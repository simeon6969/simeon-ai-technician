import unittest
from unittest.mock import patch
import test_spare_part_posts
from backend.models import User, SparePart
from backend.routes.admin_records import router, get_db
from backend.auth import get_current_user_id

class AdminRecordsTests(unittest.TestCase):
 def setUp(self):
  test_spare_part_posts.PostTests.setUp(self)
  self.app.include_router(router)
  self.app.dependency_overrides[get_db] = lambda: self.db
  self.patch = patch('backend.auth.SessionLocal', return_value=self.db)
  self.patch.start()
 def tearDown(self):
  self.patch.stop()
  test_spare_part_posts.PostTests.tearDown(self)
 def test_permissions_pagination_search_and_lightweight(self):
  self.assertEqual(self.client.get('/admin/records/users').status_code, 403)
  self.db.get(User, 1).role = 'admin'
  self.db.get(User, 2).account_field = 'medical'
  self.db.add_all([SparePart(submitted_by=2, part_name=f'Stock {i}', photo_data='large-photo') for i in range(30)])
  self.db.commit()
  page = self.client.get('/admin/records/spare-parts?field=medical').json()
  self.assertEqual(page['total'], 31)
  self.assertEqual(len(page['items']), 25)
  self.assertNotIn('photo_data', page['items'][0])
  self.assertEqual(page['items'][0]['owner']['full_name'], 'Tech 2')
  second = self.client.get('/admin/records/spare-parts?field=medical&offset=25').json()
  self.assertEqual(len(second['items']), 6)
  self.assertFalse({x['spare_part_id'] for x in page['items']} & {x['spare_part_id'] for x in second['items']})
  result = self.client.get('/admin/records/spare-parts?search=Stock%2029').json()
  self.assertEqual(result['total'], 1)
  record_id = result['items'][0]['spare_part_id']
  self.assertEqual(self.client.get(f'/admin/records/spare-parts/{record_id}').json()['photo_data'], 'large-photo')
  self.assertEqual(self.client.get('/admin/records/users?limit=101').status_code, 422)
  self.assertNotIn('password_hash', self.client.get('/admin/records/users').text)
  summary = self.client.get('/admin/overview-counts').json()
  self.assertEqual(summary['spare-parts'], 32)
  self.assertEqual(summary['fields']['medical'], 1)
  for collection in ['job-cards', 'sale-items', 'knowledge', 'item-requests', 'spare-part-requests']:
   self.assertEqual(self.client.get('/admin/records/'+collection).status_code, 200)
  del self.app.dependency_overrides[get_current_user_id]
  self.assertEqual(self.client.get('/admin/overview-counts').status_code, 401)
