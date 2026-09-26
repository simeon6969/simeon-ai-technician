import unittest
import test_admin_deletion
from backend.auth import create_access_token
from backend.routes.delivery import router


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        test_admin_deletion.AdminDeletionTests.setUp(self)
        self.client.app.include_router(router)

    def tearDown(self):
        test_admin_deletion.AdminDeletionTests.tearDown(self)

    def test_public_read_admin_write_and_validation(self):
        data = {'phone': '+250786854200', 'whatsapp': '+250786854200', 'email': 'delivery@example.com'}
        self.assertEqual(self.client.get('/delivery-contacts').json()['phone'], '')
        for user, code in [(None, 401), (3, 403), (1, 200)]:
            headers = {'Authorization': f'Bearer {create_access_token(user)}'} if user else {}
            result = self.client.put('/admin/delivery-contacts', json=data, headers=headers)
            self.assertEqual(result.status_code, code, result.text)
        self.assertEqual(self.client.get('/delivery-contacts').json(), data)
        headers = {'Authorization': f'Bearer {create_access_token(1)}'}
        for field, value in [('phone', 'javascript:alert(1)'), ('whatsapp', '123'), ('email', 'invalid')]:
            self.assertEqual(self.client.put('/admin/delivery-contacts', json={**data, field: value}, headers=headers).status_code, 422)
        self.assertEqual(self.client.put('/admin/delivery-contacts', json={'phone': '', 'whatsapp': '', 'email': ''}, headers=headers).status_code, 200)
        self.assertEqual(self.client.get('/delivery-contacts').json(), {'phone': '', 'whatsapp': '', 'email': None})
