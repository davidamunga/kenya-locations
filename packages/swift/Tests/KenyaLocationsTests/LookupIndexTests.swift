import XCTest
@testable import KenyaLocations

/// Tests for the county-scoped locality API and the internal name index.
final class LookupIndexTests: XCTestCase {

    private let kl = KenyaLocations.shared

    // ─── Areas in locality take an optional county ────────────────────────────

    func testAreasInLocalityScopedToCounty() {
        let garissa = kl.getAreasInLocality("Bura", county: "Garissa")
        XCTAssertEqual(garissa.count, 3)
        XCTAssertTrue(garissa.allSatisfy { $0.county == "Garissa" })

        let tanaRiver = kl.getAreasInLocality("Bura", county: "Tana River")
        XCTAssertEqual(tanaRiver.count, 2)
        XCTAssertTrue(tanaRiver.allSatisfy { $0.county == "Tana River" })

        let kisumu = kl.getAreasInLocality("Kaloleni", county: "Kisumu")
        XCTAssertEqual(kisumu.count, 2)
        XCTAssertTrue(kisumu.allSatisfy { $0.county == "Kisumu" })
    }

    func testAreasInLocalityCountyAcceptsAnyCaseOrCode() {
        let expected = kl.getAreasInLocality("Bura", county: "Garissa")
        XCTAssertEqual(kl.getAreasInLocality("bura", county: "garissa"), expected)
        let code = kl.getCountyByName("Garissa")?.code ?? ""
        XCTAssertEqual(kl.getAreasInLocality("Bura", county: code), expected)
    }

    func testAreasInLocalityWithUnknownCountyIsEmpty() {
        XCTAssertTrue(kl.getAreasInLocality("Bura", county: "Atlantis").isEmpty)
        XCTAssertTrue(kl.getAreasInLocality("Bura", county: "Nairobi").isEmpty)
    }

    // ─── Name index: exact wins, folded fallback, ambiguity → nil ─────────────

    func testAmbiguousNamesResolveToNil() {
        let wards = NameIndex(kl.getWards())
        XCTAssertNil(wards.unique("Township"))
        XCTAssertEqual(wards.all("Township").count, 9)
        XCTAssertNotNil(wards.unique("Kilimani"))

        let localities = NameIndex(kl.getLocalities())
        XCTAssertNil(localities.unique("Makadara"))
        XCTAssertEqual(localities.all("Makadara").count, 2)
        XCTAssertEqual(localities.all("Bura").count, 3)
    }

    func testExactMatchWinsOverFoldedMatch() {
        let wards = NameIndex(kl.getWards())
        XCTAssertEqual(wards.unique("Iriaini")?.constituency, "Mathira")
        XCTAssertEqual(wards.unique("Iria-ini")?.constituency, "Othaya")
    }

    func testFoldName() {
        XCTAssertEqual(foldName("Murang'a"), "muranga")
        XCTAssertEqual(foldName("Elgeyo-Marakwet"), "elgeyomarakwet")
        XCTAssertEqual(foldName(" Homa Bay "), "homabay")
        XCTAssertEqual(foldName("Kériö"), "kerio")
    }

    func testNormalizeCode() {
        XCTAssertEqual(normalizeCode("47", width: 3), "047")
        XCTAssertEqual(normalizeCode(" 1 ", width: 4), "0001")
        XCTAssertEqual(normalizeCode("0470", width: 3), "0470")
        XCTAssertEqual(normalizeCode(" ab ", width: 3), "ab")
    }

    // ─── Lock safety: every lookup works on a fresh instance ──────────────────

    func testLookupsWorkOnFreshInstances() {
        XCTAssertEqual(KenyaLocations().getAreasInLocality("Bura", county: "47").count, 0)
        XCTAssertEqual(KenyaLocations().getAreasInLocality("Bura", county: "Garissa").count, 3)
        XCTAssertEqual(KenyaLocations().getWardsInCounty("47"), KenyaLocations.shared.getWardsInCounty("Nairobi"))
        XCTAssertEqual(KenyaLocations().getLocalitiesInCounty("nairobi").count, 77)
        XCTAssertEqual(KenyaLocations().getCountyByName("muranga")?.name, "Murang'a")
        XCTAssertEqual(KenyaLocations().getConstituencyByCode("1")?.code, "001")
    }
}
