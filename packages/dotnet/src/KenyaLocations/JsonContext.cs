using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace KenyaLocations
{
    // Source-generated serializer: no reflection, so the package works with trimming and AOT.
    [JsonSourceGenerationOptions(PropertyNameCaseInsensitive = false)]
    [JsonSerializable(typeof(List<County>))]
    [JsonSerializable(typeof(List<SubCounty>))]
    [JsonSerializable(typeof(List<Constituency>))]
    [JsonSerializable(typeof(List<Ward>))]
    [JsonSerializable(typeof(List<Locality>))]
    [JsonSerializable(typeof(List<Area>))]
    internal sealed partial class LocationsJsonContext : JsonSerializerContext
    {
    }
}
