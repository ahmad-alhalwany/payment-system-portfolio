from models import User
from security import hash_password


def test_branch_employees_empty(client, manager_auth_headers, demo_branch):
    response = client.get("/branch-manager/employees/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["branch"]["id"] == demo_branch.id
    assert data["stats"]["total"] == 0
    assert data["items"] == []


def test_branch_employees_with_data(client, manager_auth_headers, demo_branch, db_session):
    db_session.add(
        User(
            username="emp_active",
            password=hash_password("demo123"),
            role="employee",
            branch_id=demo_branch.id,
        )
    )
    db_session.add(
        User(
            username="emp_other_branch",
            password=hash_password("demo123"),
            role="employee",
            branch_id=999,
        )
    )
    db_session.commit()

    response = client.get("/branch-manager/employees/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["username"] == "emp_active"
    assert data["items"][0]["is_active"] is True


def test_branch_employees_search(client, manager_auth_headers, demo_branch, db_session):
    db_session.add(
        User(username="ali_transfer", password="hash", role="employee", branch_id=demo_branch.id)
    )
    db_session.add(
        User(username="sara_transfer", password="hash", role="employee", branch_id=demo_branch.id)
    )
    db_session.commit()

    response = client.get(
        "/branch-manager/employees/",
        headers=manager_auth_headers,
        params={"search": "ali"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["username"] == "ali_transfer"


def test_branch_employees_forbidden_for_director(client, auth_headers):
    response = client.get("/branch-manager/employees/", headers=auth_headers)
    assert response.status_code == 403
