"""Path dependencies that turn a code or name into a record, or an HTTP error.

Unknown codes and names answer 404. A name that matches several records,
such as the Township ward, answers 409 with the candidates' codes in the
detail.

Use them in your own routes::

    @app.get("/stores/{county}")
    def stores(county: CountyFromPath) -> list[Store]:
        return stores_in(county.code)
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, Request, status
from fastapi.responses import JSONResponse

import kenya_locations as kl
from kenya_locations.errors import (
    AmbiguousLocationError,
    KenyaLocationsError,
    LocationNotFoundError,
)


def http_error(error: KenyaLocationsError) -> HTTPException:
    """404 when nothing matches, 409 when a name matches several records, else 422."""
    if isinstance(error, AmbiguousLocationError):
        code = status.HTTP_409_CONFLICT
    elif isinstance(error, LocationNotFoundError):
        code = status.HTTP_404_NOT_FOUND
    else:
        code = 422  # named differently across Starlette versions
    return HTTPException(status_code=code, detail=str(error))


def add_exception_handlers(app: FastAPI) -> None:
    """Turn kenya-locations errors raised in your own routes into JSON responses.

    After this, ``kl.require_ward(name)`` in a route answers 404 when nothing
    matches and 409, with the candidates under ``matches``, when the name is
    reused.
    """

    async def handle(request: Request, error: Exception) -> JSONResponse:
        assert isinstance(error, KenyaLocationsError)
        http = http_error(error)
        body: dict[str, object] = {"detail": http.detail}
        if isinstance(error, AmbiguousLocationError):
            body["matches"] = [match.to_dict() for match in error.matches]
        return JSONResponse(body, status_code=http.status_code)

    app.add_exception_handler(KenyaLocationsError, handle)


def county_from_path(
    county: Annotated[str, Path(description="County code or name", examples=["047"])],
) -> kl.County:
    """The county in the ``{county}`` path parameter."""
    try:
        return kl.require_county(county)
    except KenyaLocationsError as error:
        raise http_error(error) from error


def constituency_from_path(
    constituency: Annotated[str, Path(description="Constituency code or name", examples=["274"])],
) -> kl.Constituency:
    """The constituency in the ``{constituency}`` path parameter."""
    try:
        return kl.require_constituency(constituency)
    except KenyaLocationsError as error:
        raise http_error(error) from error


def sub_county_from_path(
    sub_county: Annotated[str, Path(description="Sub-county code or name", examples=["04701"])],
) -> kl.SubCounty:
    """The sub-county in the ``{sub_county}`` path parameter."""
    try:
        return kl.require_sub_county(sub_county)
    except KenyaLocationsError as error:
        raise http_error(error) from error


def ward_from_path(
    ward: Annotated[str, Path(description="Ward code, or a unique ward name", examples=["1370"])],
) -> kl.Ward:
    """The ward in the ``{ward}`` path parameter."""
    try:
        return kl.require_ward(ward)
    except KenyaLocationsError as error:
        raise http_error(error) from error


CountyFromPath = Annotated[kl.County, Depends(county_from_path)]
ConstituencyFromPath = Annotated[kl.Constituency, Depends(constituency_from_path)]
SubCountyFromPath = Annotated[kl.SubCounty, Depends(sub_county_from_path)]
WardFromPath = Annotated[kl.Ward, Depends(ward_from_path)]
