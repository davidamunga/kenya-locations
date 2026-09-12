import 'package:flutter/material.dart';
import 'package:kenya_locations/kenya_locations.dart';

void main() {
  runApp(const ExampleApp());
}

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'kenya-locations',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1C1917)),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('kenya-locations'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Explore'),
              Tab(text: 'Search'),
            ],
          ),
        ),
        body: const TabBarView(children: [ExplorePane(), SearchPane()]),
      ),
    );
  }
}

class ExplorePane extends StatefulWidget {
  const ExplorePane({super.key});

  @override
  State<ExplorePane> createState() => _ExplorePaneState();
}

class _ExplorePaneState extends State<ExplorePane> {
  County? county;
  Constituency? constituency;
  Ward? ward;

  @override
  Widget build(BuildContext context) {
    final counties = KenyaLocations.getCounties();
    final constituencies = county == null
        ? const <Constituency>[]
        : KenyaLocations.getConstituenciesInCounty(county!.name);
    final wards = constituency == null
        ? const <Ward>[]
        : KenyaLocations.getWardsInConstituency(constituency!.name);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'County → constituency → ward. This example uses the kenya_locations Dart package.',
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<County>(
          decoration: const InputDecoration(labelText: 'County'),
          initialValue: county,
          items: [
            for (final item in counties)
              DropdownMenuItem(value: item, child: Text(item.name)),
          ],
          onChanged: (value) {
            setState(() {
              county = value;
              constituency = null;
              ward = null;
            });
          },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<Constituency>(
          key: ValueKey(county?.code ?? 'no-county'),
          decoration: const InputDecoration(labelText: 'Constituency'),
          initialValue: constituency,
          items: [
            for (final item in constituencies)
              DropdownMenuItem(value: item, child: Text(item.name)),
          ],
          onChanged: county == null
              ? null
              : (value) {
                  setState(() {
                    constituency = value;
                    ward = null;
                  });
                },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<Ward>(
          key: ValueKey(constituency?.code ?? 'no-constituency'),
          decoration: const InputDecoration(labelText: 'Ward'),
          initialValue: ward,
          items: [
            for (final item in wards)
              DropdownMenuItem(value: item, child: Text(item.name)),
          ],
          onChanged: constituency == null
              ? null
              : (value) => setState(() => ward = value),
        ),
        if (county != null) ...[
          const SizedBox(height: 16),
          Text(
            [
              county!.name,
              if (county!.capital != county!.name) county!.capital,
              county!.region,
              '${county!.population2019} (2019)',
            ].join(' · '),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ],
    );
  }
}

class SearchPane extends StatefulWidget {
  const SearchPane({super.key});

  @override
  State<SearchPane> createState() => _SearchPaneState();
}

class _SearchPaneState extends State<SearchPane> {
  String query = '';

  String _nameOf(Object item) => switch (item) {
    County(:final name) => name,
    SubCounty(:final name) => name,
    Constituency(:final name) => name,
    Ward(:final name) => name,
    Locality(:final name) => name,
    Area(:final name) => name,
    _ => item.toString(),
  };

  @override
  Widget build(BuildContext context) {
    final results = query.length < 2
        ? const <SearchResult<dynamic>>[]
        : KenyaLocations.search(query, limit: 16);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            decoration: const InputDecoration(
              labelText: 'Search',
              hintText: 'Try Nairob, Westlnds, or Karen',
            ),
            onChanged: (value) => setState(() => query = value),
          ),
        ),
        Expanded(
          child: ListView.separated(
            itemCount: results.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final result = results[index];
              return ListTile(
                title: Text(_nameOf(result.item)),
                subtitle: Text(result.type.name),
              );
            },
          ),
        ),
      ],
    );
  }
}
