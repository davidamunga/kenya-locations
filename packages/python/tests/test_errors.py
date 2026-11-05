"""Bad input fails loudly; strict lookups explain what to pass instead."""

from __future__ import annotations

from typing import Any

import pytest

import kenya_locations as kl
from kenya_locations import (
    AmbiguousLocationError,
    DataError,
    InvalidLocationCodeError,
    InvalidSearchTypeError,
    KenyaLocationsError,
    LocationNotFoundError,
)
from kenya_locations import _dataset as ds


@pytest.mark.parametrize("bad", [True, 1.0, None, b"047", ["047"]])
@pytest.mark.parametrize(
    "lookup",
    [
        kl.get_county_by_code,
        kl.get_constituency_by_code,
        kl.get_sub_county_by_code,
        kl.get_ward_by_code,
        kl.get_constituencies_in_county,
        kl.get_wards_in_constituency,
        kl.get_county_of_ward,
        kl.require_county,
    ],
)
def test_codes_of_the_wrong_type_raise_type_error(lookup: Any, bad: object) -> None:
    with pytest.raises(TypeError, match="code must be a str or int"):
        lookup(bad)


def test_negative_codes_are_invalid() -> None:
    with pytest.raises(InvalidLocationCodeError, match="-1 is not a valid county code") as error:
        kl.get_county_by_code(-1)
    assert isinstance(error.value, ValueError)
    assert error.value.kind == "county"


@pytest.mark.parametrize(
    "lookup",
    [kl.get_county_by_name, kl.get_ward_by_name, kl.get_localities_by_name, kl.get_area_by_name],
)
def test_names_of_the_wrong_type_raise_type_error(lookup: Any) -> None:
    with pytest.raises(TypeError, match="name must be a str, not NoneType"):
        lookup(None)


def test_get_functions_still_return_none_for_unknown_strings() -> None:
    assert kl.get_county_by_code("abc") is None
    assert kl.get_county_by_code("") is None
    assert kl.get_county_by_code(999) is None
    assert kl.get_ward_by_name("Township") is None


def test_require_returns_the_record() -> None:
    assert kl.require_county(47).name == "Nairobi"
    assert kl.require_county("Nairobi City").code == "047"
    assert kl.require_constituency("Westlands").code == "274"
    assert kl.require_sub_county("04701").name == "Westlands"
    assert kl.require_ward("1370").name == "Mountain view"
    assert kl.require_locality("Makadara", "Mombasa").county == "Mombasa"
    assert kl.require_area("Gigiri").locality == "Westlands"


@pytest.mark.parametrize(
    ("call", "kind"),
    [
        (lambda: kl.require_county("Narnia"), "county"),
        (lambda: kl.require_constituency("999"), "constituency"),
        (lambda: kl.require_sub_county("Nowhere"), "sub-county"),
        (lambda: kl.require_ward(9999), "ward"),
        (lambda: kl.require_area("Nowhere"), "area"),
        (lambda: kl.require_locality("Nowhere"), "locality"),
    ],
)
def test_require_raises_not_found(call: Any, kind: str) -> None:
    with pytest.raises(LocationNotFoundError) as error:
        call()
    assert not isinstance(error.value, AmbiguousLocationError)
    assert isinstance(error.value, LookupError)
    assert error.value.kind == kind


def test_ambiguous_names_list_their_candidates() -> None:
    with pytest.raises(AmbiguousLocationError) as error:
        kl.require_ward("Township")
    assert len(error.value.matches) == 9
    assert error.value.value == "Township"
    message = str(error.value)
    assert message.startswith("9 ward records are named 'Township': 0133 Township (Garissa")
    assert "and 4 more" in message
    assert message.endswith("Pass the ward code instead.")


def test_ambiguous_localities_and_areas_say_how_to_choose() -> None:
    with pytest.raises(AmbiguousLocationError, match="Pass a county too") as locality:
        kl.require_locality("Bura")
    counties = {getattr(m, "county", None) for m in locality.value.matches}
    assert counties == {"Garissa", "Taita-Taveta", "Tana River"}

    with pytest.raises(AmbiguousLocationError, match=r"Shauri Yako \(Nyali, Mombasa\)"):
        kl.require_area("Shauri Yako")


def test_require_locality_explains_a_county_scope() -> None:
    with pytest.raises(LocationNotFoundError, match="No locality matches 'Bura' in Nairobi County"):
        kl.require_locality("Bura", "Nairobi")
    with pytest.raises(LocationNotFoundError, match="No county matches 'Narnia'") as error:
        kl.require_locality("Bura", "Narnia")
    assert error.value.kind == "county"


def test_one_base_class_catches_everything() -> None:
    for call in (lambda: kl.require_ward("Township"), lambda: kl.search("xx", types=["planet"])):
        with pytest.raises(KenyaLocationsError):
            call()


@pytest.mark.parametrize("types", [["planet"], "planet"])
def test_unknown_search_types_name_the_valid_ones(types: Any) -> None:
    with pytest.raises(InvalidSearchTypeError, match="Use one of: county, sub-county") as error:
        kl.search("Nairobi", types=types)
    assert isinstance(error.value, ValueError)


def test_unknown_search_types_fail_even_for_short_queries() -> None:
    with pytest.raises(InvalidSearchTypeError):
        kl.search("x", types=["planet"])


def test_search_rejects_arguments_of_the_wrong_type() -> None:
    with pytest.raises(TypeError, match="query must be a str"):
        kl.search(None)  # type: ignore[arg-type]
    with pytest.raises(TypeError, match="limit must be an int"):
        kl.search("Nairobi", limit="5")  # type: ignore[arg-type]
    with pytest.raises(TypeError, match="limit must be an int"):
        kl.search("Nairobi", limit=True)


def test_a_single_type_string_is_accepted() -> None:
    assert all(r.type is kl.SearchType.COUNTY for r in kl.search("Nairobi", types="county"))


def test_broken_data_raises_data_error(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(DataError, match="missing from the package"):
        ds.load_json("nope.json")
    assert issubclass(DataError, RuntimeError)
