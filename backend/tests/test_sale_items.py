import unittest
import test_spare_part_posts
from backend.routes.sale_items import router
from backend.auth import get_current_user_id


class SaleItemTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
        self.payload = {'name': 'Analyzer', 'description': 'Used, working, Kigali',
                        'price': '150000.50', 'currency': 'RWF',
                        'photo_data': 'data:image/png;base64,aGVsbG8='}

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def test_sale_lifecycle_and_ownership(self):
        response = self.client.post('/sale-items/', json=self.payload)
        self.assertEqual(response.status_code, 200)
        item_id = response.json()['item_id']
        self.assertEqual(self.client.get('/sale-items/posts').json()['total'], 0)
        self.assertEqual(len(self.client.get('/sale-items/my').json()), 1)
        first = self.client.post(f'/sale-items/{item_id}/post').json()
        self.assertEqual(first, self.client.post(f'/sale-items/{item_id}/post').json())
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        self.assertEqual(self.client.get('/sale-items/my').json(), [])
        self.assertEqual(self.client.post(f'/sale-items/{item_id}/post').status_code, 404)
        self.assertEqual(self.client.delete(f'/sale-items/{item_id}').status_code, 404)
        self.assertEqual(self.client.get('/sale-items/posts').json()['total'], 1)
        self.app.dependency_overrides[get_current_user_id] = lambda: 1
        self.assertEqual(self.client.delete(f'/sale-items/{item_id}').status_code, 200)
        self.assertEqual(self.client.get('/sale-items/posts').json()['total'], 0)

    def test_validation(self):
        for values in [{'price': '-1'}, {'price': 'NaN'}, {'price': '1.001'}, {'currency': 'BAD'}, {'photo_data': ''}, {'photo_data': 'javascript:bad'}, {'name': ' '}]:
            self.assertEqual(self.client.post('/sale-items/', json={**self.payload, **values}).status_code, 422)

    def test_authentication(self):
        del self.app.dependency_overrides[get_current_user_id]
        self.assertEqual(self.client.get('/sale-items/posts').status_code, 401)
        self.assertEqual(self.client.post('/sale-items/', json=self.payload).status_code, 401)

    def test_public_board_shows_only_published_items_without_account_details(self):
        first = self.client.post('/sale-items/', json=self.payload).json()
        self.client.post('/sale-items/', json={**self.payload, 'name': 'Private draft'})
        self.client.post(f"/sale-items/{first['item_id']}/post")
        del self.app.dependency_overrides[get_current_user_id]
        response = self.client.get('/sale-items/public')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total'], 1)
        item = response.json()['items'][0]
        self.assertEqual(item['name'], 'Analyzer')
        self.assertEqual(item['seller_name'], 'Tech 1')
        for field in ['seller_id', 'email', 'phone', 'password_hash']:
            self.assertNotIn(field, item)
        self.assertEqual(self.client.get('/sale-items/public?search=analyzer').json()['total'], 1)
        self.assertEqual(self.client.get('/sale-items/public?search=Private').json()['total'], 0)
        self.assertEqual(self.client.get('/sale-items/public?search=%25').json()['total'], 0)
        self.assertEqual(self.client.get('/sale-items/public?offset=1').json()['items'], [])
        self.assertEqual(self.client.get('/sale-items/my').status_code, 401)
        self.assertEqual(self.client.post(f"/sale-items/{first['item_id']}/post").status_code, 401)
        self.assertEqual(self.client.delete(f"/sale-items/{first['item_id']}").status_code, 401)
