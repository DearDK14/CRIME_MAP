def test_register_user(client):
    payload = {
        "username": "new_officer",
        "email": "new.officer@test.gov",
        "password": "Password123!",
        "role": "police_officer"
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "new_officer"
    assert "hashed_password" not in data

def test_login_success(client):
    payload = {
        "username": "test_officer",
        "password": "Officer@123"
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "test_officer"

def test_login_invalid_password(client):
    payload = {
        "username": "test_officer",
        "password": "WrongPassword"
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 401

def test_get_me_profile(client, officer_headers):
    resp = client.get("/api/auth/me", headers=officer_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "test_officer"

def test_unauthorized_without_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
