using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace KenyaLocations
{
    /// <summary>
    /// Main entry point for the KenyaLocations library.
    /// Data is embedded in the assembly, parsed lazily on first access and cached for the
    /// lifetime of the process. Everything here is thread-safe.
    /// </summary>
    /// <example>
    /// <code>
    /// var counties = Locations.GetCounties();
    /// var wards = Locations.GetWardsInConstituency("Westlands");
    /// var results = Locations.Search("karen");
    /// </code>
    /// </example>
    public static class Locations
    {
        // ─── Lazy-loaded data (each file parsed only when first accessed) ──────

        private static readonly Lazy<IReadOnlyList<County>> Counties =
            new(() => Load("counties.json", LocationsJsonContext.Default.ListCounty));
        private static readonly Lazy<IReadOnlyList<SubCounty>> SubCounties =
            new(() => Load("sub-counties.json", LocationsJsonContext.Default.ListSubCounty));
        private static readonly Lazy<IReadOnlyList<Constituency>> Constituencies =
            new(() => Load("constituencies.json", LocationsJsonContext.Default.ListConstituency));
        private static readonly Lazy<IReadOnlyList<Ward>> Wards =
            new(() => Load("wards.json", LocationsJsonContext.Default.ListWard));
        private static readonly Lazy<IReadOnlyList<Locality>> LocalityList =
            new(() => Load("locality.json", LocationsJsonContext.Default.ListLocality));
        private static readonly Lazy<IReadOnlyList<Area>> Areas =
            new(() => Load("area.json", LocationsJsonContext.Default.ListArea));

        // Fast lookup indexes, also lazy. Matching rules live in Lookups.cs.
        private static readonly Lazy<Dictionary<string, County>> CountiesByCode =
            new(() => Counties.Value.ToDictionary(c => c.Code, StringComparer.Ordinal));
        private static readonly Lazy<NameIndex<County>> CountyNames =
            new(() => new NameIndex<County>(Counties.Value, c => c.Name, c => c.Aliases));
        private static readonly Lazy<Dictionary<string, Constituency>> ConstituenciesByCode =
            new(() => Constituencies.Value.ToDictionary(c => c.Code, StringComparer.Ordinal));
        private static readonly Lazy<NameIndex<Constituency>> ConstituencyNames =
            new(() => new NameIndex<Constituency>(Constituencies.Value, c => c.Name));
        private static readonly Lazy<NameIndex<Locality>> LocalityNames =
            new(() => new NameIndex<Locality>(LocalityList.Value, l => l.Name));

        // Relationships are joined by code.
        private static readonly Lazy<ILookup<string, SubCounty>> SubCountiesByCountyCode =
            new(() => SubCounties.Value.ToLookup(s => s.CountyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Constituency>> ConstituenciesByCountyCode =
            new(() => Constituencies.Value.ToLookup(c => c.CountyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Ward>> WardsByConstituencyCode =
            new(() => Wards.Value.ToLookup(w => w.ConstituencyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Ward>> WardsByCountyCode =
            new(() => Wards.Value.ToLookup(w => w.CountyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Locality>> LocalitiesByCountyCode =
            new(() => LocalityList.Value.ToLookup(l => l.CountyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Area>> AreasByCountyCode =
            new(() => Areas.Value.ToLookup(a => a.CountyCode, StringComparer.Ordinal));
        private static readonly Lazy<ILookup<string, Area>> AreasByLocality =
            new(() => Areas.Value.ToLookup(a => Lookups.LocalityKey(a.CountyCode, a.Locality), StringComparer.Ordinal));

        // ─── Getters ───────────────────────────────────────────────────────────

        public static IReadOnlyList<County> GetCounties() => Counties.Value;
        public static IReadOnlyList<SubCounty> GetSubCounties() => SubCounties.Value;
        public static IReadOnlyList<Constituency> GetConstituencies() => Constituencies.Value;
        public static IReadOnlyList<Ward> GetWards() => Wards.Value;
        public static IReadOnlyList<Locality> GetLocalities() => LocalityList.Value;
        public static IReadOnlyList<Area> GetAreas() => Areas.Value;

        /// <summary>Find a county by code. Numeric codes are zero-padded, so "47" finds "047".</summary>
        public static County? GetCountyByCode(string code) =>
            CountiesByCode.Value.TryGetValue(Lookups.NormalizeCode(code, Lookups.CountyCodeWidth), out var county) ? county : null;

        /// <summary>
        /// Find a county by name or alias ("Nairobi City"), ignoring case. Falls back to ignoring
        /// spaces, punctuation and accents ("Muranga" finds "Murang'a").
        /// </summary>
        public static County? GetCountyByName(string name) => CountyNames.Value.Unique(name);

        /// <summary>Find a constituency by code. Numeric codes are zero-padded, so "1" finds "001".</summary>
        public static Constituency? GetConstituencyByCode(string code) =>
            ConstituenciesByCode.Value.TryGetValue(Lookups.NormalizeCode(code, Lookups.ConstituencyCodeWidth), out var c) ? c : null;

        /// <summary>Find a constituency by name, ignoring case (see <see cref="GetCountyByName"/>).</summary>
        public static Constituency? GetConstituencyByName(string name) => ConstituencyNames.Value.Unique(name);

        // Every `countyName` / `constituencyName` argument below accepts a name in any case, a
        // county alias, or a code. An unknown county or constituency returns an empty list.

        public static IReadOnlyList<SubCounty> GetSubCountiesInCounty(string countyName) =>
            InCounty(countyName, SubCountiesByCountyCode.Value);

        public static IReadOnlyList<Constituency> GetConstituenciesInCounty(string countyName) =>
            InCounty(countyName, ConstituenciesByCountyCode.Value);

        public static IReadOnlyList<Ward> GetWardsInConstituency(string constituencyName)
        {
            var constituency = ResolveConstituency(constituencyName);
            return constituency is null ? Array.Empty<Ward>() : WardsByConstituencyCode.Value[constituency.Code].ToList();
        }

        public static IReadOnlyList<Ward> GetWardsInCounty(string countyName) =>
            InCounty(countyName, WardsByCountyCode.Value);

        public static IReadOnlyList<Locality> GetLocalitiesInCounty(string countyName) =>
            InCounty(countyName, LocalitiesByCountyCode.Value);

        /// <summary>
        /// Areas of one locality. The same locality name exists in several counties (e.g. "Bura"), so pass
        /// <paramref name="county"/> (name or code) to pick one. Without a county the locality name must be
        /// unique; an ambiguous name returns an empty list.
        /// </summary>
        public static IReadOnlyList<Area> GetAreasInLocality(string localityName, string? county = null)
        {
            var locality = ResolveLocality(localityName, county);
            return locality is null
                ? Array.Empty<Area>()
                : AreasByLocality.Value[Lookups.LocalityKey(locality.CountyCode, locality.Name)].ToList();
        }

        public static IReadOnlyList<Area> GetAreasInCounty(string countyName) =>
            InCounty(countyName, AreasByCountyCode.Value);

        // ─── Resolvers ─────────────────────────────────────────────────────────

        private static IReadOnlyList<T> InCounty<T>(string countyNameOrCode, ILookup<string, T> byCountyCode)
        {
            var county = ResolveCounty(countyNameOrCode);
            return county is null ? Array.Empty<T>() : byCountyCode[county.Code].ToList();
        }

        private static County? ResolveCounty(string nameOrCode) =>
            GetCountyByCode(nameOrCode) ?? CountyNames.Value.Unique(nameOrCode);

        private static Constituency? ResolveConstituency(string nameOrCode) =>
            GetConstituencyByCode(nameOrCode) ?? ConstituencyNames.Value.Unique(nameOrCode);

        private static Locality? ResolveLocality(string name, string? countyNameOrCode)
        {
            if (countyNameOrCode is null) return LocalityNames.Value.Unique(name);
            var county = ResolveCounty(countyNameOrCode);
            if (county is null) return null;
            var inCounty = LocalityNames.Value.All(name).Where(l => l.CountyCode == county.Code).ToList();
            return inCounty.Count == 1 ? inCounty[0] : null;
        }

        // ─── Search ────────────────────────────────────────────────────────────

        /// <summary>
        /// Fuzzy search across all record types using a Levenshtein sliding-window algorithm, mirroring the
        /// Fuse.js behaviour of the JS package (effective threshold of about 0.4). Tolerates small typos:
        /// "Nairob" matches "Nairobi". Results are sorted by relevance, best match first.
        /// </summary>
        /// <param name="query">Text to search for. Queries shorter than two characters return nothing.</param>
        /// <param name="limit">Maximum number of results.</param>
        public static IReadOnlyList<SearchResult> Search(string query, int limit = 20) =>
            SearchCore(query, limit, null);

        /// <summary>
        /// Fuzzy search restricted to one record type. The type is applied before the limit, so
        /// <paramref name="limit"/> results of that type are returned even when other types match better.
        /// </summary>
        public static IReadOnlyList<SearchResult> SearchByType(string query, SearchType type, int limit = 20) =>
            SearchCore(query, limit, type);

        private static IReadOnlyList<SearchResult> SearchCore(string query, int limit, SearchType? only)
        {
            var q = query.Trim();
            if (q.Length < 2 || limit <= 0) return Array.Empty<SearchResult>();

            var scored = new List<(double Score, SearchResult Result)>();

            void Collect<T>(IReadOnlyList<T> items, SearchType type, Func<T, string> name) where T : class
            {
                if (only is not null && only != type) return;
                foreach (var item in items)
                {
                    var score = Fuzzy.Score(q, name(item));
                    if (score is not null) scored.Add((score.Value, new SearchResult(type, item)));
                }
            }

            Collect(Counties.Value, SearchType.County, c => c.Name);
            Collect(SubCounties.Value, SearchType.SubCounty, s => s.Name);
            Collect(Constituencies.Value, SearchType.Constituency, c => c.Name);
            Collect(Wards.Value, SearchType.Ward, w => w.Name);
            Collect(LocalityList.Value, SearchType.Locality, l => l.Name);
            Collect(Areas.Value, SearchType.Area, a => a.Name);

            // OrderBy is stable, so equal scores keep data order, as in the other packages.
            return scored.OrderBy(s => s.Score).Take(limit).Select(s => s.Result).ToList();
        }

        // ─── Internal ──────────────────────────────────────────────────────────

        private static IReadOnlyList<T> Load<T>(string resource, JsonTypeInfo<List<T>> typeInfo)
        {
            var assembly = typeof(Locations).GetTypeInfo().Assembly;
            using var stream = assembly.GetManifestResourceStream(resource)
                ?? throw new InvalidOperationException(
                    $"KenyaLocations: embedded resource '{resource}' not found. The package is missing its data files.");
            return JsonSerializer.Deserialize(stream, typeInfo)
                ?? throw new InvalidOperationException($"KenyaLocations: '{resource}' is empty.");
        }
    }
}
