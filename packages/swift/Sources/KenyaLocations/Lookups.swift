import Foundation

// Shared name/code matching used by every lookup in `KenyaLocations`, so the
// rules behave the same everywhere (and the same as the JS package):
//
// - Numeric codes are zero-padded, so "47" finds county "047".
// - Names are case-insensitive. If nothing matches exactly, a looser match
//   that ignores spaces, hyphens, apostrophes and accents is tried
//   ("Muranga" finds "Murang'a").
// - A singular lookup whose name matches more than one record returns nil
//   instead of an arbitrary record.
// - County aliases ("Nairobi City") count as names.
// - Records are joined by their parents' codes, never by name.
// - Localities are identified by county code + name.

enum CodeWidth {
    static let county = 3
    static let constituency = 3
    static let subCounty = 3
    static let ward = 4
}

/// Lowercase and trim.
func lowerName(_ value: String) -> String {
    value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
}

/// True when two names are equal ignoring case and surrounding whitespace.
func sameName(_ a: String, _ b: String) -> Bool {
    lowerName(a) == lowerName(b)
}

/// Ignore case, accents, spaces and punctuation: "Murang'a" → "muranga".
func foldName(_ value: String) -> String {
    let stripped = value.decomposedStringWithCanonicalMapping.unicodeScalars
        .filter { !(0x300...0x36F).contains($0.value) }
    return String(String.UnicodeScalarView(stripped)).lowercased().unicodeScalars
        .filter { ("a"..."z").contains($0) || ("0"..."9").contains($0) }
        .map(String.init).joined()
}

/// Zero-pad a numeric code to `width` digits; non-numeric input is returned trimmed.
func normalizeCode(_ value: String, width: Int) -> String {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, trimmed.unicodeScalars.allSatisfy({ ("0"..."9").contains($0) }) else {
        return trimmed
    }
    return String(repeating: "0", count: max(0, width - trimmed.count)) + trimmed
}

protocol NamedRecord {
    var name: String { get }
    /// Alternative names that match like `name`.
    var aliases: [String] { get }
}

extension NamedRecord {
    var aliases: [String] { [] }
}
protocol CodedRecord { var code: String { get } }

extension County: NamedRecord, CodedRecord {}
extension Constituency: NamedRecord, CodedRecord {}
extension SubCounty: NamedRecord, CodedRecord {}
extension Ward: NamedRecord, CodedRecord {}
extension Locality: NamedRecord {}
extension Area: NamedRecord {}

/// Group items under every key they produce; an item appears once per key.
private func group<T>(_ items: [T], keys: (T) -> [String]) -> [String: [T]] {
    var map: [String: [T]] = [:]
    for item in items {
        var seen = Set<String>()
        for key in keys(item) where seen.insert(key).inserted {
            map[key, default: []].append(item)
        }
    }
    return map
}

/// Name index: exact (case-insensitive) matches first, folded matches as a fallback.
/// A record's aliases count as names.
struct NameIndex<T: NamedRecord> {
    private let exact: [String: [T]]
    private let folded: [String: [T]]

    init(_ items: [T]) {
        exact = group(items) { ([$0.name] + $0.aliases).map(lowerName) }
        folded = group(items) { ([$0.name] + $0.aliases).map(foldName) }
    }

    /// Every record with this name.
    func all(_ name: String) -> [T] {
        exact[lowerName(name)] ?? folded[foldName(name)] ?? []
    }

    /// The record with this name, or nil if there are none or several.
    func unique(_ name: String) -> T? {
        let matches = all(name)
        return matches.count == 1 ? matches[0] : nil
    }
}

/// Code + name index for records that have both.
struct CodedIndex<T: NamedRecord & CodedRecord> {
    private let byCode: [String: T]
    private let width: Int
    let names: NameIndex<T>

    init(_ items: [T], codeWidth: Int) {
        byCode = Dictionary(items.map { ($0.code, $0) }, uniquingKeysWith: { first, _ in first })
        width = codeWidth
        names = NameIndex(items)
    }

    func byCode(_ code: String) -> T? {
        byCode[normalizeCode(code, width: width)]
    }

    /// Resolve from a code, or from a name when that name is unique.
    func resolve(_ nameOrCode: String) -> T? {
        byCode(nameOrCode) ?? names.unique(nameOrCode)
    }
}
