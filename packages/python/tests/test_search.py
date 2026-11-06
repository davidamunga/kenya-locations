"""Search behaviour. Mirrors the search tests in the PHP package."""

from __future__ import annotations

import time

import pytest

import kenya_locations as kl
from kenya_locations import County, SearchResult, SearchType
from kenya_locations.search import fuzzy_score


def _has_county(results: list[SearchResult], name: str) -> bool:
    return any(r.type is SearchType.COUNTY and r.item.name == name for r in results)


def test_finds_an_exact_county_match_first() -> None:
    results = kl.search("Nairobi")
    assert results
    assert results[0].type is SearchType.COUNTY
    assert isinstance(results[0].item, County)
    assert results[0].name == "Nairobi"
    assert results[0].score == 0.0


@pytest.mark.parametrize("query", ["NAIROBI", "Nairo", "Nairob"])
def test_matches_case_substrings_and_typos(query: str) -> None:
    assert _has_county(kl.search(query), "Nairobi")


def test_tolerates_spelling_mistakes() -> None:
    assert _has_county(kl.search("Mombassa"), "Mombasa")


def test_searches_every_type() -> None:
    cases = [
        ("Nairobi", SearchType.COUNTY),
        ("Alego Usonga", SearchType.CONSTITUENCY),
        ("Bomet Central", SearchType.SUB_COUNTY),
        (kl.get_wards()[0].name, SearchType.WARD),
        (kl.get_localities()[0].name, SearchType.LOCALITY),
        (kl.get_areas()[0].name, SearchType.AREA),
    ]
    for query, kind in cases:
        assert any(r.type is kind for r in kl.search(query, limit=1000)), query


@pytest.mark.parametrize("kind", [SearchType.WARD, "ward"])
def test_search_by_type_restricts_results(kind: SearchType | str) -> None:
    results = kl.search_by_type("West", kind)
    assert results
    assert all(r.type is SearchType.WARD for r in results)


def test_respects_the_limit() -> None:
    assert len(kl.search("West", limit=5)) == 5


@pytest.mark.parametrize(
    ("query", "limit"), [("a", 20), (" a ", 20), ("zzzzzzzz", 20), ("Nairobi", 0)]
)
def test_returns_nothing_for_short_unknown_or_zero_limit(query: str, limit: int) -> None:
    assert kl.search(query, limit=limit) == []


def test_rejects_unknown_types() -> None:
    with pytest.raises(ValueError, match="'nowhere' is not a search type"):
        kl.search("Nairobi", types=["nowhere"])


def test_ranks_substring_matches_before_typos() -> None:
    results = kl.search("Mombasa", limit=1000)
    scores = [r.score for r in results]
    assert scores == sorted(scores)
    assert results[0].score == 0.0


def test_fuzzy_score_matches_the_other_libraries() -> None:
    assert fuzzy_score("nai", "Nairobi") == 0.0
    assert fuzzy_score("Nairbi", "Nairobi") == pytest.approx(1 / 6)
    assert fuzzy_score("xyz", "Nairobi") is None
    assert fuzzy_score("a", "Kisumu") is None


def test_search_is_fast_enough_for_a_web_request() -> None:
    kl.search("warmup")
    start = time.perf_counter()
    for query in ("Kilimanj", "Mombassa", "Nyerri", "Kakameg", "Eldorett"):
        kl.search(query)
    assert (time.perf_counter() - start) / 5 < 0.25
