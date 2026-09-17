import unittest
from unittest.mock import patch
import test_spare_part_posts
from backend.routes import users, job_cards
from backend.auth import get_current_user_id
from backend.models import User, Equipment


class AccountTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(users.router)
        self.app.include_router(job_cards.router)
        self.app.dependency_overrides[users.get_db] = lambda: self.db
        self.app.dependency_overrides[job_cards.get_db] = lambda: self.db
        self.db.add(Equipment(equipment_id=1, category='Analyzer', manufacturer='Test', model='A'))
        self.db.commit()
        self.card = {'equipment_id': 1, 'maintenance_type': 'corrective', 'fault_description': 'Fault'}

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def test_registration_types_and_no_admin_escalation(self):
        with patch('backend.routes.users.hash_password', return_value='hashed'):
            for role in ['technician', 'organization', 'institution', 'health_facility', 'other_business']:
                result = self.client.post('/users/register', json={'full_name': ' Example Account ', 'email': f'{role}@example.com', 'password': 'test-pass', 'role': role})
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.json()['role'], role)
                self.assertEqual(result.json()['full_name'], 'Example Account')
            result = self.client.post('/users/register', json={'full_name': 'Admin', 'email': 'admin@example.com', 'password': 'test', 'role': 'admin'})
            self.assertEqual(result.status_code, 422)

    def test_personal_name_comes_from_account_not_request(self):
        result = self.client.post('/job-cards/', json={**self.card, 'submitter_name': 'Someone else'})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()['submitter_name'], 'Tech 1')
        self.assertEqual(result.json()['account_name'], 'Tech 1')

    def test_shared_name_required_and_preserved_during_confirmation(self):
        account = self.db.get(User, 1)
        account.role = 'health_facility'
        account.full_name = 'Kigali Health Centre'
        self.db.commit()
        for name in [None, '', '   ']:
            self.assertEqual(self.client.post('/job-cards/', json={**self.card, 'submitter_name': name}).status_code, 422)
        result = self.client.post('/job-cards/', json={**self.card, 'submitter_name': ' Jane Doe '})
        item_id = result.json()['job_card_id']
        self.assertEqual(result.json()['submitter_name'], 'Jane Doe')
        self.assertEqual(result.json()['account_name'], 'Kigali Health Centre')
        self.client.put(f'/job-cards/{item_id}', json={**self.card, 'successful': True})
        account.full_name = 'Renamed Facility'
        self.db.commit()
        result = self.client.get('/job-cards/').json()[0]
        self.assertEqual(result['submitter_name'], 'Jane Doe')
        self.assertEqual(result['account_name'], 'Kigali Health Centre')
        self.assertEqual(self.client.get(f'/job-cards/{item_id}').json()['submitter_name'], 'Jane Doe')
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        self.assertEqual(self.client.get(f'/job-cards/{item_id}').status_code, 404)
