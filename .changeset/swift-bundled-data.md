---
"kenya-locations-swift": patch
---

Fix the Swift package for Swift Package Manager users: the JSON data is now committed in `Resources`, so installs from a git tag build and load data. Also fix `getCountyByCode`, `getCountyByName`, `getConstituencyByCode` and `getConstituencyByName` returning `nil` for the rest of the process when called before the matching list getter.
