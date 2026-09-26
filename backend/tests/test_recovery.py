import unittest
import test_admin_deletion
from backend.auth import create_access_token
from backend.routes.recovery import router, get_db
from backend.models import User
from backend.models.recovery import AccountRecovery
from backend.security import hash_password, verify_password


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        test_admin_deletion.AdminDeletionTests.setUp(self)
        self.client.app.include_router(router)
        self.client.app.dependency_overrides[get_db] = lambda: self.db
        self.db.get(User, 3).email = '3@example.com'
        self.db.get(User, 3).password_hash = hash_password('old-password')
        self.db.commit()
        self.headers = {'Authorization': 'Bearer ' + create_access_token(3)}
        self.secret = {'question': 'My private phrase?', 'answer': 'A long private answer'}

    def tearDown(self):
        test_admin_deletion.AdminDeletionTests.tearDown(self)

    def configure(self):
        result = self.client.put('/users/recovery', headers=self.headers, json={**self.secret, 'current_password': 'old-password'})
        self.assertEqual(result.status_code, 200, result.text)

    def test_setup_requires_password_and_reset_changes_only_name_password(self):
        self.assertEqual(self.client.put('/users/recovery', headers=self.headers, json={**self.secret, 'current_password': 'wrong'}).status_code, 403)
        self.configure()
        self.assertNotEqual(self.db.get(AccountRecovery, 3).answer_hash, self.secret['answer'])
        result = self.client.post('/users/recovery/reset', json={**self.secret, 'email': '3@example.com', 'new_password': 'new-strong-password', 'full_name': 'New name'})
        self.assertEqual(result.status_code, 200, result.text)
        user = self.db.get(User, 3)
        self.assertTrue(verify_password('new-strong-password', user.password_hash))
        self.assertEqual(user.full_name, 'New name')
        self.assertEqual(user.role, 'technician')
        self.assertEqual(self.client.put('/users/recovery', headers=self.headers, json={**self.secret, 'current_password': 'new-strong-password'}).status_code, 401)

    def test_lockout_and_missing_configuration(self):
        self.configure()
        payload = {**self.secret, 'email': '3@example.com', 'full_name': 'Changed'}
        for _ in range(5):
            self.assertEqual(self.client.post('/users/recovery/reset', json={**payload, 'answer': 'wrong answer'}).status_code, 400)
        self.assertEqual(self.client.post('/users/recovery/reset', json=payload).status_code, 400)
        self.assertEqual(self.db.get(User, 3).full_name, 'User 3')
        self.assertEqual(self.client.post('/users/recovery/reset', json={**payload, 'email': '1@example.com'}).status_code, 400)
