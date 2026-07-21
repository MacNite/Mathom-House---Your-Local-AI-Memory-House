"""Router tests for the text and document upload endpoints.

The background worker runs with Ollama mocked (see conftest), so uploads reach
a terminal state without network or models.
"""

import io

from fastapi.testclient import TestClient


def test_create_text_mathom(client: TestClient, wait_for_status) -> None:  # type: ignore[no-untyped-def]
    response = client.post(
        "/api/mathoms/text",
        json={"text": "A pasted note worth keeping.", "title": "Note"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source_type"] == "text"
    assert body["has_audio_stream"] is False
    assert body["has_video_stream"] is False

    detail = wait_for_status(client, body["id"])
    assert detail["status"] == "ready"
    assert detail["transcript"] == "A pasted note worth keeping."
    assert len(detail["summaries"]) == 1


def test_text_rejects_blank(client: TestClient) -> None:
    # Whitespace-only text passes the min_length=1 schema check but is rejected
    # by the endpoint body validation.
    response = client.post("/api/mathoms/text", json={"text": "   "})
    assert response.status_code == 422


def test_text_rejects_over_limit(client: TestClient) -> None:
    from app.config import get_settings

    limit = get_settings().max_text_chars
    response = client.post("/api/mathoms/text", json={"text": "x" * (limit + 1)})
    assert response.status_code == 413


def test_text_mathom_has_no_audio(client: TestClient, wait_for_status) -> None:  # type: ignore[no-untyped-def]
    created = client.post("/api/mathoms/text", json={"text": "Some content."}).json()
    wait_for_status(client, created["id"])
    audio = client.get(f"/api/mathoms/{created['id']}/audio")
    assert audio.status_code == 409


def test_upload_document_txt(client: TestClient, wait_for_status) -> None:  # type: ignore[no-untyped-def]
    response = client.post(
        "/api/mathoms/documents",
        files={"file": ("memo.txt", io.BytesIO(b"Document body text."), "text/plain")},
        data={"title": "Memo"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["source_type"] == "document"
    assert body["has_audio_stream"] is False

    detail = wait_for_status(client, body["id"])
    assert detail["status"] == "ready"
    assert detail["transcript"] == "Document body text."


def test_upload_document_markdown(client: TestClient, wait_for_status) -> None:  # type: ignore[no-untyped-def]
    response = client.post(
        "/api/mathoms/documents",
        files={"file": ("readme.md", io.BytesIO(b"# Heading\n\nText."), "text/markdown")},
    )
    assert response.status_code == 201, response.text
    detail = wait_for_status(client, response.json()["id"])
    assert detail["status"] == "ready"
    assert "# Heading" in detail["transcript"]


def test_upload_document_rejects_unknown_extension(client: TestClient) -> None:
    response = client.post(
        "/api/mathoms/documents",
        files={"file": ("thing.rtf", io.BytesIO(b"data"), "application/rtf")},
    )
    assert response.status_code == 415


def test_upload_document_rejects_empty(client: TestClient) -> None:
    response = client.post(
        "/api/mathoms/documents",
        files={"file": ("blank.txt", io.BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400


def test_binary_document_is_accepted_at_upload(client: TestClient) -> None:
    # A .txt with NUL bytes passes the upload allowlist; extraction fails later
    # in the worker. Here we only assert the upload itself is accepted, so the
    # test stays fast and independent of the worker's retry/backoff schedule.
    response = client.post(
        "/api/mathoms/documents",
        files={"file": ("bad.txt", io.BytesIO(b"text\x00more"), "text/plain")},
    )
    assert response.status_code == 201, response.text


def test_extraction_error_maps_to_calm_message() -> None:
    from app.services import documents, pipeline

    message = pipeline._safe_error(documents.DocumentExtractionError("This is not valid UTF-8."))
    assert message == "This is not valid UTF-8."


def test_source_download(client: TestClient, wait_for_status) -> None:  # type: ignore[no-untyped-def]
    created = client.post(
        "/api/mathoms/documents",
        files={"file": ("memo.txt", io.BytesIO(b"Retained source."), "text/plain")},
    ).json()
    wait_for_status(client, created["id"])
    download = client.get(f"/api/mathoms/{created['id']}/source")
    assert download.status_code == 200
    assert download.content == b"Retained source."
