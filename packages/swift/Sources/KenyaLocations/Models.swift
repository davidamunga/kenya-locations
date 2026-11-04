import Foundation

public enum CountyRegion: String, Codable, Equatable, Hashable, CaseIterable, Sendable {
    case nairobi = "Nairobi"
    case central = "Central"
    case coast = "Coast"
    case eastern = "Eastern"
    case northEastern = "North Eastern"
    case nyanza = "Nyanza"
    case riftValley = "Rift Valley"
    case western = "Western"
}

public struct County: Codable, Equatable, Hashable, Sendable {
    public let code: String
    /// ISO 3166-2 code, e.g. "KE-30" for Nairobi (numbered alphabetically, unlike `code`)
    public let iso_code: String
    public let name: String
    /// County headquarters / capital town
    public let capital: String
    /// Area in square kilometres (KNBS)
    public let area_km2: Double
    /// Population from the 2019 Kenya Population and Housing Census (KNBS)
    public let population_2019: Int
    /// Former province this county belongs to
    public let region: CountyRegion
    /// Kenya Post primary postal code for the county capital
    public let postal_code: String
    /// Other names the county goes by, e.g. "Nairobi City" (may be empty)
    public let aliases: [String]
}

public struct SubCounty: Codable, Equatable, Hashable, Sendable {
    public let code: String
    public let name: String
    public let county: String
    public let county_code: String
}

public struct Constituency: Codable, Equatable, Hashable, Sendable {
    public let code: String
    public let name: String
    public let county: String
    public let county_code: String
}

public struct Ward: Codable, Equatable, Hashable, Sendable {
    public let code: String
    public let name: String
    public let constituency: String
    public let constituency_code: String
    public let county_code: String
}

public struct Locality: Codable, Equatable, Hashable, Sendable {
    public let name: String
    public let county: String
    public let county_code: String
}

public struct Area: Codable, Equatable, Hashable, Sendable {
    public let name: String
    public let locality: String
    public let county: String
    public let county_code: String
}

public enum SearchType: String, CaseIterable, Sendable {
    case county
    case subCounty
    case constituency
    case ward
    case locality
    case area
}

public enum SearchResult: Sendable {
    case county(County)
    case subCounty(SubCounty)
    case constituency(Constituency)
    case ward(Ward)
    case locality(Locality)
    case area(Area)

    public var type: SearchType {
        switch self {
        case .county: return .county
        case .subCounty: return .subCounty
        case .constituency: return .constituency
        case .ward: return .ward
        case .locality: return .locality
        case .area: return .area
        }
    }
}
