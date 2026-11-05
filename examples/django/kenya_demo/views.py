"""One page: a form that creates a delivery address, and the saved addresses."""

from typing import Any

from django.forms import ModelForm
from django.urls import reverse_lazy
from django.views.generic import CreateView

from kenya_demo.models import DeliveryAddress


class DeliveryAddressForm(ModelForm):
    """Uses the fields' chained selects as they are."""

    class Meta:
        model = DeliveryAddress
        fields = ("recipient", "county", "constituency", "ward", "street")


class AddressCreateView(CreateView):
    """Create an address, then show it in the list."""

    form_class = DeliveryAddressForm
    template_name = "kenya_demo/address_form.html"
    success_url = reverse_lazy("address-create")

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        """Add the saved addresses."""
        context = super().get_context_data(**kwargs)
        context["addresses"] = DeliveryAddress.objects.order_by("-id")[:10]
        return context
