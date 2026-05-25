def test_list_transactions_formatted_date(client, auth_headers, demo_branch, db_session):
    from datetime import datetime
    from models import Transaction
    import uuid

    tx = Transaction(
        id=str(uuid.uuid4()),
        sender="Ali",
        receiver="Sara",
        sender_mobile="0991111111",
        receiver_mobile="0992222222",
        amount=5000,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="processing",
        date=datetime(2026, 1, 15, 14, 30),
        employee_name="employee",
    )
    db_session.add(tx)
    db_session.commit()

    response = client.get("/transactions/", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    match = next(i for i in items if i["id"] == tx.id)
    assert match["date"] == "2026-01-15 14:30"
    assert match["short_id"] == tx.id[:8]


def test_update_transaction(client, auth_headers, demo_branch, db_session):
    from datetime import datetime
    from models import Transaction
    import uuid

    tx = Transaction(
        id=str(uuid.uuid4()),
        sender="Old Sender",
        receiver="Old Receiver",
        amount=1000,
        currency="USD",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="processing",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.put(
        f"/transactions/{tx.id}/",
        headers=auth_headers,
        json={"sender": "New Sender", "message": "Updated note"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "New Sender"
    assert data["message"] == "Updated note"


def test_patch_transaction_status(client, auth_headers, demo_branch, db_session):
    from datetime import datetime
    from models import Transaction
    import uuid

    tx = Transaction(
        id=str(uuid.uuid4()),
        sender="A",
        receiver="B",
        amount=2000,
        benefited_amount=100,
        tax_rate=2.5,
        currency="SYP",
        branch_id=demo_branch.id,
        destination_branch_id=demo_branch.id,
        status="processing",
        date=datetime.now(),
    )
    db_session.add(tx)
    db_session.commit()

    response = client.patch(
        f"/transactions/{tx.id}/status/",
        headers=auth_headers,
        json={"status": "completed"},
    )
    assert response.status_code == 200
    assert response.json()["transaction"]["status"] == "completed"
