"""Choice lists for fields and forms.

These are callables, so Django evaluates them lazily and migrations never
embed the data.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
from typing import TypeVar

import kenya_locations as kl

Choices = list[tuple[str, str]]
GroupedChoices = list[tuple[str, Choices]]

_T = TypeVar("_T")


def _grouped(
    items: Iterable[_T],
    group: Callable[[_T], str],
    code: Callable[[_T], str],
    name: Callable[[_T], str],
) -> GroupedChoices:
    groups: dict[str, Choices] = {}
    for item in items:
        groups.setdefault(group(item), []).append((code(item), name(item)))
    return [
        (label, sorted(options, key=lambda option: option[1].lower()))
        for label, options in sorted(groups.items(), key=lambda entry: entry[0].lower())
    ]


def county_choices() -> Choices:
    """``(code, name)`` for every county, by name."""
    return sorted(
        ((county.code, county.name) for county in kl.get_counties()), key=lambda c: c[1].lower()
    )


def constituency_choices() -> GroupedChoices:
    """Constituencies grouped by county."""
    return _grouped(kl.get_constituencies(), lambda c: c.county, lambda c: c.code, lambda c: c.name)


def sub_county_choices() -> GroupedChoices:
    """Sub-counties grouped by county."""
    return _grouped(kl.get_sub_counties(), lambda s: s.county, lambda s: s.code, lambda s: s.name)


def ward_choices() -> GroupedChoices:
    """Wards grouped by constituency. Ward names repeat, so values are codes."""
    return _grouped(kl.get_wards(), lambda w: w.constituency, lambda w: w.code, lambda w: w.name)
