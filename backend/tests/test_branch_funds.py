def test_add_funds(client, auth_headers, demo_branch):
    response = client.post(
        f"/branches/{demo_branch.id}/funds/",
        headers=auth_headers,
        json={"amount": 500_000, "currency": "SYP", "operation": "add", "description": "Test deposit"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["allocated_amount_syp"] == 1_500_000


def test_deduct_funds(client, auth_headers, demo_branch):
    response = client.post(
        f"/branches/{demo_branch.id}/funds/",
        headers=auth_headers,
        json={"amount": 200_000, "currency": "SYP", "operation": "deduct"},
    )
    assert response.status_code == 200
    assert response.json()["allocated_amount_syp"] == 800_000


def test_deduct_insufficient_funds(client, auth_headers, demo_branch):
    response = client.post(
        f"/branches/{demo_branch.id}/funds/",
        headers=auth_headers,
        json={"amount": 9_999_999, "currency": "SYP", "operation": "deduct"},
    )
    assert response.status_code == 400


def test_clear_tax_rate(client, auth_headers, demo_branch):
    response = client.delete(
        f"/api/branches/{demo_branch.id}/tax_rate/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["tax_rate"] == 0.0


def test_branches_include_computed_status(client, auth_headers, demo_branch):
    response = client.get("/branches/?include_employee_count=true", headers=auth_headers)
    assert response.status_code == 200
    branches = response.json()["branches"]
    match = next(b for b in branches if b["id"] == demo_branch.id)
    assert match["status"] == "active"
    assert "balance" in match
