using KenyaLocations;

namespace KenyaLocations.Tests;

public class SearchTests
{
    [Fact]
    public void Exact_names_rank_first()
    {
        var results = Locations.Search("Nairobi");
        Assert.NotEmpty(results);
        Assert.Equal(SearchType.County, results[0].Type);
        Assert.Equal("Nairobi", results[0].As<County>()!.Name);
    }

    [Fact]
    public void Typos_are_tolerated() =>
        Assert.Contains(Locations.SearchByType("Nairob", SearchType.County), r => r.As<County>()!.Name == "Nairobi");

    [Fact]
    public void Short_or_blank_queries_return_nothing()
    {
        Assert.Empty(Locations.Search(""));
        Assert.Empty(Locations.Search("   "));
        Assert.Empty(Locations.Search("a"));
    }

    [Fact]
    public void Limit_is_respected() => Assert.True(Locations.Search("an", 5).Count <= 5);

    [Fact]
    public void SearchByType_only_returns_that_type()
    {
        var results = Locations.SearchByType("Kamukunji", SearchType.Constituency);
        Assert.NotEmpty(results);
        Assert.All(results, r => Assert.Equal(SearchType.Constituency, r.Type));
        Assert.All(results, r => Assert.IsType<Constituency>(r.Item));
    }

    [Fact]
    public void Areas_are_searchable() =>
        Assert.Contains(Locations.SearchByType("Kenyatta Road", SearchType.Area), r => r.As<Area>()!.Locality == "Juja");

    [Theory]
    [InlineData("kitten", "sitting", 3)]
    [InlineData("", "abc", 3)]
    [InlineData("abc", "", 3)]
    [InlineData("same", "same", 0)]
    public void Levenshtein_matches_the_textbook_values(string a, string b, int expected) =>
        Assert.Equal(expected, Fuzzy.Levenshtein(a, b));
}
