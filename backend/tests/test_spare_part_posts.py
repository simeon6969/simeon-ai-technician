import os
import unittest
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['SECRET_KEY'] = 'posts-test-key-not-for-production'

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from backend.base import Base
from backend.models import User, SparePart
from backend.auth import get_current_user_id
from backend.routes.spare_parts import router, get_db


class PostTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([User(user_id=i, full_name=f'Tech {i}', email=f'{i}@example.test', password_hash='hidden') for i in (1, 2)])
        self.db.add_all([SparePart(spare_part_id=i, submitted_by=i, part_name=f'Part {i}') for i in (1, 2)])
        self.db.commit()
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.app.dependency_overrides[get_current_user_id] = lambda: 1
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def test_owner_only_and_idempotent_post(self):
        self.assertEqual(self.client.post('/spare-parts/2/post').status_code, 404)
        first = self.client.post('/spare-parts/1/post')
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json(), self.client.post('/spare-parts/1/post').json())
        self.assertIsNotNone(self.client.get('/spare-parts/my').json()[0]['posted_at'])

    def test_shared_board_only_contains_posts_and_deletion_removes_post(self):
        self.assertEqual(self.client.get('/spare-parts/posts').json()['total'], 0)
        self.client.post('/spare-parts/1/post')
        self.app.dependency_overrides[get_current_user_id] = lambda: 2
        result = self.client.get('/spare-parts/posts').json()
        self.assertEqual(result['total'], 1)
        self.assertEqual(result['posts'][0]['technician_name'], 'Tech 1')
        self.assertNotIn('email', result['posts'][0])
        self.client.post('/spare-parts/2/post')
        result = self.client.get('/spare-parts/posts?limit=1&offset=1').json()
        self.assertEqual(result['total'], 2)
        self.assertEqual(len(result['posts']), 1)
        self.client.delete('/spare-parts/2')
        self.assertEqual(self.client.get('/spare-parts/posts').json()['total'], 1)

    def test_board_requires_authentication(self):
        del self.app.dependency_overrides[get_current_user_id]
        self.assertEqual(self.client.get('/spare-parts/posts').status_code, 401)
        self.assertEqual(self.client.post('/spare-parts/1/post').status_code, 401)
