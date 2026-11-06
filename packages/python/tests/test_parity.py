"""Cross-language parity: the cases every package must answer the same way.

Runs ``tests/parity/cases.json`` from the monorepo root. JS is the reference
implementation; see the file's ``$comment`` and ``tests/parity/README.md`` for
what is compared. Each test reports every mismatch in its category at once.
"""

from __future__ import annotations

import json
from collections.abc import Callable, Sized
from pathlib import Path
from typing import Any

import pytest

import kenya_locations as kl

CASES_PATH = Path(__file__).resolve().parents[3] / "tests" / "parity" / "cases.json"

if not CASES_PATH.is_file():
    pytest.skip(
        "tests/parity/cases.json is only available in the monorepo", allow_module_level=True
    )

CASES: dict[str, Any] = json.loads(CASES_PATH.read_text(encoding="utf-8"))

LOOKUPS: dict[str, Callable[[str], str | None]] = {
    "countyByCode": lambda arg: getattr(kl.get_county_by_code(arg), "name", None),
    "countyByName": lambda arg: getattr(kl.get_county_by_name(arg), "code", None),
    "constituencyByCode": lambda arg: getattr(kl.get_constituency_by_code(arg), "name", None),
    "constituencyByName": lambda arg: getattr(kl.get_constituency_by_name(arg), "code", None),
}

COUNTS: dict[str, Callable[[str], Sized]] = {
    "constituenciesInCounty": kl.get_constituencies_in_county,
    "wardsInCounty": kl.get_wards_in_county,
    "subCountiesInCounty": kl.get_sub_counties_in_county,
    "wardsInConstituency": kl.get_wards_in_constituency,
}


def assert_no_mismatches(mismatches: list[str]) -> None:
    assert not mismatches, "Parity mismatches:\n" + "\n".join(mismatches)


def check_names(label: str, case: dict[str, Any], names: list[str], mismatches: list[str]) -> None:
    """Compare a list of record names against a case's includes and expectCount."""
    missing = [name for name in case.get("includes", []) if name not in names]
    if missing:
        mismatches.append(f"{label}: missing {missing}")
    if "expectCount" in case and len(names) != case["expectCount"]:
        mismatches.append(f"{label}: expected {case['expectCount']} records, got {len(names)}")


def test_lookups_match() -> None:
    mismatches = []
    for case in CASES["lookups"]:
        actual = LOOKUPS[case["call"]](case["arg"])
        if actual != case["expect"]:
            mismatches.append(
                f"{case['call']}({case['arg']!r}): expected {case['expect']!r}, got {actual!r}"
            )
    assert_no_mismatches(mismatches)


def test_counts_match() -> None:
    mismatches = []
    for case in CASES["counts"]:
        actual = len(COUNTS[case["call"]](case["arg"]))
        if actual != case["expect"]:
            mismatches.append(
                f"{case['call']}({case['arg']!r}): expected {case['expect']}, got {actual}"
            )
    assert_no_mismatches(mismatches)


def test_areas_in_locality_match() -> None:
    mismatches: list[str] = []
    for case in CASES["areasInLocality"]:
        areas = kl.get_areas_in_locality(case["locality"], case.get("county"))
        label = f"areasInLocality({case['locality']!r}, {case.get('county')!r})"
        check_names(label, case, [area.name for area in areas], mismatches)
    assert_no_mismatches(mismatches)


def test_localities_in_county_match() -> None:
    mismatches: list[str] = []
    for case in CASES["localitiesInCounty"]:
        localities = kl.get_localities_in_county(case["county"])
        label = f"localitiesInCounty({case['county']!r})"
        check_names(label, case, [locality.name for locality in localities], mismatches)
    assert_no_mismatches(mismatches)


def test_search_matches() -> None:
    mismatches = []
    for case in CASES["search"]:
        results = kl.search(case["query"], limit=case["limit"])
        label = f"search({case['query']!r}, limit={case['limit']})"
        if case.get("empty") and results:
            mismatches.append(f"{label}: expected no results, got {len(results)}")
        found = {(result.type.value, result.name) for result in results}
        for expected in case.get("includes", []):
            if (expected["type"], expected["name"]) not in found:
                mismatches.append(f"{label}: missing {expected['type']} {expected['name']!r}")
    assert_no_mismatches(mismatches)


def test_search_by_type_matches() -> None:
    mismatches: list[str] = []
    for case in CASES["searchByType"]:
        results = kl.search_by_type(case["query"], case["type"], limit=case["limit"])
        label = f"searchByType({case['query']!r}, {case['type']!r}, limit={case['limit']})"
        if case.get("nonEmpty") and not results:
            mismatches.append(f"{label}: expected results, got none")
        check_names(label, case, [result.name for result in results], mismatches)
    assert_no_mismatches(mismatches)
