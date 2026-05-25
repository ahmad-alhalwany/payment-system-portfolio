def test_list_users_includes_active_status(client, auth_headers, director_user):
    response = client.get("/users/", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    director = next(i for i in items if i["username"] == "director")
    assert director["is_active"] is True


def test_create_employee(client, auth_headers, demo_branch):
    response = client.post(
        "/users/",
        headers=auth_headers,
        json={
            "username": "new_staff",
            "password": "demo123",
            "role": "employee",
            "branch_id": demo_branch.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "new_staff"
    assert data["role"] == "employee"
    assert data["branch_name"] == demo_branch.name
    assert data["is_active"] is True


def test_create_employee_requires_branch(client, auth_headers):
    response = client.post(
        "/users/",
        headers=auth_headers,
        json={"username": "no_branch", "password": "demo123", "role": "employee"},
    )
    assert response.status_code == 400


def test_delete_employee(client, auth_headers, demo_branch, db_session):
    from models import User
    from security import hash_password

    user = User(
        username="to_delete",
        password=hash_password("demo123"),
        role="employee",
        branch_id=demo_branch.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.delete(f"/users/{user.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_cannot_delete_director(client, auth_headers, director_user):
    response = client.delete(f"/users/{director_user.id}", headers=auth_headers)
    assert response.status_code == 403


def test_search_users(client, auth_headers, director_user):
    response = client.get("/users/?search=director", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert any(i["username"] == "director" for i in items)


def test_filter_users_by_role(client, auth_headers, demo_branch):
    response = client.get("/users/?role=employee", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(i["role"] == "employee" for i in items)
