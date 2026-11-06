# kenya-locations-python

## 0.1.0

### Minor Changes

- New Python package, published on PyPI as `kenya-locations`. It has the same lookups, name matching
  and typo-tolerant search as the other libraries, with no dependencies:
  `kl.get_wards_in_constituency("Westlands")`, `kl.search("Nairob")`.

  Optional extras add framework support. `pip install "kenya-locations[django]"` adds model fields
  that store codes, chained county, constituency and ward selects for forms and the admin, hierarchy
  validation, and JSON drill-down views. `pip install "kenya-locations[fastapi]"` adds a ready-made
  read-only router, path dependencies and Pydantic code types.

  Lookups return `None` when nothing matches, and the `require_*` functions raise
  `LocationNotFoundError` or `AmbiguousLocationError` with a message that lists the candidates.
  Arguments of the wrong type raise `TypeError`.
  ([#79](https://github.com/DavidAmunga/kenya-locations/pull/79)) by
  [@achingachris](https://github.com/achingachris)
