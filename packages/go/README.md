# kenya-locations (Go)

Kenyan administrative divisions — counties, sub-counties, constituencies,
wards, localities, and areas — as a typed, dependency-free Go module.

**47** counties · **302** sub-counties · **290** constituencies ·
**1,450** wards · **917** localities · **1,829** areas

The JSON data is embedded in the package and parsed lazily on first use. There
is nothing to initialise and no network access. Every function is safe for
concurrent use, and every value returned is a copy.

This is the Go counterpart to the JavaScript, React, Kotlin, Swift, Dart, PHP
and .NET libraries in the same
[kenya-locations](https://github.com/davidamunga/kenya-locations) project, all
sourced from the same dataset and checked against the same cross-language
[parity cases](../../tests/parity/README.md).

## Installation

```bash
go get github.com/davidamunga/kenya-locations/packages/go
```

Requires Go 1.21+.

```go
import kl "github.com/davidamunga/kenya-locations/packages/go"
```

The package name is `kenyalocations`; the alias above is just shorter.

## Usage

```go
counties := kl.GetCounties()

nairobi := kl.GetCountyByName("Nairobi")
fmt.Println(nairobi.Capital)        // Nairobi
fmt.Println(nairobi.Population2019) // 4397073
fmt.Println(nairobi.Region)         // Nairobi

wards := kl.GetWardsInConstituency("Westlands")
localities := kl.GetLocalitiesInCounty("Nairobi")
areas := kl.GetAreasInLocality("Karen")

// Fuzzy search tolerates typos and ranks the best match first.
results := kl.Search("Nairob", kl.WithLimit(10))
```

Single-record lookups return a pointer that is `nil` when nothing matches, so
check it before use. Functions that return several records return an empty,
non-nil slice instead.

### How names and codes are matched

- Codes are zero-padded: `GetCountyByCode("47")` finds Nairobi (`"047"`).
- Names are case-insensitive. When nothing matches exactly, spaces, hyphens,
  apostrophes and accents are ignored: `GetCountyByName("Muranga")` finds
  Murang'a.
- County and constituency arguments accept a name or a code:
  `GetLocalitiesInCounty("047")`.
- County names include aliases, so `GetCountyByName("Nairobi City")` finds
  Nairobi.
- Ambiguous names return `nil`. 31 ward names (for example "Township"), 7
  locality names and 62 area names appear more than once. Use the plural
  function, a ward code, or pass a county:

```go
kl.GetWardByName("Township")                  // nil
kl.GetWardsByName("Township")                 // all 9 wards
kl.GetAreasInLocality("Bura", "Tana River")   // only Tana River's Bura
kl.GetLocality("Makadara", "Nairobi")         // only Nairobi's Makadara
```

### Drilling down and back up

```go
county := kl.GetCountyByName("Nairobi")
constituencies := kl.GetConstituenciesInCounty(county.Code)
wards := kl.GetWardsInConstituency("Westlands")

// Parents, by code or by a ward name that is unique in Kenya.
constituency := kl.GetConstituencyOfWard("1370") // Westlands
subCounty := kl.GetSubCountyOfWard("1370")
county = kl.GetCountyOfWard("1370")

locality := kl.GetLocalityOfArea("Kwa Jose") // Juja, in Kiambu
```

Relationships are joined by code, never by name.

### Search

```go
// Restrict the types and cap the results.
results := kl.Search("karen",
    kl.WithLimit(10),
    kl.WithTypes(kl.SearchTypeLocality, kl.SearchTypeArea),
)

for _, result := range results {
    switch item := result.Item.(type) {
    case kl.County:
        fmt.Println(item.Capital)
    case kl.Ward:
        fmt.Println(item.Constituency)
    case kl.Area:
        fmt.Println(item.Locality)
    }
}

kl.SearchByType("west", kl.SearchTypeWard, 10)
```

Exact substring matches rank first, then typo-tolerant Levenshtein matches
(edit distance within 40% of the query length), best match first. Queries
shorter than two characters return nothing. `Search` returns 20 results by
default (`kl.DefaultSearchLimit`). A search takes a few milliseconds.

## API

| Area | Functions |
|---|---|
| Counties | `GetCounties`, `GetCountyByCode`, `GetCountyByName` |
| Sub-counties | `GetSubCounties`, `GetSubCountyByCode`, `GetSubCountyByName`, `GetSubCountiesInCounty`, `GetCountyOfSubCounty` |
| Constituencies | `GetConstituencies`, `GetConstituencyByCode`, `GetConstituencyByName`, `GetConstituenciesInCounty`, `GetCountyOfConstituency` |
| Wards | `GetWards`, `GetWardByCode`, `GetWardByName`, `GetWardsByName`, `GetWardsInConstituency`, `GetWardsInCounty`, `GetWardsInSubCounty`, `GetConstituencyOfWard`, `GetSubCountyOfWard`, `GetCountyOfWard` |
| Localities | `GetLocalities`, `GetLocalityByName`, `GetLocality`, `GetLocalitiesByName`, `GetLocalitiesInCounty`, `GetCountyOfLocality` |
| Areas | `GetAreas`, `GetAreaByName`, `GetAreasByName`, `GetAreasInLocality`, `GetAreasInCounty`, `GetCountyOfArea`, `GetLocalityOfArea` |
| Search | `Search`, `SearchByType`, `WithLimit`, `WithTypes` |

`GetLocality` and `GetAreasInLocality` take an optional county (name or code) as
a final argument.

## Types

```go
type County struct {
    Code, ISOCode, Name, Capital string
    AreaKm2        float64
    Population2019 int64
    Region         string   // former province, e.g. "Nairobi", "Central"
    PostalCode     string
    Aliases        []string // e.g. "Nairobi City"
}

type SubCounty    struct{ Code, Name, County, CountyCode string }
type Constituency struct{ Code, Name, County, CountyCode string }
type Ward         struct{ Code, Name, Constituency, ConstituencyCode, CountyCode, SubCountyCode string }
type Locality     struct{ Name, County, CountyCode string }
type Area         struct{ Name, Locality, County, CountyCode string }

type SearchResult struct {
    Type SearchType // SearchTypeCounty, SearchTypeSubCounty, ...
    Item any        // County, SubCounty, Constituency, Ward, Locality or Area
}
```
