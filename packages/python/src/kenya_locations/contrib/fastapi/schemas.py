"""Response schemas. Field names match the shared JSON."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from kenya_locations.models import SearchResult, SearchType


class _Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid", frozen=True)


class CountySchema(_Schema):
    """A county."""

    code: str = Field(examples=["047"])
    iso_code: str = Field(description="ISO 3166-2:KE code", examples=["KE-30"])
    name: str = Field(examples=["Nairobi"])
    capital: str
    area_km2: float
    population_2019: int
    region: str = Field(description="Former province")
    postal_code: str
    aliases: list[str] = Field(description="Other names that resolve to this county")


class SubCountySchema(_Schema):
    """A sub-county."""

    code: str
    name: str
    county: str
    county_code: str


class ConstituencySchema(_Schema):
    """A constituency."""

    code: str = Field(examples=["274"])
    name: str = Field(examples=["Westlands"])
    county: str
    county_code: str


class WardSchema(_Schema):
    """A ward."""

    code: str = Field(examples=["1370"])
    name: str = Field(examples=["Mountain view"])
    constituency: str
    constituency_code: str
    county_code: str
    sub_county_code: str = Field(examples=["04701"])


class LocalitySchema(_Schema):
    """A locality, identified by county and name."""

    name: str
    county: str
    county_code: str


class AreaSchema(_Schema):
    """An area inside a locality."""

    name: str
    locality: str
    county: str
    county_code: str


# Tried in order. extra="forbid" means each record shape matches one schema.
AnyLocationSchema = Annotated[
    CountySchema | WardSchema | AreaSchema | ConstituencySchema | SubCountySchema | LocalitySchema,
    Field(union_mode="left_to_right"),
]


class SearchResultSchema(BaseModel):
    """A ranked search hit."""

    type: SearchType
    name: str
    score: float = Field(description="0.0 for a substring match, up to 0.4 for a typo")
    item: AnyLocationSchema

    @classmethod
    def from_result(cls, result: SearchResult) -> SearchResultSchema:
        """Build the schema from a library search result."""
        return cls.model_validate(
            {
                "type": result.type,
                "name": result.name,
                "score": result.score,
                "item": result.item.to_dict(),
            }
        )
