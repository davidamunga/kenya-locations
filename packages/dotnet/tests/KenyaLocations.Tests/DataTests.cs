using System.Text.Json;
using KenyaLocations;

namespace KenyaLocations.Tests;

/// <summary>
/// The embedded data must match the shared data/*.json. Counts come from those files rather than
/// being hardcoded, so adding an area never breaks this test.
/// </summary>
public class DataTests
{
    private static int RecordCount(string file)
    {
        var dir = AppContext.BaseDirectory;
        while (dir is not null && !File.Exists(Path.Combine(dir, "data", file)))
            dir = Path.GetDirectoryName(dir);
        Assert.NotNull(dir);
        using var doc = JsonDocument.Parse(File.ReadAllText(Path.Combine(dir!, "data", file)));
        return doc.RootElement.GetArrayLength();
    }

    [Fact]
    public void Counties_match_shared_data() => Assert.Equal(RecordCount("counties.json"), Locations.GetCounties().Count);

    [Fact]
    public void SubCounties_match_shared_data() => Assert.Equal(RecordCount("sub-counties.json"), Locations.GetSubCounties().Count);

    [Fact]
    public void Constituencies_match_shared_data() => Assert.Equal(RecordCount("constituencies.json"), Locations.GetConstituencies().Count);

    [Fact]
    public void Wards_match_shared_data() => Assert.Equal(RecordCount("wards.json"), Locations.GetWards().Count);

    [Fact]
    public void Localities_match_shared_data() => Assert.Equal(RecordCount("locality.json"), Locations.GetLocalities().Count);

    [Fact]
    public void Areas_match_shared_data() => Assert.Equal(RecordCount("area.json"), Locations.GetAreas().Count);

    [Fact]
    public void There_are_47_counties_and_290_constituencies()
    {
        Assert.Equal(47, Locations.GetCounties().Count);
        Assert.Equal(290, Locations.GetConstituencies().Count);
    }

    [Fact]
    public void County_fields_are_populated()
    {
        var nairobi = Locations.GetCountyByCode("047")!;
        Assert.Equal("Nairobi", nairobi.Name);
        Assert.Equal("KE-30", nairobi.IsoCode);
        Assert.Equal("Nairobi", nairobi.Region);
        Assert.True(nairobi.Population2019 > 4_000_000);
        Assert.True(nairobi.AreaKm2 > 600);
        Assert.Contains("Nairobi City", nairobi.Aliases);
    }
}
