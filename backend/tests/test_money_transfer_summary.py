def test_money_transfer_summary(client, auth_headers, director_user):
    response = client.get("/money-transfer/summary/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "director"
    assert data["role"] == "director"
    assert "outgoing_count" in data
    assert "incoming_count" in data
