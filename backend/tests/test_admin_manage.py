import unittest
import test_admin_deletion
from backend.auth import create_access_token
from backend.routes.admin_manage import router
from backend.models import User, SparePart, JobCard, MaintenanceKnowledge, SaleItem


class AdminManageTests(unittest.TestCase):
    def setUp(self):
        test_admin_deletion.AdminDeletionTests.setUp(self)
        self.client.app.include_router(router)

    def tearDown(self):
        test_admin_deletion.AdminDeletionTests.tearDown(self)

    def call(self, method, path, data=None, user=1):
        headers = {'Authorization': f'Bearer {create_access_token(user)}'} if user else {}
        return self.client.request(method, '/admin' + path, headers=headers, json=data)

    def test_edit_account_and_protect_admin_roles(self):
        data = {'full_name': 'Updated store', 'email': 'updated@example.com', 'phone': '123', 'role': 'store', 'account_field': 'mechanical'}
        for user, expected in [(None, 401), (3, 403)]:
            self.assertEqual(self.call('PATCH', '/users/2', data, user).status_code, expected)
        self.assertEqual(self.call('PATCH', '/users/2', data).status_code, 200)
        self.assertEqual(self.db.get(User, 2).account_field, 'mechanical')
        self.assertEqual(self.call('PATCH', '/users/1', data).status_code, 403)
        self.assertEqual(self.call('PATCH', '/users/2', {**data, 'role': 'admin'}).status_code, 422)
        self.assertEqual(self.call('PUT', '/users/1/status?is_active=false').status_code, 403)

    def test_edit_publish_and_unpublish_inventory(self):
        data = {'part_name': 'Updated pump', 'price': '100.25', 'currency': 'USD', 'availability_status': 'available'}
        self.assertEqual(self.call('PATCH', '/spare-parts/2', data).status_code, 200)
        self.assertEqual(str(self.db.get(SparePart, 2).price), '100.25')
        self.assertEqual(self.call('PATCH', '/spare-parts/2/publication', {'published': True}).status_code, 200)
        self.assertIsNotNone(self.db.get(SparePart, 2).posted_at)
        self.assertEqual(self.call('PATCH', '/spare-parts/2/publication', {'published': False}).status_code, 200)
        self.assertIsNone(self.db.get(SparePart, 2).posted_at)
        sale = {'name': 'Updated item', 'description': 'Working', 'price': '20', 'currency': 'EUR', 'photo_data': 'data:image/png;base64,aGVsbG8='}
        self.assertEqual(self.call('PATCH', '/sale-items/2', sale).status_code, 200)
        self.assertEqual(self.db.get(SaleItem, 2).name, 'Updated item')
        self.assertEqual(self.call('PATCH', '/sale-items/2/publication', {'published': True}, user=3).status_code, 403)

    def test_editing_card_invalidates_old_knowledge_and_can_be_revalidated(self):
        self.db.get(JobCard, 2).status = 'validated'
        self.db.commit()
        data = {'fault_description': 'Corrected fault', 'diagnosis': 'Corrected cause', 'actions_taken': 'Fixed', 'successful': True}
        self.assertEqual(self.call('PATCH', '/job-cards/2', data).status_code, 200)
        self.assertEqual(self.db.query(MaintenanceKnowledge).filter_by(source_job_card_id=2).count(), 0)
        self.assertEqual(self.db.get(JobCard, 2).status, 'submitted')
        self.assertEqual(self.call('POST', '/job-cards/2/validate').status_code, 200)
        self.assertEqual(self.db.query(MaintenanceKnowledge).filter_by(source_job_card_id=2).one().diagnosis, 'Corrected cause')
