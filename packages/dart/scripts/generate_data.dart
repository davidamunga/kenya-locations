import 'dart:convert';
import 'dart:io';

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
    ..writeln(
      'const List<Map<String, dynamic>> rawCounties = ${jsonEncode(counties)};',
    )
    ..writeln(
      'const List<Map<String, dynamic>> rawSubCounties = '
      '${jsonEncode(subCounties)};',
    )
    ..writeln(
      'const List<Map<String, dynamic>> rawConstituencies = '
      '${jsonEncode(constituencies)};',
    )
    ..writeln(
      'const List<Map<String, dynamic>> rawWards = ${jsonEncode(wards)};',
    )
    ..writeln(
      'const List<Map<String, dynamic>> rawLocalities = '
      '${jsonEncode(localities)};',
    )
    ..writeln(
      'const List<Map<String, dynamic>> rawAreas = ${jsonEncode(areas)};',
    );

  await outFile.parent.create(recursive: true);
  await outFile.writeAsString(buffer.toString());

  stdout.writeln('Wrote ${outFile.path}');
}
