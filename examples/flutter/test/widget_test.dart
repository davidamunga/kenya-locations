import 'package:flutter_test/flutter_test.dart';
import 'package:kenya_locations_example/main.dart';

void main() {
  testWidgets('loads the county explorer', (tester) async {
    await tester.pumpWidget(const ExampleApp());
    await tester.pumpAndSettle();

    expect(find.text('kenya-locations'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('Search'), findsOneWidget);
    expect(find.text('County'), findsOneWidget);
  });
}
