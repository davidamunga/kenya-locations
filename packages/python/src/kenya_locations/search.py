"""Typo-tolerant search across every kind of record.

The scoring matches the PHP, Kotlin, Swift and Dart libraries: an exact
substring scores 0.0, otherwise the best Levenshtein distance of the query
against a sliding window of the name, divided by the query length, as long as
it is within 40% of the query length.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Sequence
from functools import cache, lru_cache

from kenya_locations import _dataset as ds
from kenya_locations._checks import check_name
from kenya_locations.errors import InvalidSearchTypeError
from kenya_locations.models import Location, SearchResult, SearchType

DEFAULT_LIMIT = 20
_MAX_SCORE = 0.4


@cache
def _corpus() -> tuple[tuple[SearchType, Location, str, Counter[str]], ...]:
    """Every searchable record with its lowercased name and letter counts."""
    sources: tuple[tuple[SearchType, Sequence[Location]], ...] = (
        (SearchType.COUNTY, ds.counties()),
        (SearchType.SUB_COUNTY, ds.sub_counties()),
        (SearchType.CONSTITUENCY, ds.constituencies()),
        (SearchType.WARD, ds.wards()),
        (SearchType.LOCALITY, ds.localities()),
        (SearchType.AREA, ds.areas()),
    )
    return tuple(
        (kind, item, item.name.lower(), Counter(item.name.lower()))
        for kind, items in sources
        for item in items
    )


def _levenshtein_within(s: str, t: str, limit: int) -> int:
    """Edit distance between ``s`` and ``t``, or ``limit + 1`` once it must exceed ``limit``."""
    n = len(t)
    previous = list(range(n + 1))
    for i, sc in enumerate(s, start=1):
        current = [i] + [0] * n
        row_min = i
        for j in range(1, n + 1):
            cost = (
                previous[j - 1]
                if sc == t[j - 1]
                else 1 + min(previous[j - 1], previous[j], current[j - 1])
            )
            current[j] = cost
            row_min = min(row_min, cost)
        if row_min > limit:
            return limit + 1
        previous = current
    return previous[n]


def fuzzy_score(pattern: str, text: str) -> float | None:
    """Relevance in ``[0.0, 0.4]``, lower is better; ``None`` when ``text`` doesn't match."""
    p = pattern.lower()
    t = text.lower()
    return _score(p, t, Counter(p), Counter(t))


def _score(p: str, t: str, p_counts: Counter[str], t_counts: Counter[str]) -> float | None:
    if p in t:
        return 0.0
    p_len = len(p)
    t_len = len(t)
    if p_len < 2 or t_len == 0:
        return None

    max_errors = max(1, int(p_len * 0.4))
    # Every window is part of t, so letters of p that t lacks cost at least one edit each.
    if sum((p_counts - t_counts).values()) > max_errors:
        return None

    window_size = p_len + max_errors
    best = float("inf")
    for start in range(t_len):
        window = t[start : start + window_size]
        distance = _levenshtein_within(p, window, max_errors)
        if distance <= max_errors:
            best = min(best, distance / p_len)
    return best if best <= _MAX_SCORE else None


@lru_cache(maxsize=256)
def _ranked(query: str, types: frozenset[SearchType] | None) -> tuple[SearchResult, ...]:
    p = query.lower()
    p_counts = Counter(p)
    scored: list[SearchResult] = []
    for kind, item, name, counts in _corpus():
        if types is not None and kind not in types:
            continue
        score = _score(p, name, p_counts, counts)
        if score is not None:
            scored.append(SearchResult(type=kind, item=item, score=score))
    scored.sort(key=lambda result: result.score)
    return tuple(scored)


def search(
    query: str,
    limit: int = DEFAULT_LIMIT,
    types: Iterable[SearchType | str] | None = None,
) -> list[SearchResult]:
    """Search counties, sub-counties, constituencies, wards, localities and areas.

    Substring matches rank first, then typo-tolerant matches, then file order.
    Queries shorter than two characters return nothing. ``types`` limits the
    kinds of record searched, as :class:`SearchType` values or their strings;
    an unknown type raises :class:`~kenya_locations.errors.InvalidSearchTypeError`.
    """
    q = check_name(query, "query").strip()
    if isinstance(limit, bool) or not isinstance(limit, int):
        raise TypeError(f"limit must be an int, not {type(limit).__name__}")
    allowed = _search_types(types)
    if len(q) < 2 or limit <= 0:
        return []
    return list(_ranked(q, allowed)[:limit])


def _search_types(types: Iterable[SearchType | str] | None) -> frozenset[SearchType] | None:
    if types is None:
        return None
    if isinstance(types, str | SearchType):
        types = [types]
    allowed: set[SearchType] = set()
    for kind in types:
        try:
            allowed.add(SearchType(kind))
        except ValueError:
            raise InvalidSearchTypeError(kind, [t.value for t in SearchType]) from None
    return frozenset(allowed)


def search_by_type(
    query: str, type: SearchType | str, limit: int = DEFAULT_LIMIT
) -> list[SearchResult]:
    """Search one kind of record."""
    return search(query, limit, [type])
