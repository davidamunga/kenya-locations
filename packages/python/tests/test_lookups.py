"""Lookup behaviour. Mirrors packages/php/tests/KenyaLocationsTest.php so the libraries agree."""

from __future__ import annotations

import pytest

import kenya_locations as kl
from kenya_locations import County


def test_loads_every_record_type() -> None:
    assert len(kl.get_counties()) == 47
    assert len(kl.get_constituencies()) == 290
    assert len(kl.get_wards()) == 1450
    assert kl.get_sub_counties()
    assert kl.get_localities()
    assert kl.get_areas()


def test_returned_lists_are_copies() -> None:
    counties = kl.get_counties()
    counties.clear()
    assert len(kl.get_counties()) == 47


def test_finds_nairobi_by_name_and_code() -> None:
    nairobi = kl.get_county_by_name("Nairobi")
    assert nairobi is not None
    assert nairobi.capital == "Nairobi"

    by_code = kl.get_county_by_code("047")
    assert by_code is not None
    assert by_code.name == "Nairobi"
    assert by_code.population_2019 == 4397073
    assert by_code.region == "Nairobi"


@pytest.mark.parametrize("name", ["nairobi", "NAIROBI", "  Nairobi "])
def test_county_name_lookup_is_case_insensitive(name: str) -> None:
    county = kl.get_county_by_name(name)
    assert county is not None
    assert county.name == "Nairobi"


def test_unknown_counties_return_none() -> None:
    assert kl.get_county_by_name("Unknown County") is None
    assert kl.get_county_by_code("999") is None


def test_county_scoped_lookups_are_case_insensitive() -> None:
    assert kl.get_constituencies_in_county("nairobi")
    assert kl.get_sub_counties_in_county("NAIROBI")
    assert kl.get_wards_in_county("Nairobi")
    assert kl.get_localities_in_county("nairobi")
    assert kl.get_areas_in_county("Nairobi")


def test_drills_down_from_county_to_area() -> None:
    constituencies = kl.get_constituencies_in_county("Nairobi")
    assert constituencies
    assert all(c.county == "Nairobi" for c in constituencies)

    wards = kl.get_wards_in_constituency("Westlands")
    assert wards
    assert all(w.constituency == "Westlands" for w in wards)

    localities = kl.get_localities_in_county("Nairobi")
    assert all(locality.county == "Nairobi" for locality in localities)

    areas = kl.get_areas_in_locality("Westlands")
    assert areas
    assert all(a.locality == "Westlands" for a in areas)


def test_looks_up_constituency_and_ward_by_code() -> None:
    constituency = kl.get_constituency_by_code("274")
    ward = kl.get_ward_by_code("1370")
    assert constituency is not None
    assert constituency.name == "Westlands"
    assert ward is not None
    assert ward.name == "Mountain view"


def test_resolves_wards_to_their_constituency() -> None:
    by_name = kl.get_constituency_of_ward("Mountain view")
    by_code = kl.get_constituency_of_ward("1370")
    assert by_name is not None
    assert by_name.name == "Westlands"
    assert by_code == by_name
    assert kl.get_constituency_of_ward("Township") is None
    garissa = kl.get_constituency_of_ward("0133")
    assert garissa is not None
    assert garissa.name == "Garissa Township"
    assert kl.get_constituency_of_ward("Unknown Ward") is None


def test_county_scoped_lookups_accept_a_county_code() -> None:
    by_name = kl.get_constituencies_in_county("Nairobi")
    by_code = kl.get_constituencies_in_county("047")
    assert by_code
    assert len(by_code) == len(by_name)
    assert kl.get_sub_counties_in_county("047")
    assert kl.get_wards_in_county("047")
    assert kl.get_localities_in_county("047")
    assert kl.get_areas_in_county(47)


def test_finds_wards_in_a_constituency_by_code() -> None:
    by_name = kl.get_wards_in_constituency("Westlands")
    by_code = kl.get_wards_in_constituency("274")
    assert by_code == by_name
    assert all(w.constituency == "Westlands" for w in by_code)


def _name(county: County | None) -> str | None:
    return county.name if county else None


def test_resolves_the_county_of_a_constituency() -> None:
    assert _name(kl.get_county_of_constituency("Westlands")) == "Nairobi"
    assert _name(kl.get_county_of_constituency("274")) == "Nairobi"
    assert kl.get_county_of_constituency("Nowhere") is None


def test_resolves_the_county_of_a_sub_county() -> None:
    assert _name(kl.get_county_of_sub_county("Ainabkoi")) == "Uasin Gishu"
    assert _name(kl.get_county_of_sub_county("02704")) == "Uasin Gishu"
    assert kl.get_county_of_sub_county("Nowhere") is None


def test_finds_wards_in_a_sub_county() -> None:
    by_name = kl.get_wards_in_sub_county("Ainabkoi")
    by_code = kl.get_wards_in_sub_county("2704")
    assert by_name
    assert len(by_code) == len(by_name)
    assert all(w.constituency == "Ainabkoi" for w in by_name)
    assert kl.get_wards_in_sub_county("Nowhere") == []


def test_resolves_the_county_of_a_unique_ward() -> None:
    assert _name(kl.get_county_of_ward("Mountain view")) == "Nairobi"
    assert _name(kl.get_county_of_ward("1370")) == "Nairobi"
    assert kl.get_county_of_ward("Township") is None
    assert _name(kl.get_county_of_ward("0133")) == "Garissa"
    assert kl.get_county_of_ward("Unknown Ward") is None


def test_resolves_the_sub_county_of_a_unique_ward() -> None:
    for ward in ("Mountain view", "1370"):
        sub_county = kl.get_sub_county_of_ward(ward)
        assert sub_county is not None
        assert sub_county.name == "Westlands"
    assert kl.get_sub_county_of_ward("Township") is None
    assert kl.get_sub_county_of_ward("Unknown Ward") is None


def test_resolves_the_county_and_locality_of_an_area() -> None:
    assert _name(kl.get_county_of_area("Gigiri")) == "Nairobi"
    locality = kl.get_locality_of_area("Gigiri")
    assert locality is not None
    assert locality.name == "Westlands"
    assert _name(kl.get_county_of_locality("Westlands")) == "Nairobi"
    assert kl.get_county_of_area("Nowhere") is None
    assert kl.get_locality_of_area("Nowhere") is None
    assert kl.get_county_of_locality("Nowhere") is None


def test_finds_every_locality_and_area_sharing_a_name() -> None:
    localities = kl.get_localities_by_name("Westlands")
    assert localities
    assert all(locality.name == "Westlands" for locality in localities)
    assert kl.get_localities_by_name("Nowhere") == []

    first = kl.get_areas()[0]
    assert kl.get_areas_by_name(first.name)
    assert len(kl.get_areas_by_name(first.name.lower())) == len(
        kl.get_areas_by_name(first.name.upper())
    )
    assert kl.get_areas_by_name("NonExistentArea12345") == []


def test_scopes_a_locality_lookup_to_a_county() -> None:
    westlands = kl.get_locality("Westlands", "Nairobi")
    assert westlands is not None
    assert westlands.county == "Nairobi"
    assert kl.get_locality("Westlands", "Mombasa") is None
    assert kl.get_locality("Westlands", "Nowhere") is None
    unscoped = kl.get_locality("Westlands")
    assert unscoped is not None
    assert unscoped.name == "Westlands"


def test_zero_pads_numeric_codes() -> None:
    assert _name(kl.get_county_by_code("47")) == "Nairobi"
    assert _name(kl.get_county_by_code(" 047 ")) == "Nairobi"
    assert _name(kl.get_county_by_code(47)) == "Nairobi"
    constituency = kl.get_constituency_by_code("1")
    sub_county = kl.get_sub_county_by_code("101")
    ward = kl.get_ward_by_code("133")
    assert constituency is not None
    assert constituency.name == "Changamwe"
    assert sub_county is not None
    assert sub_county.name == "Changamwe"
    assert ward is not None
    assert ward.code == "0133"
    garissa = kl.get_constituency_of_ward("133")
    assert garissa is not None
    assert garissa.name == "Garissa Township"


def test_falls_back_to_a_folded_name_match() -> None:
    assert _name(kl.get_county_by_name("Muranga")) == "Murang'a"
    assert _name(kl.get_county_by_name("Elgeyo Marakwet")) == "Elgeyo-Marakwet"
    assert _name(kl.get_county_by_name("homabay")) == "Homa Bay"
    assert kl.get_constituencies_in_county("Muranga")


def test_exact_ward_names_win_over_folded_matches() -> None:
    for name, constituency in [("Iriaini", "Mathira"), ("Iria-ini", "Othaya")]:
        ward = kl.get_ward_by_name(name)
        assert ward is not None
        assert ward.constituency == constituency
    mathira = kl.get_constituency_of_ward("iriaini")
    assert mathira is not None
    assert mathira.name == "Mathira"
    assert len(kl.get_wards_by_name("Iriaini")) == 1


def test_ambiguous_names_resolve_to_none() -> None:
    assert kl.get_ward_by_name("Township") is None
    assert len(kl.get_wards_by_name("Township")) == 9
    assert len(kl.get_wards_by_name("township")) == 9
    assert kl.get_wards_by_name("Nowhere") == []

    assert kl.get_locality_by_name("Makadara") is None
    assert kl.get_county_of_locality("Makadara") is None
    assert kl.get_locality_by_name("Bura") is None
    assert len(kl.get_localities_by_name("Makadara")) == 2
    assert len(kl.get_localities_by_name("Bura")) == 3
    mombasa = kl.get_locality("Makadara", "Mombasa")
    nairobi = kl.get_locality("Makadara", "47")
    assert mombasa is not None
    assert mombasa.county == "Mombasa"
    assert nairobi is not None
    assert nairobi.county == "Nairobi"

    assert len(kl.get_areas_by_name("Shauri Yako")) == 3
    assert kl.get_area_by_name("Shauri Yako") is None
    assert kl.get_county_of_area("Shauri Yako") is None
    assert kl.get_locality_of_area("Shauri Yako") is None


@pytest.mark.parametrize("county", ["nairobi", "Nairobi", "047", "47", 47, "Nairobi City"])
def test_county_arguments_accept_any_name_or_code_form(county: str | int) -> None:
    assert len(kl.get_localities_in_county(county)) == 77
    assert len(kl.get_areas_in_county(county)) == 151
    assert kl.get_wards_in_county(county) == kl.get_wards_in_county("Nairobi")


def test_sub_counties_accept_folded_county_names() -> None:
    assert kl.get_sub_counties_in_county("Muranga") == kl.get_sub_counties_in_county("Murang'a")


@pytest.mark.parametrize("constituency", ["westlands", "Westlands", "274", 274])
def test_constituency_arguments_accept_any_name_or_code_form(constituency: str | int) -> None:
    assert len(kl.get_wards_in_constituency(constituency)) == 5


def test_scopes_areas_in_a_locality_to_its_county() -> None:
    garissa = kl.get_areas_in_locality("Bura", "Garissa")
    assert len(garissa) == 3
    assert all(area.county == "Garissa" for area in garissa)
    assert len(kl.get_areas_in_locality("Bura", "7")) == 3
    assert len(kl.get_areas_in_locality("Bura", "Tana River")) == 2
    assert kl.get_areas_in_locality("Bura") == []
    assert kl.get_areas_in_locality("Bura", "Nowhere") == []
    assert len(kl.get_areas_in_locality("Kaloleni", "Kisumu")) == 2
    assert kl.get_areas_in_locality("Westlands")


def test_finds_the_locality_of_an_area_in_the_areas_county() -> None:
    locality = kl.get_locality_of_area("Kaloleni")
    assert locality is not None
    assert locality.name == "Kaloleni"
    assert locality.county == "Kilifi"


def test_finds_the_county_of_a_ward_via_its_constituency() -> None:
    assert _name(kl.get_county_of_ward("Iria-ini")) == "Nyeri"
    assert _name(kl.get_county_of_ward("Iriaini")) == "Nyeri"
    # Sub-counties come from the HDX ward layer, not the constituency.
    nyeri_south = kl.get_sub_county_of_ward("Iria-ini")
    assert nyeri_south is not None
    assert nyeri_south.name == "Nyeri South"


def test_wards_carry_their_parent_codes() -> None:
    ward = kl.get_ward_by_code("0737")
    marakwet_west = kl.get_constituency_by_name("Marakwet West")
    assert ward is not None
    assert marakwet_west is not None
    assert ward.constituency_code == marakwet_west.code
    assert ward.county_code == "028"


def test_counties_have_unique_iso_codes() -> None:
    nairobi = kl.get_county_by_code("047")
    baringo = kl.get_county_by_code("030")
    assert nairobi is not None
    assert nairobi.iso_code == "KE-30"
    assert baringo is not None
    assert baringo.iso_code == "KE-01"
    assert len({county.iso_code for county in kl.get_counties()}) == 47


def test_county_aliases_resolve_as_names() -> None:
    for alias in ("Nairobi City", "nairobicity"):
        county = kl.get_county_by_name(alias)
        assert county is not None
        assert county.code == "047"
    nairobi = kl.get_county_by_code("047")
    assert nairobi is not None
    assert "Nairobi City" in nairobi.aliases
    assert len(kl.get_constituencies_in_county("Nairobi City")) == len(
        kl.get_constituencies_in_county("Nairobi")
    )


def test_every_ward_shares_its_constituencys_county() -> None:
    for ward in kl.get_wards():
        constituency = kl.get_constituency_by_code(ward.constituency_code)
        assert constituency is not None, ward.code
        assert constituency.county_code == ward.county_code, ward.code


def test_records_round_trip_through_dicts() -> None:
    nairobi = kl.get_county_by_code("047")
    assert nairobi is not None
    data = nairobi.to_dict()
    assert data["aliases"] == ["Nairobi City"]
    assert County.from_dict(data) == nairobi
    ward = kl.get_wards()[0]
    assert type(ward).from_dict(ward.to_dict()) == ward
