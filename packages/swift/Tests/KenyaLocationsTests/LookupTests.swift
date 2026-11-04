import XCTest
@testable import KenyaLocations

/// Lookup behaviour shared with the JS package: padded codes, case-insensitive
/// and punctuation-tolerant names, name-or-code county/constituency inputs.
final class LookupTests: XCTestCase {

    private let kl = KenyaLocations.shared

    // ─── Codes are zero-padded ────────────────────────────────────────────────

    func testCountyCodesArePadded() {
        XCTAssertEqual(kl.getCountyByCode("47")?.name, "Nairobi")
        XCTAssertEqual(kl.getCountyByCode(" 047 ")?.name, "Nairobi")
        XCTAssertEqual(kl.getCountyByCode("047")?.name, "Nairobi")
    }

    func testConstituencyCodesArePadded() {
        XCTAssertEqual(kl.getConstituencyByCode("1")?.code, "001")
        XCTAssertEqual(kl.getConstituencyByCode(" 001 ")?.code, "001")
    }

    func testUnknownCodesReturnNil() {
        XCTAssertNil(kl.getCountyByCode("999"))
        XCTAssertNil(kl.getCountyByCode("abc"))
    }

    // ─── Names are case-insensitive, with a folded fallback ───────────────────

    func testCountyNamesIgnoreCase() {
        XCTAssertEqual(kl.getCountyByName("nairobi")?.code, "047")
        XCTAssertEqual(kl.getCountyByName("  NAIROBI ")?.code, "047")
    }

    func testCountyNamesIgnorePunctuationWhenNothingMatchesExactly() {
        XCTAssertEqual(kl.getCountyByName("Muranga")?.name, "Murang'a")
        XCTAssertEqual(kl.getCountyByName("Elgeyo Marakwet")?.code, "028")
        XCTAssertEqual(kl.getCountyByName("homabay")?.name, "Homa Bay")
    }

    func testConstituencyNamesIgnoreCase() {
        XCTAssertEqual(kl.getConstituencyByName("westlands")?.name, "Westlands")
        XCTAssertNil(kl.getConstituencyByName("Nowhere"))
    }

    // ─── County and constituency inputs accept any case or a code ─────────────

    func testLocalitiesInCountyAcceptNameOrCode() {
        let expected = kl.getLocalitiesInCounty("Nairobi")
        XCTAssertEqual(expected.count, 77)
        for input in ["nairobi", "NAIROBI", "047", "47"] {
            XCTAssertEqual(kl.getLocalitiesInCounty(input), expected, input)
        }
    }

    func testAreasInCountyAcceptNameOrCode() {
        let expected = kl.getAreasInCounty("Nairobi")
        XCTAssertEqual(expected.count, 151)
        XCTAssertEqual(kl.getAreasInCounty("NAIROBI"), expected)
        XCTAssertEqual(kl.getAreasInCounty("47"), expected)
    }

    func testWardsInConstituencyAcceptNameOrCode() throws {
        XCTAssertEqual(kl.getWardsInConstituency("Westlands").count, 5)
        XCTAssertEqual(kl.getWardsInConstituency("westlands").count, 5)
        let code = try XCTUnwrap(kl.getConstituencyByName("Westlands")?.code)
        XCTAssertEqual(kl.getWardsInConstituency(code), kl.getWardsInConstituency("Westlands"))
    }

    func testWardsInCountyAcceptNameOrCode() {
        let expected = kl.getWardsInCounty("Nairobi")
        XCTAssertFalse(expected.isEmpty)
        XCTAssertEqual(kl.getWardsInCounty("47"), expected)
        XCTAssertEqual(kl.getWardsInCounty("nairobi"), expected)
    }

    func testSubCountiesAndConstituenciesInCountyAcceptNameOrCode() {
        let subCounties = kl.getSubCountiesInCounty("Nairobi")
        XCTAssertFalse(subCounties.isEmpty)
        XCTAssertEqual(kl.getSubCountiesInCounty("47"), subCounties)
        XCTAssertEqual(kl.getSubCountiesInCounty("nairobi"), subCounties)

        let constituencies = kl.getConstituenciesInCounty("Nairobi")
        XCTAssertFalse(constituencies.isEmpty)
        XCTAssertEqual(kl.getConstituenciesInCounty("047"), constituencies)
        XCTAssertEqual(kl.getConstituenciesInCounty("muranga"), kl.getConstituenciesInCounty("Murang'a"))
    }

    func testUnknownCountyReturnsEmpty() {
        XCTAssertTrue(kl.getLocalitiesInCounty("Atlantis").isEmpty)
        XCTAssertTrue(kl.getWardsInCounty("999").isEmpty)
    }

    // ─── Localities are identified by county + name ───────────────────────────

    func testAreasInAmbiguousLocalityWithoutCountyIsEmpty() {
        XCTAssertTrue(kl.getAreasInLocality("Bura").isEmpty)
    }

    func testAreasInUniqueLocalityWithoutCounty() {
        XCTAssertFalse(kl.getAreasInLocality("Westlands").isEmpty)
    }
}
