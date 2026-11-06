# Django example

A one-page Django project that stores delivery addresses with the
`kenya-locations` Python package (`packages/python`).

- `CountyField`, `ConstituencyField` and `WardField` store codes on the model.
- The form and the admin narrow each select to the one above it.
- Saving a ward that isn't in the chosen constituency fails validation.
- The JSON views are mounted at `/locations/`.

## Run it

From the repository root, with [uv](https://docs.astral.sh/uv/):

```bash
uv run --project packages/python python examples/django/manage.py migrate
uv run --project packages/python python examples/django/manage.py runserver
```

Open http://127.0.0.1:8000/ for the form. For the admin, create a user with
`createsuperuser` and open http://127.0.0.1:8000/admin/.

## Test it

```bash
uv run --project packages/python python examples/django/manage.py test kenya_demo
uv run --project packages/python python examples/django/manage.py makemigrations --check --dry-run
```

The second command proves the location fields keep data out of migrations.
