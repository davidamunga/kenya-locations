package ke.locations

import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/**
 * Main entry point for the kenya-locations library.
 *
 * Works on Android, Spring Boot, Ktor, CLI tools, or any Java project —
 * no Android Context or special initialisation required.
 *
 * Data is parsed lazily on first access and cached for the lifetime of the process.
 *
 * Usage:
 * ```kotlin
 * val counties  = KenyaLocations.getCounties()
 * val wards     = KenyaLocations.getWardsInConstituency("Westlands")
 * val results   = KenyaLocations.search("karen")
 * ```
 */
object KenyaLocations {

    private val json = Json { ignoreUnknownKeys = true }

    // ─── Lazy-loaded data (each file parsed only when first accessed) ──────────

    private val _counties: List<County> by lazy {
        loadList("counties.json", ListSerializer(County.serializer()))
    }
    private val _subCounties: List<SubCounty> by lazy {
        loadList("sub-counties.json", ListSerializer(SubCounty.serializer()))
    }
    private val _constituencies: List<Constituency> by lazy {
        loadList("constituencies.json", ListSerializer(Constituency.serializer()))
    }
    private val _wards: List<Ward> by lazy {
        loadList("wards.json", ListSerializer(Ward.serializer()))
    }
    private val _localities: List<Locality> by lazy {
        loadList("locality.json", ListSerializer(Locality.serializer()))
    }
    private val _areas: List<Area> by lazy {
        loadList("area.json", ListSerializer(Area.serializer()))
    }

    // Fast lookup indexes — also lazy. Matching rules live in Lookups.kt.
    private val countiesByCode: Map<String, County> by lazy { _counties.associateBy { it.code } }
    private val countyNames by lazy { NameIndex(_counties, aliases = { it.aliases }) { it.name } }
    private val constituenciesByCode: Map<String, Constituency> by lazy { _constituencies.associateBy { it.code } }
    private val constituencyNames by lazy { NameIndex(_constituencies) { it.name } }
    private val localityNames by lazy { NameIndex(_localities) { it.name } }

    // Relationships are joined by code.
    private val subCountiesByCountyCode by lazy { _subCounties.groupBy { it.county_code } }
    private val constituenciesByCountyCode by lazy { _constituencies.groupBy { it.county_code } }
    private val wardsByConstituencyCode by lazy { _wards.groupBy { it.constituency_code } }
    private val wardsByCountyCode by lazy { _wards.groupBy { it.county_code } }
    private val localitiesByCountyCode by lazy { _localities.groupBy { it.county_code } }
    private val areasByCountyCode by lazy { _areas.groupBy { it.county_code } }
    private val areasByLocality by lazy { _areas.groupBy { localityKey(it.county_code, it.locality) } }

    // ─── Getters ──────────────────────────────────────────────────────────────

    fun getCounties(): List<County> = _counties
    fun getSubCounties(): List<SubCounty> = _subCounties
    fun getConstituencies(): List<Constituency> = _constituencies
    fun getWards(): List<Ward> = _wards
    fun getLocalities(): List<Locality> = _localities
    fun getAreas(): List<Area> = _areas

    /** Find a county by code. Numeric codes are zero-padded, so "47" finds "047". */
    fun getCountyByCode(code: String): County? =
        countiesByCode[normalizeCode(code, COUNTY_CODE_WIDTH)]

    /**
     * Find a county by name or alias ("Nairobi City"), ignoring case. Falls back
     * to ignoring spaces, punctuation and accents ("Muranga" finds "Murang'a").
     */
    fun getCountyByName(name: String): County? = countyNames.unique(name)

    /** Find a constituency by code. Numeric codes are zero-padded, so "1" finds "001". */
    fun getConstituencyByCode(code: String): Constituency? =
        constituenciesByCode[normalizeCode(code, CONSTITUENCY_CODE_WIDTH)]

    /** Find a constituency by name, ignoring case (see [getCountyByName]). */
    fun getConstituencyByName(name: String): Constituency? = constituencyNames.unique(name)

    // Every `countyName` / `constituencyName` argument below accepts a name in
    // any case, a county alias, or a code. An unknown county or constituency returns an empty list.

    fun getSubCountiesInCounty(countyName: String): List<SubCounty> =
        resolveCounty(countyName)?.let { subCountiesByCountyCode[it.code] }.orEmpty()

    fun getConstituenciesInCounty(countyName: String): List<Constituency> =
        resolveCounty(countyName)?.let { constituenciesByCountyCode[it.code] }.orEmpty()

    fun getWardsInConstituency(constituencyName: String): List<Ward> =
        resolveConstituency(constituencyName)?.let { wardsByConstituencyCode[it.code] }.orEmpty()

    fun getWardsInCounty(countyName: String): List<Ward> =
        resolveCounty(countyName)?.let { wardsByCountyCode[it.code] }.orEmpty()

    fun getLocalitiesInCounty(countyName: String): List<Locality> =
        resolveCounty(countyName)?.let { localitiesByCountyCode[it.code] }.orEmpty()

    /**
     * Areas of one locality. The same locality name exists in several counties
     * (e.g. "Bura"), so pass [county] (name or code) to pick one. Without a
     * county the locality name must be unique; an ambiguous name returns an
     * empty list.
     */
    fun getAreasInLocality(localityName: String, county: String? = null): List<Area> =
        resolveLocality(localityName, county)?.let { areasByLocality[localityKey(it.county_code, it.name)] }.orEmpty()

    fun getAreasInCounty(countyName: String): List<Area> =
        resolveCounty(countyName)?.let { areasByCountyCode[it.code] }.orEmpty()

    // ─── Resolvers ────────────────────────────────────────────────────────────

    private fun resolveCounty(nameOrCode: String): County? =
        getCountyByCode(nameOrCode) ?: countyNames.unique(nameOrCode)

    private fun resolveConstituency(nameOrCode: String): Constituency? =
        getConstituencyByCode(nameOrCode) ?: constituencyNames.unique(nameOrCode)

    private fun resolveLocality(name: String, countyNameOrCode: String?): Locality? {
        if (countyNameOrCode == null) return localityNames.unique(name)
        val county = resolveCounty(countyNameOrCode) ?: return null
        return localityNames.all(name)
            .filter { it.county_code == county.code }
            .singleOrNull()
    }

    private fun localityKey(countyCode: String, localityName: String): String =
        "$countyCode|${lowerName(localityName)}"

    // ─── Search ───────────────────────────────────────────────────────────────

    /**
     * Fuzzy search across all entity types using a Levenshtein sliding-window algorithm,
     * mirroring the Fuse.js behaviour used on the JS platform (effective threshold ≈ 0.4).
     * Tolerates minor typos — e.g. "Nairob" matches "Nairobi".
     * Results are sorted by relevance score (best match first).
     * Returns up to [limit] results (default 20).
     */
    fun search(query: String, limit: Int = 20): List<SearchResult<*>> {
        val q = query.trim()
        if (q.length < 2) return emptyList()

        val scored = ArrayList<Pair<Double, SearchResult<*>>>()

        fun <T : Any> collect(items: List<T>, type: SearchType, name: (T) -> String) {
            for (item in items) {
                val score = fuzzyScore(q, name(item)) ?: continue
                scored.add(score to SearchResult(type, item))
            }
        }

        collect(_counties, SearchType.COUNTY) { it.name }
        collect(_subCounties, SearchType.SUB_COUNTY) { it.name }
        collect(_constituencies, SearchType.CONSTITUENCY) { it.name }
        collect(_wards, SearchType.WARD) { it.name }
        collect(_localities, SearchType.LOCALITY) { it.name }
        collect(_areas, SearchType.AREA) { it.name }

        return scored.sortedBy { it.first }.take(limit).map { it.second }
    }

    fun searchByType(query: String, type: SearchType, limit: Int = 20): List<SearchResult<*>> =
        search(query, limit * 6).filter { it.type == type }.take(limit)

    // ─── Fuzzy matching ───────────────────────────────────────────────────────

    /**
     * Returns a relevance score in [0.0, 1.0) for [pattern] against [text], or null if
     * no fuzzy match exists. Score 0.0 = exact substring (perfect). Higher = worse match.
     *
     * Algorithm: exact substring check first; then Levenshtein sliding-window with
     * maxErrors = max(1, floor(patternLen × 0.4)). Matches only when the best window
     * score ≤ 0.4, keeping behaviour in line with Fuse.js threshold = 0.4.
     */
    private fun fuzzyScore(pattern: String, text: String): Double? {
        val p = pattern.lowercase()
        val t = text.lowercase()

        if (t.contains(p)) return 0.0
        if (p.length < 2) return null

        val pLen = p.length
        val tLen = t.length
        val maxErrors = maxOf(1, (pLen * 0.4).toInt())
        val windowSize = pLen + maxErrors

        var bestScore = Double.MAX_VALUE

        for (start in 0..maxOf(0, tLen - 1)) {
            val end = minOf(start + windowSize, tLen)
            val dist = levenshteinDistance(p, t.substring(start, end))
            if (dist <= maxErrors) {
                val score = dist.toDouble() / pLen.toDouble()
                if (score < bestScore) bestScore = score
            }
            if (bestScore == 0.0) break
        }

        return if (bestScore <= 0.4) bestScore else null
    }

    /**
     * Space-optimised Levenshtein distance — O(min(m,n)) space.
     */
    private fun levenshteinDistance(s: String, t: String): Int {
        val m = s.length; val n = t.length
        if (m == 0) return n
        if (n == 0) return m
        val dp = IntArray(n + 1) { it }
        for (i in 1..m) {
            var prev = dp[0]; dp[0] = i
            for (j in 1..n) {
                val temp = dp[j]
                dp[j] = if (s[i - 1] == t[j - 1]) prev
                         else 1 + minOf(prev, dp[j], dp[j - 1])
                prev = temp
            }
        }
        return dp[n]
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    private fun <T> loadList(resource: String, deserializer: kotlinx.serialization.DeserializationStrategy<T>): T {
        val stream = KenyaLocations::class.java.getResourceAsStream("/$resource")
            ?: error("kenya-locations: classpath resource '/$resource' not found. Make sure the library JAR is on the classpath.")
        return stream.bufferedReader().use { json.decodeFromString(deserializer, it.readText()) }
    }
}
