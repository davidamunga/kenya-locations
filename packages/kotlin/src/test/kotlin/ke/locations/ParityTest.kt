package ke.locations

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Test
import java.io.File
import kotlin.test.assertTrue

/**
 * Runs the cases shared by every language package (tests/parity/cases.json at the repo root).
 * JS is the reference implementation; see the file's "$comment" for what is compared.
 * Each test reports every mismatch, not just the first.
 */
class ParityTest {

    private val cases: JsonObject = File("../../tests/parity/cases.json")
        .also { require(it.exists()) { "Parity cases not found: ${it.absolutePath}" } }
        .let { Json.parseToJsonElement(it.readText()).jsonObject }

    private fun JsonElement.str(): String? = if (this is JsonNull) null else jsonPrimitive.content
    private fun JsonObject.str(key: String): String? = get(key)?.str()
    private fun JsonObject.list(key: String): List<JsonElement> = get(key)?.jsonArray ?: JsonArray(emptyList())

    private fun section(name: String): List<JsonObject> = cases.getValue(name).jsonArray.map { it.jsonObject }

    private fun assertNoMismatches(mismatches: List<String>) =
        assertTrue(mismatches.isEmpty(), "Parity mismatches:\n" + mismatches.joinToString("\n"))

    private fun typeOf(name: String): SearchType = when (name) {
        "county" -> SearchType.COUNTY
        "sub-county" -> SearchType.SUB_COUNTY
        "constituency" -> SearchType.CONSTITUENCY
        "ward" -> SearchType.WARD
        "locality" -> SearchType.LOCALITY
        "area" -> SearchType.AREA
        else -> error("unknown type $name")
    }

    private fun nameOf(result: SearchResult<*>): String = when (val item = result.item) {
        is County -> item.name
        is SubCounty -> item.name
        is Constituency -> item.name
        is Ward -> item.name
        is Locality -> item.name
        is Area -> item.name
        else -> error("unknown item")
    }

    @Test
    fun `lookups match`() {
        val mismatches = mutableListOf<String>()
        for (c in section("lookups")) {
            val call = c.str("call")!!
            val arg = c.str("arg")!!
            val expected = c["expect"]!!.str()
            val actual: String? = when (call) {
                "countyByCode" -> KenyaLocations.getCountyByCode(arg)?.name
                "countyByName" -> KenyaLocations.getCountyByName(arg)?.code
                "constituencyByCode" -> KenyaLocations.getConstituencyByCode(arg)?.name
                "constituencyByName" -> KenyaLocations.getConstituencyByName(arg)?.code
                else -> error(call)
            }
            if (actual != expected) mismatches += "$call($arg): expected $expected, got $actual"
        }
        assertNoMismatches(mismatches)
    }

    @Test
    fun `counts match`() {
        val mismatches = mutableListOf<String>()
        for (c in section("counts")) {
            val call = c.str("call")!!
            val arg = c.str("arg")!!
            val expected = c["expect"]!!.jsonPrimitive.int
            val actual = when (call) {
                "constituenciesInCounty" -> KenyaLocations.getConstituenciesInCounty(arg).size
                "wardsInCounty" -> KenyaLocations.getWardsInCounty(arg).size
                "subCountiesInCounty" -> KenyaLocations.getSubCountiesInCounty(arg).size
                "wardsInConstituency" -> KenyaLocations.getWardsInConstituency(arg).size
                else -> error(call)
            }
            if (actual != expected) mismatches += "$call($arg): expected $expected, got $actual"
        }
        assertNoMismatches(mismatches)
    }

    @Test
    fun `areas in locality match`() {
        val mismatches = mutableListOf<String>()
        for (c in section("areasInLocality")) {
            val locality = c.str("locality")!!
            val county = c.str("county")
            val names = KenyaLocations.getAreasInLocality(locality, county).map { it.name }
            val label = "areasInLocality($locality, $county)"
            c["expectCount"]?.jsonPrimitive?.int?.let { if (names.size != it) mismatches += "$label: expected $it areas, got ${names.size}" }
            for (name in c.list("includes")) if (name.str() !in names) mismatches += "$label: missing ${name.str()}"
        }
        assertNoMismatches(mismatches)
    }

    @Test
    fun `localities in county match`() {
        val mismatches = mutableListOf<String>()
        for (c in section("localitiesInCounty")) {
            val county = c.str("county")!!
            val names = KenyaLocations.getLocalitiesInCounty(county).map { it.name }
            for (name in c.list("includes")) if (name.str() !in names) mismatches += "localitiesInCounty($county): missing ${name.str()}"
        }
        assertNoMismatches(mismatches)
    }

    @Test
    fun `search matches`() {
        val mismatches = mutableListOf<String>()
        for (c in section("search")) {
            val query = c.str("query")!!
            val results = KenyaLocations.search(query, c["limit"]!!.jsonPrimitive.int)
            if (c["empty"]?.jsonPrimitive?.booleanOrNull == true && results.isNotEmpty()) {
                mismatches += "search(\"$query\"): expected no results, got ${results.size}"
            }
            val hits = results.map { it.type to nameOf(it) }
            for (want in c.list("includes")) {
                val w = want.jsonObject
                val expected = typeOf(w.str("type")!!) to w.str("name")!!
                if (expected !in hits) {
                    mismatches += "search(\"$query\"): missing ${expected.first}:${expected.second}; got " +
                        hits.joinToString(" | ") { "${it.first}:${it.second}" }
                }
            }
        }
        assertNoMismatches(mismatches)
    }

    @Test
    fun `searchByType matches`() {
        val mismatches = mutableListOf<String>()
        for (c in section("searchByType")) {
            val query = c.str("query")!!
            val type = typeOf(c.str("type")!!)
            val results = KenyaLocations.searchByType(query, type, c["limit"]!!.jsonPrimitive.int)
            val label = "searchByType(\"$query\", $type)"
            if (c["nonEmpty"]?.jsonPrimitive?.booleanOrNull == true && results.isEmpty()) mismatches += "$label: expected results, got none"
            if (results.any { it.type != type }) mismatches += "$label: returned other types"
            val names = results.map { nameOf(it) }
            for (name in c.list("includes")) if (name.str() !in names) mismatches += "$label: missing ${name.str()}"
        }
        assertNoMismatches(mismatches)
    }
}
