from __future__ import annotations

from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, ValidationError

from kenya_locations.contrib.fastapi import (
    CountyCode,
    CountyFromPath,
    WardCode,
    create_router,
)

app = FastAPI()
app.include_router(create_router(), prefix="/locations")


@app.get("/stores/{county}")
def stores(county: CountyFromPath) -> dict[str, str]:
    return {"county": county.name}


client = TestClient(app)


def get(url: str, **params: Any) -> Any:
    response = client.get(url, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_lists_counties_with_every_field() -> None:
    counties = get("/locations/counties")
    assert len(counties) == 47
    nairobi = next(c for c in counties if c["code"] == "047")
    assert nairobi == {
        "code": "047",
        "iso_code": "KE-30",
        "name": "Nairobi",
        "capital": "Nairobi",
        "area_km2": nairobi["area_km2"],
        "population_2019": 4397073,
        "region": "Nairobi",
        "postal_code": nairobi["postal_code"],
        "aliases": ["Nairobi City"],
    }


@pytest.mark.parametrize("county", ["047", "47", "Nairobi", "nairobi", "Nairobi City"])
def test_gets_a_county_by_code_or_name(county: str) -> None:
    assert get(f"/locations/counties/{county}")["code"] == "047"


@pytest.mark.parametrize(
    ("url", "count"),
    [
        ("/locations/counties/47/constituencies", 17),
        ("/locations/counties/47/wards", 85),
        ("/locations/counties/47/localities", 77),
        ("/locations/counties/47/areas", 151),
        ("/locations/counties/Garissa/localities/Bura/areas", 3),
        ("/locations/constituencies/274/wards", 5),
        ("/locations/constituencies/Westlands/wards", 5),
        ("/locations/sub-counties/04701/wards", 5),
        ("/locations/sub-counties/Ainabkoi/wards", 3),
        ("/locations/constituencies", 290),
        ("/locations/wards", 1450),
    ],
)
def test_drill_down_counts(url: str, count: int) -> None:
    assert len(get(url)) == count


def test_detail_endpoints() -> None:
    assert get("/locations/constituencies/274")["name"] == "Westlands"
    assert get("/locations/wards/1370")["name"] == "Mountain view"
    assert get("/locations/wards/133")["code"] == "0133"
    assert get("/locations/sub-counties/04701")["name"] == "Westlands"
    assert get("/locations/counties/27/sub-counties")
    assert get("/locations/sub-counties")


@pytest.mark.parametrize(
    "url",
    [
        "/locations/counties/999",
        "/locations/constituencies/Nowhere/wards",
        "/locations/sub-counties/Nowhere",
        "/locations/counties/Nairobi/localities/Bura/areas",
    ],
)
def test_unknown_or_ambiguous_paths_are_404(url: str) -> None:
    response = client.get(url)
    assert response.status_code == 404
    assert response.json()["detail"]


def test_ambiguous_names_are_409_with_the_candidates() -> None:
    response = client.get("/locations/wards/Township")
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail.startswith("9 ward records are named 'Township': 0133")
    assert "Pass the ward code instead." in detail
    bura = client.get("/locations/counties/Nairobi/localities/Bura/areas")
    assert bura.status_code == 404
    assert bura.json()["detail"] == "No locality matches 'Bura' in Nairobi County."


def test_exception_handlers_cover_your_own_routes() -> None:
    import kenya_locations as kl
    from kenya_locations.contrib.fastapi import add_exception_handlers

    own = FastAPI()
    add_exception_handlers(own)

    @own.get("/wards/{name}")
    def ward(name: str) -> dict[str, str]:
        return {"code": kl.require_ward(name).code}

    @own.get("/county-by-number/{number}")
    def county(number: int) -> dict[str, str]:
        return {"name": kl.require_county(number).name}

    own_client = TestClient(own)
    assert own_client.get("/wards/1370").json() == {"code": "1370"}
    missing = own_client.get("/wards/Nowhere")
    assert missing.status_code == 404
    assert missing.json() == {"detail": "No ward matches 'Nowhere'."}
    ambiguous = own_client.get("/wards/Township")
    assert ambiguous.status_code == 409
    assert len(ambiguous.json()["matches"]) == 9
    assert own_client.get("/county-by-number/-1").status_code == 422


def test_responses_are_cacheable() -> None:
    assert "max-age=86400" in client.get("/locations/counties").headers["cache-control"]
    plain = FastAPI()
    plain.include_router(create_router(cache_max_age=0))
    assert "cache-control" not in TestClient(plain).get("/counties").headers


def test_search_returns_typed_items() -> None:
    results = get("/locations/search", q="Nairob")
    assert results[0]["type"] == "county"
    assert results[0]["item"]["code"] == "047"

    wards = get("/locations/search", q="Mountain view", type="ward")
    assert wards[0]["item"] == {
        "code": "1370",
        "name": "Mountain view",
        "constituency": "Westlands",
        "constituency_code": "274",
        "county_code": "047",
        "sub_county_code": "04701",
    }

    areas = get("/locations/search", q="Gigiri", type=["area", "locality"])
    assert {r["type"] for r in areas} <= {"area", "locality"}
    assert "locality" in next(r for r in areas if r["type"] == "area")["item"]


def test_search_items_keep_their_own_shape() -> None:
    for result in get("/locations/search", q="West", limit=100):
        keys = set(result["item"])
        expected = {
            "county": {
                "code",
                "iso_code",
                "name",
                "capital",
                "area_km2",
                "population_2019",
                "region",
                "postal_code",
                "aliases",
            },
            "sub-county": {"code", "name", "county", "county_code"},
            "constituency": {"code", "name", "county", "county_code"},
            "ward": {
                "code",
                "name",
                "constituency",
                "constituency_code",
                "county_code",
                "sub_county_code",
            },
            "locality": {"name", "county", "county_code"},
            "area": {"name", "locality", "county", "county_code"},
        }[result["type"]]
        assert keys == expected, result


@pytest.mark.parametrize(
    "params",
    [
        {"q": "a"},
        {"q": "Nairobi", "limit": 0},
        {"q": "Nairobi", "limit": 101},
        {"q": "x", "type": "planet"},
    ],
)
def test_search_rejects_bad_parameters(params: dict[str, Any]) -> None:
    assert client.get("/locations/search", params=params).status_code == 422


def test_openapi_documents_every_route() -> None:
    paths = client.get("/openapi.json").json()["paths"]
    assert "/locations/counties/{county}/constituencies" in paths
    assert "/locations/search" in paths
    assert paths["/locations/counties"]["get"]["tags"] == ["Kenya locations"]


def test_dependencies_work_in_your_own_routes() -> None:
    assert get("/stores/47") == {"county": "Nairobi"}
    assert client.get("/stores/999").status_code == 404


class Delivery(BaseModel):
    county: CountyCode
    ward: WardCode


@pytest.mark.parametrize("county", ["47", 47, "047", " 47 "])
def test_code_types_zero_pad(county: Any) -> None:
    delivery = Delivery.model_validate({"county": county, "ward": 1370})
    assert delivery.county == "047"
    assert delivery.ward == "1370"


@pytest.mark.parametrize("bad", [{"county": "999", "ward": "1370"}, {"county": True, "ward": "1"}])
def test_code_types_reject_unknown_codes(bad: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        Delivery(**bad)


def test_code_types_document_themselves() -> None:
    schema = Delivery.model_json_schema()
    assert schema["properties"]["county"]["examples"] == ["047"]
