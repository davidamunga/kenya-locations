# KenyaLocations Swift Package

Swift Package Manager library providing Kenyan administrative divisions — counties, sub-counties, constituencies, wards, localities, and areas.

See the [root README](../../README.md) for full API documentation and data details.

## Requirements

- Swift 5.9+
- iOS 13+ / macOS 10.15+ / tvOS 13+ / watchOS 6+

## Installation

### Swift Package Manager

In Xcode: **File → Add Package Dependencies** and enter:

```
https://github.com/DavidAmunga/kenya-locations
```

Or in `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/DavidAmunga/kenya-locations", from: "0.5.0"),
],
targets: [
    .target(
        name: "YourTarget",
        dependencies: [
            .product(name: "KenyaLocations", package: "kenya-locations"),
        ]
    ),
]
```

## Quick Start

```swift
import KenyaLocations

let shared = KenyaLocations.shared

// Get all counties
let counties = shared.getCounties()

// Lookups: names ignore case (and punctuation as a fallback); codes can be unpadded
let nairobi = shared.getCountyByName("nairobi")
let muranga = shared.getCountyByName("Muranga")       // Murang'a
let byCode = shared.getCountyByCode("47")             // Nairobi

// Relational queries: county / constituency arguments take a name or a code
let localities = shared.getLocalitiesInCounty("Nairobi")
let wards = shared.getWardsInConstituency("westlands")

// Locality names repeat across counties, so pass the county
let areas = shared.getAreasInLocality("Bura", county: "Garissa")

// Search across all entity types
let results = shared.search("karen", limit: 10)
```

## Models

All models are `Codable`, `Hashable` and `Sendable`, with properties named after the JSON keys.

| Type | Fields |
|---|---|
| `County` | `code`, `iso_code`, `name`, `capital`, `area_km2`, `population_2019`, `region`, `postal_code`, `aliases` |
| `Constituency` | `code`, `name`, `county`, `county_code` |
| `SubCounty` | `code`, `name`, `county`, `county_code` |
| `Ward` | `code`, `name`, `constituency`, `constituency_code`, `county_code` |
| `Locality` | `name`, `county`, `county_code` |
| `Area` | `name`, `locality`, `county`, `county_code` |

`iso_code` is the ISO 3166-2 code (Nairobi is `KE-30`; its IEBC `code` is `047`). Relational queries join on the `*_code` fields, and county aliases count as names: `getCountyByName("Nairobi City")` finds Nairobi.

## Local Development

The JSON in `Sources/KenyaLocations/Resources/` is a committed copy of `../../data/`. Swift Package Manager installs straight from the git tag, so it must be in the repo. After editing `data/*.json`, refresh it:

```bash
# From packages/swift/
cp ../../data/*.json Sources/KenyaLocations/Resources/

swift build
swift test
```

CI fails if the copy is out of date.
