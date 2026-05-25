def test_login_success(client, director_user):
    response = client.post("/login/", json={"username": "director", "password": "demo123"})
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["role"] == "director"
    assert data["access_token"]
    assert data["token"] == data["access_token"]


def test_login_invalid_password(client, director_user):
    response = client.post("/login/", json={"username": "director", "password": "wrong"})
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post("/login/", json={"username": "nobody", "password": "demo123"})
    assert response.status_code == 401


def test_protected_route_without_token(client):
    response = client.get("/users/")
    assert response.status_code == 401


def test_protected_route_with_token(client, auth_headers):
    response = client.get("/users/", headers=auth_headers)
    assert response.status_code == 200


def test_register_employee(client, auth_headers, demo_branch):
    response = client.post(
        "/register/",
        headers=auth_headers,
        json={
            "username": "new_employee",
            "password": "secure123",
            "role": "employee",
            "branch_id": demo_branch.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "new_employee"
    assert data["role"] == "employee"
    assert data["branch_id"] == demo_branch.id


def test_change_password(client, auth_headers, director_user):
    response = client.post(
        "/change-password/",
        headers=auth_headers,
        json={"old_password": "demo123", "new_password": "newpass456"},
    )
    assert response.status_code == 200

    login_old = client.post("/login/", json={"username": "director", "password": "demo123"})
    assert login_old.status_code == 401

    login_new = client.post("/login/", json={"username": "director", "password": "newpass456"})
    assert login_new.status_code == 200
