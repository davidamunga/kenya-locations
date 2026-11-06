"""Name and code matching shared by every lookup."""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterable
from typing import Generic, Protocol, TypeVar

_NOT_ALPHANUMERIC = re.compile(r"[^a-z0-9]")
_ALL_DIGITS = re.compile(r"[0-9]+")


class Named(Protocol):
    """Anything with a ``name``."""

    @property
    def name(self) -> str:
        """Display name."""
        ...


T = TypeVar("T", bound=Named)


def lower(value: str) -> str:
    """Lowercase and trim."""
    return value.strip().lower()


def fold(value: str) -> str:
    """Ignore case, accents, spaces and punctuation: ``"Murang'a"`` becomes ``"muranga"``."""
    decomposed = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return _NOT_ALPHANUMERIC.sub("", stripped.lower())


def normalise_code(value: str | int, width: int) -> str:
    """Zero-pad an all-digit code to ``width``; other input is returned trimmed."""
    trimmed = str(value).strip()
    return trimmed.zfill(width) if _ALL_DIGITS.fullmatch(trimmed) else trimmed


class NameIndex(Generic[T]):
    """Records by name.

    Case-insensitive exact matches win. Only when there are none is the looser
    folded match tried. A record's ``aliases``, if it has any, count as names.
    """

    __slots__ = ("_exact", "_folded")

    def __init__(self, items: Iterable[T]) -> None:
        """Index ``items`` by name and alias."""
        self._exact: dict[str, list[T]] = {}
        self._folded: dict[str, list[T]] = {}
        for item in items:
            names = [item.name, *getattr(item, "aliases", ())]
            for key in dict.fromkeys(lower(name) for name in names):
                self._exact.setdefault(key, []).append(item)
            for key in dict.fromkeys(fold(name) for name in names):
                self._folded.setdefault(key, []).append(item)

    def all(self, name: str) -> list[T]:
        """Every record with this name. Raises ``TypeError`` if ``name`` isn't a string."""
        if not isinstance(name, str):
            raise TypeError(f"name must be a str, not {type(name).__name__}")
        return list(self._exact.get(lower(name)) or self._folded.get(fold(name)) or [])

    def unique(self, name: str) -> T | None:
        """The record with this name, or ``None`` when there are none or several."""
        matches = self.all(name)
        return matches[0] if len(matches) == 1 else None
