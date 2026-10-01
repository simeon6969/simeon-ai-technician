import unittest
from uuid import uuid4
from unittest.mock import patch
from sqlalchemy.orm import sessionmaker
import test_spare_part_posts
from backend.auth import get_current_user_id
from backend.models import User, JobCard
from backend.models.job_forms import JobSheetSubmission
from backend.routes.offline import router as offline_router
from backend.routes.job_forms import router
from backend.sheet_sync import sync_pending, GoogleSheetWriter

class JobSheetTests(unittest.TestCase):
    def setUp(self):
        test_spare_part_posts.PostTests.setUp(self)
        self.app.include_router(router)
        self.app.include_router(offline_router)
        self.db.get(User, 2).role = 'admin'
        self.db.commit()
    def tearDown(self):
        test_spare_part_posts.PostTests.tearDown(self)
    def user(self, value):
        self.app.dependency_overrides[get_current_user_id] = lambda: value
    def publish(self):
        self.user(2)
        config = self.client.get('/job-card-form').json()
        questions = [{'key': q[0], 'label': q[1], 'help': q[2], 'required': q[3], 'kind': q[4]} for q in config['questions']]
        questions.append({'key': 'custom_room', 'label': 'Room', 'help': 'Where is the equipment?', 'required': True, 'kind': 'text'})
        response = self.client.put('/admin/job-card-form', json={'version': config['version'], 'questions': questions})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()
    def payload(self, version=0):
        return {'kind': 'job', 'submission_id': str(uuid4()), 'equipment': {'category': 'Pump', 'manufacturer': 'Acme', 'model': 'P1'},
                'job': {'equipment_id': 0, 'maintenance_type': 'corrective', 'fault_description': '=1+1', 'successful': False,
                        'form_version': version, 'custom_answers': {'custom_room': 'Room 5'} if version else {}}}
    def test_custom_answers_and_version_survive_offline_retry(self):
        form = self.publish()
        self.user(1)
        payload = self.payload(form['version'])
        first = self.client.post('/offline/submit', json=payload)
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(self.client.post('/offline/submit', json=payload).json(), first.json())
        row = self.db.query(JobSheetSubmission).one()
        self.assertEqual(row.answers['custom_room'], 'Room 5')
        self.assertEqual(row.questions[-1][1], 'Room')
        self.assertFalse(row.synced)
        self.assertEqual(self.db.query(JobCard).count(), 1)
        payload = self.payload(form['version'])
        payload['job']['custom_answers'] = {}
        self.assertEqual(self.client.post('/offline/submit', json=payload).status_code, 422)
        self.assertEqual(self.db.query(JobCard).count(), 1)
    def test_admin_controls_and_invalid_sheet_links(self):
        self.assertEqual(self.client.get('/admin/job-card-sheet').status_code, 403)
        form = self.publish()
        self.user(2)
        self.assertEqual(self.client.put('/admin/job-card-form', json={'version': 0, 'questions': []}).status_code, 422)
        self.assertEqual(self.client.put('/admin/job-card-sheet', json={'enabled': True, 'spreadsheet_url': 'https://evil.test'}).status_code, 422)
        status = self.client.get('/admin/job-card-sheet').json()
        self.assertIn('1UeIoc3SI8sU074vUiSW0ah-go-UuD9bc5bDsHBTbcyU', status['spreadsheet_url'])
        self.assertEqual(self.client.put('/admin/job-card-sheet', json={'enabled': False, 'spreadsheet_url': status['spreadsheet_url']}).status_code, 200)
    def test_google_failure_does_not_lose_database_and_retry_is_idempotent(self):
        self.client.post('/offline/submit', json=self.payload())
        calls = []
        class Writer:
            def write(self, spreadsheet, submission, card):
                calls.append(card.job_card_id)
                if len(calls) == 1:
                    raise RuntimeError('Temporary Google failure')
            def close(self): pass
        factory = sessionmaker(bind=self.engine)
        sync_pending(factory, Writer)
        self.db.expire_all()
        row = self.db.query(JobSheetSubmission).one()
        self.assertFalse(row.synced)
        self.assertEqual(row.attempts, 1)
        self.assertEqual(self.db.query(JobCard).count(), 1)
        self.user(2)
        self.client.post('/admin/job-card-sheet/retry')
        sync_pending(factory, Writer)
        sync_pending(factory, Writer)
        self.db.expire_all()
        self.assertTrue(self.db.query(JobSheetSubmission).one().synced)
        self.assertEqual(calls, [1, 1])
    def test_writer_uses_fixed_row_and_raw_values(self):
        self.client.post('/offline/submit', json=self.payload())
        submission = self.db.query(JobSheetSubmission).one()
        card = self.db.query(JobCard).one()
        writer = GoogleSheetWriter.__new__(GoogleSheetWriter)
        calls = []
        def call(method, url, **kwargs):
            calls.append((method, url, kwargs))
            if method == 'GET' and '/values/' not in url:
                return {'sheets': [{'properties': {'title': 'S Job Cards v0', 'sheetId': 1, 'gridProperties': {'rowCount': 1000, 'columnCount': 26}}}]}
            return {}
        writer.call = call
        writer.write('test-sheet', submission, card)
        writes = [entry for entry in calls if entry[0] == 'PUT']
        self.assertEqual(len(writes), 2)
        self.assertTrue(writes[-1][1].endswith('A2'))
        self.assertEqual(writes[-1][2]['params']['valueInputOption'], 'RAW')
        self.assertIn('=1+1', writes[-1][2]['json']['values'][0])
    def test_legacy_backfill_does_not_duplicate(self):
        self.client.post('/offline/submit', json=self.payload())
        self.db.query(JobSheetSubmission).delete()
        self.db.commit()
        self.user(2)
        self.client.post('/admin/job-card-sheet/include-existing')
        self.client.post('/admin/job-card-sheet/include-existing')
        self.assertEqual(self.db.query(JobSheetSubmission).count(), 1)
