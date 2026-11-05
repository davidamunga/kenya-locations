# kenya-locations-dotnet

## 0.1.1

### Patch Changes

- Fix `searchByType` in Kotlin, Swift and .NET returning fewer results than asked for, or none. It
  searched every type, kept the top `limit × 6` and then filtered by type, so for a common word like
  "West" other types filled the slots and no wards survived. The type is now applied before the
  limit, as in JS, PHP and Dart. ([#74](https://github.com/DavidAmunga/kenya-locations/pull/74))

## 0.1.0

### Minor Changes

- Add the `KenyaLocations` .NET package for NuGet: counties, sub-counties, constituencies, wards,
  localities and areas with fast lookups and fuzzy search. Targets `net8.0` and `netstandard2.0`,
  with the data embedded. ([#72](https://github.com/DavidAmunga/kenya-locations/pull/72))
