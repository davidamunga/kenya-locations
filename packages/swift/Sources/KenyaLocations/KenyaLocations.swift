import Foundation

/// Main entry point for the kenya-locations library.
///
/// Works on iOS, macOS, tvOS, watchOS, and any Swift/Apple platform.
/// Data is parsed lazily on first access and cached for the lifetime of the process.
///
/// Usage:
/// ```swift
/// let counties  = KenyaLocations.shared.getCounties()
/// let wards     = KenyaLocations.shared.getWardsInConstituency("Westlands")
/// let results   = KenyaLocations.shared.search("karen")
/// ```
public final class KenyaLocations: @unchecked Sendable {

    public static let shared = KenyaLocations()

    private let decoder = JSONDecoder()
    private let lock = NSLock()

    // Backing storage for lazy-loaded data
    private var _counties: [County]?
    private var _subCounties: [SubCounty]?
    private var _constituencies: [Constituency]?
    private var _wards: [Ward]?
    private var _localities: [Locality]?
    private var _areas: [Area]?

    // Lookup indexes (see Lookups.swift)
    private var _countyIndex: CodedIndex<County>?
    private var _constituencyIndex: CodedIndex<Constituency>?
    private var _localityIndex: NameIndex<Locality>?

    /// Internal so tests can create a fresh, unloaded instance.
    init() {}

    // ─── Getters ──────────────────────────────────────────────────────────────

    public func getCounties() -> [County] { counties }
    public func getSubCounties() -> [SubCounty] { subCounties }
    public func getConstituencies() -> [Constituency] { constituencies }
    public func getWards() -> [Ward] { wards }
    public func getLocalities() -> [Locality] { localities }
    public func getAreas() -> [Area] { areas }

    /// Accepts padded or unpadded codes: "47" and "047" both find Nairobi.
    public func getCountyByCode(_ code: String) -> County? { countyIndex.byCode(code) }
    /// Case-insensitive; falls back to ignoring spaces, punctuation and accents ("Muranga").
    /// Aliases count as names: "Nairobi City" finds Nairobi.
    public func getCountyByName(_ name: String) -> County? { countyIndex.names.unique(name) }

    /// Accepts padded or unpadded codes: "1" and "001" both find constituency 001.
    public func getConstituencyByCode(_ code: String) -> Constituency? { constituencyIndex.byCode(code) }
    /// Case-insensitive; falls back to ignoring spaces, punctuation and accents.
    public func getConstituencyByName(_ name: String) -> Constituency? { constituencyIndex.names.unique(name) }

    /// - Parameter countyName: County name (any case) or code.
    public func getSubCountiesInCounty(_ countyName: String) -> [SubCounty] {
        guard let county = countyIndex.resolve(countyName) else { return [] }
        return subCounties.filter { $0.county_code == county.code }
    }

    /// - Parameter countyName: County name (any case) or code.
    public func getConstituenciesInCounty(_ countyName: String) -> [Constituency] {
        guard let county = countyIndex.resolve(countyName) else { return [] }
        return constituencies.filter { $0.county_code == county.code }
    }

    /// - Parameter constituencyName: Constituency name (any case) or code.
    public func getWardsInConstituency(_ constituencyName: String) -> [Ward] {
        guard let constituency = constituencyIndex.resolve(constituencyName) else { return [] }
        return wards.filter { $0.constituency_code == constituency.code }
    }

    /// - Parameter countyName: County name (any case) or code.
    public func getWardsInCounty(_ countyName: String) -> [Ward] {
        guard let county = countyIndex.resolve(countyName) else { return [] }
        return wards.filter { $0.county_code == county.code }
    }

    /// - Parameter countyName: County name (any case) or code.
    public func getLocalitiesInCounty(_ countyName: String) -> [Locality] {
        guard let county = countyIndex.resolve(countyName) else { return [] }
        return localities.filter { $0.county_code == county.code }
    }

    /// Areas of one locality. Locality names repeat across counties ("Bura" is in
    /// Garissa, Taita-Taveta and Tana River), so pass `county` to pick one.
    /// Without a county the locality name must be unique; an ambiguous name returns `[]`.
    ///
    /// - Parameters:
    ///   - localityName: Locality name (any case).
    ///   - county: Optional county name (any case) or code.
    public func getAreasInLocality(_ localityName: String, county: String? = nil) -> [Area] {
        guard let locality = resolveLocality(localityName, county: county) else { return [] }
        return areas.filter { $0.county_code == locality.county_code && sameName($0.locality, locality.name) }
    }

    /// - Parameter countyName: County name (any case) or code.
    public func getAreasInCounty(_ countyName: String) -> [Area] {
        guard let county = countyIndex.resolve(countyName) else { return [] }
        return areas.filter { $0.county_code == county.code }
    }

    /// The single locality with this name (within `county`, if given), or nil.
    private func resolveLocality(_ name: String, county countyNameOrCode: String?) -> Locality? {
        guard let countyNameOrCode else { return localityIndex.unique(name) }
        guard let county = countyIndex.resolve(countyNameOrCode) else { return nil }
        let matches = localityIndex.all(name).filter { $0.county_code == county.code }
        return matches.count == 1 ? matches[0] : nil
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    /// Fuzzy search across all entity types using a Levenshtein sliding-window algorithm,
    /// mirroring the Fuse.js behaviour used on the JS platform (effective threshold ≈ 0.4).
    /// Tolerates minor typos — e.g. "Nairob" matches "Nairobi".
    /// Results are sorted by relevance score (best match first).
    /// Returns up to `limit` results (default 20).
    public func search(_ query: String, limit: Int = 20) -> [SearchResult] {
        searchCore(query, limit: limit, only: nil)
    }

    /// Fuzzy search restricted to one entity type. The type is applied before `limit`, so up to
    /// `limit` results of that type are returned even when other types match better.
    public func searchByType(_ query: String, type: SearchType, limit: Int = 20) -> [SearchResult] {
        searchCore(query, limit: limit, only: type)
    }

    private func searchCore(_ query: String, limit: Int, only: SearchType?) -> [SearchResult] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2, limit > 0 else { return [] }

        var scored: [(score: Double, result: SearchResult)] = []

        func collect<T>(_ type: SearchType, _ items: [T], make: (T) -> SearchResult, name: (T) -> String) {
            if let only, only != type { return }
            for item in items {
                guard let score = fuzzyScore(pattern: q, text: name(item)) else { continue }
                scored.append((score, make(item)))
            }
        }

        collect(.county, counties,       make: { .county($0) })       { $0.name }
        collect(.subCounty, subCounties,    make: { .subCounty($0) })    { $0.name }
        collect(.constituency, constituencies, make: { .constituency($0) }) { $0.name }
        collect(.ward, wards,          make: { .ward($0) })          { $0.name }
        collect(.locality, localities,     make: { .locality($0) })     { $0.name }
        collect(.area, areas,          make: { .area($0) })          { $0.name }

        return scored.sorted { $0.score < $1.score }.prefix(limit).map { $0.result }
    }

    // ─── Fuzzy matching ───────────────────────────────────────────────────────

    /// Returns a relevance score in [0.0, 1.0) for `pattern` against `text`, or nil if
    /// no fuzzy match exists. Score 0.0 = exact substring (perfect). Higher = worse match.
    ///
    /// Algorithm: exact substring check first; then Levenshtein sliding-window with
    /// maxErrors = max(1, floor(patternLen × 0.4)). Returns a score only when the best
    /// window score ≤ 0.4, matching Fuse.js effective threshold behaviour.
    private func fuzzyScore(pattern: String, text: String) -> Double? {
        let p = pattern.lowercased()
        let t = text.lowercased()

        if t.contains(p) { return 0.0 }
        guard p.count >= 2 else { return nil }

        let pChars = Array(p)
        let tChars = Array(t)
        let pLen   = pChars.count
        let tLen   = tChars.count
        let maxErrors  = max(1, Int(Double(pLen) * 0.4))
        let windowSize = pLen + maxErrors

        var bestScore = Double.greatestFiniteMagnitude

        var start = 0
        while start < tLen {
            let end    = min(start + windowSize, tLen)
            let window = Array(tChars[start..<end])
            let dist   = levenshteinDistance(pChars, window)
            if dist <= maxErrors {
                let score = Double(dist) / Double(pLen)
                if score < bestScore { bestScore = score }
            }
            if bestScore == 0.0 { break }
            start += 1
        }

        return bestScore <= 0.4 ? bestScore : nil
    }

    /// Space-optimised Levenshtein distance — O(n) space.
    private func levenshteinDistance(_ s: [Character], _ t: [Character]) -> Int {
        let m = s.count, n = t.count
        if m == 0 { return n }
        if n == 0 { return m }
        var dp = Array(0...n)
        for i in 1...m {
            var prev = dp[0]; dp[0] = i
            for j in 1...n {
                let temp = dp[j]
                dp[j] = s[i - 1] == t[j - 1] ? prev : 1 + min(prev, min(dp[j], dp[j - 1]))
                prev = temp
            }
        }
        return dp[n]
    }

    // ─── Thread-safe lazy accessors ───────────────────────────────────────────

    private var counties: [County] {
        lock.lock(); defer { lock.unlock() }
        if let v = _counties { return v }
        let v: [County] = load("counties")
        _counties = v; return v
    }

    private var subCounties: [SubCounty] {
        lock.lock(); defer { lock.unlock() }
        if let v = _subCounties { return v }
        let v: [SubCounty] = load("sub-counties")
        _subCounties = v; return v
    }

    private var constituencies: [Constituency] {
        lock.lock(); defer { lock.unlock() }
        if let v = _constituencies { return v }
        let v: [Constituency] = load("constituencies")
        _constituencies = v; return v
    }

    private var wards: [Ward] {
        lock.lock(); defer { lock.unlock() }
        if let v = _wards { return v }
        let v: [Ward] = load("wards")
        _wards = v; return v
    }

    private var localities: [Locality] {
        lock.lock(); defer { lock.unlock() }
        if let v = _localities { return v }
        let v: [Locality] = load("locality")
        _localities = v; return v
    }

    private var areas: [Area] {
        lock.lock(); defer { lock.unlock() }
        if let v = _areas { return v }
        let v: [Area] = load("area")
        _areas = v; return v
    }

    // Each index loads its source list first (it takes the lock itself, and
    // NSLock is not reentrant) so the index is never built from unloaded data.

    private var countyIndex: CodedIndex<County> {
        let source = counties
        lock.lock(); defer { lock.unlock() }
        if let v = _countyIndex { return v }
        let v = CodedIndex(source, codeWidth: CodeWidth.county)
        _countyIndex = v; return v
    }

    private var constituencyIndex: CodedIndex<Constituency> {
        let source = constituencies
        lock.lock(); defer { lock.unlock() }
        if let v = _constituencyIndex { return v }
        let v = CodedIndex(source, codeWidth: CodeWidth.constituency)
        _constituencyIndex = v; return v
    }

    private var localityIndex: NameIndex<Locality> {
        let source = localities
        lock.lock(); defer { lock.unlock() }
        if let v = _localityIndex { return v }
        let v = NameIndex(source)
        _localityIndex = v; return v
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    private func load<T: Decodable>(_ resource: String) -> [T] {
        guard let url = Bundle.module.url(forResource: resource, withExtension: "json") else {
            fatalError("kenya-locations: resource '\(resource).json' not found in bundle. Make sure to run the copy-data script before building.")
        }
        do {
            let data = try Data(contentsOf: url)
            return try decoder.decode([T].self, from: data)
        } catch {
            fatalError("kenya-locations: failed to decode '\(resource).json': \(error)")
        }
    }
}
