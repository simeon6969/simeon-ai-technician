import unittest
from decimal import Decimal
from datetime import datetime
import test_spare_part_posts
from backend.models import User, SaleItem, ItemRequest
from backend.auth import get_current_user_id
from backend.routes.commissions import router
from backend.routes.item_requests import router as requests_router


class CommissionTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
        self.app.include_router(requests_router)
        self.db.add_all([User(user_id=3, full_name='Admin', email='admin@test.com', password_hash='hidden', role='admin'),
                         User(user_id=4, full_name='Other', email='other@test.com', password_hash='hidden', role='client')])
        self.db.get(User, 1).role = 'client'
        self.db.get(User, 2).phone = '+250788123456'
        self.db.add(SaleItem(item_id=1, seller_id=2, name='Pump', description='Working', price=10000, currency='RWF', photo_data='photo', posted_at=datetime.now()))
        self.db.commit()
        self.request_id = self.client.post('/item-requests/', json={'item_type': 'sale', 'item_id': 1}).json()['request_id']
        self.path = f'/item-requests/{self.request_id}/commission'

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def as_user(self, user_id):
        self.app.dependency_overrides[get_current_user_id] = lambda: user_id

    def start(self):
        response = self.client.post(self.path)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def action(self, state, action, status=200, **extra):
        response = self.client.post(self.path + '/action', json={'action': action, 'revision': state['revision'], **extra})
        self.assertEqual(response.status_code, status, response.text)
        return response.json()

    def settings(self, **overrides):
        self.as_user(3)
        response = self.client.put('/admin/commission-settings', json={'enabled': True, 'payer': 'client', 'starting_percent': '5', 'minimum_percent': '0', 'reduction_percent': '0.2', 'momo_number': '0786854200', **overrides})
        self.assertEqual(response.status_code, 200, response.text)

    def test_client_negotiation_requires_admin_approval(self):
        state = self.start()
        self.assertEqual(Decimal(state['current_percent']), 5)
        self.assertEqual(state['amount'], '500')
        self.assertNotIn('minimum_percent', state)
        self.assertNotIn('seller', state)
        state = self.action(state, 'counter', counter_percent='1')
        self.assertEqual(Decimal(state['current_percent']), Decimal('4.8'))
        self.action({**state, 'revision': 0}, 'counter', 409, counter_percent='1')
        state = self.action(state, 'accept')
        self.action(state, 'approve', 403)
        self.as_user(3)
        self.action(state, 'approve', 409)
        self.as_user(1)
        state = self.action(state, 'payment', payment_reference='MOMO-123')
        self.assertNotIn('seller', state)
        self.assertNotIn('seller_name', self.client.get('/item-requests/').json()[0])
        self.as_user(3)
        state = self.action(state, 'approve')
        self.as_user(1)
        state = self.client.get(self.path).json()
        self.assertEqual(state['seller']['phone'], '+250788123456')
        self.assertEqual(self.client.get('/item-requests/').json()[0]['seller_name'], 'Tech 2')
        self.action(state, 'counter', 409, counter_percent='0')
        self.as_user(4)
        self.assertEqual(self.client.get(self.path).status_code, 403)
        self.assertEqual(self.client.get('/item-requests/').json(), [])

    def test_seller_pays_client_waits_and_terms_are_frozen(self):
        self.settings(payer='seller')
        self.as_user(1)
        state = self.start()
        self.assertFalse(state['is_payer'])
        self.action(state, 'accept', 403)
        self.settings(payer='client', starting_percent='10')
        self.db.get(SaleItem, 1).price = 20000
        self.db.commit()
        self.as_user(2)
        state = self.start()
        self.assertTrue(state['is_payer'])
        self.assertEqual(Decimal(state['listed_price']), 10000)
        self.assertEqual(Decimal(state['current_percent']), 5)
        state = self.action(state, 'accept')
        state = self.action(state, 'payment', payment_reference='SELLER-123')
        self.as_user(3)
        state = self.action(state, 'reject', note='Reference not found')
        self.assertEqual(state['status'], 'awaiting_payment')
        self.as_user(2)
        state = self.action(state, 'payment', payment_reference='SELLER-456')
        self.as_user(3)
        self.action(state, 'approve')
        self.as_user(1)
        self.assertIn('seller', self.client.get(self.path).json())

    def test_floor_and_zero_fee_still_need_admin(self):
        state = self.start()
        for _ in range(25):
            state = self.action(state, 'counter', counter_percent='0')
        self.assertEqual(Decimal(state['current_percent']), 0)
        self.action(state, 'counter', 409, counter_percent='0')
        state = self.action(state, 'accept')
        self.assertEqual(state['status'], 'pending_review')
        self.assertEqual(state['amount'], '0')
        self.assertNotIn('seller', state)
        self.as_user(3)
        self.action(state, 'approve')
        self.as_user(1)
        self.assertIn('seller', self.client.get(self.path).json())

    def test_settings_validation_permissions_and_missing_price(self):
        self.assertEqual(self.client.get('/admin/commission-settings').status_code, 403)
        self.settings(enabled=False)
        self.as_user(1)
        self.assertEqual(self.client.post(self.path).status_code, 409)
        self.settings()
        config = self.client.get('/admin/commission-settings').json()
        for patch in [{'minimum_percent': 6}, {'reduction_percent': 0}, {'starting_percent': 101}, {'payer': 'other'}]:
            self.assertEqual(self.client.put('/admin/commission-settings', json={**config, **patch}).status_code, 422)
        self.as_user(1)
        self.db.get(SaleItem, 1).price = 0
        self.db.commit()
        self.assertEqual(self.client.post(self.path).status_code, 409)

    def test_nonzero_floor_and_idempotent_start(self):
        self.settings(minimum_percent='4.9')
        self.as_user(1)
        state = self.start()
        state = self.action(state, 'counter', counter_percent='0')
        self.assertEqual(Decimal(state['current_percent']), Decimal('4.9'))
        self.assertEqual(self.start()['revision'], state['revision'])
        self.action(state, 'counter', 409, counter_percent='0')
        self.as_user(4)
        self.assertEqual(self.client.post(self.path).status_code, 403)

    def test_payment_notifications_persist_until_review_and_resubmission_is_new(self):
        self.assertEqual(self.client.get('/admin/payment-reviews').status_code, 403)
        state = self.action(self.start(), 'accept')
        self.as_user(3)
        self.assertEqual(self.client.get('/admin/payment-reviews').json()['total'], 0)
        self.as_user(1)
        state = self.action(state, 'payment', payment_reference='PAY-100')
        self.as_user(3)
        queue = self.client.get('/admin/payment-reviews').json()
        self.assertEqual(queue['total'], 1)
        first = queue['items'][0]
        self.assertEqual(first['payer_name'], 'Tech 1')
        self.assertEqual(first['amount'], '500')
        self.assertEqual(first['payment_reference'], 'PAY-100')
        self.client.get(self.path)
        self.assertEqual(self.client.get('/admin/payment-reviews').json(), queue)
        state = self.action(state, 'reject', note='Please correct reference')
        self.assertEqual(self.client.get('/admin/payment-reviews').json()['total'], 0)
        self.as_user(1)
        state = self.action(state, 'payment', payment_reference='PAY-101')
        self.as_user(3)
        second = self.client.get('/admin/payment-reviews').json()['items'][0]
        self.assertNotEqual(first['notification_id'], second['notification_id'])
        self.action(state, 'approve')
        self.assertEqual(self.client.get('/admin/payment-reviews').json()['total'], 0)

    def test_queue_orders_by_submission_with_pagination_and_seller_payer(self):
        from datetime import timedelta
        from backend.models.commissions import PaymentReviewNotification
        self.settings(payer='seller')
        self.as_user(2)
        state = self.action(self.start(), 'accept')
        self.action(state, 'payment', payment_reference='FIRST')
        self.as_user(4)
        request = self.client.post('/item-requests/', json={'item_type': 'sale', 'item_id': 1}).json()['request_id']
        self.path = f'/item-requests/{request}/commission'
        self.as_user(2)
        state = self.action(self.start(), 'accept')
        self.action(state, 'payment', payment_reference='SECOND')
        rows = self.db.query(PaymentReviewNotification).order_by(PaymentReviewNotification.notification_id).all()
        rows[0].created_at = datetime.now() - timedelta(days=1)
        rows[1].created_at = datetime.now()
        self.db.commit()
        self.as_user(3)
        first = self.client.get('/admin/payment-reviews?limit=1').json()
        second = self.client.get('/admin/payment-reviews?limit=1&offset=1').json()
        self.assertEqual(first['total'], 2)
        self.assertEqual(first['items'][0]['payment_reference'], 'FIRST')
        self.assertEqual(second['items'][0]['payment_reference'], 'SECOND')
        self.assertEqual(first['items'][0]['payer_name'], 'Tech 2')
        self.assertEqual(self.client.get('/admin/payment-reviews?limit=101').status_code, 422)

    def test_zero_fee_notification_and_legacy_backfill_are_idempotent(self):
        from backend.models.commissions import PaymentReviewNotification
        from backend.payment_review_migration import backfill_payment_reviews
        self.settings(starting_percent='0.2')
        self.as_user(1)
        state = self.action(self.start(), 'counter', counter_percent='0')
        self.action(state, 'accept')
        self.as_user(3)
        queue = self.client.get('/admin/payment-reviews').json()
        self.assertEqual(queue['total'], 1)
        self.assertEqual(queue['items'][0]['amount'], '0')
        self.db.query(PaymentReviewNotification).delete()
        self.db.commit()
        backfill_payment_reviews(self.engine)
        backfill_payment_reviews(self.engine)
        self.assertEqual(self.client.get('/admin/payment-reviews').json()['total'], 1)

    def test_client_approval_notifications_are_private_and_require_approval(self):
        self.assertEqual(self.client.get('/my/commission-approvals').json()['total'], 0)
        state = self.action(self.start(), 'accept')
        state = self.action(state, 'payment', payment_reference='CLIENT-NOTICE')
        self.assertEqual(self.client.get('/my/commission-approvals').json()['total'], 0)
        self.as_user(3)
        self.action(state, 'approve')
        self.as_user(1)
        result = self.client.get('/my/commission-approvals').json()
        self.assertEqual(result['total'], 1)
        self.assertEqual(result['items'][0]['request_id'], self.request_id)
        self.assertEqual(result['items'][0]['item_name'], 'Pump')
        self.assertTrue(result['items'][0]['approved_at'])
        self.assertEqual(self.client.get('/my/commission-approvals').json(), result)
        self.assertEqual(self.client.get('/my/commission-approvals?offset=1').json()['items'], [])
        for user_id in [2, 4]:
            self.as_user(user_id)
            self.assertEqual(self.client.get('/my/commission-approvals').json()['total'], 0)
