from __future__ import annotations

import pytest
from django import forms
from django.core.exceptions import ValidationError
from django.test import Client, override_settings

from kenya_locations import County, Ward
from kenya_locations.contrib.django import validators
from kenya_locations.contrib.django.choices import county_choices, ward_choices
from kenya_locations.contrib.django.fields import CountyField, SubCountyField, WardField
from kenya_locations.contrib.django.forms import (
    ConstituencyChoiceField,
    CountyChoiceField,
    WardChoiceField,
)
from kenya_locations.contrib.django.widgets import ChainedSelect
from tests.django_app.models import Address


class AddressForm(forms.ModelForm[Address]):
    class Meta:
        model = Address
        fields = ("county", "constituency", "sub_county", "ward", "county_ward")


# ── Choices ─────────────────────────────────────────────────────────────────


def test_county_choices_are_codes_sorted_by_name() -> None:
    choices = county_choices()
    assert len(choices) == 47
    assert choices[0] == ("030", "Baringo")
    assert ("047", "Nairobi") in choices


def test_ward_choices_are_grouped_by_constituency() -> None:
    groups = dict(ward_choices())
    assert ("1370", "Mountain view") in groups["Westlands"]
    assert sum(len(options) for options in groups.values()) == 1450


# ── Model fields ────────────────────────────────────────────────────────────


def test_fields_keep_data_out_of_migrations() -> None:
    _, path, args, kwargs = WardField(chained_to="constituency", blank=True).deconstruct()
    assert path == "kenya_locations.contrib.django.fields.WardField"
    assert args == []
    assert kwargs == {"chained_to": "constituency", "blank": True}


def test_fields_keep_a_custom_max_length() -> None:
    assert CountyField().max_length == 3
    assert SubCountyField().max_length == 5
    assert CountyField(max_length=10).deconstruct()[3] == {"max_length": 10}


@pytest.mark.django_db
def test_stores_zero_padded_codes_and_queries_by_any_form() -> None:
    address = Address(county="47", constituency="274", ward="1370")
    address.full_clean()
    address.save()
    assert address.county == "047"
    assert Address.objects.filter(county=47).get() == address
    assert Address.objects.filter(ward="1370").exists()


def test_display_and_record_helpers() -> None:
    address = Address(county="047", ward="1370")
    assert address.get_county_display() == "Nairobi"
    county = address.get_county_record()  # type: ignore[attr-defined]
    ward = address.get_ward_record()  # type: ignore[attr-defined]
    assert isinstance(county, County)
    assert county.name == "Nairobi"
    assert isinstance(ward, Ward)
    assert ward.name == "Mountain view"
    assert address.get_constituency_record() is None  # type: ignore[attr-defined]


def test_rejects_unknown_codes() -> None:
    with pytest.raises(ValidationError) as error:
        Address(county="999").full_clean()
    assert "county" in error.value.message_dict


@pytest.mark.parametrize(
    ("values", "field"),
    [
        ({"county": "047", "constituency": "001"}, "constituency"),
        ({"county": "047", "sub_county": "00101"}, "sub_county"),
        ({"county": "047", "constituency": "274", "ward": "0133"}, "ward"),
        ({"county": "047", "county_ward": "0133"}, "county_ward"),
    ],
)
def test_rejects_children_outside_their_parent(values: dict[str, str], field: str) -> None:
    with pytest.raises(ValidationError) as error:
        Address(**values).full_clean()
    assert list(error.value.message_dict) == [field]


def test_accepts_children_inside_their_parent() -> None:
    Address(
        county="47", constituency="274", sub_county="04701", ward="1370", county_ward="1370"
    ).full_clean()


# ── Forms ───────────────────────────────────────────────────────────────────


def test_model_form_validates_the_hierarchy() -> None:
    good = AddressForm(data={"county": "047", "constituency": "274", "ward": "1370"})
    assert good.is_valid(), good.errors
    bad = AddressForm(data={"county": "047", "constituency": "274", "ward": "0133"})
    assert not bad.is_valid()
    assert list(bad.errors) == ["ward"]


def test_model_form_uses_chained_selects() -> None:
    form = AddressForm()
    county_widget = form.fields["county"].widget
    ward_widget = form.fields["ward"].widget
    assert not isinstance(county_widget, ChainedSelect)
    assert isinstance(ward_widget, ChainedSelect)
    assert ward_widget.parent == "constituency"
    assert ward_widget.parent_level == "constituency"
    html = str(form["ward"])
    assert 'data-kl-parent="constituency"' in html
    assert 'data-kl-url="/locations/constituencies/__parent__/wards/"' in html
    assert "kenya_locations/chained.js" in str(form.media)


@override_settings(ROOT_URLCONF="tests.django_app.no_urls")
def test_chained_select_degrades_without_the_urls() -> None:
    html = str(AddressForm()["ward"])
    assert "data-kl-url" not in html
    assert 'value="1370"' in html


def test_plain_form_fields_accept_and_pad_codes() -> None:
    class Form(forms.Form):
        county = CountyChoiceField()
        constituency = ConstituencyChoiceField(chained_to="county")
        ward = WardChoiceField(chained_to="county", parent_level="county", required=False)

    form = Form(data={"county": "47", "constituency": "274"})
    assert form.is_valid(), form.errors
    assert form.cleaned_data["county"] == "047"
    county_field = form.fields["county"]
    assert isinstance(county_field, CountyChoiceField)
    county = county_field.record(form.cleaned_data["county"])
    assert county is not None
    assert county.name == "Nairobi"
    assert 'data-kl-url="/locations/counties/__parent__/wards/"' in str(form["ward"])
    assert not Form(data={"county": "999", "constituency": "274"}).is_valid()


def test_chained_select_rejects_impossible_chains() -> None:
    with pytest.raises(ValueError, match="cannot chain"):
        ChainedSelect(level="county", parent="ward", parent_level="ward")


# ── Validators ──────────────────────────────────────────────────────────────


def test_code_validators() -> None:
    validators.validate_county_code("47")
    validators.validate_constituency_code("274")
    validators.validate_sub_county_code("02704")
    validators.validate_ward_code("1370")
    for validator in (
        validators.validate_county_code,
        validators.validate_constituency_code,
        validators.validate_sub_county_code,
        validators.validate_ward_code,
    ):
        with pytest.raises(ValidationError):
            validator("9999")


def test_hierarchy_validators() -> None:
    validators.validate_ward_in("1370", constituency="274", county="47")
    validators.validate_constituency_in("274", "047")
    validators.validate_sub_county_in("04701", "047")
    with pytest.raises(ValidationError, match="constituency"):
        validators.validate_ward_in("1370", constituency="001")
    with pytest.raises(ValidationError, match="county"):
        validators.validate_ward_in("1370", county="001")
    with pytest.raises(ValidationError):
        validators.validate_ward_in("9999")
    with pytest.raises(ValidationError):
        validators.validate_constituency_in("274", "001")
    with pytest.raises(ValidationError):
        validators.validate_sub_county_in("04701", "001")


# ── JSON views ──────────────────────────────────────────────────────────────


def test_lists_counties(client: Client) -> None:
    response = client.get("/locations/counties/")
    assert response.status_code == 200
    assert len(response.json()["results"]) == 47
    assert "max-age" in response["Cache-Control"]


@pytest.mark.parametrize(
    ("url", "count"),
    [
        ("/locations/counties/47/constituencies/", 17),
        ("/locations/counties/Nairobi/constituencies/", 17),
        ("/locations/counties/047/wards/", 85),
        ("/locations/counties/047/localities/", 77),
        ("/locations/constituencies/274/wards/", 5),
        ("/locations/constituencies/Westlands/wards/", 5),
    ],
)
def test_lists_children(client: Client, url: str, count: int) -> None:
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.json()["results"]) == count


def test_sub_counties_of_a_county(client: Client) -> None:
    results = client.get("/locations/counties/027/sub-counties/").json()["results"]
    assert {
        "code": "02704",
        "name": "Ainabkoi",
        "county": "Uasin Gishu",
        "county_code": "027",
    } in results


def test_unknown_parent_is_404(client: Client) -> None:
    response = client.get("/locations/counties/999/wards/")
    assert response.status_code == 404
    assert response.json()["detail"] == "No county matches '999'."


def test_error_response_maps_each_error() -> None:
    import json

    import kenya_locations as kl
    from kenya_locations.contrib.django.views import error_response

    try:
        kl.require_ward("Township")
    except kl.AmbiguousLocationError as error:
        ambiguous = error_response(error)
    assert ambiguous.status_code == 409
    body = json.loads(ambiguous.content)
    assert len(body["matches"]) == 9
    assert body["matches"][0]["code"] == "0133"
    assert error_response(kl.LocationNotFoundError("ward", "x")).status_code == 404
    assert error_response(kl.InvalidLocationCodeError("ward", -1)).status_code == 400


def test_search_view(client: Client) -> None:
    results = client.get("/locations/search/", {"q": "Nairob", "type": "county"}).json()["results"]
    assert results[0]["name"] == "Nairobi"
    assert results[0]["type"] == "county"
    assert results[0]["item"]["code"] == "047"
    bad_type = client.get("/locations/search/", {"q": "xx", "type": "planet"})
    assert bad_type.status_code == 400
    assert "Use one of: county" in bad_type.json()["detail"]
    bad_limit = client.get("/locations/search/", {"q": "Nairobi", "limit": "abc"})
    assert bad_limit.status_code == 400
    assert bad_limit.json()["detail"] == "limit must be a whole number."


def test_views_only_allow_get(client: Client) -> None:
    assert client.post("/locations/counties/").status_code == 405
