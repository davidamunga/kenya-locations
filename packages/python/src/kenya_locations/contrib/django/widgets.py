"""A select that narrows its options when a parent select changes."""

from __future__ import annotations

from typing import Any

from django import forms
from django.urls import NoReverseMatch, reverse

# Which JSON endpoint lists a child level for a parent level.
ENDPOINTS: dict[tuple[str, str], str] = {
    ("constituency", "county"): "kenya_locations:county-constituencies",
    ("sub-county", "county"): "kenya_locations:county-sub-counties",
    ("ward", "county"): "kenya_locations:county-wards",
    ("ward", "constituency"): "kenya_locations:constituency-wards",
}

PARENT_PLACEHOLDER = "__parent__"


class ChainedSelect(forms.Select):
    """Select whose options follow another field in the same form.

    ``parent`` is the name of the parent field. Works inside prefixed forms,
    formsets and admin inlines. If the JSON views aren't routed, it renders as
    a plain select with every option.
    """

    class Media:
        """The script that reloads options."""

        js = ("kenya_locations/chained.js",)

    def __init__(
        self,
        *,
        level: str,
        parent: str,
        parent_level: str,
        attrs: dict[str, Any] | None = None,
    ) -> None:
        """Chain a ``level`` select to the ``parent`` field, which holds ``parent_level`` codes."""
        if (level, parent_level) not in ENDPOINTS:
            raise ValueError(f"cannot chain {level} to {parent_level}")
        super().__init__(attrs)
        self.level = level
        self.parent = parent
        self.parent_level = parent_level

    def get_context(self, name: str, value: Any, attrs: dict[str, Any] | None) -> dict[str, Any]:
        """Add the parent field and endpoint as data attributes."""
        context = super().get_context(name, value, attrs)
        try:
            url = reverse(ENDPOINTS[(self.level, self.parent_level)], args=[PARENT_PLACEHOLDER])
        except NoReverseMatch:
            return context
        context["widget"]["attrs"].update(
            {"data-kl-parent": self.parent, "data-kl-url": url, "data-kl-level": self.level}
        )
        return context
