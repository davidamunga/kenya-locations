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

  final counties = jsonDecode(
    await File('${dataDir.path}/counties.json').readAsString(),
  ) as List;
  final subCounties = jsonDecode(
    await File('${dataDir.path}/sub-counties.json').readAsString(),
  ) as List;
  final constituencies = jsonDecode(
    await File('${dataDir.path}/constituencies.json').readAsString(),
  ) as List;
  final wards = jsonDecode(
    await File('${dataDir.path}/wards.json').readAsString(),
  ) as List;
  final localities = jsonDecode(
    await File('${dataDir.path}/locality.json').readAsString(),
  ) as List;
  final areas = jsonDecode(
    await File('${dataDir.path}/area.json').readAsString(),
  ) as List;

  final buffer = StringBuffer()
    ..writeln('// ignore_for_file: prefer_double_quotes')
    ..writeln()
    ..writeln('/// Generated file. Do not edit manually.')
    ..writeln()
    ..writeln("/// Raw data for Kenya's counties.")
    ..writeln(
      'const List<Map<String, dynamic>> rawCounties = '
          '${jsonEncode(counties)};',
    )
    ..writeln('/// Raw data for sub-counties.')
    ..writeln(
      'const List<Map<String, dynamic>> rawSubCounties = '
          '${jsonEncode(subCounties)};',
    )
    ..writeln('/// Raw data for constituencies.')
    ..writeln(
      'const List<Map<String, dynamic>> rawConstituencies = '
          '${jsonEncode(constituencies)};',
    )
    ..writeln('/// Raw data for wards.')
    ..writeln(
      'const List<Map<String, dynamic>> rawWards = '
          '${jsonEncode(wards)};',
    )
    ..writeln('/// Raw data for localities.')
    ..writeln(
      'const List<Map<String, dynamic>> rawLocalities = '
          '${jsonEncode(localities)};',
    )
    ..writeln('/// Raw data for areas.')
    ..writeln(
      'const List<Map<String, dynamic>> rawAreas = '
          '${jsonEncode(areas)};',
    );

  await outFile.parent.create(recursive: true);
  await outFile.writeAsString(buffer.toString());

  stdout.writeln('Wrote ${outFile.path}');
}
