package ke.locations

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class LookupsTest {

    // ─── Codes are zero-padded ──────────────────────────────────────────────

    @Test
    fun `county codes are zero-padded and trimmed`() {
        assertEquals("Nairobi", KenyaLocations.getCountyByCode("47")?.name)
        assertEquals("Nairobi", KenyaLocations.getCountyByCode(" 047 ")?.name)
        assertEquals("Nairobi", KenyaLocations.getCountyByCode("047")?.name)
    }

    @Test
    fun `constituency codes are zero-padded`() {
        assertEquals("001", KenyaLocations.getConstituencyByCode("1")?.code)
    }

    // ─── Name matching ──────────────────────────────────────────────────────

    @Test
    fun `county names are case-insensitive`() {
        assertEquals("Nairobi", KenyaLocations.getCountyByName("nairobi")?.name)
        assertEquals("Nairobi", KenyaLocations.getCountyByName(" NAIROBI ")?.name)
    }

    @Test
    fun `county names ignore punctuation when nothing matches exactly`() {
        assertEquals("Murang'a", KenyaLocations.getCountyByName("Muranga")?.name)
        assertEquals("028", KenyaLocations.getCountyByName("Elgeyo Marakwet")?.code)
        assertEquals("Homa Bay", KenyaLocations.getCountyByName("homabay")?.name)
    }

    @Test
    fun `constituency names are case-insensitive`() {
        assertEquals("Westlands", KenyaLocations.getConstituencyByName("westlands")?.name)
    }

    @Test
    fun `an exact match wins over a folded one`() {
        val index = NameIndex(KenyaLocations.getWards()) { it.name }
        assertEquals("Mathira", index.unique("Iriaini")?.constituency)
        assertEquals("Othaya", index.unique("Iria-ini")?.constituency)
    }

    @Test
    fun `ambiguous names resolve to nothing`() {
        val wards = NameIndex(KenyaLocations.getWards()) { it.name }
        assertEquals(9, wards.all("Township").size)
        assertNull(wards.unique("Township"))

        val localities = NameIndex(KenyaLocations.getLocalities()) { it.name }
        assertEquals(2, localities.all("Makadara").size)
        assertNull(localities.unique("Makadara"))
    }

    // ─── County and constituency arguments accept any case or a code ────────

    @Test
    fun `getLocalitiesInCounty accepts name in any case or code`() {
        val expected = KenyaLocations.getLocalitiesInCounty("Nairobi")
        assertEquals(77, expected.size)
        assertEquals(expected, KenyaLocations.getLocalitiesInCounty("nairobi"))
        assertEquals(expected, KenyaLocations.getLocalitiesInCounty("047"))
        assertEquals(expected, KenyaLocations.getLocalitiesInCounty("47"))
    }

    @Test
    fun `getAreasInCounty accepts name in any case or code`() {
        val expected = KenyaLocations.getAreasInCounty("Nairobi")
        assertEquals(151, expected.size)
        assertEquals(expected, KenyaLocations.getAreasInCounty("NAIROBI"))
        assertEquals(expected, KenyaLocations.getAreasInCounty("47"))
    }

    @Test
    fun `getWardsInConstituency accepts name in any case or code`() {
        val expected = KenyaLocations.getWardsInConstituency("Westlands")
        assertEquals(5, expected.size)
        assertEquals(expected, KenyaLocations.getWardsInConstituency("westlands"))
        val code = KenyaLocations.getConstituencyByName("Westlands")!!.code
        assertEquals(expected, KenyaLocations.getWardsInConstituency(code))
    }

    @Test
    fun `getWardsInCounty accepts name in any case or code`() {
        val expected = KenyaLocations.getWardsInCounty("Nairobi")
        assertTrue(expected.isNotEmpty())
        assertEquals(expected, KenyaLocations.getWardsInCounty("nairobi"))
        assertEquals(expected, KenyaLocations.getWardsInCounty("47"))
    }

    @Test
    fun `getSubCountiesInCounty accepts name in any case or code`() {
        val expected = KenyaLocations.getSubCountiesInCounty("Nairobi")
        assertTrue(expected.isNotEmpty())
        assertEquals(expected, KenyaLocations.getSubCountiesInCounty("nairobi"))
        assertEquals(expected, KenyaLocations.getSubCountiesInCounty("47"))
    }

    @Test
    fun `getConstituenciesInCounty accepts name in any case or code`() {
        val expected = KenyaLocations.getConstituenciesInCounty("Nairobi")
        assertEquals(17, expected.size)
        assertEquals(expected, KenyaLocations.getConstituenciesInCounty("nairobi"))
        assertEquals(expected, KenyaLocations.getConstituenciesInCounty("47"))
    }

    @Test
    fun `county arguments use the folded fallback`() {
        val expected = KenyaLocations.getConstituenciesInCounty("Murang'a")
        assertTrue(expected.isNotEmpty())
        assertEquals(expected, KenyaLocations.getConstituenciesInCounty("muranga"))
    }

    @Test
    fun `unknown county returns an empty list`() {
        assertTrue(KenyaLocations.getLocalitiesInCounty("Atlantis").isEmpty())
    }

    // ─── Localities are identified by county + name ─────────────────────────

    @Test
    fun `getAreasInLocality scoped to a county`() {
        val garissa = KenyaLocations.getAreasInLocality("Bura", "Garissa")
        assertEquals(3, garissa.size)
        assertTrue(garissa.all { it.county == "Garissa" })

        val tanaRiver = KenyaLocations.getAreasInLocality("Bura", "Tana River")
        assertEquals(2, tanaRiver.size)
        assertTrue(tanaRiver.all { it.county == "Tana River" })
    }

    @Test
    fun `getAreasInLocality accepts a county code or any case`() {
        val expected = KenyaLocations.getAreasInLocality("Kaloleni", "Kisumu")
        assertEquals(2, expected.size)
        assertTrue(expected.all { it.county == "Kisumu" })
        val code = KenyaLocations.getCountyByName("Kisumu")!!.code
        assertEquals(expected, KenyaLocations.getAreasInLocality("kaloleni", code))
    }

    @Test
    fun `getAreasInLocality returns nothing for an ambiguous name without a county`() {
        assertTrue(KenyaLocations.getAreasInLocality("Bura").isEmpty())
    }

    @Test
    fun `getAreasInLocality works for a unique locality name`() {
        assertTrue(KenyaLocations.getAreasInLocality("Westlands").isNotEmpty())
    }

    // ─── Parent codes, ISO codes and aliases ────────────────────────────────

    @Test
    fun `wards carry their constituency and county codes`() {
        val ward = KenyaLocations.getWards().single { it.code == "0737" }
        val marakwetWest = KenyaLocations.getConstituencyByName("Marakwet West")!!
        assertEquals(marakwetWest.code, ward.constituency_code)
        assertEquals("028", ward.county_code)
    }

    @Test
    fun `counties carry unique ISO codes`() {
        assertEquals("KE-30", KenyaLocations.getCountyByCode("047")?.iso_code)
        assertEquals("KE-01", KenyaLocations.getCountyByCode("030")?.iso_code)
        val isoCodes = KenyaLocations.getCounties().map { it.iso_code }
        assertEquals(47, isoCodes.toSet().size)
    }

    @Test
    fun `county aliases resolve as names`() {
        assertEquals("047", KenyaLocations.getCountyByName("Nairobi City")?.code)
        assertEquals("047", KenyaLocations.getCountyByName("nairobi city")?.code)
        assertEquals(77, KenyaLocations.getLocalitiesInCounty("Nairobi City").size)
    }

    @Test
    fun `every ward is in its constituency's county`() {
        val constituencies = KenyaLocations.getConstituencies().associateBy { it.code }
        KenyaLocations.getWards().forEach { ward ->
            assertEquals(constituencies.getValue(ward.constituency_code).county_code, ward.county_code, ward.code)
        }
    }
}
