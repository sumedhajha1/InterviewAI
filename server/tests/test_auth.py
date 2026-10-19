import json

def test_register_user_success(client):
    response = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "username": "newdev",
        "password": "Password123!"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["username"] == "newdev"

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/auth/register", json={
        "email": test_user["email"],
        "username": "anotheruser",
        "password": "Password123!"
    })
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data

def test_login_success(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "candidate@example.com",
        "password": "SecurePassword123"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["user"]["email"] == "candidate@example.com"

def test_login_invalid_credentials(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "candidate@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data

def test_get_current_user_profile(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["id"] == test_user["id"]
    assert data["user"]["email"] == test_user["email"]

def test_get_current_user_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
