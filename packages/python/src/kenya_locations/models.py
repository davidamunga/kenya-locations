"""Typed records for every level of the dataset.

Field names follow the shared JSON (``county_code``, ``population_2019``),
so a record and its JSON look the same.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, TypeAlias


@dataclass(frozen=True, slots=True)
class County:
    """A Kenyan county with administrative and demographic metadata."""

    code: str
    """IEBC county code, ``"001"`` to ``"047"``."""
    name: str
    capital: str
    area_km2: float
    population_2019: int
    region: str
    """Former province."""
    postal_code: str
    iso_code: str
    """ISO 3166-2:KE code, e.g. ``"KE-30"`` for Nairobi. Differs from ``code``."""
    aliases: tuple[str, ...] = ()
    """Other names that resolve to this county, e.g. ``"Nairobi City"``."""

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> County:
        """Build a county from a ``counties.json`` record."""
        return cls(
            code=str(data["code"]),
            name=str(data["name"]),
            capital=str(data["capital"]),
            area_km2=float(data["area_km2"]),
            population_2019=int(data["population_2019"]),
            region=str(data["region"]),
            postal_code=str(data["postal_code"]),
            iso_code=str(data["iso_code"]),
            aliases=tuple(str(alias) for alias in data.get("aliases", ())),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``counties.json``."""
        return {
            "code": self.code,
            "iso_code": self.iso_code,
            "name": self.name,
            "capital": self.capital,
            "area_km2": self.area_km2,
            "population_2019": self.population_2019,
            "region": self.region,
            "postal_code": self.postal_code,
            "aliases": list(self.aliases),
        }


@dataclass(frozen=True, slots=True)
class SubCounty:
    """A sub-county from the HDX ward layer, with a 5-digit code such as ``04701``."""

    code: str
    name: str
    county: str
    county_code: str

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> SubCounty:
        """Build a sub-county from a ``sub-counties.json`` record."""
        return cls(
            code=str(data["code"]),
            name=str(data["name"]),
            county=str(data["county"]),
            county_code=str(data["county_code"]),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``sub-counties.json``."""
        return {
            "code": self.code,
            "name": self.name,
            "county": self.county,
            "county_code": self.county_code,
        }


@dataclass(frozen=True, slots=True)
class Constituency:
    """An IEBC constituency (2012 delimitation)."""

    code: str
    name: str
    county: str
    county_code: str

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Constituency:
        """Build a constituency from a ``constituencies.json`` record."""
        return cls(
            code=str(data["code"]),
            name=str(data["name"]),
            county=str(data["county"]),
            county_code=str(data["county_code"]),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``constituencies.json``."""
        return {
            "code": self.code,
            "name": self.name,
            "county": self.county,
            "county_code": self.county_code,
        }


@dataclass(frozen=True, slots=True)
class Ward:
    """An IEBC county assembly ward. Names repeat, so identify wards by code."""

    code: str
    name: str
    constituency: str
    constituency_code: str
    county_code: str
    #: Code of the sub-county the ward belongs to (HDX/DHIS2, see ``data/README.md``).
    sub_county_code: str = ""

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Ward:
        """Build a ward from a ``wards.json`` record."""
        return cls(
            code=str(data["code"]),
            name=str(data["name"]),
            constituency=str(data["constituency"]),
            constituency_code=str(data["constituency_code"]),
            county_code=str(data["county_code"]),
            sub_county_code=str(data.get("sub_county_code", "")),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``wards.json``."""
        return {
            "code": self.code,
            "name": self.name,
            "constituency": self.constituency,
            "constituency_code": self.constituency_code,
            "county_code": self.county_code,
            "sub_county_code": self.sub_county_code,
        }


@dataclass(frozen=True, slots=True)
class Locality:
    """An informal place. Identified by county and name; names repeat across counties."""

    name: str
    county: str
    county_code: str

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Locality:
        """Build a locality from a ``locality.json`` record."""
        return cls(
            name=str(data["name"]),
            county=str(data["county"]),
            county_code=str(data["county_code"]),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``locality.json``."""
        return {"name": self.name, "county": self.county, "county_code": self.county_code}


@dataclass(frozen=True, slots=True)
class Area:
    """A neighbourhood or estate inside a locality."""

    name: str
    locality: str
    county: str
    county_code: str

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Area:
        """Build an area from an ``area.json`` record."""
        return cls(
            name=str(data["name"]),
            locality=str(data["locality"]),
            county=str(data["county"]),
            county_code=str(data["county_code"]),
        )

    def to_dict(self) -> dict[str, Any]:
        """The record as JSON-ready data, keyed like ``area.json``."""
        return {
            "name": self.name,
            "locality": self.locality,
            "county": self.county,
            "county_code": self.county_code,
        }


Location: TypeAlias = County | SubCounty | Constituency | Ward | Locality | Area
"""Any record the library returns."""


class SearchType(StrEnum):
    """The kinds of record that search covers."""

    COUNTY = "county"
    SUB_COUNTY = "sub-county"
    CONSTITUENCY = "constituency"
    WARD = "ward"
    LOCALITY = "locality"
    AREA = "area"


@dataclass(frozen=True, slots=True)
class SearchResult:
    """A ranked search hit and the record it matched."""

    type: SearchType
    item: Location
    score: float
    """0.0 for a substring match, up to 0.4 for a typo-tolerant match."""

    @property
    def name(self) -> str:
        """Display name of the matched record."""
        return self.item.name
