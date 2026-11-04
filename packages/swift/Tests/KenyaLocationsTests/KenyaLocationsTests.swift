import XCTest
@testable import KenyaLocations

private let dataDir: URL = URL(fileURLWithPath: #file)
    .deletingLastPathComponent() 
    .deletingLastPathComponent() 
    .deletingLastPathComponent() 
    .deletingLastPathComponent() 
    .deletingLastPathComponent()
    .appendingPathComponent("data")

private func loadFixture<T: Decodable>(_ name: String) throws -> [T] {
    let url = dataDir.appendingPathComponent("\(name).json")
    let data = try Data(contentsOf: url)
    return try JSONDecoder().decode([T].self, from: data)
}

final class KenyaLocationsTests: XCTestCase {

    // ─── County ───────────────────────────────────────────────────────────────

    func testCountyCountEquals47() throws {
        let counties: [County] = try loadFixture("counties")
        XCTAssertEqual(counties.count, 47, "Kenya has exactly 47 counties")
    }

    func testAllCountiesHaveNonBlankCodeAndName() throws {
        let counties: [County] = try loadFixture("counties")
        for county in counties {
            XCTAssertFalse(county.code.isEmpty, "County code must not be blank: \(county)")
            XCTAssertFalse(county.name.isEmpty, "County name must not be blank: \(county)")
        }
    }

    func testCountyCodesAreUnique() throws {
        let counties: [County] = try loadFixture("counties")
        let codes = counties.map { $0.code }
        XCTAssertEqual(codes.count, Set(codes).count, "County codes must be unique")
    }

    func testNairobiCountyExists() throws {
        let counties: [County] = try loadFixture("counties")
        let nairobi = counties.first { $0.name == "Nairobi City" || $0.name == "Nairobi" }
        XCTAssertNotNil(nairobi, "Nairobi county should exist")
    }

    // ─── Sub-counties ─────────────────────────────────────────────────────────

    func testSubCountyCountyReferencesAreValid() throws {
        let subCounties: [SubCounty] = try loadFixture("sub-counties")
        let counties: [County] = try loadFixture("counties")
        let countyNames = Set(counties.map { $0.name })
        let invalid = subCounties.filter { !countyNames.contains($0.county) }
        XCTAssertTrue(invalid.isEmpty, "All sub-county county refs must be valid. Invalid: \(invalid.prefix(5))")
    }

    // ─── Constituencies ───────────────────────────────────────────────────────

    func testConstituencyCountyReferencesAreValid() throws {
        let constituencies: [Constituency] = try loadFixture("constituencies")
        let counties: [County] = try loadFixture("counties")
        let countyNames = Set(counties.map { $0.name })
        let invalid = constituencies.filter { !countyNames.contains($0.county) }
        XCTAssertTrue(invalid.isEmpty, "All constituency county refs must be valid. Invalid: \(invalid.prefix(5))")
    }

    // ─── Wards ────────────────────────────────────────────────────────────────

    func testWardConstituencyReferencesAreValid() throws {
        let wards: [Ward] = try loadFixture("wards")
        let constituencies: [Constituency] = try loadFixture("constituencies")
        let constituencyNames = Set(constituencies.map { $0.name })
        let invalid = wards.filter { !constituencyNames.contains($0.constituency) }
        XCTAssertTrue(invalid.isEmpty, "All ward constituency refs must be valid. Invalid: \(invalid.prefix(5))")
    }

    // ─── Areas ────────────────────────────────────────────────────────────────

    func testAreaLocalityReferencesAreValid() throws {
        let areas: [Area] = try loadFixture("area")
        let localities: [Locality] = try loadFixture("locality")
        let localityNames = Set(localities.map { $0.name })
        let invalid = areas.filter { !localityNames.contains($0.locality) }
        XCTAssertTrue(invalid.isEmpty, "All area locality refs must be valid. Invalid: \(invalid.prefix(5))")
    }

    // ─── Models round-trip ────────────────────────────────────────────────────

    func testModelsDecodeAndReencode() throws {
        let counties: [County] = try loadFixture("counties")
        let encoded = try JSONEncoder().encode(counties)
        let decoded = try JSONDecoder().decode([County].self, from: encoded)
        XCTAssertEqual(counties, decoded)
    }

    // ─── Fuzzy search ─────────────────────────────────────────────────────────

    func testSearchExactMatchReturnsCounty() {
        let results = KenyaLocations.shared.search("Nairobi")
        XCTAssertFalse(results.isEmpty, "Search for 'Nairobi' should return results")
        let hasNairobi = results.contains { r in
            if case .county(let c) = r { return c.name == "Nairobi" }
            return false
        }
        XCTAssertTrue(hasNairobi, "Search for 'Nairobi' should include the Nairobi county")
    }

    func testSearchToleratesTypos() {
        let results = KenyaLocations.shared.search("Nairob")
        XCTAssertFalse(results.isEmpty, "Typo 'Nairob' should fuzzy-match 'Nairobi'")
        let hasNairobi = results.contains { r in
            if case .county(let c) = r { return c.name == "Nairobi" }
            return false
        }
        XCTAssertTrue(hasNairobi, "Fuzzy search for 'Nairob' should include Nairobi county")
    }

    func testSearchReturnsEmptyForSingleCharacter() {
        let results = KenyaLocations.shared.search("N")
        XCTAssertTrue(results.isEmpty, "Single character queries should return no results")
    }

    func testSearchRespectsLimit() {
        let results = KenyaLocations.shared.search("a", limit: 5)
        XCTAssertLessThanOrEqual(results.count, 5, "Search should respect the limit parameter")
    }

    func testSearchResultsSortedBestFirst() {
        let results = KenyaLocations.shared.search("Westlands")
        XCTAssertFalse(results.isEmpty, "Search for 'Westlands' should return results")
        // First result should contain "Westlands" (exact substring before fuzzy matches)
        let firstName: String = {
            switch results[0] {
            case .county(let c):       return c.name
            case .constituency(let c): return c.name
            case .subCounty(let s):    return s.name
            case .ward(let w):         return w.name
            case .locality(let l):     return l.name
            case .area(let a):         return a.name
            }
        }()
        XCTAssertTrue(firstName.lowercased().contains("westlands"),
                      "First result should contain 'Westlands', got '\(firstName)'")
    }

    func testSearchByTypeFiltersCorrectly() {
        let results = KenyaLocations.shared.searchByType("Nairobi", type: .county)
        XCTAssertTrue(results.allSatisfy { $0.type == .county },
                      "searchByType(.county) should only return county results")
    }

    // ─── Bundled resources & lookup maps ──────────────────────────────────────

    func testBundledResourcesMatchSharedData() throws {
        for name in ["counties", "sub-counties", "constituencies", "wards", "locality", "area"] {
            let bundled = try XCTUnwrap(
                Bundle.module.url(forResource: name, withExtension: "json"),
                "\(name).json missing from the package bundle"
            )
            let shared = dataDir.appendingPathComponent("\(name).json")
            XCTAssertEqual(try Data(contentsOf: bundled), try Data(contentsOf: shared),
                           "\(name).json in Resources is stale; copy data/*.json again")
        }
    }

    func testCodeLookupWorksBeforeListIsLoaded() {
        let fresh = KenyaLocations()
        XCTAssertEqual(fresh.getCountyByCode("047")?.name, "Nairobi")
        XCTAssertEqual(fresh.getCounties().count, 47)
    }

    func testNameLookupsWorkBeforeListsAreLoaded() {
        let fresh = KenyaLocations()
        XCTAssertEqual(fresh.getCountyByName("Nairobi")?.code, "047")
        XCTAssertNotNil(fresh.getConstituencyByName("Westlands"))
        XCTAssertNotNil(fresh.getConstituencyByCode("001"))
    }
}
