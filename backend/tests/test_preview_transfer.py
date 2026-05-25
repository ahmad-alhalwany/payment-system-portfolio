def test_preview_transfer_with_branch(client, auth_headers, demo_branch):
    response = client.post(
        "/money-transfer/preview/",
        headers=auth_headers,
        json={
            "amount": 10_000,
            "benefited_amount": 10_000,
            "currency": "SYP",
            "sending_branch_id": demo_branch.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tax_rate"] == 2.5
    assert data["tax_amount"] == 250.0
    assert data["branch_profit"] == 9750.0
    assert data["available_balance"] == 1_000_000
    assert data["valid"] is True
    assert data["sufficient_balance"] is True


def test_preview_transfer_insufficient_balance(client, auth_headers, demo_branch):
    response = client.post(
        "/money-transfer/preview/",
        headers=auth_headers,
        json={
            "amount": 2_000_000,
            "benefited_amount": 2_000_000,
            "currency": "SYP",
            "sending_branch_id": demo_branch.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["sufficient_balance"] is False
    assert any("Insufficient" in e for e in data["errors"])


def test_preview_transfer_benefited_exceeds_amount(client, auth_headers, demo_branch):
    response = client.post(
        "/money-transfer/preview/",
        headers=auth_headers,
        json={
            "amount": 1_000,
            "benefited_amount": 2_000,
            "currency": "SYP",
            "sending_branch_id": demo_branch.id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("exceed" in e.lower() for e in data["errors"])
