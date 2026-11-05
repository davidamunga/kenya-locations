"""FastAPI integration: a ready-made router, path dependencies, schemas and code types.

``pip install "kenya-locations[fastapi]"``, then::

    from fastapi import FastAPI
    from kenya_locations.contrib.fastapi import create_router

    app = FastAPI()
    app.include_router(create_router(), prefix="/locations")
"""

from kenya_locations.contrib.fastapi.dependencies import (
    ConstituencyFromPath,
    CountyFromPath,
    SubCountyFromPath,
    WardFromPath,
    add_exception_handlers,
    constituency_from_path,
    county_from_path,
    http_error,
    sub_county_from_path,
    ward_from_path,
)
from kenya_locations.contrib.fastapi.router import create_router
from kenya_locations.contrib.fastapi.schemas import (
    AreaSchema,
    ConstituencySchema,
    CountySchema,
    LocalitySchema,
    SearchResultSchema,
    SubCountySchema,
    WardSchema,
)
from kenya_locations.contrib.pydantic import (
    ConstituencyCode,
    CountyCode,
    SubCountyCode,
    WardCode,
)

__all__ = [
    "AreaSchema",
    "ConstituencyCode",
    "ConstituencyFromPath",
    "ConstituencySchema",
    "CountyCode",
    "CountyFromPath",
    "CountySchema",
    "LocalitySchema",
    "SearchResultSchema",
    "SubCountyCode",
    "SubCountyFromPath",
    "SubCountySchema",
    "WardCode",
    "WardFromPath",
    "WardSchema",
    "add_exception_handlers",
    "constituency_from_path",
    "county_from_path",
    "create_router",
    "http_error",
    "sub_county_from_path",
    "ward_from_path",
]
