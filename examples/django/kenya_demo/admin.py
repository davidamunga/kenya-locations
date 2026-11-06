"""The admin gets chained selects with no extra setup."""

from django.contrib import admin

from kenya_demo.models import DeliveryAddress


@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    """List and filter addresses by county."""

    list_display = ("recipient", "county", "constituency", "ward")
    list_filter = ("county",)
