from django.urls import include, path

urlpatterns = [path("locations/", include("kenya_locations.contrib.django.urls"))]
