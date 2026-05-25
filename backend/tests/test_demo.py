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


def test_demo_seed_creates_rich_data(db_session):
    from services.demo import ensure_demo_data, demo_data_summary

    ensure_demo_data(db_session)
    counts = demo_data_summary(db_session)
    assert counts["branches"] >= 3
    assert counts["users"] >= 6
    assert counts["transactions"] >= 20
