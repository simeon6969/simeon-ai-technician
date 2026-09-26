import unittest
from uuid import uuid4
from unittest.mock import patch
from sqlalchemy.exc import IntegrityError
import test_spare_part_posts
from backend.auth import get_current_user_id
from backend.models import Equipment, JobCard, MaintenanceKnowledge, SparePart, User, OfflineSubmission
from backend.routes.offline import router


class OfflineSyncTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)

    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)

    def job(self):
        return {'kind': 'job', 'submission_id': str(uuid4()),
                'equipment': {'category': 'Analyzer', 'manufacturer': 'Test', 'model': 'M1'},
                'job': {'equipment_id': 0, 'maintenance_type': 'corrective',
                        'fault_description': 'Broken', 'actions_taken': 'Repaired', 'successful': True}}

    def test_retry_returns_same_receipt_and_does_not_duplicate_any_rows(self):
        payload = self.job()
        first = self.client.post('/offline/submit', json=payload)
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(self.client.post('/offline/submit', json=payload).json(), first.json())
        for model in (Equipment, JobCard, MaintenanceKnowledge, OfflineSubmission):
            self.assertEqual(self.db.query(model).count(), 1)
        card = self.db.query(JobCard).one()
        self.assertEqual(card.submitter_name, 'Tech 1')
        self.assertEqual(card.status, 'validated')
        payload['job']['fault_description'] = 'Different'
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 409)
        self.assertEqual(self.db.query(JobCard).count(), 1)

    def test_shared_account_requires_submitter_and_preserves_heading(self):
        user = self.db.get(User, 1)
        user.role = 'organization'
        user.full_name = 'Clinic'
        self.db.commit()
        payload = self.job()
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 422)
        self.assertEqual(self.db.query(Equipment).count(), 0)
        payload['job']['submitter_name'] = 'Jane'
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 200)
        card = self.db.query(JobCard).one()
        self.assertEqual((card.account_name, card.submitter_name), ('Clinic', 'Jane'))

    def test_parts_are_account_scoped_and_keep_price_and_photo(self):
        payload = {'kind': 'part', 'submission_id': str(uuid4()), 'part': {
            'part_name': 'Pump', 'price': '150.25', 'currency': 'USD', 'photo_data': 'data:image/png;base64,aGVsbG8='}}
        first = self.client.post('/offline/submit', json=payload)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json(), self.client.post('/offline/submit', json=payload).json())
        part = self.db.get(SparePart, first.json()['record_id'])
        self.assertEqual(str(part.price), '150.25')
        self.assertEqual(part.photo_data, payload['part']['photo_data'])
        self.assertIsNone(part.posted_at)
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        second = self.client.post('/offline/submit', json=payload)
        self.assertNotEqual(first.json()['record_id'], second.json()['record_id'])
        self.assertEqual(self.db.get(SparePart, second.json()['record_id']).submitted_by, 2)
        self.app.dependency_overrides.pop(get_current_user_id)
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 401)

    def test_failed_commit_rolls_back_equipment_job_and_knowledge(self):
        with patch.object(self.db, 'commit', side_effect=IntegrityError('test', {}, Exception('failure'))):
            self.assertEqual(self.client.post('/offline/submit', json=self.job()).status_code, 409)
        for model in (Equipment, JobCard, MaintenanceKnowledge, OfflineSubmission):
            self.assertEqual(self.db.query(model).count(), 0)

    def test_invalid_payload_does_not_create_records(self):
        payload = {'kind': 'part', 'submission_id': str(uuid4()), 'part': {'part_name': 'Pump', 'price': '-1'}}
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 422)
        self.assertEqual(self.db.query(OfflineSubmission).count(), 0)

    def test_deleted_record_is_not_recreated_by_a_delayed_retry(self):
        payload = {'kind': 'part', 'submission_id': str(uuid4()), 'part': {'part_name': 'Pump'}}
        receipt = self.client.post('/offline/submit', json=payload).json()
        self.assertEqual(self.client.delete(f"/spare-parts/{receipt['record_id']}").status_code, 200)
        self.assertEqual(self.client.post('/offline/submit', json=payload).json(), receipt)
        self.assertIsNone(self.db.get(SparePart, receipt['record_id']))

    def test_account_deletion_cleans_up_sync_receipts(self):
        from backend.routes.admin import delete_admin_user
        self.assertEqual(self.client.post('/offline/submit', json=self.job()).status_code, 200)
        delete_admin_user(1, admin_id=2, db=self.db)
        self.assertEqual(self.db.query(OfflineSubmission).count(), 0)
        self.assertIsNone(self.db.get(User, 1))
