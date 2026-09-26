import unittest
import test_admin_deletion
from backend.auth import create_access_token
from backend.models.subscriptions import AccountSubscription
from backend.routes.subscriptions import router, catalogue, Settings
from backend.routes.users import router as users_router, get_db


class SubscriptionTests(unittest.TestCase):
    def setUp(self):
        test_admin_deletion.AdminDeletionTests.setUp(self)
        self.client.app.include_router(router)
        self.client.app.include_router(users_router)
        self.client.app.dependency_overrides[get_db] = lambda: self.db
        self.headers = {'Authorization': 'Bearer ' + create_access_token(1)}

    def tearDown(self):
        test_admin_deletion.AdminDeletionTests.tearDown(self)

    def test_admin_rates_conversions_and_permissions(self):
        data = Settings(rates={'RWF': 1, 'USD': 1000}).model_dump(mode='json')
        self.assertEqual(self.client.put('/admin/subscription-plans', json=data).status_code, 401)
        denied = {'Authorization': 'Bearer ' + create_access_token(3)}
        self.assertEqual(self.client.put('/admin/subscription-plans', headers=denied, json=data).status_code, 403)
        result = self.client.put('/admin/subscription-plans', headers=self.headers, json=data)
        self.assertEqual(result.status_code, 200, result.text)
        quote = next(p for p in result.json()['plans'] if p['plan'] == 'standard' and p['currency'] == 'USD')
        self.assertEqual(quote['amount'], '0.0200')
        self.assertTrue(result.json()['all_services_included'])
        self.assertEqual(self.client.put('/admin/subscription-plans', headers=self.headers, json={**data, 'rates': {'RWF': 1, 'USD': 0}}).status_code, 422)

    def test_registration_snapshot_and_payment_confirmation(self):
        data = {'full_name': 'Subscriber', 'email': 'subscriber@example.com', 'password': 'testpassword', 'role': 'client', 'account_field': 'it',
                'subscription': {'plan': 'premium', 'currency': 'RWF', 'revision': 1, 'accepted_terms': True}}
        result = self.client.post('/users/register', json=data)
        self.assertEqual(result.status_code, 200, result.text)
        user_id = result.json()['user_id']
        sub = self.db.get(AccountSubscription, user_id)
        self.assertEqual(sub.amount_rwf, 100)
        self.assertEqual(sub.payment_status, 'pending')
        self.client.put('/admin/subscription-plans', headers=self.headers, json=Settings(premium=200).model_dump(mode='json'))
        self.db.refresh(sub)
        self.assertEqual(sub.amount_rwf, 100)
        self.assertEqual(self.client.post('/users/register', json={**data, 'email': 'second@example.com'}).status_code, 409)
        result = self.client.patch(f'/admin/subscriptions/{user_id}', headers=self.headers, json={'status': 'paid'})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(self.db.get(AccountSubscription, user_id).payment_status, 'paid')

    def test_free_and_legacy_signup_stay_available(self):
        self.assertEqual(catalogue(self.db)['period'], 'yearly')
        data = {'full_name': 'Legacy', 'email': 'legacy@example.com', 'password': 'testpassword', 'role': 'technician', 'account_field': 'medical'}
        self.assertEqual(self.client.post('/users/register', json=data).status_code, 200)
        result = self.client.get('/admin/subscriptions', headers=self.headers)
        self.assertEqual(next(row for row in result.json() if row['email'] == data['email'])['plan'], 'free')

    def test_upgrade_blocks_existing_token_until_paid(self):
        token = {'Authorization': 'Bearer ' + create_access_token(3)}
        payload = {'plan': 'standard', 'period': 'monthly', 'revision': 1}
        self.assertEqual(self.client.post('/admin/subscriptions/2/upgrade', headers=token, json=payload).status_code, 403)
        self.assertEqual(self.client.post('/admin/subscriptions/1/upgrade', headers=self.headers, json=payload).status_code, 403)
        result = self.client.post('/admin/subscriptions/3/upgrade', headers=self.headers, json=payload)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(self.db.get(AccountSubscription, 3).period, 'monthly')
        self.assertEqual(self.client.get('/users/me', headers=token).status_code, 402)
        self.assertEqual(self.client.patch('/admin/subscriptions/3', headers=self.headers, json={'status': 'waived'}).status_code, 422)
        self.assertEqual(self.client.patch('/admin/subscriptions/3', headers=self.headers, json={'status': 'paid'}).status_code, 200)
        self.assertEqual(self.client.get('/users/me', headers=token).status_code, 200)
        self.assertEqual(self.client.post('/admin/subscriptions/3/upgrade', headers=self.headers, json=payload).status_code, 409)
        self.assertEqual(self.client.post('/admin/subscriptions/3/upgrade', headers=self.headers, json={**payload, 'plan': 'premium'}).status_code, 200)
        self.assertEqual(self.client.get('/users/me', headers=token).status_code, 402)

    def test_monthly_setting(self):
        result = self.client.put('/admin/subscription-plans', headers=self.headers, json=Settings(period='monthly').model_dump(mode='json'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()['period'], 'monthly')

    def test_legacy_selection_is_once_and_profile_shows_plan(self):
        token = {'Authorization': 'Bearer ' + create_access_token(3)}
        self.assertIsNone(self.client.get('/users/me', headers=token).json()['subscription'])
        data = {'plan': 'standard', 'currency': 'RWF', 'revision': 1, 'accepted_terms': True}
        result = self.client.put('/users/subscription', headers=token, json=data)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()['payment_status'], 'pending')
        profile = self.client.get('/users/me', headers=token).json()
        self.assertEqual(profile['subscription']['plan'], 'standard')
        self.assertEqual(self.client.put('/users/subscription', headers=token, json={**data, 'plan': 'free'}).status_code, 409)
        self.assertEqual(self.client.put('/users/subscription', headers=self.headers, json=data).status_code, 403)
