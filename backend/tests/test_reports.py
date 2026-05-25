from datetime import datetime

from models import Branch, Transaction, User


def test_transactions_report_empty(client, auth_headers):
    response = client.get("/reports/transactions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "stats" in data
    assert "charts" in data
    assert data["stats"]["total_count"] == 0


def test_transactions_report_with_data(client, auth_headers, demo_branch, db_session):
    tx = Transaction(
        id="TX-REPORT-1",
        sender="Ali",
        receiver="Sara",
        amount=5000,
        benefited_amount=5000,
        tax_amount=125,
        tax_rate=2.5,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        employee_name="employee",
        status="completed",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.get(
        "/reports/transactions/",
        headers=auth_headers,
        params={"from_date": datetime.now().strftime("%Y-%m-%d")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_count"] == 1
    assert data["stats"]["total_amount"] == 5000
    assert len(data["items"]) == 1
    assert data["charts"]["status_counts"][0]["status"] == "completed"


def test_branches_report(client, auth_headers, demo_branch):
    response = client.get("/reports/branches/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["branch_stats"]) >= 1
    assert data["stats"]["branch_count"] >= 1


def test_employees_report(client, auth_headers, demo_branch, db_session):
    user = User(
        username="emp_report",
        password="hash",
        role="employee",
        branch_id=demo_branch.id,
    )
    db_session.add(user)
    db_session.commit()

    response = client.get(
        "/reports/employees/",
        headers=auth_headers,
        params={"search": "emp_report"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(item["username"] == "emp_report" for item in data["items"])


def test_daily_report(client, auth_headers, demo_branch, db_session):
    tx = Transaction(
        id="TX-DAILY-1",
        sender="A",
        receiver="B",
        amount=1000,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="processing",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    today = datetime.now().strftime("%Y-%m-%d")
    response = client.get(
        "/reports/daily/",
        headers=auth_headers,
        params={"from_date": today, "to_date": today},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_count"] >= 1


def test_transactions_report_date_alias(client, auth_headers):
    response = client.get(
        "/reports/transactions/",
        headers=auth_headers,
        params={"start_date": "2024-01-01", "end_date": "2024-12-31"},
    )
    assert response.status_code == 200


def test_transactions_report_search(client, auth_headers, demo_branch, db_session):
    tx = Transaction(
        id="TX-SEARCH-ALI",
        sender="Ali Hassan",
        receiver="Sara",
        amount=1000,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="completed",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.get(
        "/reports/transactions/",
        headers=auth_headers,
        params={"search": "Ali"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_count"] == 1
    assert data["items"][0]["sender"] == "Ali Hassan"


def test_branch_manager_reports_scoped(client, manager_auth_headers, demo_branch, db_session):
    other_branch = Branch(
        branch_id="BR-OTHER",
        name="فرع آخر",
        location="X",
        governorate="Y",
        allocated_amount_syp=0,
        allocated_amount_usd=0,
    )
    db_session.add(other_branch)
    db_session.flush()
    db_session.add(
        Transaction(
            id="TX-MANAGER-SCOPE",
            sender="A",
            receiver="B",
            amount=500,
            currency="SYP",
            branch_id=demo_branch.id,
            destination_branch_id=demo_branch.id,
            status="completed",
            date=datetime.now(),
        )
    )
    db_session.add(
        Transaction(
            id="TX-OTHER-BRANCH",
            sender="C",
            receiver="D",
            amount=9000,
            currency="SYP",
            branch_id=other_branch.id,
            destination_branch_id=other_branch.id,
            status="completed",
            date=datetime.now(),
        )
    )
    db_session.commit()

    response = client.get("/reports/transactions/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_count"] == 1
    assert data["items"][0]["id"] == "TX-MANAGER-SCOPE"
