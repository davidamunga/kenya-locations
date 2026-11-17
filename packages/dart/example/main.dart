// The example is a console script, so print is the intended way to show output.
// ignore_for_file: avoid_print

import 'package:kenya_locations/kenya_locations.dart';

void main() {
  final counties = KenyaLocations.getCounties();
  print('Counties: ${counties.length}');

  final nairobi = KenyaLocations.getCountyByName('Nairobi');
  print('${nairobi?.name} - ${nairobi?.capital}');

  final constituencies = KenyaLocations.getConstituenciesInCounty('Nairobi');
  print('Constituencies: ${constituencies.length}');

  final wards = KenyaLocations.getWardsInConstituency('Westlands');
  print('Wards in Westlands: ${wards.map((w) => w.name).join(', ')}');

  final constituency = KenyaLocations.getConstituencyOfWard('Mountain View');
  print('Mountain View is in ${constituency?.name}');

  final results = KenyaLocations.search('Nairob', limit: 3);
  for (final result in results) {
    print('${result.type.name}: ${result.name}');
  }
}
