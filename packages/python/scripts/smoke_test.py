"""Check that a built kenya-locations wheel or sdist installs and works.

Run it against the built artifact, not the source tree, so a file missing from
the package fails here instead of on PyPI:

    uv build
    uv run --isolated --no-project --with dist/*.whl scripts/smoke_test.py
    uv run --isolated --no-project --with dist/*.tar.gz scripts/smoke_test.py

Set EXPECTED_VERSION to also check the installed version.
"""

from __future__ import annotations

import os
import sys
from importlib.resources import files
from pathlib import Path

import kenya_locations as kl

DATA_FILES = (
    "area.json",
    "constituencies.json",
    "counties.json",
    "history.json",
    "locality.json",
    "meta.json",
    "sub-counties.json",
    "wards.json",
)


def main() -> None:
    """Fail with an AssertionError on the first problem found."""
    source = Path(kl.__file__).resolve()
    here = Path(__file__).resolve().parents[1] / "src"
    assert here not in source.parents, f"imported the source tree, not the package: {source}"

    expected = os.environ.get("EXPECTED_VERSION")
    if expected:
        assert kl.__version__ == expected, f"version {kl.__version__}, expected {expected}"

    package = files("kenya_locations")
    assert package.joinpath("py.typed").is_file(), "py.typed is missing"
    for name in DATA_FILES:
        assert package.joinpath("data", name).is_file(), f"data/{name} is missing"
    script = "contrib/django/static/kenya_locations/chained.js"
    assert package.joinpath(*script.split("/")).is_file(), f"{script} is missing"

    county = kl.get_county_by_code(47)
    assert county is not None, "county 047 not found"
    assert county.name == "Nairobi"
    assert len(kl.get_counties()) == 47
    assert len(kl.get_wards_in_constituency("Westlands")) == 5
    assert kl.search("Mombassa")[0].name == "Mombasa"
    matches: tuple[object, ...] = ()
    try:
        kl.require_ward("Township")
    except kl.AmbiguousLocationError as error:
        matches = tuple(error.matches)
    assert len(matches) == 9, "require_ward('Township') should list 9 wards"

    print(f"kenya-locations {kl.__version__} OK ({source.parent})")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as error:
        sys.exit(f"smoke test failed: {error}")
