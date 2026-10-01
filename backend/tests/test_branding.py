import base64
from io import BytesIO
import unittest
from PIL import Image
import test_spare_part_posts
from backend.auth import get_current_user_id
from backend.routes.branding import router

class BrandingTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)
    def test_upload_resize_isolation_and_remove(self):
        stream = BytesIO()
        Image.new('RGBA', (1000, 500), (0, 200, 150, 128)).save(stream, 'PNG')
        data = 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()
        response = self.client.put('/users/me/branding', json={'image_data': data})
        self.assertEqual(response.status_code, 200)
        stored = response.json()['image_data']
        with Image.open(BytesIO(base64.b64decode(stored.split(',')[1]))) as image:
            self.assertEqual(image.size, (512, 256))
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        self.assertIsNone(self.client.get('/users/me/branding').json()['image_data'])
        self.client.delete('/users/me/branding')
        self.app.dependency_overrides[get_current_user_id] = lambda: 1
        self.assertEqual(self.client.get('/users/me/branding').json()['image_data'], stored)
        self.client.delete('/users/me/branding')
        self.assertIsNone(self.client.get('/users/me/branding').json()['image_data'])
    def test_reject_invalid_and_unauthenticated_uploads(self):
        for data in ['data:image/png;base64,aGVsbG8=', 'data:image/svg+xml;base64,abcd']:
            self.assertEqual(self.client.put('/users/me/branding', json={'image_data': data}).status_code, 422)
        del self.app.dependency_overrides[get_current_user_id]
        self.assertEqual(self.client.get('/users/me/branding').status_code, 401)
