def test_get_system_settings(client, auth_headers):
    response = client.get("/settings/system/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "systemName" in data
    assert "defaultCurrency" in data
    assert data["defaultCurrency"] in ("SYP", "USD", "EUR")


def test_update_system_settings_director(client, auth_headers):
    payload = {
        "systemName": "Test System",
        "companyName": "Test Co",
        "adminEmail": "admin@test.com",
        "defaultCurrency": "SYP",
        "mainPhone": "0912345678",
        "receiptFooter": "Thank you",
        "transferMinAmount": 500,
        "transferMaxAmount": 0,
        "requireReceiverPhone": True,
        "requireCompletedForTax": True,
        "defaultLocale": "ar",
    }
    response = client.put("/settings/system/", headers=auth_headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["systemName"] == "Test System"
    assert data["transferMinAmount"] == 500


def test_update_system_settings_invalid_payload(client, auth_headers):
    payload = {
        "systemName": "",
        "companyName": "Test",
        "adminEmail": "admin@test.com",
        "defaultCurrency": "SYP",
        "mainPhone": "",
        "receiptFooter": "",
        "transferMinAmount": 0,
        "transferMaxAmount": 0,
        "requireReceiverPhone": False,
        "requireCompletedForTax": True,
        "defaultLocale": "en",
    }
    response = client.put("/settings/system/", headers=auth_headers, json=payload)
    assert response.status_code == 422
