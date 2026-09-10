/// Generates `lib/src/generated/data.dart` for the `kenya_locations` package
/// by reading the raw JSON datasets in `data/` and embedding them as Dart
/// constant list literals.
library;

import 'dart:convert';
import 'dart:io';

/// Entry point. Reads the county, sub-county, constituency, ward, locality,
/// and area JSON files from the `data` directory and writes them out as
/// Dart constants to the generated data file.
Future<void> main() async {
  final dataDir = Directory('data');
  final outFile = File('packages/dart/lib/src/generated/data.dart');

  final counties = await _readJson('${dataDir.path}/counties.json');
  final subCounties = await _readJson('${dataDir.path}/sub-counties.json');
  final constituencies = await _readJson('${dataDir.path}/constituencies.json');
  final wards = await _readJson('${dataDir.path}/wards.json');
  final localities = await _readJson('${dataDir.path}/locality.json');
  final areas = await _readJson('${dataDir.path}/area.json');

  final buffer = StringBuffer()
    ..writeln('/// Generated file. Do not edit manually.')
    ..write('library;')
    ..writeln()
    ..writeln("/// Raw data for Kenya's counties.")
    ..writeln('const List<Map<String, dynamic>> rawCounties =')
    ..writeln('    ${_toDartLiteral(counties)};')
    ..writeln()
    ..writeln('/// Raw data for sub-counties.')
    ..writeln('const List<Map<String, dynamic>> rawSubCounties =')
    ..writeln('    ${_toDartLiteral(subCounties)};')
    ..writeln()
    ..writeln('/// Raw data for constituencies.')
    ..writeln('const List<Map<String, dynamic>> rawConstituencies =')
    ..writeln('    ${_toDartLiteral(constituencies)};')
    ..writeln()
    ..writeln('/// Raw data for wards.')
    ..writeln('const List<Map<String, dynamic>> rawWards =')
    ..writeln('    ${_toDartLiteral(wards)};')
    ..writeln()
    ..writeln('/// Raw data for localities.')
    ..writeln('const List<Map<String, dynamic>> rawLocalities =')
    ..writeln('    ${_toDartLiteral(localities)};')
    ..writeln()
    ..writeln('/// Raw data for areas.')
    ..writeln('const List<Map<String, dynamic>> rawAreas =')
    ..writeln('    ${_toDartLiteral(areas)};');

  await outFile.parent.create(recursive: true);
  await outFile.writeAsString(buffer.toString());

  final format = await Process.run('dart', ['format', outFile.path]);
  if (format.exitCode != 0) {
    stderr.writeln(format.stderr);
    exitCode = format.exitCode;
    return;
  }

  stdout.writeln('Wrote ${outFile.path}');
}

/// Reads and decodes the JSON list at [path].
Future<List<dynamic>> _readJson(String path) async {
  final raw = await File(path).readAsString();
  return jsonDecode(raw) as List;
}

/// Converts a decoded JSON value into a Dart literal using single-quoted
/// strings, since `jsonEncode` only produces double-quoted JSON.
String _toDartLiteral(dynamic value) {
  if (value is Map) {
    final entries = value.entries.map(
      (entry) => "${_quote('${entry.key}')}: ${_toDartLiteral(entry.value)}",
    );
    return '{${entries.join(', ')}}';
  }
  if (value is List) {
    final items = value.map(_toDartLiteral);
    return '[${items.join(', ')}]';
  }
  if (value is String) return _quote(value);
  return '$value';
}

/// Wraps [value] in the quote style that avoids escaping: single quotes
/// normally, or double quotes when [value] itself contains a single quote
/// (falling back to escaping only if it contains both quote characters).
String _quote(String value) {
  final hasSingle = value.contains("'");
  final hasDouble = value.contains('"');

  if (!hasSingle) return "'$value'";
  if (!hasDouble) return '"$value"';

  final buffer = StringBuffer("'");
  for (final rune in value.runes) {
    final char = String.fromCharCode(rune);
    if (char == r'\' || char == "'") buffer.write(r'\');
    buffer.write(char);
  }
  buffer.write("'");
  return buffer.toString();
}
