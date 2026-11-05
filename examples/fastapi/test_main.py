"""The demo app's endpoints."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_router_is_mounted() -> None:
    response = client.get("/locations/counties/47/constituencies")
    assert response.status_code == 200
    assert len(response.json()) == 17


def test_accepts_a_consistent_delivery() -> None:
    body = {"recipient": "Wanjiku", "county": 47, "constituency": "274", "ward": "1370"}
    response = client.post("/deliveries", json=body)
    assert response.status_code == 201
    assert response.json() == {
        "recipient": "Wanjiku",
        "address": "Mountain view ward, Westlands, Nairobi County",
    }


def test_rejects_unknown_and_inconsistent_codes() -> None:
    unknown = {"recipient": "A", "county": "999", "constituency": "274", "ward": "1370"}
    assert client.post("/deliveries", json=unknown).status_code == 422
    elsewhere = {"recipient": "A", "county": "47", "constituency": "274", "ward": "0133"}
    response = client.post("/deliveries", json=elsewhere)
    assert response.status_code == 422
    assert "ward is not in the constituency" in response.text


def test_path_dependency_in_a_custom_route() -> None:
    assert client.get("/counties/Nairobi/delivery-fee").json() == {
        "county": "Nairobi",
        "fee_kes": 200,
    }
    assert client.get("/counties/999/delivery-fee").status_code == 404
