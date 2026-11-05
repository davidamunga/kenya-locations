"""Exceptions raised by kenya-locations.

Every exception inherits from :class:`KenyaLocationsError`, and from the
built-in exception it is closest to, so ``except LookupError`` and
``except ValueError`` keep working.

The ``get_...`` functions return ``None`` when nothing matches. The
``require_...`` functions raise :class:`LocationNotFoundError` instead, or
:class:`AmbiguousLocationError` when a name matches several records.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from kenya_locations.models import Location


class KenyaLocationsError(Exception):
    """Base class for every kenya-locations error."""


class LocationNotFoundError(KenyaLocationsError, LookupError):
    """No record matches the name or code."""

    def __init__(self, kind: str, value: object, message: str | None = None) -> None:
        """``kind`` is the record type, such as ``"county"``; ``value`` is what was looked up."""
        self.kind = kind
        self.value = value
        super().__init__(message or f"No {kind} matches {value!r}.")


class AmbiguousLocationError(LocationNotFoundError):
    """A name matches more than one record, so it can't identify one.

    ``matches`` holds every candidate. Pass a code, or a county where the
    function accepts one, to pick between them.
    """

    def __init__(self, kind: str, value: object, matches: Sequence[Location], hint: str) -> None:
        """Describe the candidates and how to choose between them."""
        self.matches = list(matches)
        shown = ", ".join(_describe(match) for match in self.matches[:5])
        more = f" and {len(self.matches) - 5} more" if len(self.matches) > 5 else ""
        super().__init__(
            kind,
            value,
            f"{len(self.matches)} {kind} records are named {value!r}: {shown}{more}. {hint}",
        )


class InvalidLocationCodeError(KenyaLocationsError, ValueError):
    """A code argument is malformed, such as a negative number."""

    def __init__(self, kind: str, value: object) -> None:
        """``kind`` is the code's record type; ``value`` is what was passed."""
        self.kind = kind
        self.value = value
        super().__init__(
            f"{value!r} is not a valid {kind} code. Codes are digits, like '047' or 47."
        )


class InvalidSearchTypeError(KenyaLocationsError, ValueError):
    """``types`` names a record type that search doesn't cover."""

    def __init__(self, value: object, valid: Sequence[str]) -> None:
        """``valid`` lists the accepted type names."""
        self.value = value
        super().__init__(f"{value!r} is not a search type. Use one of: {', '.join(valid)}.")


class DataError(KenyaLocationsError, RuntimeError):
    """The bundled data is missing or unreadable. This points to a broken install."""


def _describe(record: Location) -> str:
    """``0133 Township (Garissa Township)``, ``Shauri Yako (Nyali, Mombasa)``."""
    code = getattr(record, "code", None)
    parents = [
        getattr(record, attr)
        for attr in ("constituency", "locality", "county")
        if isinstance(getattr(record, attr, None), str)
    ]
    if hasattr(record, "constituency"):
        parents = parents[:1]
    label = f"{record.name} ({', '.join(parents)})" if parents else record.name
    return f"{code} {label}" if code else label
