# KenyaLocations

[![NuGet](https://img.shields.io/nuget/v/KenyaLocations.svg)](https://www.nuget.org/packages/KenyaLocations)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/DavidAmunga/kenya-locations/blob/main/LICENSE)

Kenyan administrative divisions for .NET: counties, sub-counties, constituencies, wards, localities and areas, with forgiving lookups and typo-tolerant search.

All the data is embedded in the package. There are no network calls, no API keys and nothing to configure.

**47** counties · **307** sub-counties · **290** constituencies · **1,450** wards · **917** localities · **1,800+** areas

[Live demo](https://kenya-locations.web.app) · [Full documentation](https://kenya-locations.web.app/docs#dotnet) · [Report an issue](https://github.com/DavidAmunga/kenya-locations/issues)

## Installation

```bash
dotnet add package KenyaLocations
```

Targets `net8.0` and `netstandard2.0`, so it also works on .NET Framework 4.6.1+, Unity and Xamarin. Works from C#, F# and VB.

## Quick start

Everything is on the static `Locations` class.

```csharp
using KenyaLocations;

// All 47 counties
var counties = Locations.GetCounties();

// Look up by name, alias or code
var nairobi = Locations.GetCountyByName("nairobi");
Console.WriteLine($"{nairobi?.Capital}, population {nairobi?.Population2019}");

// Drill down: county -> constituency -> wards
var constituencies = Locations.GetConstituenciesInCounty("Nairobi");
var wards = Locations.GetWardsInConstituency("Westlands");

// Fuzzy search across every level
foreach (var result in Locations.Search("karen", limit: 5))
{
    Console.WriteLine($"{result.Type}: {result.Item}");
}
```

### A county, constituency and ward picker

```csharp
using KenyaLocations;

var app = WebApplication.CreateBuilder(args).Build();

app.MapGet("/counties", () => Locations.GetCounties());
app.MapGet("/counties/{county}/constituencies",
    (string county) => Locations.GetConstituenciesInCounty(county));
app.MapGet("/constituencies/{constituency}/wards",
    (string constituency) => Locations.GetWardsInConstituency(constituency));

app.Run();
```

The lists are parsed once and cached, so repeated calls cost nothing and the class is safe to use from any thread.

## API

### Lists

| Method | Returns |
|---|---|
| `GetCounties()` | `IReadOnlyList<County>` |
| `GetSubCounties()` | `IReadOnlyList<SubCounty>` |
| `GetConstituencies()` | `IReadOnlyList<Constituency>` |
| `GetWards()` | `IReadOnlyList<Ward>` |
| `GetLocalities()` | `IReadOnlyList<Locality>` |
| `GetAreas()` | `IReadOnlyList<Area>` |

### Lookups

| Method | Returns |
|---|---|
| `GetCountyByCode(code)` | `County?` |
| `GetCountyByName(name)` | `County?` |
| `GetConstituencyByCode(code)` | `Constituency?` |
| `GetConstituencyByName(name)` | `Constituency?` |

### Relations

Each one accepts a county or constituency **name, alias or code**, and returns an empty list for an unknown parent.

| Method | Returns |
|---|---|
| `GetSubCountiesInCounty(county)` | `IReadOnlyList<SubCounty>` |
| `GetConstituenciesInCounty(county)` | `IReadOnlyList<Constituency>` |
| `GetWardsInCounty(county)` | `IReadOnlyList<Ward>` |
| `GetWardsInConstituency(constituency)` | `IReadOnlyList<Ward>` |
| `GetLocalitiesInCounty(county)` | `IReadOnlyList<Locality>` |
| `GetAreasInCounty(county)` | `IReadOnlyList<Area>` |
| `GetAreasInLocality(locality, county?)` | `IReadOnlyList<Area>` |

### Search

| Method | Description |
|---|---|
| `Search(query, limit = 20)` | Fuzzy search across every type, best match first |
| `SearchByType(query, type, limit = 20)` | The same, restricted to one `SearchType` |

`SearchResult` has a `Type` (`SearchType.County`, `SubCounty`, `Constituency`, `Ward`, `Locality` or `Area`) and an `Item`. Use `As<T>()` to get the typed record:

```csharp
foreach (var result in Locations.SearchByType("Kamukunji", SearchType.Constituency))
{
    var constituency = result.As<Constituency>()!;
    Console.WriteLine($"{constituency.Name} ({constituency.County})");
}
```

Queries shorter than two characters return nothing. Search tolerates small typos, so `"Nairob"` and `"Mombassa"` still find Nairobi and Mombasa.

## How matching works

- **Codes are zero-padded.** `GetCountyByCode("47")` finds county `047`.
- **Names are case-insensitive and trimmed**, and county aliases count: `"Nairobi City"` finds Nairobi.
- **Punctuation and accents are ignored when nothing matches exactly**, so `"Muranga"` finds Murang'a.
- **Ambiguous names return nothing** rather than an arbitrary record. Ward names such as "Township" repeat across constituencies, and locality names such as "Makadara" repeat across counties. Identify wards by code, and pass the county to `GetAreasInLocality("Makadara", "Nairobi")`.
- **Relations are joined by code**, never by name.

## The records

All records are immutable `record` types.

| Type | Properties |
|---|---|
| `County` | `Code`, `IsoCode`, `Name`, `Capital`, `AreaKm2`, `Population2019`, `Region`, `PostalCode`, `Aliases` |
| `SubCounty` | `Code`, `Name`, `County`, `CountyCode` |
| `Constituency` | `Code`, `Name`, `County`, `CountyCode` |
| `Ward` | `Code`, `Name`, `Constituency`, `ConstituencyCode`, `CountyCode` |
| `Locality` | `Name`, `County`, `CountyCode` |
| `Area` | `Name`, `Locality`, `County`, `CountyCode` |

## Trimming and AOT

The data is read with a source-generated `System.Text.Json` serializer, so the library works with trimming and Native AOT without extra configuration.

## About the data

County, constituency and ward data follows the IEBC (2012 boundaries), with county figures from the KNBS 2019 census. Localities and areas are informal places and are community-maintained. If something is missing or wrong, [open an issue](https://github.com/DavidAmunga/kenya-locations/issues) or send a pull request. The data is licensed under CC BY 4.0.

The same data is available for [JavaScript](https://www.npmjs.com/package/kenya-locations), [React](https://www.npmjs.com/package/kenya-locations-react), [Kotlin](https://central.sonatype.com/artifact/io.github.davidamunga/kenya-locations), [Swift](https://swiftpackageindex.com/davidamunga/kenya-locations), [Dart](https://pub.dev/packages/kenya_locations) and [PHP](https://packagist.org/packages/davidamunga/kenya-locations). Lookups and search behave the same in every language.

## License

Code is [MIT](https://github.com/DavidAmunga/kenya-locations/blob/main/LICENSE). Data is [CC BY 4.0](https://github.com/DavidAmunga/kenya-locations/blob/main/data/LICENSE.md).
