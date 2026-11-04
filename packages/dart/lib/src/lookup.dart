/// Internal name and code matching shared by every `KenyaLocations` lookup.
///
/// Not exported from the package.
library;

/// Zero-pads an all-digit [value] to [width] digits after trimming.
///
/// Non-numeric input is returned trimmed.
String normalizeCode(String value, int width) {
  final trimmed = value.trim();
  return _digits.hasMatch(trimmed) ? trimmed.padLeft(width, '0') : trimmed;
}

/// Lowercases and trims [value].
String lowerName(String value) => value.trim().toLowerCase();

/// Folds [value] for loose matching: strips accents, lowercases, and removes
/// everything that is not `a-z` or `0-9`, so `Murang'a` becomes `muranga`.
String foldName(String value) {
  final buffer = StringBuffer();
  for (final rune in value.toLowerCase().runes) {
    final char = String.fromCharCode(rune);
    final index = _accented.indexOf(char);
    buffer.write(index < 0 ? char : _unaccented[index]);
  }
  return buffer.toString().replaceAll(_nonAlphanumeric, '');
}

final _digits = RegExp(r'^\d+$');
final _nonAlphanumeric = RegExp('[^a-z0-9]');

// Dart has no built-in Unicode normalisation, so common Latin accents are
// mapped to their base letter. Input is lowercased first.
const _accented =
    'àáâãäåāăąçćčďèéêëēėęěğìíîïīįıľĺñńňòóôõöōőŕřśšşťţùúûüūůűųýÿźżž';
const _unaccented =
    'aaaaaaaaacccdeeeeeeeegiiiiiiillnnnooooooorrsssttuuuuuuuuyyzzz';

/// Groups [items] by [keyOf], dropping items whose key is `null`.
Map<String, List<T>> groupBy<T>(
  Iterable<T> items,
  String? Function(T item) keyOf,
) {
  final groups = <String, List<T>>{};
  for (final item in items) {
    final key = keyOf(item);
    if (key != null) (groups[key] ??= []).add(item);
  }
  return groups;
}

/// Groups [items] under every distinct key returned by [keysOf].
Map<String, List<T>> _groupByKeys<T>(
  Iterable<T> items,
  Iterable<String> Function(T item) keysOf,
) {
  final groups = <String, List<T>>{};
  for (final item in items) {
    for (final key in keysOf(item).toSet()) {
      (groups[key] ??= []).add(item);
    }
  }
  return groups;
}

/// Looks records up by name.
///
/// A case-insensitive exact match is tried first; only when it finds nothing
/// is a folded match (see [foldName]) used, so an exact spelling always wins.
/// Aliases returned by `aliasesOf` count as names.
class NameIndex<T> {
  /// Indexes [items] by the name returned from [nameOf] and any aliases
  /// returned from [aliasesOf].
  new(
    Iterable<T> items,
    String Function(T item) nameOf, {
    List<String> Function(T item)? aliasesOf,
  }) : this._(items, (item) => [nameOf(item), ...?aliasesOf?.call(item)]);

  new _(Iterable<T> items, List<String> Function(T item) namesOf)
    : _exact = _groupByKeys(items, (item) => namesOf(item).map(lowerName)),
      _folded = _groupByKeys(items, (item) => namesOf(item).map(foldName));

  final Map<String, List<T>> _exact;
  final Map<String, List<T>> _folded;

  /// Every record with this [name].
  List<T> all(String name) =>
      _exact[lowerName(name)] ?? _folded[foldName(name)] ?? const [];

  /// The record with this [name], or `null` if there are none or several.
  T? unique(String name) {
    final matches = all(name);
    return matches.length == 1 ? matches.first : null;
  }
}
