"""Read-only JSON endpoints for drill-down selects and lookups."""

from __future__ import annotations

from collections.abc import Callable, Sequence
from functools import wraps
from typing import Any

from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET

import kenya_locations as kl
from kenya_locations.errors import (
    AmbiguousLocationError,
    KenyaLocationsError,
    LocationNotFoundError,
)
from kenya_locations.models import Location

CACHE_SECONDS = 60 * 60 * 24

View = Callable[..., JsonResponse]


def _json(records: Sequence[Location]) -> JsonResponse:
    response = JsonResponse({"results": [record.to_dict() for record in records]})
    response["Cache-Control"] = f"public, max-age={CACHE_SECONDS}"
    return response


def error_response(error: KenyaLocationsError) -> JsonResponse:
    """A JSON error: 404 when nothing matches, 409 when a name matches several records."""
    if isinstance(error, AmbiguousLocationError):
        return JsonResponse(
            {"detail": str(error), "matches": [match.to_dict() for match in error.matches]},
            status=409,
        )
    status = 404 if isinstance(error, LocationNotFoundError) else 400
    return JsonResponse({"detail": str(error)}, status=status)


def _children(
    resolve: Callable[[str], kl.County | kl.Constituency],
    children: Callable[[str], Sequence[Location]],
) -> View:
    @require_GET
    @wraps(children)
    def view(request: HttpRequest, code: str) -> JsonResponse:
        try:
            parent = resolve(code)
        except KenyaLocationsError as error:
            return error_response(error)
        return _json(children(parent.code))

    return view


@require_GET
def counties(request: HttpRequest) -> JsonResponse:
    """Every county."""
    return _json(kl.get_counties())


county_constituencies = _children(kl.require_county, kl.get_constituencies_in_county)
county_sub_counties = _children(kl.require_county, kl.get_sub_counties_in_county)
county_wards = _children(kl.require_county, kl.get_wards_in_county)
county_localities = _children(kl.require_county, kl.get_localities_in_county)
constituency_wards = _children(kl.require_constituency, kl.get_wards_in_constituency)


@require_GET
def search(request: HttpRequest) -> JsonResponse:
    """``?q=`` search, with optional repeated ``type`` and ``limit``."""
    query = request.GET.get("q", "")
    try:
        limit = min(int(request.GET.get("limit", "20")), 100)
    except ValueError:
        return JsonResponse({"detail": "limit must be a whole number."}, status=400)
    try:
        results = kl.search(query, limit=limit, types=request.GET.getlist("type") or None)
    except KenyaLocationsError as error:
        return error_response(error)
    payload: dict[str, Any] = {
        "results": [
            {"type": str(r.type), "name": r.name, "score": r.score, "item": r.item.to_dict()}
            for r in results
        ]
    }
    return JsonResponse(payload)
