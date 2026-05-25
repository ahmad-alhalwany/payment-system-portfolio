def test_demo_login_by_role(client, db_session):
    response = client.post("/demo/login/", json={"role": "director"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "director"
    assert data["username"] == "director"
    assert data["access_token"]


def test_demo_login_invalid_role(client):
    response = client.post("/demo/login/", json={"role": "superadmin"})
    assert response.status_code == 422
