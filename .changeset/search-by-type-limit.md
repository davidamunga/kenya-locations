---
"kenya-locations": patch
"kenya-locations-dotnet": patch
---

Fix `searchByType` in Kotlin, Swift and .NET returning fewer results than asked for, or none. It searched every type, kept the top `limit × 6` and then filtered by type, so for a common word like "West" other types filled the slots and no wards survived. The type is now applied before the limit, as in JS, PHP and Dart.
