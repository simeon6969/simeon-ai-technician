import os
import unittest
from unittest.mock import patch
from datetime import datetime

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['SECRET_KEY'] = 'isolated-admin-delete-tests'

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError
from backend.base import Base
from backend.models import (User, Equipment, JobCard, MaintenanceKnowledge,
                            SparePart, SparePartRequest, SaleItem, ChatSession, ChatMessage)
from backend.auth import create_access_token
from backend.routes.admin import router, get_db


class AdminDeletionTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        event.listen(self.engine, 'connect', lambda connection, _: connection.execute('PRAGMA foreign_keys=ON'))
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([User(user_id=i, full_name=f'User {i}', email=f'{i}@example.test',
                              password_hash='secret', role=role, is_active=i != 4)
                         for i, role in [(1, 'admin'), (2, 'organization'), (3, 'technician'), (4, 'admin')]])
        self.db.add(Equipment(equipment_id=1, category='Test', manufacturer='Test', model='Test'))
        self.db.commit()
        for owner in (2, 3):
            self.db.add(JobCard(job_card_id=owner, technician_id=owner, equipment_id=1,
                                maintenance_type='repair', fault_description='Fault'))
            self.db.add(SparePart(spare_part_id=owner, submitted_by=owner, part_name=f'Part {owner}'))
            self.db.add(SaleItem(item_id=owner, seller_id=owner, name=f'Item {owner}',
                                 description='Details', price=12, currency='RWF', photo_data='photo',
                                 posted_at=datetime.now() if owner == 2 else None))
            self.db.add(ChatSession(session_id=owner, user_id=owner))
        self.db.commit()
        for owner in (2, 3):
            self.db.add(MaintenanceKnowledge(knowledge_id=owner, source_job_card_id=owner,
                                            equipment_id=1, problem_description='Fault'))
            self.db.add(ChatMessage(session_id=owner, role='user', content='Question'))
        self.db.add_all([
            SparePartRequest(spare_part_id=2, requester_id=3, supplier_technician_id=2),
            SparePartRequest(spare_part_id=3, requester_id=2, supplier_technician_id=3),
            SparePartRequest(spare_part_id=3, requester_id=3, supplier_technician_id=3),
        ])
        self.db.commit()
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_db] = lambda: self.db
        self.client = TestClient(app)
        self.auth_patch = patch('backend.auth.SessionLocal', lambda: Session(self.engine))
        self.auth_patch.start()

    def tearDown(self):
        self.auth_patch.stop()
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def request(self, method, path, user=1):
        headers = {'Authorization': f'Bearer {create_access_token(user)}'} if user else {}
        return self.client.request(method, '/admin' + path, headers=headers)

    def test_permissions_and_admin_protection(self):
        for path in ['/users/2', '/job-cards/2', '/spare-parts/2', '/sale-items/2']:
            for user, expected in [(None, 401), (2, 403), (3, 403), (4, 401)]:
                self.assertEqual(self.request('DELETE', path, user).status_code, expected)
        for user in (1, 4):
            self.assertEqual(self.request('DELETE', f'/users/{user}').status_code, 403)
            self.assertIsNotNone(self.db.get(User, user))
        self.assertEqual(self.request('GET', '/sale-items', 3).status_code, 403)

    def test_account_deletion_cleans_dependents_and_keeps_other_accounts(self):
        token = create_access_token(2)
        self.assertEqual(self.request('DELETE', '/users/2').status_code, 200)
        self.db.expire_all()
        for model in (User, JobCard, MaintenanceKnowledge, SparePart, SaleItem, ChatSession):
            self.assertIsNone(self.db.get(model, 2), model.__name__)
            self.assertIsNotNone(self.db.get(model, 3), model.__name__)
        self.assertEqual(self.db.query(ChatMessage).count(), 1)
        self.assertEqual(self.db.query(SparePartRequest).count(), 1)
        self.assertIsNotNone(self.db.get(Equipment, 1))
        self.assertEqual(self.client.get('/admin/users', headers={'Authorization': f'Bearer {token}'}).status_code, 401)

    def test_individual_record_deletion_and_not_found(self):
        for path, model in [('/job-cards/2', JobCard), ('/spare-parts/2', SparePart), ('/sale-items/2', SaleItem)]:
            self.assertEqual(self.request('DELETE', path).status_code, 200)
            self.assertIsNone(self.db.get(model, 2))
            self.assertEqual(self.request('DELETE', path).status_code, 404)
        self.assertIsNone(self.db.get(MaintenanceKnowledge, 2))
        self.assertEqual(self.db.query(SparePartRequest).count(), 2)
        self.assertIsNotNone(self.db.get(User, 2))
        self.assertEqual(self.request('DELETE', '/users/999').status_code, 404)

    def test_admin_lists_drafts_and_posts_without_secrets(self):
        response = self.request('GET', '/sale-items')
        self.assertEqual(response.status_code, 200)
        items = {item['item_id']: item for item in response.json()}
        self.assertEqual(set(items), {2, 3})
        self.assertEqual(items[2]['seller_name'], 'User 2')
        self.assertEqual(items[2]['price'], '12.00')
        self.assertIsNotNone(items[2]['posted_at'])
        self.assertIsNone(items[3]['posted_at'])
        self.assertNotIn('password_hash', response.text)

    def test_account_deletion_rolls_back_if_commit_fails(self):
        with patch.object(self.db, 'commit', side_effect=IntegrityError('delete', {}, Exception('conflict'))):
            self.assertEqual(self.request('DELETE', '/users/2').status_code, 409)
        for model in (User, JobCard, MaintenanceKnowledge, SparePart, SaleItem, ChatSession):
            self.assertIsNotNone(self.db.get(model, 2))
        self.assertEqual(self.db.query(SparePartRequest).count(), 3)


if __name__ == '__main__':
    unittest.main()
