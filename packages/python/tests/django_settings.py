"""Minimal Django settings for the contrib.django tests."""

import django_stubs_ext

# Lets tests write ModelForm[Address] for the type checker.
django_stubs_ext.monkeypatch()

SECRET_KEY = "kenya-locations-tests"
DEBUG = True
USE_TZ = True
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "kenya_locations.contrib.django",
    "tests.django_app",
]
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
ROOT_URLCONF = "tests.django_app.urls"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "APP_DIRS": True}]
