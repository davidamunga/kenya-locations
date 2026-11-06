"""Validators for codes and for how records nest."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

import kenya_locations as kl


def validate_county_code(value: str) -> None:
    """Reject anything that isn't a county code."""
    if kl.get_county_by_code(value) is None:
        raise ValidationError(
            _("%(value)s is not a Kenyan county code."),
            code="invalid_county",
            params={"value": value},
        )


def validate_constituency_code(value: str) -> None:
    """Reject anything that isn't a constituency code."""
    if kl.get_constituency_by_code(value) is None:
        raise ValidationError(
            _("%(value)s is not a constituency code."),
            code="invalid_constituency",
            params={"value": value},
        )


def validate_sub_county_code(value: str) -> None:
    """Reject anything that isn't a sub-county code."""
    if kl.get_sub_county_by_code(value) is None:
        raise ValidationError(
            _("%(value)s is not a sub-county code."),
            code="invalid_sub_county",
            params={"value": value},
        )


def validate_ward_code(value: str) -> None:
    """Reject anything that isn't a ward code."""
    if kl.get_ward_by_code(value) is None:
        raise ValidationError(
            _("%(value)s is not a ward code."), code="invalid_ward", params={"value": value}
        )


def validate_constituency_in(constituency: str, county: str) -> None:
    """Raise unless the constituency code belongs to the county code."""
    found = kl.get_constituency_by_code(constituency)
    parent = kl.get_county_by_code(county)
    if found is None or parent is None or found.county_code != parent.code:
        raise ValidationError(
            _("This constituency is not in the selected county."), code="constituency_not_in_county"
        )


def validate_sub_county_in(sub_county: str, county: str) -> None:
    """Raise unless the sub-county code belongs to the county code."""
    found = kl.get_sub_county_by_code(sub_county)
    parent = kl.get_county_by_code(county)
    if found is None or parent is None or found.county_code != parent.code:
        raise ValidationError(
            _("This sub-county is not in the selected county."), code="sub_county_not_in_county"
        )


def validate_ward_in(ward: str, constituency: str | None = None, county: str | None = None) -> None:
    """Raise unless the ward code belongs to the given constituency and county codes."""
    found = kl.get_ward_by_code(ward)
    if found is None:
        validate_ward_code(ward)
        return
    if constituency:
        parent = kl.get_constituency_by_code(constituency)
        if parent is None or found.constituency_code != parent.code:
            raise ValidationError(
                _("This ward is not in the selected constituency."),
                code="ward_not_in_constituency",
            )
    if county:
        county_record = kl.get_county_by_code(county)
        if county_record is None or found.county_code != county_record.code:
            raise ValidationError(
                _("This ward is not in the selected county."), code="ward_not_in_county"
            )
