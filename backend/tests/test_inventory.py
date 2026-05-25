from datetime import datetime

from models import Transaction


def test_inventory_summary_empty(client, auth_headers):
    today = datetime.now().strftime("%Y-%m-%d")
    response = client.get(
        "/inventory/summary/",
        headers=auth_headers,
        params={"from_date": today, "to_date": today},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["transactions_count"] == 0
    assert data["by_branch"] == []


def test_inventory_profit_calculation(client, auth_headers, demo_branch, db_session):
    tx = Transaction(
        id="TX-INV-1",
        sender="Ali",
        receiver="Sara",
        amount=10000,
        benefited_amount=10000,
        tax_amount=250,
        tax_rate=2.5,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="completed",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    today = datetime.now().strftime("%Y-%m-%d")
    response = client.get(
        "/inventory/summary/",
        headers=auth_headers,
        params={"from_date": today, "to_date": today, "branch_id": demo_branch.id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["transactions_count"] == 1
    assert data["summary"]["tax_collected"] == 250
    assert data["summary"]["total_profit"] == 9750
    assert len(data["by_branch"]) == 1
    assert data["by_branch"][0]["profit"] == 9750


def test_inventory_export_csv(client, auth_headers, demo_branch, db_session):
    tx = Transaction(
        id="TX-INV-2",
        sender="A",
        receiver="B",
        amount=5000,
        benefited_amount=5000,
        tax_amount=125,
        tax_rate=2.5,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="completed",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    today = datetime.now().strftime("%Y-%m-%d")
    response = client.get(
        "/inventory/export/csv/",
        headers=auth_headers,
        params={"from_date": today, "to_date": today},
    )
    assert response.status_code == 200
    assert "branch_name" in response.text
    assert "TX-INV-2" in response.text
