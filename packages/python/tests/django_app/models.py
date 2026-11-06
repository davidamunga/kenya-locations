from django.db import models

from kenya_locations.contrib.django.fields import (
    ConstituencyField,
    CountyField,
    SubCountyField,
    WardField,
)


class Address(models.Model):
    county = CountyField()
    constituency = ConstituencyField(chained_to="county", blank=True)
    sub_county = SubCountyField(chained_to="county", blank=True)
    ward = WardField(chained_to="constituency", blank=True)
    county_ward = WardField(chained_to="county", blank=True)

    class Meta:
        app_label = "django_app"
