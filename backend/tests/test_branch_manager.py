from datetime import datetime

from models import Transaction, User
from security import hash_password


def test_branch_manager_dashboard_empty(client, manager_auth_headers, demo_branch):
    response = client.get("/branch-manager/dashboard/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["branch"]["id"] == demo_branch.id
    assert data["branch"]["name"] == demo_branch.name
    assert data["stats"]["employees"] == 0
    assert data["stats"]["outgoing_count"] == 0
    assert data["stats"]["incoming_count"] == 0
    assert data["recent_transfers"] == []
    assert data["manager"]["username"] == "manager"


def test_branch_manager_dashboard_with_data(client, manager_auth_headers, demo_branch, db_session):
    employee = User(
        username="emp1",
        password="hash",
        role="employee",
        branch_id=demo_branch.id,
    )
    db_session.add(employee)
    db_session.add(
        Transaction(
            id="TX-BM-OUT",
            sender="Ali",
            receiver="Sara",
            amount=10_000,
            benefited_amount=10_500,
            tax_amount=250,
            tax_rate=2.5,
            currency="SYP",
            branch_id=demo_branch.id,
            destination_branch_id=demo_branch.id,
            employee_name="emp1",
            status="completed",
            date=datetime.now(),
        )
    )
    db_session.add(
        Transaction(
            id="TX-BM-IN",
            sender="Omar",
            receiver="Layla",
            amount=500,
            benefited_amount=500,
            tax_amount=0,
            currency="USD",
            branch_id=demo_branch.id,
            destination_branch_id=demo_branch.id,
            employee_name="emp1",
            status="pending",
            date=datetime.now(),
        )
    )
    db_session.commit()

    response = client.get("/branch-manager/dashboard/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["employees"] == 1
    assert data["stats"]["outgoing_count"] >= 1
    assert data["stats"]["incoming_count"] >= 1
    assert data["stats"]["processing_outgoing"] >= 1
    assert len(data["recent_transfers"]) >= 2
    assert data["stats"]["total_tax"] == 250


def test_branch_manager_dashboard_forbidden_for_employee(client, demo_branch, db_session):
    user = User(
        username="employee_only",
        password=hash_password("demo123"),
        role="employee",
        branch_id=demo_branch.id,
    )
    db_session.add(user)
    db_session.commit()

    login = client.post("/login/", json={"username": "employee_only", "password": "demo123"})
    assert login.status_code == 200

    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.get("/branch-manager/dashboard/", headers=headers)
    assert response.status_code == 403
