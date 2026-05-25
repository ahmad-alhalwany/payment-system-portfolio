from security import create_access_token, decode_token, hash_password, verify_password


def test_password_hash_and_verify():
    hashed = hash_password("secret")
    assert hashed != "secret"
    assert verify_password("secret", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_roundtrip():
    payload = {"username": "director", "role": "director", "user_id": 1}
    token = create_access_token(payload)
    decoded = decode_token(token)
    assert decoded["username"] == "director"
    assert decoded["role"] == "director"
    assert "exp" in decoded
