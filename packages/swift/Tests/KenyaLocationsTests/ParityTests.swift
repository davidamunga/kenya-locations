import XCTest
@testable import KenyaLocations

/// Runs the cases shared by every language package (tests/parity/cases.json at the repo root).
/// JS is the reference implementation; see the file's "$comment" for what is compared.
/// Each test reports every mismatch, not just the first.
final class ParityTests: XCTestCase {

    private typealias Case = [String: Any]

    private static let casesURL: URL = URL(fileURLWithPath: #file)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .appendingPathComponent("tests/parity/cases.json")

    private func section(_ name: String) throws -> [Case] {
        let data = try Data(contentsOf: Self.casesURL)
        let root = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        return try XCTUnwrap(root[name] as? [Case])
    }

    private func assertNoMismatches(_ mismatches: [String], file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(mismatches.isEmpty, "Parity mismatches:\n" + mismatches.joined(separator: "\n"), file: file, line: line)
    }

    /// JSON null decodes to NSNull, so compare through an optional string.
    private func string(_ value: Any?) -> String? { value as? String }

    private func searchType(_ name: String) -> SearchType {
        switch name {
        case "county": return .county
        case "sub-county": return .subCounty
        case "constituency": return .constituency
        case "ward": return .ward
        case "locality": return .locality
        case "area": return .area
        default: fatalError("unknown type \(name)")
        }
    }

    private func name(of result: SearchResult) -> String {
        switch result {
        case .county(let c): return c.name
        case .subCounty(let s): return s.name
        case .constituency(let c): return c.name
        case .ward(let w): return w.name
        case .locality(let l): return l.name
        case .area(let a): return a.name
        }
    }

    func testLookupsMatch() throws {
        let kl = KenyaLocations.shared
        var mismatches: [String] = []
        for c in try section("lookups") {
            let call = c["call"] as! String
            let arg = c["arg"] as! String
            let expected = string(c["expect"])
            let actual: String?
            switch call {
            case "countyByCode": actual = kl.getCountyByCode(arg)?.name
            case "countyByName": actual = kl.getCountyByName(arg)?.code
            case "constituencyByCode": actual = kl.getConstituencyByCode(arg)?.name
            case "constituencyByName": actual = kl.getConstituencyByName(arg)?.code
            default: fatalError(call)
            }
            if actual != expected { mismatches.append("\(call)(\(arg)): expected \(expected ?? "nil"), got \(actual ?? "nil")") }
        }
        assertNoMismatches(mismatches)
    }

    func testCountsMatch() throws {
        let kl = KenyaLocations.shared
        var mismatches: [String] = []
        for c in try section("counts") {
            let call = c["call"] as! String
            let arg = c["arg"] as! String
            let expected = c["expect"] as! Int
            let actual: Int
            switch call {
            case "constituenciesInCounty": actual = kl.getConstituenciesInCounty(arg).count
            case "wardsInCounty": actual = kl.getWardsInCounty(arg).count
            case "subCountiesInCounty": actual = kl.getSubCountiesInCounty(arg).count
            case "wardsInConstituency": actual = kl.getWardsInConstituency(arg).count
            default: fatalError(call)
            }
            if actual != expected { mismatches.append("\(call)(\(arg)): expected \(expected), got \(actual)") }
        }
        assertNoMismatches(mismatches)
    }

    func testAreasInLocalityMatch() throws {
        var mismatches: [String] = []
        for c in try section("areasInLocality") {
            let locality = c["locality"] as! String
            let county = string(c["county"])
            let names = KenyaLocations.shared.getAreasInLocality(locality, county: county).map(\.name)
            let label = "areasInLocality(\(locality), \(county ?? "nil"))"
            if let count = c["expectCount"] as? Int, names.count != count {
                mismatches.append("\(label): expected \(count) areas, got \(names.count)")
            }
            for want in (c["includes"] as? [String]) ?? [] where !names.contains(want) {
                mismatches.append("\(label): missing \(want)")
            }
        }
        assertNoMismatches(mismatches)
    }

    func testLocalitiesInCountyMatch() throws {
        var mismatches: [String] = []
        for c in try section("localitiesInCounty") {
            let county = c["county"] as! String
            let names = KenyaLocations.shared.getLocalitiesInCounty(county).map(\.name)
            for want in c["includes"] as! [String] where !names.contains(want) {
                mismatches.append("localitiesInCounty(\(county)): missing \(want)")
            }
        }
        assertNoMismatches(mismatches)
    }

    func testSearchMatches() throws {
        var mismatches: [String] = []
        for c in try section("search") {
            let query = c["query"] as! String
            let results = KenyaLocations.shared.search(query, limit: c["limit"] as! Int)
            if (c["empty"] as? Bool) == true, !results.isEmpty {
                mismatches.append("search(\"\(query)\"): expected no results, got \(results.count)")
            }
            let hits = results.map { "\($0.type):\(name(of: $0))" }
            for want in (c["includes"] as? [Case]) ?? [] {
                let key = "\(searchType(want["type"] as! String)):\(want["name"] as! String)"
                if !hits.contains(key) {
                    mismatches.append("search(\"\(query)\"): missing \(key); got \(hits.joined(separator: " | "))")
                }
            }
        }
        assertNoMismatches(mismatches)
    }

    func testSearchByTypeMatches() throws {
        var mismatches: [String] = []
        for c in try section("searchByType") {
            let query = c["query"] as! String
            let type = searchType(c["type"] as! String)
            let results = KenyaLocations.shared.searchByType(query, type: type, limit: c["limit"] as! Int)
            let label = "searchByType(\"\(query)\", \(type))"
            if (c["nonEmpty"] as? Bool) == true, results.isEmpty { mismatches.append("\(label): expected results, got none") }
            if results.contains(where: { $0.type != type }) { mismatches.append("\(label): returned other types") }
            let names = results.map { name(of: $0) }
            for want in (c["includes"] as? [String]) ?? [] where !names.contains(want) {
                mismatches.append("\(label): missing \(want)")
            }
        }
        assertNoMismatches(mismatches)
    }
}
