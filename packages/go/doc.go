// Package kenyalocations provides Kenyan administrative divisions (counties,
// sub-counties, constituencies, wards, localities and areas) from the shared
// kenya-locations dataset.
//
// The JSON data is embedded in the package and parsed lazily on first use, so
// no initialisation or network access is needed. All functions are safe for
// concurrent use, and every value returned is a copy: callers may modify it
// without affecting later calls.
//
// Every lookup handles names and codes the same way:
//
//   - Codes are zero-padded, so "47" finds county "047".
//   - Names are case-insensitive. If nothing matches exactly, a looser match
//     that ignores accents, spaces, hyphens and apostrophes is tried
//     ("Muranga" finds "Murang'a").
//   - A name that matches more than one record resolves to nil instead of an
//     arbitrary record. Use the plural ...ByName functions or pass a county to
//     disambiguate.
//   - Localities are identified by county and name, because the same locality
//     name exists in more than one county.
//   - County names include aliases, so "Nairobi City" finds Nairobi.
//   - Relationships are joined by code, never by name.
//
// Single-record lookups return a pointer, which is nil when nothing matches.
// Functions returning several records return an empty, non-nil slice when
// nothing matches.
package kenyalocations
