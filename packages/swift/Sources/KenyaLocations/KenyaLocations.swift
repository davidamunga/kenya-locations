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

    // Fast lookup maps
    private var _countiesByCode: [String: County]?
    private var _countiesByName: [String: County]?
    private var _constituenciesByCode: [String: Constituency]?
    private var _constituenciesByName: [String: Constituency]?

    /// Internal so tests can create a fresh, unloaded instance.
    init() {}

    // ─── Getters ──────────────────────────────────────────────────────────────

    public func getCounties() -> [County] { counties }
    public func getSubCounties() -> [SubCounty] { subCounties }
    public func getConstituencies() -> [Constituency] { constituencies }
    public func getWards() -> [Ward] { wards }
    public func getLocalities() -> [Locality] { localities }
    public func getAreas() -> [Area] { areas }

    public func getCountyByCode(_ code: String) -> County? { countiesByCode[code] }
    public func getCountyByName(_ name: String) -> County? { countiesByName[name] }

    public func getConstituencyByCode(_ code: String) -> Constituency? { constituenciesByCode[code] }
    public func getConstituencyByName(_ name: String) -> Constituency? { constituenciesByName[name] }

    public func getSubCountiesInCounty(_ countyName: String) -> [SubCounty] {
        subCounties.filter { $0.county == countyName }
    }

    public func getConstituenciesInCounty(_ countyName: String) -> [Constituency] {
        constituencies.filter { $0.county == countyName }
    }

    public func getWardsInConstituency(_ constituencyName: String) -> [Ward] {
        wards.filter { $0.constituency == constituencyName }
    }

    public func getWardsInCounty(_ countyName: String) -> [Ward] {
        let constituencyNames = Set(getConstituenciesInCounty(countyName).map { $0.name })
        return wards.filter { constituencyNames.contains($0.constituency) }
    }

    public func getLocalitiesInCounty(_ countyName: String) -> [Locality] {
        localities.filter { $0.county == countyName }
    }

    public func getAreasInLocality(_ localityName: String) -> [Area] {
        areas.filter { $0.locality == localityName }
    }

    public func getAreasInCounty(_ countyName: String) -> [Area] {
        areas.filter { $0.county == countyName }
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    /// Fuzzy search across all entity types using a Levenshtein sliding-window algorithm,
    /// mirroring the Fuse.js behaviour used on the JS platform (effective threshold ≈ 0.4).
    /// Tolerates minor typos — e.g. "Nairob" matches "Nairobi".
    /// Results are sorted by relevance score (best match first).
    /// Returns up to `limit` results (default 20).
    public func search(_ query: String, limit: Int = 20) -> [SearchResult] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { return [] }

        var scored: [(score: Double, result: SearchResult)] = []

        func collect<T>(_ items: [T], make: (T) -> SearchResult, name: (T) -> String) {
            for item in items {
                guard let score = fuzzyScore(pattern: q, text: name(item)) else { continue }
                scored.append((score, make(item)))
            }
        }

        collect(counties,       make: { .county($0) })       { $0.name }
        collect(subCounties,    make: { .subCounty($0) })    { $0.name }
        collect(constituencies, make: { .constituency($0) }) { $0.name }
        collect(wards,          make: { .ward($0) })          { $0.name }
        collect(localities,     make: { .locality($0) })     { $0.name }
        collect(areas,          make: { .area($0) })          { $0.name }

        return scored.sorted { $0.score < $1.score }.prefix(limit).map { $0.result }
    }

    public func searchByType(_ query: String, type: SearchType, limit: Int = 20) -> [SearchResult] {
        search(query, limit: limit * 6).filter { $0.type == type }.prefix(limit).map { $0 }
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

    private var countiesByCode: [String: County] {
        // Load the source list first (it takes the lock itself, and NSLock
        // is not reentrant) so the map is never built from unloaded data.
        let source = counties
        lock.lock(); defer { lock.unlock() }
        if let v = _countiesByCode { return v }
        let v = Dictionary(uniqueKeysWithValues: source.map { ($0.code, $0) })
        _countiesByCode = v; return v
    }

    private var countiesByName: [String: County] {
        // Load the source list first (it takes the lock itself, and NSLock
        // is not reentrant) so the map is never built from unloaded data.
        let source = counties
        lock.lock(); defer { lock.unlock() }
        if let v = _countiesByName { return v }
        let v = Dictionary(uniqueKeysWithValues: source.map { ($0.name, $0) })
        _countiesByName = v; return v
    }

    private var constituenciesByCode: [String: Constituency] {
        // Load the source list first (it takes the lock itself, and NSLock
        // is not reentrant) so the map is never built from unloaded data.
        let source = constituencies
        lock.lock(); defer { lock.unlock() }
        if let v = _constituenciesByCode { return v }
        let v = Dictionary(uniqueKeysWithValues: source.map { ($0.code, $0) })
        _constituenciesByCode = v; return v
    }

    private var constituenciesByName: [String: Constituency] {
        // Load the source list first (it takes the lock itself, and NSLock
        // is not reentrant) so the map is never built from unloaded data.
        let source = constituencies
        lock.lock(); defer { lock.unlock() }
        if let v = _constituenciesByName { return v }
        let v = Dictionary(uniqueKeysWithValues: source.map { ($0.name, $0) })
        _constituenciesByName = v; return v
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
