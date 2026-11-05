"""Form fields for counties, constituencies, sub-counties and wards."""

from __future__ import annotations

from typing import Any

from django import forms

import kenya_locations as kl
from kenya_locations._names import normalise_code
from kenya_locations.contrib.django import choices
from kenya_locations.contrib.django.widgets import ChainedSelect
from kenya_locations.lookups import (
    CONSTITUENCY_CODE_WIDTH,
    COUNTY_CODE_WIDTH,
    SUB_COUNTY_CODE_WIDTH,
    WARD_CODE_WIDTH,
)
from kenya_locations.models import Location


class CodeChoiceField(forms.TypedChoiceField):
    """Base for choice fields whose values are location codes."""

    level: str = ""
    default_parent_level: str = ""
    code_width = 0

    def __init__(
        self,
        *,
        chained_to: str | None = None,
        parent_level: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Offer every code; ``chained_to`` names the parent field in the same form."""
        kwargs.setdefault("choices", self.load_choices)
        if chained_to and "widget" not in kwargs:
            kwargs["widget"] = ChainedSelect(
                level=self.level,
                parent=chained_to,
                parent_level=parent_level or self.default_parent_level,
            )
        super().__init__(**kwargs)

    @staticmethod
    def load_choices() -> list[Any]:
        """The choices for this level."""
        raise NotImplementedError

    def to_python(self, value: Any) -> str:
        """Zero-pad numeric codes so ``"47"`` is accepted as ``"047"``."""
        text = super().to_python(value)
        return normalise_code(text, self.code_width) if text else text

    def record(self, value: str) -> Location | None:
        """The record for a cleaned value."""
        raise NotImplementedError


class CountyChoiceField(CodeChoiceField):
    """Choose a county; the value is its code."""

    level = "county"
    code_width = COUNTY_CODE_WIDTH
    load_choices = staticmethod(choices.county_choices)

    def record(self, value: str) -> kl.County | None:
        """The county for a code."""
        return kl.get_county_by_code(value)


class ConstituencyChoiceField(CodeChoiceField):
    """Choose a constituency; the value is its code. Chain it to a county field."""

    level = "constituency"
    default_parent_level = "county"
    code_width = CONSTITUENCY_CODE_WIDTH
    load_choices = staticmethod(choices.constituency_choices)

    def record(self, value: str) -> kl.Constituency | None:
        """The constituency for a code."""
        return kl.get_constituency_by_code(value)


class SubCountyChoiceField(CodeChoiceField):
    """Choose a sub-county; the value is its code. Chain it to a county field."""

    level = "sub-county"
    default_parent_level = "county"
    code_width = SUB_COUNTY_CODE_WIDTH
    load_choices = staticmethod(choices.sub_county_choices)

    def record(self, value: str) -> kl.SubCounty | None:
        """The sub-county for a code."""
        return kl.get_sub_county_by_code(value)


class WardChoiceField(CodeChoiceField):
    """Choose a ward; the value is its code. Chain it to a constituency or county field."""

    level = "ward"
    default_parent_level = "constituency"
    code_width = WARD_CODE_WIDTH
    load_choices = staticmethod(choices.ward_choices)

    def record(self, value: str) -> kl.Ward | None:
        """The ward for a code."""
        return kl.get_ward_by_code(value)
