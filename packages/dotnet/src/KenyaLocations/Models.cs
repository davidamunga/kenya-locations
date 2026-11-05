using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace KenyaLocations
{
    /// <summary>A Kenyan county.</summary>
    /// <param name="Code">IEBC county code, "001"–"047".</param>
    /// <param name="IsoCode">ISO 3166-2:KE code, e.g. "KE-30" for Nairobi. Numbered alphabetically, so it differs from <paramref name="Code"/>.</param>
    /// <param name="Name">County name.</param>
    /// <param name="Capital">County capital.</param>
    /// <param name="AreaKm2">Area in square kilometres (KNBS).</param>
    /// <param name="Population2019">Population from the 2019 census (KNBS).</param>
    /// <param name="Region">Former province, e.g. "Rift Valley".</param>
    /// <param name="PostalCode">Postal code of the capital.</param>
    /// <param name="Aliases">Other names the county is known by, e.g. "Nairobi City". Empty when none.</param>
    public sealed record County(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("iso_code")] string IsoCode,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("capital")] string Capital,
        [property: JsonPropertyName("area_km2")] double AreaKm2,
        [property: JsonPropertyName("population_2019")] long Population2019,
        [property: JsonPropertyName("region")] string Region,
        [property: JsonPropertyName("postal_code")] string PostalCode,
        [property: JsonPropertyName("aliases")] IReadOnlyList<string> Aliases);

    /// <summary>An administrative sub-county.</summary>
    public sealed record SubCounty(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("county")] string County,
        [property: JsonPropertyName("county_code")] string CountyCode);

    /// <summary>An electoral constituency.</summary>
    public sealed record Constituency(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("county")] string County,
        [property: JsonPropertyName("county_code")] string CountyCode);

    /// <summary>An electoral ward. Ward names repeat across constituencies, so identify wards by <see cref="Code"/>.</summary>
    public sealed record Ward(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("constituency")] string Constituency,
        [property: JsonPropertyName("constituency_code")] string ConstituencyCode,
        [property: JsonPropertyName("county_code")] string CountyCode);

    /// <summary>A locality. The same name can exist in several counties; match on <see cref="CountyCode"/> and <see cref="Name"/>.</summary>
    public sealed record Locality(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("county")] string County,
        [property: JsonPropertyName("county_code")] string CountyCode);

    /// <summary>An informal area inside a locality.</summary>
    public sealed record Area(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("locality")] string Locality,
        [property: JsonPropertyName("county")] string County,
        [property: JsonPropertyName("county_code")] string CountyCode);

    /// <summary>The kind of record a search result holds.</summary>
    public enum SearchType
    {
        County,
        SubCounty,
        Constituency,
        Ward,
        Locality,
        Area,
    }

    /// <summary>A fuzzy-search hit. <see cref="Item"/> is the record matching <see cref="Type"/>.</summary>
    public sealed record SearchResult(SearchType Type, object Item)
    {
        /// <summary>The matched record as <typeparamref name="T"/>, or null if it is another type.</summary>
        public T? As<T>() where T : class => Item as T;
    }
}

#if NETSTANDARD2_0
namespace System.Runtime.CompilerServices
{
    // Lets `record` and `init` compile when targeting netstandard2.0.
    internal static class IsExternalInit { }
}
#endif
