"""Include with ``path("locations/", include("kenya_locations.contrib.django.urls"))``."""

from django.urls import path

from kenya_locations.contrib.django import views

app_name = "kenya_locations"

urlpatterns = [
    path("counties/", views.counties, name="counties"),
    path(
        "counties/<str:code>/constituencies/",
        views.county_constituencies,
        name="county-constituencies",
    ),
    path(
        "counties/<str:code>/sub-counties/", views.county_sub_counties, name="county-sub-counties"
    ),
    path("counties/<str:code>/wards/", views.county_wards, name="county-wards"),
    path("counties/<str:code>/localities/", views.county_localities, name="county-localities"),
    path("constituencies/<str:code>/wards/", views.constituency_wards, name="constituency-wards"),
    path("search/", views.search, name="search"),
]
