"""With MATHOM_AUTH_ENABLED unset, Mathom is the original single-user archive."""

import io

from fastapi.testclient import TestClient


def test_status_reports_auth_disabled(client: TestClient) -> None:
    status = client.get("/api/auth/status").json()
    assert status["auth_enabled"] is False
    assert status["authenticated"] is False
    assert status["user"] is None


def test_data_endpoints_work_without_login(client: TestClient) -> None:
    # No cookie, no login — uploading and listing behaves exactly as before.
    response = client.post(
        "/api/mathoms",
        files={"file": ("note.mp3", io.BytesIO(b"bytes"), "audio/mpeg")},
        data={"title": "Open archive"},
    )
    assert response.status_code == 201
    assert len(client.get("/api/mathoms").json()) == 1


def test_admin_endpoints_are_forbidden_when_disabled(client: TestClient) -> None:
    assert client.get("/api/users").status_code == 403
    assert client.get("/api/settings/authentik").status_code == 403
    # Login cannot even start when the feature is off.
    assert client.get("/api/auth/login", follow_redirects=False).status_code == 404
