"""Argument checks shared by the lookups, so bad input fails loudly and early."""

from __future__ import annotations

from kenya_locations.errors import InvalidLocationCodeError


def check_name(value: object, argument: str) -> str:
    """Return ``value`` if it is a string, else raise ``TypeError``."""
    if not isinstance(value, str):
        raise TypeError(f"{argument} must be a str, not {type(value).__name__}")
    return value


def check_code(value: object, kind: str) -> str | int:
    """Return a code argument if it is a string or a non-negative int.

    Raises ``TypeError`` for other types (``bool``, ``float``, ``None``) and
    :class:`InvalidLocationCodeError` for negative numbers.
    """
    if isinstance(value, bool) or not isinstance(value, str | int):
        raise TypeError(
            f"{kind} code must be a str or int, not {type(value).__name__}. "
            "Pass '047' or 47; a leading zero needs quotes."
        )
    if isinstance(value, int) and value < 0:
        raise InvalidLocationCodeError(kind, value)
    return value


def check_name_or_code(value: object, kind: str) -> str | int:
    """Like :func:`check_code`, for arguments that take a name or a code."""
    if isinstance(value, str):
        return value
    return check_code(value, kind)
