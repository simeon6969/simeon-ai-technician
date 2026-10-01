import unittest
import test_spare_part_posts
from backend.auth import get_current_user_id
from backend.routes.location import router

class LocationTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)
    def test_save_trim_private_and_clear(self):
        path = '/users/me/location'
        self.assertEqual(self.client.get(path).json(), {'location': ''})
        self.assertEqual(self.client.put(path, json={'location': ' Kigali, Gasabo '}).json(), {'location': 'Kigali, Gasabo'})
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        self.assertEqual(self.client.get(path).json(), {'location': ''})
        self.client.put(path, json={'location': 'Huye'})
        self.app.dependency_overrides[get_current_user_id] = lambda: 1
        self.assertEqual(self.client.get(path).json(), {'location': 'Kigali, Gasabo'})
        self.assertEqual(self.client.put(path, json={'location': ' '}).json(), {'location': ''})
        self.assertEqual(self.client.put(path, json={'location': 'x' * 501}).status_code, 422)
        self.assertEqual(self.client.put(path, json={'location': 'Here', 'user_id': 2}).status_code, 422)
        del self.app.dependency_overrides[get_current_user_id]
        self.assertEqual(self.client.get(path).status_code, 401)
