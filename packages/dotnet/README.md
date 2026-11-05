# KenyaLocations

Kenyan administrative divisions as a typed .NET library: counties, sub-counties, constituencies, wards, localities and areas, with fast lookups and fuzzy search. All data is embedded in the package; there are no network calls.

```bash
dotnet add package KenyaLocations
```

```csharp
using KenyaLocations;

var counties = Locations.GetCounties();                    // 47
var nairobi = Locations.GetCountyByName("nairobi");        // case-insensitive, aliases, "Muranga" finds "Murang'a"
var wards = Locations.GetWardsInConstituency("Westlands");
var results = Locations.Search("karen");                   // fuzzy, typo tolerant
```

See the [main repository](https://github.com/DavidAmunga/kenya-locations) for the data and the other language packages.
