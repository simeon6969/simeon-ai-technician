import unittest
from unittest.mock import patch
from datetime import datetime
import test_spare_part_posts
from backend.models import User, SaleItem
from backend.routes.inventory_chat import router, inventory_records


class InventoryChatTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
        user = self.db.get(User, 1)
        user.role, user.account_field = 'client', 'medical'
        store = self.db.get(User, 2)
        store.role, store.account_field = 'store', 'medical'
        for key, posted in [(1, True), (2, False)]:
            self.db.add(SaleItem(item_id=key, seller_id=2, name='Public gloves' if posted else 'Private stock', description='Recorded stock', price=100, currency='RWF', photo_data='photo', posted_at=datetime.now() if posted else None,
                                 medical_category='consumables', medical_details={'quantity': 5, 'unit': 'box', 'storage_location': 'Private warehouse'}))
        self.db.commit()

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def test_client_only_sees_posted_stock_even_with_mine_scope(self):
        with patch('backend.routes.inventory_chat.get_openai_client', side_effect=RuntimeError('offline')):
            result = self.client.post('/inventory-chat', json={'message': 'Show medical consumables', 'field': 'medical', 'scope': 'mine'})
        self.assertEqual(result.status_code, 200, result.text)
        records = result.json()['records']
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]['name'], 'Public gloves')
        self.assertNotIn('storage_location', records[0]['medical_details'])
        self.assertTrue(records[0]['can_request'])

    def test_store_own_scope_and_current_stock(self):
        store = self.db.get(User, 2)
        result = inventory_records(self.db, store, 'medical', 'mine', '', 'consumables')
        self.assertEqual(result['total'], 2)
        self.assertTrue(all(not row['can_request'] for row in result['records']))
        self.db.get(SaleItem, 1).medical_details = {'quantity': 0, 'unit': 'box'}
        self.db.commit()
        result = inventory_records(self.db, self.db.get(User, 1), 'medical', 'posted', 'gloves')
        self.assertEqual(result['records'][0]['availability'], 'out_of_stock')
        self.assertFalse(result['records'][0]['can_request'])
        self.assertEqual(inventory_records(self.db, store, 'it', 'posted')['total'], 0)
