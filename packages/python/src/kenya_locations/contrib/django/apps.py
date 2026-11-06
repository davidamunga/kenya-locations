"""App config."""

from django.apps import AppConfig


class KenyaLocationsConfig(AppConfig):
    """Ships the static chained-select script. Has no models or migrations."""

    name = "kenya_locations.contrib.django"
    label = "kenya_locations"
    verbose_name = "Kenya locations"
