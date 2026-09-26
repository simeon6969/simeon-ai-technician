import unittest
from datetime import datetime
from uuid import uuid4
from unittest.mock import patch
import test_spare_part_posts
from backend.auth import get_current_user_id
from backend.models import User, SaleItem, SparePart, JobCard
from backend.routes import users, job_cards, equipment, chat, sale_items, offline, item_requests


class RolePermissionsTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        for module in (users, job_cards, equipment, chat, sale_items, offline, item_requests):
            self.app.include_router(module.router)
            if hasattr(module, 'get_db'):
                self.app.dependency_overrides[module.get_db] = lambda: self.db
        self.db.get(User, 1).account_field = 'it'
        self.db.get(User, 2).account_field = 'medical'
        self.db.commit()

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def role(self, role):
        self.db.get(User, 1).role = role
        self.db.commit()

    def test_all_twelve_registration_combinations_and_invalid_choices(self):
        with patch('backend.routes.users.hash_password', return_value='hash'):
            for field in ['medical', 'it', 'electrical', 'mechanical']:
                for role in ['technician', 'store', 'client']:
                    payload = {'account_field': field, 'role': role, 'full_name': 'Account', 'email': f'{field}-{role}@example.com', 'password': 'pass'}
                    response = self.client.post('/users/register', json=payload)
                    self.assertEqual(response.status_code, 200, response.text)
                    self.assertEqual(response.json()['account_field'], field)
            for field, role in [('medical', 'admin'), ('medical', 'organization'), ('unknown', 'client')]:
                self.assertEqual(self.client.post('/users/register', json={**payload, 'account_field': field, 'role': role}).status_code, 422)
            self.assertEqual(self.client.post('/users/register', json={'full_name': 'Missing choices', 'email': 'missing@example.com', 'password': 'pass'}).status_code, 422)

    def test_existing_accounts_setup_once_and_keep_records(self):
        account = self.db.get(User, 1)
        account.account_field = None
        account.role = 'organization'
        self.db.commit()
        result = self.client.put('/users/account-setup', json={'account_field': 'mechanical', 'role': 'store'})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()['role'], 'store')
        self.assertIsNotNone(self.db.get(SparePart, 1))
        self.assertEqual(self.client.put('/users/account-setup', json={'account_field': 'it', 'role': 'technician'}).status_code, 409)
        account.role = 'admin'; account.account_field = None; self.db.commit()
        self.assertEqual(self.client.put('/users/account-setup', json={'account_field': 'it', 'role': 'client'}).status_code, 403)

    def test_store_and_client_cannot_submit_jobcards_or_use_maintenance_chat(self):
        payload = {'kind': 'job', 'submission_id': str(uuid4()),
                   'equipment': {'category': 'Laptop', 'manufacturer': 'Test', 'model': 'M1'},
                   'job': {'equipment_id': 0, 'maintenance_type': 'corrective', 'fault_description': 'Fault'}}
        for role in ['store', 'client']:
            self.role(role)
            self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 403)
            self.assertEqual(self.client.post('/job-cards/', json=payload['job']).status_code, 403)
            self.assertEqual(self.client.get('/job-cards/').status_code, 403)
            self.assertEqual(self.client.post('/chat/sessions').status_code, 403)
            self.assertEqual(self.client.post('/equipment/?category=A&manufacturer=B&model=C').status_code, 403)
        self.role('technician')
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 200)
        self.assertEqual(self.db.query(JobCard).count(), 1)

    def test_store_inventory_allowed_client_inventory_denied(self):
        sale = {'name': 'Laptop', 'description': 'Working', 'price': '200', 'currency': 'USD', 'photo_data': 'data:image/png;base64,aGVsbG8='}
        self.role('store')
        response = self.client.post('/sale-items/', json=sale)
        self.assertEqual(response.status_code, 200)
        item_id = response.json()['item_id']
        self.assertEqual(self.client.post(f'/sale-items/{item_id}/post').status_code, 200)
        self.assertEqual(self.client.post('/spare-parts/', json={'part_name': 'RAM'}).status_code, 200)
        self.role('client')
        for method, path, data in [('POST', '/sale-items/', sale), ('GET', '/sale-items/my', None), ('DELETE', f'/sale-items/{item_id}', None), ('POST', f'/sale-items/{item_id}/post', None), ('POST', '/spare-parts/', {'part_name': 'RAM'}), ('GET', '/spare-parts/my', None), ('DELETE', '/spare-parts/1', None)]:
            self.assertEqual(self.client.request(method, path, json=data).status_code, 403, path)
        self.assertEqual(self.client.post('/offline/submit', json={'kind': 'part', 'submission_id': str(uuid4()), 'part': {'part_name': 'RAM'}}).status_code, 403)

    def test_all_fields_filter_and_item_requests_for_clients(self):
        self.role('client')
        self.db.get(SparePart, 1).posted_at = datetime.now()
        self.db.get(SparePart, 2).posted_at = datetime.now()
        item = SaleItem(seller_id=2, name='Analyzer', description='Good', price=100, currency='RWF', photo_data='data:image/png;base64,aGVsbG8=', posted_at=datetime.now())
        self.db.add(item); self.db.commit()
        self.assertEqual(self.client.get('/sale-items/public').json()['total'], 3)
        self.assertEqual(self.client.get('/sale-items/public?account_field=medical').json()['total'], 2)
        self.assertEqual(self.client.get('/sale-items/public?account_field=electrical').json()['total'], 0)
        self.assertEqual(self.client.get('/sale-items/public?account_field=invalid').status_code, 422)
        payload = {'item_type': 'sale', 'item_id': item.item_id, 'notes': 'Please contact me'}
        response = self.client.post('/item-requests/', json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.client.post('/item-requests/', json=payload).json())
        request_id = response.json()['request_id']
        self.assertEqual(self.client.patch(f'/item-requests/{request_id}', json={'status': 'accepted'}).status_code, 403)
        self.assertEqual(len(self.client.get('/item-requests/').json()), 1)
        self.assertEqual(self.client.post('/item-requests/', json={'item_type': 'spare_part', 'item_id': 2}).status_code, 200)
        self.assertEqual(self.client.post('/item-requests/', json={'item_type': 'spare_part', 'item_id': 1}).status_code, 400)
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        self.assertEqual(self.client.patch(f'/item-requests/{request_id}', json={'status': 'accepted'}).status_code, 200)
        self.assertTrue(all(row['can_manage'] for row in self.client.get('/item-requests/').json()))
        self.db.get(User, 2).role = 'client'; self.db.commit()
        self.assertEqual(self.client.patch(f'/item-requests/{request_id}', json={'status': 'fulfilled'}).status_code, 403)
        self.assertEqual(self.client.get('/item-requests/').json(), [])
