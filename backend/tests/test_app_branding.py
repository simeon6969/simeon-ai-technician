import base64
from io import BytesIO
from unittest.mock import patch
import unittest
from PIL import Image
import test_spare_part_posts
from backend.models import User
from backend.auth import get_current_user_id
from backend.routes.app_branding import router, get_db

class AppBrandingTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.auth_db = patch('backend.auth.SessionLocal', return_value=self.db)
        self.auth_db.start()
    def tearDown(self):
        self.auth_db.stop()
        test_spare_part_posts.PostTests.tearDown(self)
    def test_public_read_admin_only_update_and_validation(self):
        self.assertEqual(self.client.get('/app-branding').json(), {'name': 'S', 'logo': None})
        self.assertEqual(self.client.put('/admin/app-branding', json={'name': 'New name'}).status_code, 403)
        self.db.get(User, 1).role = 'admin'
        self.db.commit()
        for payload in [{'name': '  '}, {'name': 'a'*61}, {'name': 'Name', 'logo': 'data:image/svg+xml;base64,abcd'}]:
            self.assertEqual(self.client.put('/admin/app-branding', json=payload).status_code, 422)
        stream = BytesIO()
        Image.new('RGB', (1000, 500)).save(stream, 'PNG')
        logo = 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()
        response = self.client.put('/admin/app-branding', json={'name': ' New Brand ', 'logo': logo})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'New Brand')
        with Image.open(BytesIO(base64.b64decode(response.json()['logo'].split(',')[1]))) as image:
            self.assertEqual(image.size, (512, 256))
        del self.app.dependency_overrides[get_current_user_id]
        self.assertEqual(self.client.get('/app-branding').json()['name'], 'New Brand')
        self.assertEqual(self.client.put('/admin/app-branding', json={'name': 'Bad'}).status_code, 401)
        self.app.dependency_overrides[get_current_user_id] = lambda: 1
        self.assertIsNone(self.client.put('/admin/app-branding', json={'name': 'New Brand', 'logo': None}).json()['logo'])
