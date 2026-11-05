"""Routes: the address form, the admin and the kenya-locations JSON views."""

from django.contrib import admin
from django.urls import include, path
from kenya_demo import views

urlpatterns = [
    path("", views.AddressCreateView.as_view(), name="address-create"),
    path("admin/", admin.site.urls),
    path("locations/", include("kenya_locations.contrib.django.urls")),
]
