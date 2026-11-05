using KenyaLocations;

namespace KenyaLocations.Tests;

public class LookupTests
{
    // ─── Codes are zero-padded ───────────────────────────────────────────────

    [Theory]
    [InlineData("47")]
    [InlineData(" 047 ")]
    [InlineData("047")]
    public void County_codes_are_zero_padded_and_trimmed(string code) =>
        Assert.Equal("Nairobi", Locations.GetCountyByCode(code)?.Name);

    [Fact]
    public void Constituency_codes_are_zero_padded() =>
        Assert.Equal("001", Locations.GetConstituencyByCode("1")?.Code);

    [Fact]
    public void Unknown_codes_return_null()
    {
        Assert.Null(Locations.GetCountyByCode("999"));
        Assert.Null(Locations.GetCountyByCode("abc"));
        Assert.Null(Locations.GetConstituencyByCode("9999"));
    }

    // ─── Name matching ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("nairobi")]
    [InlineData(" NAIROBI ")]
    [InlineData("Nairobi City")]
    public void County_names_are_case_insensitive_and_match_aliases(string name) =>
        Assert.Equal("Nairobi", Locations.GetCountyByName(name)?.Name);

    [Fact]
    public void County_names_ignore_punctuation_when_nothing_matches_exactly()
    {
        Assert.Equal("Murang'a", Locations.GetCountyByName("Muranga")?.Name);
        Assert.Equal("028", Locations.GetCountyByName("Elgeyo Marakwet")?.Code);
        Assert.Equal("Homa Bay", Locations.GetCountyByName("homabay")?.Name);
    }

    [Fact]
    public void Constituency_names_are_case_insensitive() =>
        Assert.Equal("Westlands", Locations.GetConstituencyByName("westlands")?.Name);

    [Fact]
    public void Ambiguous_names_resolve_to_nothing()
    {
        var wards = new NameIndex<Ward>(Locations.GetWards(), w => w.Name);
        Assert.Equal(9, wards.All("Township").Count);
        Assert.Null(wards.Unique("Township"));

        var localities = new NameIndex<Locality>(Locations.GetLocalities(), l => l.Name);
        Assert.Equal(2, localities.All("Makadara").Count);
        Assert.Null(localities.Unique("Makadara"));
    }

    [Fact]
    public void An_exact_match_wins_over_a_folded_one()
    {
        var index = new NameIndex<Ward>(Locations.GetWards(), w => w.Name);
        Assert.Equal("Mathira", index.Unique("Iriaini")?.Constituency);
        Assert.Equal("Othaya", index.Unique("Iria-ini")?.Constituency);
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    [Fact]
    public void Constituencies_and_wards_in_a_county_accept_name_alias_or_code()
    {
        var byName = Locations.GetConstituenciesInCounty("Nairobi");
        Assert.Equal(17, byName.Count);
        Assert.Equal(byName, Locations.GetConstituenciesInCounty("047"));
        Assert.Equal(byName, Locations.GetConstituenciesInCounty("nairobi city"));
        Assert.All(Locations.GetWardsInCounty("Nairobi"), w => Assert.Equal("047", w.CountyCode));
    }

    [Fact]
    public void Wards_in_a_constituency_are_joined_by_code()
    {
        var wards = Locations.GetWardsInConstituency("Westlands");
        Assert.NotEmpty(wards);
        var code = Locations.GetConstituencyByName("Westlands")!.Code;
        Assert.All(wards, w => Assert.Equal(code, w.ConstituencyCode));
    }

    [Fact]
    public void Unknown_parents_return_empty_lists()
    {
        Assert.Empty(Locations.GetWardsInCounty("Atlantis"));
        Assert.Empty(Locations.GetWardsInConstituency("Atlantis"));
        Assert.Empty(Locations.GetLocalitiesInCounty("Atlantis"));
        Assert.Empty(Locations.GetAreasInCounty("Atlantis"));
    }

    [Fact]
    public void Areas_in_a_locality_need_a_county_when_the_name_repeats()
    {
        // "Makadara" exists in more than one county, so it is ambiguous on its own.
        Assert.Empty(Locations.GetAreasInLocality("Makadara"));

        var juja = Locations.GetAreasInLocality("Juja", "Kiambu");
        Assert.NotEmpty(juja);
        Assert.All(juja, a => Assert.Equal("Juja", a.Locality));
        Assert.Equal(juja, Locations.GetAreasInLocality("Juja"));
        Assert.Empty(Locations.GetAreasInLocality("Juja", "Mombasa"));
    }

    [Fact]
    public void Lookups_are_stable_across_calls() =>
        Assert.Same(Locations.GetCounties(), Locations.GetCounties());
}
