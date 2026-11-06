# kenya-locations (Python)

Kenyan administrative divisions (counties, sub-counties, constituencies,
wards, localities and areas) as a typed Python library, with optional
Django and FastAPI integrations.

**47** counties · **302** sub-counties · **290** constituencies ·
**1,450** wards · **917** localities · **1,829** areas

The core library has no dependencies. JSON loads lazily from the package on
first use and is cached for the life of the process. Every record is a frozen
dataclass, and the package ships type hints (`py.typed`).

This is the Python counterpart to the JavaScript, React, Kotlin, Swift, Dart
and PHP libraries in the
[kenya-locations](https://github.com/DavidAmunga/kenya-locations) project,
all built from the same dataset.

## Installation

With [uv](https://docs.astral.sh/uv/):

```bash
uv add kenya-locations
uv add "kenya-locations[django]"    # Django 5.2+
uv add "kenya-locations[fastapi]"   # FastAPI with Pydantic v2
```

Or with pip:

```bash
pip install kenya-locations
pip install "kenya-locations[django]"
pip install "kenya-locations[fastapi]"
```

Requires Python 3.11 or newer.

## Usage

```python
import kenya_locations as kl

counties = kl.get_counties()

nairobi = kl.get_county_by_name("Nairobi")
nairobi.capital          # "Nairobi"
nairobi.population_2019  # 4397073
nairobi.iso_code         # "KE-30"
```

### Drilling down

```python
constituencies = kl.get_constituencies_in_county("Nairobi")
wards = kl.get_wards_in_constituency("Westlands")
localities = kl.get_localities_in_county("Nairobi")
areas = kl.get_areas_in_locality("Karen")

# Bura exists in three counties, so pass the county
bura = kl.get_areas_in_locality("Bura", "Garissa")
```

### Resolving upward

```python
kl.get_constituency_of_ward("Mountain view").name  # "Westlands"

# Prefer a ward code when the name is reused (e.g. Township)
kl.get_constituency_of_ward("1370")

kl.get_county_of_ward("1370")
kl.get_county_of_constituency("Westlands")
kl.get_locality_of_area("Gigiri")

# Same locality name in more than one county
kl.get_localities_by_name("Makadara")
kl.get_locality("Makadara", "Nairobi")
```

### Search

Search is case-insensitive and typo-tolerant. It uses the same Levenshtein
sliding window as the PHP, Kotlin, Swift and Dart libraries, so results match.

```python
from kenya_locations import SearchType

for result in kl.search("Nairob", limit=20):
    print(result.type, result.name, result.score)

wards_only = kl.search_by_type("West", SearchType.WARD)
wards_and_areas = kl.search("West", types=["ward", "area"])
```

### Errors

The `get_...` functions return `None`, or an empty list, when nothing
matches. When you'd rather fail, use a `require_...` function. It accepts a
code or a name and raises an error that says what to pass instead:

```python
kl.require_county(47)              # County
kl.require_ward("Township")        # AmbiguousLocationError
# 9 ward records are named 'Township': 0133 Township (Garissa Township), ...
# Pass the ward code instead.
kl.require_locality("Bura", "Nairobi")
# LocationNotFoundError: No locality matches 'Bura' in Nairobi County.
```

| Exception                  | Raised when                                         | Also a        |
| -------------------------- | --------------------------------------------------- | ------------- |
| `LocationNotFoundError`    | a `require_...` lookup finds nothing                | `LookupError` |
| `AmbiguousLocationError`   | a name matches several records; see `.matches`      | `LookupError` |
| `InvalidLocationCodeError` | a code is malformed, such as `-1`                   | `ValueError`  |
| `InvalidSearchTypeError`   | `search(types=...)` names an unknown type           | `ValueError`  |
| `DataError`                | the bundled data is missing or unreadable           | `RuntimeError` |

All of them inherit from `KenyaLocationsError`. Arguments of the wrong type,
such as `None`, `True` or `1.0`, raise `TypeError` from every function. To
pass a code with a leading zero, quote it: `"047"` or `"01"`. Python itself
rejects the literal `01`.

The strict functions are `require_county`, `require_sub_county`,
`require_constituency`, `require_ward`, `require_locality(name, county=None)`
and `require_area`.

## Django

Add the app, then store locations as codes with the model fields:

```python
# settings.py
INSTALLED_APPS = [..., "kenya_locations.contrib.django"]

# urls.py: serves the JSON the chained selects read
path("locations/", include("kenya_locations.contrib.django.urls"))

# models.py
from kenya_locations.contrib.django.fields import (
    ConstituencyField,
    CountyField,
    WardField,
)

class Address(models.Model):
    county = CountyField()
    constituency = ConstituencyField(chained_to="county")
    ward = WardField(chained_to="constituency")
```

- **Codes in the database.** `CountyField`, `ConstituencyField`, `SubCountyField` and `WardField` are `CharField`s with the code's choices. `47` is stored as `"047"`, and `filter(county=47)` works.
- **No migration churn.** Choices load at runtime and stay out of migrations, so a data release never creates a migration.
- **Chained selects.** With `chained_to`, model forms and the admin narrow each select to its parent. The script ships with the app, and works in formsets and admin inlines. Without the URLs it falls back to a plain select.
- **Hierarchy validation.** `full_clean()` rejects a ward outside its constituency, or a constituency outside its county.
- **Records and names.** `get_ward_display()` returns the name, and `get_ward_record()` returns the full `Ward`.

Form fields (`CountyChoiceField`, `ConstituencyChoiceField`,
`SubCountyChoiceField`, `WardChoiceField`) and validators
(`validate_county_code`, `validate_ward_in`, and others) are in
`kenya_locations.contrib.django.forms` and `.validators` for plain forms.

| JSON endpoint                         | Returns                    |
| ------------------------------------- | -------------------------- |
| `counties/`                           | every county               |
| `counties/<code>/constituencies/`     | a county's constituencies  |
| `counties/<code>/sub-counties/`       | a county's sub-counties    |
| `counties/<code>/wards/`              | a county's wards           |
| `counties/<code>/localities/`         | a county's localities      |
| `constituencies/<code>/wards/`        | a constituency's wards     |
| `search/?q=&type=&limit=`             | ranked search results      |

Each list endpoint returns `{"results": [...]}` with the same keys as the
shared JSON. An unknown county or constituency answers 404 with a `detail`
message; a bad search `type` or `limit` answers 400. A runnable project is in
[`examples/django`](https://github.com/DavidAmunga/kenya-locations/tree/main/examples/django).

## FastAPI

```python
from fastapi import FastAPI
from pydantic import BaseModel

from kenya_locations.contrib.fastapi import (
    CountyCode,
    CountyFromPath,
    WardCode,
    create_router,
)

app = FastAPI()
app.include_router(create_router(), prefix="/locations")


class Delivery(BaseModel):
    county: CountyCode  # "47", 47 and "047" all validate to "047"
    ward: WardCode      # unknown codes fail with a 422


@app.get("/stores/{county}")
def stores(county: CountyFromPath):  # any code or name; 404 if unknown
    return {"county": county.name}
```

`create_router()` serves these read-only routes, with response schemas,
OpenAPI tags and a public `Cache-Control` header:

| Route                                          | Returns                    |
| ---------------------------------------------- | -------------------------- |
| `GET /counties`, `/counties/{county}`          | counties                   |
| `GET /counties/{county}/sub-counties`          | a county's sub-counties    |
| `GET /counties/{county}/constituencies`        | a county's constituencies  |
| `GET /counties/{county}/wards`                 | a county's wards           |
| `GET /counties/{county}/localities`            | a county's localities      |
| `GET /counties/{county}/areas`                 | a county's areas           |
| `GET /counties/{county}/localities/{locality}/areas` | a locality's areas   |
| `GET /sub-counties`, `/sub-counties/{sub_county}`, `/sub-counties/{sub_county}/wards` | sub-counties |
| `GET /constituencies`, `/constituencies/{constituency}`, `/constituencies/{constituency}/wards` | constituencies |
| `GET /wards`, `/wards/{ward}`                  | wards                      |
| `GET /search?q=&type=&limit=`                  | ranked search results      |

Path parameters accept a code or a unique name. An unknown one answers 404,
and a name shared by several records answers 409 with their codes in
`detail`. Call `add_exception_handlers(app)` to get the same responses when
your own routes call `kl.require_...`; a 409 then also lists the candidates
under `matches`. `CountyCode`,
`ConstituencyCode`, `SubCountyCode` and `WardCode` also work in any Pydantic
model via `kenya_locations.contrib.pydantic`. A runnable app is in
[`examples/fastapi`](https://github.com/DavidAmunga/kenya-locations/tree/main/examples/fastapi).

## Data model

| Type           | Fields                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `County`       | `code`, `name`, `capital`, `area_km2`, `population_2019`, `region`, `postal_code`, `iso_code`, `aliases` |
| `SubCounty`    | `code`, `name`, `county`, `county_code`                                                                  |
| `Constituency` | `code`, `name`, `county`, `county_code`                                                                  |
| `Ward`         | `code`, `name`, `constituency`, `constituency_code`, `county_code`, `sub_county_code`                    |
| `Locality`     | `name`, `county`, `county_code`                                                                          |
| `Area`         | `name`, `locality`, `county`, `county_code`                                                              |

Field names match the shared JSON. Every record has `to_dict()` and
`from_dict()`. Relationships are joined on `county_code`,
`constituency_code` and `sub_county_code`, not on names.

Sub-counties have 5-digit codes (`04701` is Westlands, Nairobi). They come
from the HDX ward layer rather than an official list, and wards link to them
through `sub_county_code`. See
[`data/README.md`](https://github.com/DavidAmunga/kenya-locations/blob/main/data/README.md)
for the source and its limits.

## API reference

| Function                                   | Returns               |
| ------------------------------------------ | --------------------- |
| `get_counties()`                           | `list[County]`        |
| `get_county_by_code(code)`                 | `County \| None`      |
| `get_county_by_name(name)`                 | `County \| None`      |
| `get_sub_counties()`                       | `list[SubCounty]`     |
| `get_sub_county_by_code(code)`             | `SubCounty \| None`   |
| `get_sub_county_by_name(name)`             | `SubCounty \| None`   |
| `get_sub_counties_in_county(county)`       | `list[SubCounty]`     |
| `get_county_of_sub_county(sub_county)`     | `County \| None`      |
| `get_constituencies()`                     | `list[Constituency]`  |
| `get_constituency_by_code(code)`           | `Constituency \| None` |
| `get_constituency_by_name(name)`           | `Constituency \| None` |
| `get_constituencies_in_county(county)`     | `list[Constituency]`  |
| `get_county_of_constituency(constituency)` | `County \| None`      |
| `get_constituency_of_ward(ward)`           | `Constituency \| None` |
| `get_wards()`                              | `list[Ward]`          |
| `get_ward_by_code(code)`                   | `Ward \| None`        |
| `get_ward_by_name(name)`                   | `Ward \| None`        |
| `get_wards_by_name(name)`                  | `list[Ward]`          |
| `get_wards_in_constituency(constituency)`  | `list[Ward]`          |
| `get_wards_in_county(county)`              | `list[Ward]`          |
| `get_wards_in_sub_county(sub_county)`      | `list[Ward]`          |
| `get_county_of_ward(ward)`                 | `County \| None`      |
| `get_sub_county_of_ward(ward)`             | `SubCounty \| None`   |
| `get_localities()`                         | `list[Locality]`      |
| `get_locality(name, county=None)`          | `Locality \| None`    |
| `get_locality_by_name(name)`               | `Locality \| None`    |
| `get_localities_by_name(name)`             | `list[Locality]`      |
| `get_localities_in_county(county)`         | `list[Locality]`      |
| `get_county_of_locality(name)`             | `County \| None`      |
| `get_areas()`                              | `list[Area]`          |
| `get_area_by_name(name)`                   | `Area \| None`        |
| `get_areas_by_name(name)`                  | `list[Area]`          |
| `get_areas_in_locality(locality, county=None)` | `list[Area]`      |
| `get_areas_in_county(county)`              | `list[Area]`          |
| `get_county_of_area(name)`                 | `County \| None`      |
| `get_locality_of_area(name)`               | `Locality \| None`    |
| `search(query, limit=20, types=None)`      | `list[SearchResult]`  |
| `search_by_type(query, type, limit=20)`    | `list[SearchResult]`  |

Name lookups are case-insensitive. When nothing matches exactly, a looser
match that ignores spaces, hyphens, apostrophes and accents is tried
(`Muranga` finds `Murang'a`). Codes are zero-padded, so `"47"` and `47` find
county `047`. County, constituency and sub-county arguments accept a name or
a code. County names include aliases, so `"Nairobi City"` finds Nairobi.

Singular by-name lookups return `None` when a name is reused (for example
the `Township` ward or the `Makadara` locality) instead of an arbitrary
record. Use the plural `..._by_name` functions, a ward code, or pass a county
to `get_locality()` / `get_areas_in_locality()` in that case.

## Local development

From this directory, with [uv](https://docs.astral.sh/uv/):

```bash
uv sync
uv run pytest
uv run ruff check && uv run ruff format --check
uv run mypy
```

### Check the built package

`scripts/smoke_test.py` installs the built wheel in a clean environment, away from the source
tree, and checks the bundled data and a few lookups. The release workflow runs it on the wheel and
the sdist before uploading to PyPI.

```bash
uv build
uv run --isolated --no-project --with dist/*.whl scripts/smoke_test.py
```

### Try it in a Python shell

To explore the library by hand, open a shell in the package's environment.
From the repository root:

```bash
uv run --directory packages/python python
```

Then try a few lookups. The output below is shortened.

```pycon
>>> import kenya_locations as kl
>>> kl.get_county_by_code(47)
County(code='047', name='Nairobi', capital='Nairobi', area_km2=694.9, population_2019=4397073, region='Nairobi', postal_code='00100', iso_code='KE-30', aliases=('Nairobi City',))
>>> [ward.name for ward in kl.get_wards_in_constituency("Westlands")]
['Kangemi', 'Karura', 'Kitisuru', 'Mountain view', 'Parklands/Highridge']
>>> kl.get_ward_by_name("Township")  # nothing printed: 9 wards share the name
>>> kl.require_ward("Township")
Traceback (most recent call last):
  ...
kenya_locations.errors.AmbiguousLocationError: 9 ward records are named 'Township': 0133 Township (Garissa Township), ... Pass the ward code instead.
>>> kl.get_ward_by_code("0133").constituency
'Garissa Township'
>>> kl.search("Mombassa")[0].name  # typo-tolerant
'Mombasa'
```

`get_ward_by_name` returns `None` for a reused name, and the shell prints
nothing for `None`. Codes can be strings or numbers, but a code with a
leading zero must be quoted: `"01"` works, while `01` is a Python syntax
error. Leave the shell with `exit()` or Ctrl-D.

The package ships a copy of the monorepo `data/*.json` in
`src/kenya_locations/data/`. After editing the shared JSON, refresh every
copy from the repository root with `pnpm data:sync`. CI fails if the copy is
stale.

## Contributing

Data corrections and additions belong in the shared `data/` JSON files at the
root of the [kenya-locations](https://github.com/DavidAmunga/kenya-locations)
monorepo, not in this package's copy. See the
[contributing guide](https://github.com/DavidAmunga/kenya-locations/blob/main/packages/js/CONTRIBUTING.md).

## License

The library code is MIT © [David Amunga](https://davidamunga.com). The data
is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
and sourced from the Independent Electoral and Boundaries Commission (IEBC)
and the Kenya National Bureau of Statistics (KNBS).
