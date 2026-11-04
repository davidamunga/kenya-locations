package ke.locations

import kotlinx.serialization.Serializable

enum class CountyRegion {
    NAIROBI, CENTRAL, COAST, EASTERN, NORTH_EASTERN, NYANZA, RIFT_VALLEY, WESTERN;

    companion object {
        fun fromString(value: String): CountyRegion = when (value) {
            "Nairobi" -> NAIROBI
            "Central" -> CENTRAL
            "Coast" -> COAST
            "Eastern" -> EASTERN
            "North Eastern" -> NORTH_EASTERN
            "Nyanza" -> NYANZA
            "Rift Valley" -> RIFT_VALLEY
            "Western" -> WESTERN
            else -> throw IllegalArgumentException("Unknown region: $value")
        }
    }
}

@Serializable
data class County(
    val code: String,
    /** ISO 3166-2:KE code, e.g. "KE-30" for Nairobi. Numbered alphabetically, so it differs from [code]. */
    val iso_code: String,
    val name: String,
    val capital: String,
    val area_km2: Double,
    val population_2019: Long,
    val region: String,
    val postal_code: String,
    /** Other names the county is known by, e.g. "Nairobi City". Empty when none. */
    val aliases: List<String>
)

@Serializable
data class SubCounty(val code: String, val name: String, val county: String, val county_code: String)

@Serializable
data class Constituency(val code: String, val name: String, val county: String, val county_code: String)

@Serializable
data class Ward(
    val code: String,
    val name: String,
    val constituency: String,
    val constituency_code: String,
    val county_code: String
)

@Serializable
data class Locality(val name: String, val county: String, val county_code: String)

@Serializable
data class Area(val name: String, val locality: String, val county: String, val county_code: String)

enum class SearchType { COUNTY, SUB_COUNTY, CONSTITUENCY, WARD, LOCALITY, AREA }

data class SearchResult<T>(val type: SearchType, val item: T)
