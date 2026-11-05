"""Model fields that store a location code.

Each field is a ``CharField`` with the code's choices, so ``get_FOO_display()``
returns the name and the admin shows a select. The fields leave ``choices``
and ``max_length`` out of migrations, so a data release never creates one.

Chain a field to its parent with ``chained_to``. The form select then narrows
its options as the parent changes, and ``full_clean()`` rejects a child that
isn't inside its parent::

    class Address(models.Model):
        county = CountyField()
        constituency = ConstituencyField(chained_to="county", blank=True)
        ward = WardField(chained_to="constituency", blank=True)

Each field also adds ``get_FOO_record()`` to the model, returning the full
record (for example a :class:`kenya_locations.County`) or ``None``.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import TYPE_CHECKING, Any, ClassVar

from django import forms
from django.core.exceptions import FieldDoesNotExist
from django.db import models

import kenya_locations as kl
from kenya_locations._names import normalise_code
from kenya_locations.contrib.django import choices, validators
from kenya_locations.contrib.django import forms as location_forms
from kenya_locations.contrib.django.widgets import ChainedSelect
from kenya_locations.lookups import (
    CONSTITUENCY_CODE_WIDTH,
    COUNTY_CODE_WIDTH,
    SUB_COUNTY_CODE_WIDTH,
    WARD_CODE_WIDTH,
)
from kenya_locations.models import Location

if TYPE_CHECKING:
    _CharField = models.CharField[str, str]
else:
    _CharField = models.CharField


class LocationCodeField(_CharField):
    """Base for fields that store one kind of location code."""

    level: ClassVar[str] = ""
    code_width: ClassVar[int] = 0
    db_max_length: ClassVar[int] = 0
    form_class: ClassVar[type[location_forms.CodeChoiceField]]
    load_choices: ClassVar[Callable[[], list[Any]]]

    def __init__(self, *args: Any, chained_to: str | None = None, **kwargs: Any) -> None:
        """Store codes; ``chained_to`` names the parent field on the same model."""
        kwargs.setdefault("max_length", self.db_max_length)
        kwargs.setdefault("choices", type(self).load_choices)
        self.chained_to = chained_to
        super().__init__(*args, **kwargs)

    def deconstruct(self) -> Any:
        """Keep data-derived options out of migrations."""
        name, path, args, kwargs = super().deconstruct()
        kwargs.pop("choices", None)
        if kwargs.get("max_length") == self.db_max_length:
            kwargs.pop("max_length")
        if self.chained_to:
            kwargs["chained_to"] = self.chained_to
        return name, path, args, kwargs

    def to_python(self, value: Any) -> Any:
        """Zero-pad numeric codes, so ``47`` is stored as ``"047"``."""
        value = super().to_python(value)
        return normalise_code(value, self.code_width) if value else value

    def get_prep_value(self, value: Any) -> Any:
        """Zero-pad in queries too: ``filter(county=47)`` works."""
        value = super().get_prep_value(value)
        return normalise_code(value, self.code_width) if value else value

    def contribute_to_class(
        self, cls: type[models.Model], name: str, private_only: bool = False
    ) -> None:
        """Add ``get_<name>_record()`` to the model."""
        super().contribute_to_class(cls, name, private_only)
        field = self

        def get_record(instance: models.Model) -> Location | None:
            value = getattr(instance, field.attname)
            return field.lookup(value) if value else None

        get_record.__doc__ = f"The {self.level} record for ``{name}``, or ``None``."
        setattr(cls, f"get_{name}_record", get_record)

    def lookup(self, code: str) -> Location | None:
        """The record for a stored code."""
        raise NotImplementedError

    def parent_field(self) -> LocationCodeField | None:
        """The field named by ``chained_to``, if it is a location field."""
        if not self.chained_to:
            return None
        try:
            field = self.model._meta.get_field(self.chained_to)
        except FieldDoesNotExist:
            return None
        return field if isinstance(field, LocationCodeField) else None

    def validate(self, value: Any, model_instance: models.Model | None) -> None:
        """Check the code exists and sits inside the chained parent."""
        super().validate(value, model_instance)
        parent = self.parent_field()
        if not value or parent is None or model_instance is None:
            return
        parent_value = getattr(model_instance, parent.attname)
        if parent_value:
            self.validate_parent(
                value, parent.level, normalise_code(parent_value, parent.code_width)
            )

    def validate_parent(self, value: str, parent_level: str, parent_value: str) -> None:
        """Raise when ``value`` is not inside ``parent_value``."""

    def formfield(self, **kwargs: Any) -> forms.Field | None:
        """A choice field, chained to the parent field's select when ``chained_to`` is set."""
        defaults: dict[str, Any] = {"choices_form_class": self.form_class}
        parent = self.parent_field()
        if parent is not None:
            defaults["widget"] = ChainedSelect(
                level=self.level, parent=parent.name, parent_level=parent.level
            )
        defaults.update(kwargs)
        return super().formfield(**defaults)


class CountyField(LocationCodeField):
    """A county, stored as its 3-digit IEBC code."""

    level = "county"
    code_width = COUNTY_CODE_WIDTH
    db_max_length = 3
    form_class = location_forms.CountyChoiceField
    load_choices = staticmethod(choices.county_choices)

    def lookup(self, code: str) -> kl.County | None:
        """The county for a code."""
        return kl.get_county_by_code(code)


class ConstituencyField(LocationCodeField):
    """A constituency, stored as its 3-digit IEBC code. Chain it to a county field."""

    level = "constituency"
    code_width = CONSTITUENCY_CODE_WIDTH
    db_max_length = 3
    form_class = location_forms.ConstituencyChoiceField
    load_choices = staticmethod(choices.constituency_choices)

    def lookup(self, code: str) -> kl.Constituency | None:
        """The constituency for a code."""
        return kl.get_constituency_by_code(code)

    def validate_parent(self, value: str, parent_level: str, parent_value: str) -> None:
        """A constituency must be in its county."""
        if parent_level == "county":
            validators.validate_constituency_in(value, parent_value)


class SubCountyField(LocationCodeField):
    """A sub-county, stored as its 5-digit code."""

    level = "sub-county"
    code_width = SUB_COUNTY_CODE_WIDTH
    db_max_length = 5
    form_class = location_forms.SubCountyChoiceField
    load_choices = staticmethod(choices.sub_county_choices)

    def lookup(self, code: str) -> kl.SubCounty | None:
        """The sub-county for a code."""
        return kl.get_sub_county_by_code(code)

    def validate_parent(self, value: str, parent_level: str, parent_value: str) -> None:
        """A sub-county must be in its county."""
        if parent_level == "county":
            validators.validate_sub_county_in(value, parent_value)


class WardField(LocationCodeField):
    """A ward, stored as its 4-digit IEBC code. Chain it to a constituency or county field."""

    level = "ward"
    code_width = WARD_CODE_WIDTH
    db_max_length = 4
    form_class = location_forms.WardChoiceField
    load_choices = staticmethod(choices.ward_choices)

    def lookup(self, code: str) -> kl.Ward | None:
        """The ward for a code."""
        return kl.get_ward_by_code(code)

    def validate_parent(self, value: str, parent_level: str, parent_value: str) -> None:
        """A ward must be in its constituency or county."""
        if parent_level == "constituency":
            validators.validate_ward_in(value, constituency=parent_value)
        elif parent_level == "county":
            validators.validate_ward_in(value, county=parent_value)
