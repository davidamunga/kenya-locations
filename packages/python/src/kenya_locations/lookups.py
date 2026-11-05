"""Lookups across counties, sub-counties, constituencies, wards, localities and areas.

Every lookup handles names and codes the same way:

- Codes are zero-padded, so ``"47"`` and ``47`` find county ``"047"``.
- Names are case-insensitive. If nothing matches exactly, a looser match that
  ignores spaces, hyphens, apostrophes and accents is tried (``"Muranga"``
  finds ``"Murang'a"``).
- A name that matches more than one record resolves to ``None`` instead of an
  arbitrary record. Use the plural ``..._by_name`` functions or pass a county.
- Localities are identified by county and name, because the same locality
  name exists in more than one county.
- County names include aliases, so ``"Nairobi City"`` finds Nairobi.
- Relationships are joined by code (``county_code``, ``constituency_code``).

The ``get_...`` functions return ``None`` (or an empty list) when nothing
matches. The ``require_...`` functions raise
:class:`~kenya_locations.errors.LocationNotFoundError` or
:class:`~kenya_locations.errors.AmbiguousLocationError` instead, with a
message that says what to pass. Every function raises ``TypeError`` for
arguments of the wrong type, such as ``None``, ``True`` or ``1.0``.
"""

from __future__ import annotations

from typing import TypeVar

from kenya_locations import _dataset as ds
from kenya_locations._checks import check_code, check_name
from kenya_locations._names import NameIndex, lower, normalise_code
from kenya_locations.errors import AmbiguousLocationError, LocationNotFoundError
from kenya_locations.models import Area, Constituency, County, Locality, SubCounty, Ward

COUNTY_CODE_WIDTH = 3
CONSTITUENCY_CODE_WIDTH = 3
SUB_COUNTY_CODE_WIDTH = 5
WARD_CODE_WIDTH = 4

# ── Counties ────────────────────────────────────────────────────────────────


def get_counties() -> list[County]:
    """All 47 counties."""
    return list(ds.counties())


def get_county_by_code(code: str | int) -> County | None:
    """County by IEBC code; ``"47"``, ``47`` and ``"047"`` all find Nairobi."""
    return ds.county_by_code().get(normalise_code(check_code(code, "county"), COUNTY_CODE_WIDTH))


def get_county_by_name(name: str) -> County | None:
    """County by name or alias."""
    return ds.county_names().unique(name)


# ── Sub-counties ────────────────────────────────────────────────────────────


def get_sub_counties() -> list[SubCounty]:
    """All sub-counties."""
    return list(ds.sub_counties())


def get_sub_county_by_code(code: str | int) -> SubCounty | None:
    """Sub-county by code."""
    return ds.sub_county_by_code().get(
        normalise_code(check_code(code, "sub-county"), SUB_COUNTY_CODE_WIDTH)
    )


def get_sub_county_by_name(name: str) -> SubCounty | None:
    """Sub-county by name, or ``None`` when the name is missing or reused."""
    return ds.sub_county_names().unique(name)


def get_sub_counties_in_county(county: str | int) -> list[SubCounty]:
    """Sub-counties of a county, given its name or code."""
    found = _resolve_county(county)
    return list(ds.sub_counties_by_county().get(found.code, ())) if found else []


def get_county_of_sub_county(sub_county: str | int) -> County | None:
    """County of a sub-county, given its name or code."""
    found = _resolve_sub_county(sub_county)
    return get_county_by_code(found.county_code) if found else None


# ── Constituencies ──────────────────────────────────────────────────────────


def get_constituencies() -> list[Constituency]:
    """All 290 constituencies."""
    return list(ds.constituencies())


def get_constituency_by_code(code: str | int) -> Constituency | None:
    """Constituency by IEBC code."""
    return ds.constituency_by_code().get(
        normalise_code(check_code(code, "constituency"), CONSTITUENCY_CODE_WIDTH)
    )


def get_constituency_by_name(name: str) -> Constituency | None:
    """Constituency by name."""
    return ds.constituency_names().unique(name)


def get_constituencies_in_county(county: str | int) -> list[Constituency]:
    """Constituencies of a county, given its name or code."""
    found = _resolve_county(county)
    return list(ds.constituencies_by_county().get(found.code, ())) if found else []


def get_county_of_constituency(constituency: str | int) -> County | None:
    """County of a constituency, given its name or code."""
    found = _resolve_constituency(constituency)
    return get_county_by_code(found.county_code) if found else None


def get_constituency_of_ward(ward: str | int) -> Constituency | None:
    """Constituency of a ward, given its code or a unique ward name.

    Codes win when both could match. Returns ``None`` when the ward is missing
    or the name is reused (for example Township).
    """
    found = _resolve_ward(ward)
    return get_constituency_by_code(found.constituency_code) if found else None


# ── Wards ───────────────────────────────────────────────────────────────────


def get_wards() -> list[Ward]:
    """All 1,450 wards."""
    return list(ds.wards())


def get_ward_by_code(code: str | int) -> Ward | None:
    """Ward by IEBC code; ``"133"`` and ``"0133"`` find the same ward."""
    return ds.ward_by_code().get(normalise_code(check_code(code, "ward"), WARD_CODE_WIDTH))


def get_ward_by_name(name: str) -> Ward | None:
    """Ward by name, or ``None`` when the name is missing or reused (for example Township)."""
    return ds.ward_names().unique(name)


def get_wards_by_name(name: str) -> list[Ward]:
    """Every ward with this name, across constituencies."""
    return ds.ward_names().all(name)


def get_wards_in_constituency(constituency: str | int) -> list[Ward]:
    """Wards of a constituency, given its name or code."""
    found = _resolve_constituency(constituency)
    return list(ds.wards_by_constituency().get(found.code, ())) if found else []


def get_wards_in_county(county: str | int) -> list[Ward]:
    """Wards of a county, given its name or code."""
    found = _resolve_county(county)
    return list(ds.wards_by_county().get(found.code, ())) if found else []


def get_wards_in_sub_county(sub_county: str | int) -> list[Ward]:
    """Wards of a sub-county, given its code or a unique name."""
    found = _resolve_sub_county(sub_county)
    return list(ds.wards_by_sub_county().get(found.code, ())) if found else []


def get_county_of_ward(ward: str | int) -> County | None:
    """County of a ward, given its code or a unique ward name."""
    found = _resolve_ward(ward)
    return get_county_by_code(found.county_code) if found else None


def get_sub_county_of_ward(ward: str | int) -> SubCounty | None:
    """Sub-county of a ward, given its code or a unique ward name."""
    found = _resolve_ward(ward)
    return get_sub_county_by_code(found.sub_county_code) if found else None


# ── Localities ──────────────────────────────────────────────────────────────


def get_localities() -> list[Locality]:
    """All localities."""
    return list(ds.localities())


def get_locality(name: str, county: str | int | None = None) -> Locality | None:
    """Locality by name, optionally scoped to a county name or code.

    Without a county the name must be unique across Kenya.
    """
    check_name(name, "name")
    if county is None:
        return ds.locality_names().unique(name)
    found = _resolve_county(county)
    if found is None:
        return None
    matches = [item for item in ds.locality_names().all(name) if item.county_code == found.code]
    return matches[0] if len(matches) == 1 else None


def get_locality_by_name(name: str) -> Locality | None:
    """Locality by name, or ``None`` when it is missing or used in several counties."""
    return get_locality(name)


def get_localities_by_name(name: str) -> list[Locality]:
    """Every locality with this name, across counties."""
    return ds.locality_names().all(name)


def get_localities_in_county(county: str | int) -> list[Locality]:
    """Localities of a county, given its name or code."""
    found = _resolve_county(county)
    return list(ds.localities_by_county().get(found.code, ())) if found else []


def get_county_of_locality(name: str) -> County | None:
    """County of a locality, or ``None`` when the locality name is reused."""
    found = get_locality(name)
    return get_county_by_code(found.county_code) if found else None


# ── Areas ───────────────────────────────────────────────────────────────────


def get_areas() -> list[Area]:
    """All areas."""
    return list(ds.areas())


def get_area_by_name(name: str) -> Area | None:
    """Area by name, or ``None`` when the name is missing or reused."""
    return ds.area_names().unique(name)


def get_areas_by_name(name: str) -> list[Area]:
    """Every area with this name, across localities."""
    return ds.area_names().all(name)


def get_areas_in_locality(locality: str, county: str | int | None = None) -> list[Area]:
    """Areas of one locality, matched on locality name and county.

    Pass a county when the locality name exists in more than one county (for
    example Bura). Without one, a reused locality name returns an empty list.
    """
    found = get_locality(locality, county)
    if found is None:
        return []
    key = lower(found.name)
    return [
        area
        for area in ds.areas_by_county().get(found.county_code, ())
        if lower(area.locality) == key
    ]


def get_areas_in_county(county: str | int) -> list[Area]:
    """Areas of a county, given its name or code."""
    found = _resolve_county(county)
    return list(ds.areas_by_county().get(found.code, ())) if found else []


def get_county_of_area(name: str) -> County | None:
    """County of an area, or ``None`` when the area name is reused."""
    found = get_area_by_name(name)
    return get_county_by_code(found.county_code) if found else None


def get_locality_of_area(name: str) -> Locality | None:
    """Locality of an area in the area's own county, or ``None`` when the area name is reused."""
    found = get_area_by_name(name)
    return get_locality(found.locality, found.county_code) if found else None


# ── Strict lookups ──────────────────────────────────────────────────────────

_Record = TypeVar("_Record", County, SubCounty, Constituency, Ward, Locality, Area)


def _missing(kind: str, value: str | int, names: NameIndex[_Record], hint: str) -> LookupError:
    """The error for a lookup that found nothing: ambiguous if the name is reused."""
    if isinstance(value, str):
        matches = names.all(value)
        if len(matches) > 1:
            return AmbiguousLocationError(kind, value, matches, hint)
    return LocationNotFoundError(kind, value)


def require_county(county: str | int) -> County:
    """County by code, name or alias. Raises ``LocationNotFoundError`` when there is none."""
    found = _resolve_county(county)
    if found is None:
        raise _missing("county", county, ds.county_names(), "Pass the county code instead.")
    return found


def require_sub_county(sub_county: str | int) -> SubCounty:
    """Sub-county by code or unique name. Raises when it is missing or the name is reused."""
    found = _resolve_sub_county(sub_county)
    if found is None:
        raise _missing(
            "sub-county", sub_county, ds.sub_county_names(), "Pass the sub-county code instead."
        )
    return found


def require_constituency(constituency: str | int) -> Constituency:
    """Constituency by code or unique name. Raises when it is missing or the name is reused."""
    found = _resolve_constituency(constituency)
    if found is None:
        raise _missing(
            "constituency",
            constituency,
            ds.constituency_names(),
            "Pass the constituency code instead.",
        )
    return found


def require_ward(ward: str | int) -> Ward:
    """Ward by code or unique name. Raises when it is missing or the name is reused.

    Ward names repeat (nine wards are called Township), so prefer codes.
    """
    found = _resolve_ward(ward)
    if found is None:
        raise _missing("ward", ward, ds.ward_names(), "Pass the ward code instead.")
    return found


def require_locality(name: str, county: str | int | None = None) -> Locality:
    """Locality by name, optionally within a county. Raises instead of returning ``None``."""
    found = get_locality(name, county)
    if found is not None:
        return found
    if county is None:
        raise _missing(
            "locality",
            name,
            ds.locality_names(),
            "Pass a county too, for example require_locality(name, county).",
        )
    parent = require_county(county)
    raise LocationNotFoundError(
        "locality", name, f"No locality matches {name!r} in {parent.name} County."
    )


def require_area(name: str) -> Area:
    """Area by unique name. Raises when it is missing or the name is reused."""
    found = get_area_by_name(name)
    if found is None:
        raise _missing(
            "area",
            name,
            ds.area_names(),
            "Use get_areas_by_name() to list them, or get_areas_in_locality() with a county.",
        )
    return found


# ── Resolution helpers ──────────────────────────────────────────────────────


def _resolve_county(value: str | int) -> County | None:
    return get_county_by_code(value) or ds.county_names().unique(str(value))


def _resolve_sub_county(value: str | int) -> SubCounty | None:
    return get_sub_county_by_code(value) or ds.sub_county_names().unique(str(value))


def _resolve_constituency(value: str | int) -> Constituency | None:
    return get_constituency_by_code(value) or ds.constituency_names().unique(str(value))


def _resolve_ward(value: str | int) -> Ward | None:
    return get_ward_by_code(value) or ds.ward_names().unique(str(value))
