import pytest
from app import create_app
from app.config import TestConfig
from app.database import db
from app.models import User
from app.utils.auth_helpers import generate_token

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(email="candidate@example.com", username="alexdev")
        user.set_password("SecurePassword123")
        db.session.add(user)
        db.session.commit()
        # Refresh to get ID
        user_id = user.id
        return {"id": user_id, "email": "candidate@example.com", "username": "alexdev"}

@pytest.fixture
def auth_headers(app, test_user):
    with app.app_context():
        token = generate_token(test_user["id"])
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
