"""A delivery address stored as location codes."""

from django.db import models

from kenya_locations.contrib.django.fields import ConstituencyField, CountyField, WardField


class DeliveryAddress(models.Model):
    """County, constituency and ward, each narrowed by the one above it."""

    recipient = models.CharField(max_length=100)
    county = CountyField()
    constituency = ConstituencyField(chained_to="county")
    ward = WardField(chained_to="constituency")
    street = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "delivery addresses"

    def __str__(self) -> str:
        """Recipient and ward."""
        return f"{self.recipient}, {self.get_ward_display()}, {self.get_county_display()}"
