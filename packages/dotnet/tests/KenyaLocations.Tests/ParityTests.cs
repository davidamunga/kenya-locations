using System.Text.Json.Nodes;
using KenyaLocations;

namespace KenyaLocations.Tests;

/// <summary>
/// Runs the cases shared by every language package (tests/parity/cases.json). JS is the reference
/// implementation; see the file's $comment for what is compared. Each test reports every mismatch.
/// </summary>
public class ParityTests
{
    private static readonly JsonNode Cases = Load();

    private static JsonNode Load()
    {
        var dir = AppContext.BaseDirectory;
        while (dir is not null && !File.Exists(Path.Combine(dir, "tests", "parity", "cases.json")))
            dir = Path.GetDirectoryName(dir);
        Assert.NotNull(dir);
        return JsonNode.Parse(File.ReadAllText(Path.Combine(dir!, "tests", "parity", "cases.json")))!;
    }

    private static void AssertNoMismatches(List<string> mismatches) =>
        Assert.True(mismatches.Count == 0, "Parity mismatches:\n" + string.Join("\n", mismatches));

    private static string? Str(JsonNode? node) => node?.GetValue<string>();

    // Fixture type names -> SearchType.
    private static SearchType TypeOf(string name) => name switch
    {
        "county" => SearchType.County,
        "sub-county" => SearchType.SubCounty,
        "constituency" => SearchType.Constituency,
        "ward" => SearchType.Ward,
        "locality" => SearchType.Locality,
        "area" => SearchType.Area,
        _ => throw new ArgumentException($"unknown type {name}"),
    };

    private static string NameOf(SearchResult result) => result.Item switch
    {
        County c => c.Name,
        SubCounty s => s.Name,
        Constituency c => c.Name,
        Ward w => w.Name,
        Locality l => l.Name,
        Area a => a.Name,
        _ => throw new InvalidOperationException("unknown item"),
    };

    [Fact]
    public void Lookups_match()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["lookups"]!.AsArray())
        {
            var call = Str(c!["call"])!;
            var arg = Str(c["arg"])!;
            var expected = Str(c["expect"]);
            string? actual = call switch
            {
                "countyByCode" => Locations.GetCountyByCode(arg)?.Name,
                "countyByName" => Locations.GetCountyByName(arg)?.Code,
                "constituencyByCode" => Locations.GetConstituencyByCode(arg)?.Name,
                "constituencyByName" => Locations.GetConstituencyByName(arg)?.Code,
                _ => throw new ArgumentException(call),
            };
            if (actual != expected) mismatches.Add($"{call}({arg}): expected {expected ?? "null"}, got {actual ?? "null"}");
        }
        AssertNoMismatches(mismatches);
    }

    [Fact]
    public void Counts_match()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["counts"]!.AsArray())
        {
            var call = Str(c!["call"])!;
            var arg = Str(c["arg"])!;
            var expected = c["expect"]!.GetValue<int>();
            var actual = call switch
            {
                "constituenciesInCounty" => Locations.GetConstituenciesInCounty(arg).Count,
                "wardsInCounty" => Locations.GetWardsInCounty(arg).Count,
                "subCountiesInCounty" => Locations.GetSubCountiesInCounty(arg).Count,
                "wardsInConstituency" => Locations.GetWardsInConstituency(arg).Count,
                _ => throw new ArgumentException(call),
            };
            if (actual != expected) mismatches.Add($"{call}({arg}): expected {expected}, got {actual}");
        }
        AssertNoMismatches(mismatches);
    }

    [Fact]
    public void Areas_in_locality_match()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["areasInLocality"]!.AsArray())
        {
            var locality = Str(c!["locality"])!;
            var county = Str(c["county"]);
            var names = Locations.GetAreasInLocality(locality, county).Select(a => a.Name).ToList();
            if (c["expectCount"] is JsonNode count && names.Count != count.GetValue<int>())
                mismatches.Add($"areasInLocality({locality}, {county}): expected {count} areas, got {names.Count}");
            foreach (var name in c["includes"]?.AsArray() ?? new JsonArray())
                if (!names.Contains(Str(name)!)) mismatches.Add($"areasInLocality({locality}, {county}): missing {name}");
        }
        AssertNoMismatches(mismatches);
    }

    [Fact]
    public void Localities_in_county_match()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["localitiesInCounty"]!.AsArray())
        {
            var county = Str(c!["county"])!;
            var names = Locations.GetLocalitiesInCounty(county).Select(l => l.Name).ToList();
            foreach (var name in c["includes"]!.AsArray())
                if (!names.Contains(Str(name)!)) mismatches.Add($"localitiesInCounty({county}): missing {name}");
        }
        AssertNoMismatches(mismatches);
    }

    [Fact]
    public void Search_matches()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["search"]!.AsArray())
        {
            var query = Str(c!["query"])!;
            var results = Locations.Search(query, c["limit"]!.GetValue<int>());
            if (c["empty"]?.GetValue<bool>() == true && results.Count != 0)
                mismatches.Add($"search(\"{query}\"): expected no results, got {results.Count}");
            var hits = results.Select(r => (r.Type, NameOf(r))).ToList();
            foreach (var expected in c["includes"]?.AsArray() ?? new JsonArray())
            {
                var want = (TypeOf(Str(expected!["type"])!), Str(expected["name"])!);
                if (!hits.Contains(want))
                    mismatches.Add($"search(\"{query}\"): missing {want.Item1}:{want.Item2}; got " +
                                   string.Join(" | ", hits.Select(h => $"{h.Type}:{h.Item2}")));
            }
        }
        AssertNoMismatches(mismatches);
    }

    [Fact]
    public void SearchByType_matches()
    {
        var mismatches = new List<string>();
        foreach (var c in Cases["searchByType"]!.AsArray())
        {
            var query = Str(c!["query"])!;
            var type = TypeOf(Str(c["type"])!);
            var results = Locations.SearchByType(query, type, c["limit"]!.GetValue<int>());
            if (c["nonEmpty"]?.GetValue<bool>() == true && results.Count == 0)
                mismatches.Add($"searchByType(\"{query}\", {type}): expected results, got none");
            if (results.Any(r => r.Type != type))
                mismatches.Add($"searchByType(\"{query}\", {type}): returned other types");
            var names = results.Select(NameOf).ToList();
            foreach (var name in c["includes"]?.AsArray() ?? new JsonArray())
                if (!names.Contains(Str(name)!)) mismatches.Add($"searchByType(\"{query}\", {type}): missing {name}");
        }
        AssertNoMismatches(mismatches);
    }
}
