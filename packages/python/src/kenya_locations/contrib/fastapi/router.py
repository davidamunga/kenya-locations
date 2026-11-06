"""A read-only router for the whole dataset."""

from collections.abc import Sequence
from enum import Enum
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Response

import kenya_locations as kl
from kenya_locations.contrib.fastapi.dependencies import (
    ConstituencyFromPath,
    CountyFromPath,
    SubCountyFromPath,
    WardFromPath,
    http_error,
)
from kenya_locations.contrib.fastapi.schemas import (
    AreaSchema,
    ConstituencySchema,
    CountySchema,
    LocalitySchema,
    SearchResultSchema,
    SubCountySchema,
    WardSchema,
)
from kenya_locations.errors import KenyaLocationsError
from kenya_locations.search import DEFAULT_LIMIT


def create_router(
    *,
    tags: Sequence[str | Enum] = ("Kenya locations",),
    cache_max_age: int = 60 * 60 * 24,
    max_search_limit: int = 100,
    **router_options: Any,
) -> APIRouter:
    """Build a router with list, detail, drill-down and search endpoints.

    Mount it anywhere: ``app.include_router(create_router(), prefix="/locations")``.
    Path parameters accept a code or a unique name: unknown ones answer 404,
    and a name shared by several records answers 409 listing their codes. Responses carry a public
    ``Cache-Control`` header of ``cache_max_age`` seconds; pass 0 to omit it.
    Extra keyword arguments go to :class:`fastapi.APIRouter`.
    """

    def cache_headers(response: Response) -> None:
        if cache_max_age > 0:
            response.headers["Cache-Control"] = f"public, max-age={cache_max_age}"

    router = APIRouter(
        tags=list(tags),
        dependencies=[Depends(cache_headers), *router_options.pop("dependencies", [])],
        **router_options,
    )

    # ── Counties ────────────────────────────────────────────────────────────

    @router.get("/counties", response_model=list[CountySchema], summary="List counties")
    def list_counties() -> list[kl.County]:
        return kl.get_counties()

    @router.get("/counties/{county}", response_model=CountySchema, summary="Get a county")
    def get_county(county: CountyFromPath) -> kl.County:
        return county

    @router.get(
        "/counties/{county}/sub-counties",
        response_model=list[SubCountySchema],
        summary="List a county's sub-counties",
    )
    def county_sub_counties(county: CountyFromPath) -> list[kl.SubCounty]:
        return kl.get_sub_counties_in_county(county.code)

    @router.get(
        "/counties/{county}/constituencies",
        response_model=list[ConstituencySchema],
        summary="List a county's constituencies",
    )
    def county_constituencies(county: CountyFromPath) -> list[kl.Constituency]:
        return kl.get_constituencies_in_county(county.code)

    @router.get(
        "/counties/{county}/wards",
        response_model=list[WardSchema],
        summary="List a county's wards",
    )
    def county_wards(county: CountyFromPath) -> list[kl.Ward]:
        return kl.get_wards_in_county(county.code)

    @router.get(
        "/counties/{county}/localities",
        response_model=list[LocalitySchema],
        summary="List a county's localities",
    )
    def county_localities(county: CountyFromPath) -> list[kl.Locality]:
        return kl.get_localities_in_county(county.code)

    @router.get(
        "/counties/{county}/areas",
        response_model=list[AreaSchema],
        summary="List a county's areas",
    )
    def county_areas(county: CountyFromPath) -> list[kl.Area]:
        return kl.get_areas_in_county(county.code)

    @router.get(
        "/counties/{county}/localities/{locality}/areas",
        response_model=list[AreaSchema],
        summary="List a locality's areas",
    )
    def locality_areas(county: CountyFromPath, locality: str) -> list[kl.Area]:
        try:
            found = kl.require_locality(locality, county.code)
        except KenyaLocationsError as error:
            raise http_error(error) from error
        return kl.get_areas_in_locality(found.name, found.county_code)

    # ── Sub-counties ────────────────────────────────────────────────────────

    @router.get("/sub-counties", response_model=list[SubCountySchema], summary="List sub-counties")
    def list_sub_counties() -> list[kl.SubCounty]:
        return kl.get_sub_counties()

    @router.get(
        "/sub-counties/{sub_county}", response_model=SubCountySchema, summary="Get a sub-county"
    )
    def get_sub_county(sub_county: SubCountyFromPath) -> kl.SubCounty:
        return sub_county

    @router.get(
        "/sub-counties/{sub_county}/wards",
        response_model=list[WardSchema],
        summary="List a sub-county's wards",
    )
    def sub_county_wards(sub_county: SubCountyFromPath) -> list[kl.Ward]:
        return kl.get_wards_in_sub_county(sub_county.code)

    # ── Constituencies ──────────────────────────────────────────────────────

    @router.get(
        "/constituencies", response_model=list[ConstituencySchema], summary="List constituencies"
    )
    def list_constituencies() -> list[kl.Constituency]:
        return kl.get_constituencies()

    @router.get(
        "/constituencies/{constituency}",
        response_model=ConstituencySchema,
        summary="Get a constituency",
    )
    def get_constituency(constituency: ConstituencyFromPath) -> kl.Constituency:
        return constituency

    @router.get(
        "/constituencies/{constituency}/wards",
        response_model=list[WardSchema],
        summary="List a constituency's wards",
    )
    def constituency_wards(constituency: ConstituencyFromPath) -> list[kl.Ward]:
        return kl.get_wards_in_constituency(constituency.code)

    # ── Wards ───────────────────────────────────────────────────────────────

    @router.get("/wards", response_model=list[WardSchema], summary="List wards")
    def list_wards() -> list[kl.Ward]:
        return kl.get_wards()

    @router.get("/wards/{ward}", response_model=WardSchema, summary="Get a ward")
    def get_ward(ward: WardFromPath) -> kl.Ward:
        return ward

    # ── Search ──────────────────────────────────────────────────────────────

    @router.get("/search", response_model=list[SearchResultSchema], summary="Search everything")
    def search(
        q: Annotated[str, Query(min_length=2, description="Search text; typos are tolerated")],
        limit: Annotated[int, Query(ge=1, le=max_search_limit)] = DEFAULT_LIMIT,
        types: Annotated[
            list[kl.SearchType] | None,
            Query(alias="type", description="Limit to these record types"),
        ] = None,
    ) -> list[SearchResultSchema]:
        return [
            SearchResultSchema.from_result(result)
            for result in kl.search(q, limit=limit, types=types)
        ]

    return router
