import unittest
import test_spare_part_posts
from backend.models import User
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

    def test_spare_part_price_survives_storage_and_public_post(self):
        from decimal import Decimal
        from backend.routes.admin import get_all_spare_parts
        response = self.client.post('/spare-parts/', json={'part_name': 'Priced pump', 'price': '12345.67', 'currency': 'USD'})
        self.assertEqual(response.status_code, 200)
        part_id = response.json()['spare_part_id']
        for path in ['/spare-parts/my', '/spare-parts/?search=Priced']:
            part = next(row for row in self.client.get(path).json() if row['spare_part_id'] == part_id)
            self.assertEqual(Decimal(part['price']), Decimal('12345.67'))
            self.assertEqual(part['currency'], 'USD')
        self.assertEqual(self.client.get('/sale-items/public').json()['total'], 0)
        self.client.post(f'/spare-parts/{part_id}/post')
        for path, key in [('/spare-parts/posts', 'posts'), ('/sale-items/public', 'items')]:
            part = self.client.get(path).json()[key][0]
            self.assertEqual(Decimal(str(part['price'])), Decimal('12345.67'))
            self.assertEqual(part['currency'], 'USD')
        part = next(row for row in get_all_spare_parts(admin_id=1, db=self.db) if row['spare_part_id'] == part_id)
        self.assertEqual(part['price'], '12345.67')
        self.assertIsNone(self.client.get('/spare-parts/1').json()['price'])

    def test_spare_part_price_validation_and_older_clients(self):
        for price in ['0', '-1', '12.345', 'NaN', 'Infinity', '1000000000000']:
            response = self.client.post('/spare-parts/', json={'part_name': 'Pump', 'price': price})
            self.assertEqual(response.status_code, 422, price)
        self.assertEqual(self.client.post('/spare-parts/', json={'part_name': 'Pump', 'price': '10', 'currency': 'BAD'}).status_code, 422)
        response = self.client.post('/spare-parts/', json={'part_name': 'Older app'})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['price'])

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

    def test_all_account_types_publish_to_public_board(self):
        for role in ['technician', 'organization', 'institution', 'health_facility', 'other_business']:
            account = self.db.get(User, 1)
            account.role = role
            self.db.commit()
            response = self.client.post('/sale-items/', json={**self.payload, 'name': role})
            self.assertEqual(response.status_code, 200)
            item_id = response.json()['item_id']
            self.assertEqual(self.client.post(f'/sale-items/{item_id}/post').status_code, 200)
        result = self.client.get('/sale-items/public').json()
        self.assertEqual(result['total'], 5)

    def test_public_board_combines_posts_without_id_collisions(self):
        first = self.client.post('/sale-items/', json=self.payload).json()
        self.client.post(f"/sale-items/{first['item_id']}/post")
        self.client.post('/spare-parts/1/post')
        del self.app.dependency_overrides[get_current_user_id]
        data = self.client.get('/sale-items/public').json()
        self.assertEqual(data['total'], 2)
        self.assertEqual(len({item['listing_key'] for item in data['items']}), 2)
        part = next(item for item in data['items'] if item['item_type'] == 'spare_part')
        self.assertIsNone(part['price'])
        self.assertEqual(part['name'], 'Part 1')
        self.assertEqual(self.client.get('/sale-items/public?limit=1&offset=1').json()['items'][0]['listing_key'], data['items'][1]['listing_key'])

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
