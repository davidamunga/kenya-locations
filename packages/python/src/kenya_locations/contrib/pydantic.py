"""Pydantic types for location codes. Needs the ``fastapi`` extra, or pydantic v2.

Each type accepts a code as a string or an integer, zero-pads it, and rejects
codes that don't exist::

    class Delivery(BaseModel):
        county: CountyCode  # "47", 47 and "047" all validate to "047"
        ward: WardCode
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated, Any

from pydantic import BeforeValidator, Field
from pydantic_core import PydanticCustomError

import kenya_locations as kl
from kenya_locations._names import normalise_code
from kenya_locations.lookups import (
    CONSTITUENCY_CODE_WIDTH,
    COUNTY_CODE_WIDTH,
    SUB_COUNTY_CODE_WIDTH,
    WARD_CODE_WIDTH,
)


def _code(kind: str, width: int, exists: Callable[[str], Any]) -> Callable[[Any], str]:
    def validate(value: Any) -> str:
        if isinstance(value, int) and not isinstance(value, bool):
            value = str(value)
        if not isinstance(value, str):
            raise PydanticCustomError("string_type", "Input should be a valid string")
        code = normalise_code(value, width)
        if exists(code) is None:
            raise PydanticCustomError(
                f"kenya_{kind.replace('-', '_')}_code",
                "{value} is not a Kenyan {kind} code",
                {"value": value, "kind": kind},
            )
        return code

    return validate


CountyCode = Annotated[
    str,
    BeforeValidator(_code("county", COUNTY_CODE_WIDTH, kl.get_county_by_code)),
    Field(description="IEBC county code", examples=["047"]),
]
ConstituencyCode = Annotated[
    str,
    BeforeValidator(_code("constituency", CONSTITUENCY_CODE_WIDTH, kl.get_constituency_by_code)),
    Field(description="IEBC constituency code", examples=["274"]),
]
SubCountyCode = Annotated[
    str,
    BeforeValidator(_code("sub-county", SUB_COUNTY_CODE_WIDTH, kl.get_sub_county_by_code)),
    Field(description="Sub-county code", examples=["04701"]),
]
WardCode = Annotated[
    str,
    BeforeValidator(_code("ward", WARD_CODE_WIDTH, kl.get_ward_by_code)),
    Field(description="IEBC ward code", examples=["1370"]),
]

__all__ = ["ConstituencyCode", "CountyCode", "SubCountyCode", "WardCode"]
