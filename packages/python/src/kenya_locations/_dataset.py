"""Loads the bundled JSON once per process and indexes it."""

from __future__ import annotations

import json
from collections import defaultdict
from collections.abc import Callable, Iterable, Mapping
from functools import cache
from importlib import resources
from typing import Any, TypeVar

from kenya_locations._names import NameIndex
from kenya_locations.errors import DataError
from kenya_locations.models import Area, Constituency, County, Locality, SubCounty, Ward

R = TypeVar("R")


def load_json(filename: str) -> Any:
    """Parse one of the bundled data files."""
    resource = resources.files("kenya_locations") / "data" / filename
    try:
        text = resource.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise DataError(
            f"kenya-locations: {filename} is missing from the package. "
            "Reinstall it, or run `pnpm data:sync` in a source checkout."
        ) from error
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise DataError(f"kenya-locations: {filename} is not valid JSON") from error


def _records(filename: str, build: Callable[[Mapping[str, Any]], R]) -> tuple[R, ...]:
    data = load_json(filename)
    if not isinstance(data, list):
        raise DataError(f"kenya-locations: {filename} must be a JSON array")
    return tuple(build(record) for record in data)


def _group(items: Iterable[R], key: Callable[[R], str]) -> dict[str, tuple[R, ...]]:
    groups: defaultdict[str, list[R]] = defaultdict(list)
    for item in items:
        groups[key(item)].append(item)
    return {k: tuple(v) for k, v in groups.items()}


@cache
def counties() -> tuple[County, ...]:
    """All counties, in file order."""
    return _records("counties.json", County.from_dict)


@cache
def sub_counties() -> tuple[SubCounty, ...]:
    """All sub-counties, in file order."""
    return _records("sub-counties.json", SubCounty.from_dict)


@cache
def constituencies() -> tuple[Constituency, ...]:
    """All constituencies, in file order."""
    return _records("constituencies.json", Constituency.from_dict)


@cache
def wards() -> tuple[Ward, ...]:
    """All wards, in file order."""
    return _records("wards.json", Ward.from_dict)


@cache
def localities() -> tuple[Locality, ...]:
    """All localities, in file order."""
    return _records("locality.json", Locality.from_dict)


@cache
def areas() -> tuple[Area, ...]:
    """All areas, in file order."""
    return _records("area.json", Area.from_dict)


@cache
def county_by_code() -> dict[str, County]:
    """Counties keyed by code."""
    return {county.code: county for county in counties()}


@cache
def sub_county_by_code() -> dict[str, SubCounty]:
    """Sub-counties keyed by code."""
    return {sub_county.code: sub_county for sub_county in sub_counties()}


@cache
def constituency_by_code() -> dict[str, Constituency]:
    """Constituencies keyed by code."""
    return {constituency.code: constituency for constituency in constituencies()}


@cache
def ward_by_code() -> dict[str, Ward]:
    """Wards keyed by code."""
    return {ward.code: ward for ward in wards()}


@cache
def sub_counties_by_county() -> dict[str, tuple[SubCounty, ...]]:
    """Sub-counties grouped by county code."""
    return _group(sub_counties(), lambda item: item.county_code)


@cache
def constituencies_by_county() -> dict[str, tuple[Constituency, ...]]:
    """Constituencies grouped by county code."""
    return _group(constituencies(), lambda item: item.county_code)


@cache
def wards_by_sub_county() -> dict[str, tuple[Ward, ...]]:
    """Wards grouped by sub-county code."""
    return _group(wards(), lambda item: item.sub_county_code)


@cache
def wards_by_county() -> dict[str, tuple[Ward, ...]]:
    """Wards grouped by county code."""
    return _group(wards(), lambda item: item.county_code)


@cache
def wards_by_constituency() -> dict[str, tuple[Ward, ...]]:
    """Wards grouped by constituency code."""
    return _group(wards(), lambda item: item.constituency_code)


@cache
def localities_by_county() -> dict[str, tuple[Locality, ...]]:
    """Localities grouped by county code."""
    return _group(localities(), lambda item: item.county_code)


@cache
def areas_by_county() -> dict[str, tuple[Area, ...]]:
    """Areas grouped by county code."""
    return _group(areas(), lambda item: item.county_code)


@cache
def county_names() -> NameIndex[County]:
    """Counties by name and alias."""
    return NameIndex(counties())


@cache
def sub_county_names() -> NameIndex[SubCounty]:
    """Sub-counties by name."""
    return NameIndex(sub_counties())


@cache
def constituency_names() -> NameIndex[Constituency]:
    """Constituencies by name."""
    return NameIndex(constituencies())


@cache
def ward_names() -> NameIndex[Ward]:
    """Wards by name."""
    return NameIndex(wards())


@cache
def locality_names() -> NameIndex[Locality]:
    """Localities by name."""
    return NameIndex(localities())


@cache
def area_names() -> NameIndex[Area]:
    """Areas by name."""
    return NameIndex(areas())
