from datetime import datetime

from models import Transaction


def test_branch_profits_empty(client, manager_auth_headers, demo_branch):
    response = client.get("/branch-manager/profits/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["branch"]["id"] == demo_branch.id
    assert data["stats"]["total_transactions"] == 0
    assert data["items"] == []


def test_branch_profits_with_data(client, manager_auth_headers, demo_branch, db_session):
    db_session.add(
        Transaction(
            id="TX-PROFIT-1",
            sender="A",
            receiver="B",
            amount=10_000,
            benefited_amount=10_500,
            tax_amount=250,
            tax_rate=2.5,
            currency="SYP",
            branch_id=demo_branch.id,
            destination_branch_id=demo_branch.id,
            status="completed",
            date=datetime.now(),
        )
    )
    db_session.commit()

    response = client.get("/branch-manager/profits/", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_transactions"] == 1
    assert data["stats"]["total_profits_syp"] > 0
    assert len(data["items"]) == 1


def test_branch_profits_forbidden_for_director(client, auth_headers):
    response = client.get("/branch-manager/profits/", headers=auth_headers)
    assert response.status_code == 403
