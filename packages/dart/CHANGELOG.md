## 0.1.1

- Initial release.
- Typed access to Kenya's counties, sub-counties, constituencies, wards,
  localities, and areas.
- Relational lookups: constituencies/localities in a county, wards in a
  constituency, areas in a locality, and the constituency of a given ward
  (by unique name or ward code; ambiguous names return `null`).
- Case-insensitive, typo-tolerant search across all six location types,
  plus `searchByType`.
- Data is compiled into the package as Dart constants — no asset loading or
  async setup required.