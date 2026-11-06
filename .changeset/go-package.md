---
"kenya-locations-go": minor
---

New Go module, `github.com/davidamunga/kenya-locations/packages/go`. It has the same lookups, name matching and typo-tolerant search as the other libraries, with no dependencies: `kl.GetWardsInConstituency("Westlands")`, `kl.Search("Nairob")`. The data is embedded with `go:embed` and parsed on first use, every function is safe for concurrent use, and every value returned is a copy.

Lookups return `nil` when nothing matches or the name is ambiguous. Releases are tagged `packages/go/v{version}`.
