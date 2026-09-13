import { DATA_VERSION } from "kenya-locations";
import { AreaSubmissionForm } from "@/components/AreaSubmissionForm";
import { CodeBlock } from "@/components/ui/code-block";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

const REACT_HOOKS: Array<{ hook: string; returns: string; note: string }> = [
  { hook: "useCounties()", returns: "County[]", note: "All counties" },
  { hook: "useConstituenciesInCounty(name)", returns: "ConstituencyWrapper[]", note: "Drill down" },
  { hook: "useWardsInConstituency(name)", returns: "Ward[]", note: "Wards in a constituency" },
  { hook: "useSearch(query, options?)", returns: "{ results, isPending }", note: "Debounced search" },
];

export function Docs() {
  return (
    <div className="flex flex-col gap-16">
      <section className="scroll-mt-24" id="install">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Install
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          JavaScript, React, Kotlin, Swift, PHP, and WordPress read the same
          JSON in <code>data/</code>. Version {DATA_VERSION} on the lockstep
          platforms.
        </p>
        <Tabs className="mt-6" defaultValue="js">
          <TabsList className="flex flex-wrap">
            <TabsTab value="js">JavaScript</TabsTab>
            <TabsTab value="react">React</TabsTab>
            <TabsTab value="kotlin">Kotlin</TabsTab>
            <TabsTab value="swift">Swift</TabsTab>
            <TabsTab value="php">PHP</TabsTab>
            <TabsTab value="wordpress">WordPress</TabsTab>
          </TabsList>
          <TabsPanel className="mt-3 space-y-3" value="js">
            <CodeBlock filename="terminal">npm install kenya-locations</CodeBlock>
            <p className="text-muted-foreground text-xs">
              Also: <code>pnpm add kenya-locations</code> ·{" "}
              <code>yarn add kenya-locations</code>
            </p>
          </TabsPanel>
          <TabsPanel className="mt-3" value="react">
            <CodeBlock filename="terminal">
              npm install kenya-locations-react
            </CodeBlock>
          </TabsPanel>
          <TabsPanel className="mt-3" value="kotlin">
            <CodeBlock filename="build.gradle.kts" language="kotlin">
              {`dependencies {
    implementation("io.github.davidamunga:kenya-locations:${DATA_VERSION}")
}`}
            </CodeBlock>
          </TabsPanel>
          <TabsPanel className="mt-3" value="swift">
            <CodeBlock filename="Package.swift" language="swift">
              {`.package(url: "https://github.com/DavidAmunga/kenya-locations", from: "${DATA_VERSION}")`}
            </CodeBlock>
          </TabsPanel>
          <TabsPanel className="mt-3 space-y-3" value="php">
            <CodeBlock filename="terminal">
              composer require davidamunga/kenya-locations
            </CodeBlock>
            <p className="text-muted-foreground text-xs">
              PHP 8.2+. Versions independently of the JS / Kotlin / Swift trio.
              Packagist:{" "}
              <a
                className="underline underline-offset-4"
                href="https://packagist.org/packages/davidamunga/kenya-locations"
                rel="noreferrer"
                target="_blank"
              >
                davidamunga/kenya-locations
              </a>
            </p>
          </TabsPanel>
          <TabsPanel className="mt-3 space-y-3" value="wordpress">
            <CodeBlock filename="terminal">
              {`# Download kenya-locations-wordpress-*.zip from the GitHub release
# WordPress → Plugins → Add New → Upload Plugin`}
            </CodeBlock>
            <p className="text-muted-foreground text-xs">
              PHP 8.2+. Zip already includes{" "}
              <code>davidamunga/kenya-locations</code>. Releases:{" "}
              <a
                className="underline underline-offset-4"
                href="https://github.com/DavidAmunga/kenya-locations/releases"
                rel="noreferrer"
                target="_blank"
              >
                github.com/DavidAmunga/kenya-locations/releases
              </a>
            </p>
          </TabsPanel>
        </Tabs>
      </section>

      <section className="scroll-mt-24" id="examples">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Example apps
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          Full projects in the repo. Same county picker and search as the
          explorer above.
        </p>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Uses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Android</TableCell>
                <TableCell>
                  <RepoLink path="examples/android" />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  Kotlin library via Gradle
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Flutter</TableCell>
                <TableCell>
                  <RepoLink path="examples/flutter" />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  Shared JSON in <code>data/</code> — Dart cannot load the JAR
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>WordPress</TableCell>
                <TableCell>
                  <RepoLink path="examples/wordpress" />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  PHP library — zip on each <code>v*</code> GitHub release
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>JavaScript</TableCell>
                <TableCell>
                  <RepoLink path="packages/js/examples/basic-usage.html" />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  HTML page
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Two hierarchies, one county
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border bg-muted/40 p-4 font-mono text-sm leading-6">
          {`County
├── capital, area_km2, population_2019, region, postal_code
├── Locality → Area          informal addressing
└── Constituency → Ward      electoral
    └── Sub-County           administrative`}
        </pre>
      </section>

      <section className="scroll-mt-24" id="javascript">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          JavaScript
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          A county picker, then search. Import from the root or from subpaths
          such as <code>kenya-locations/counties</code>.
        </p>
        <div className="mt-6 space-y-8">
          <Example
            title="County picker"
            body="Start at a county, then constituency, then wards."
            code={`import { county, getCounties } from "kenya-locations";

const counties = getCounties();
const nairobi = county("Nairobi");
const westlands = nairobi?.constituency("Westlands");
const wards = westlands?.wards() ?? [];

nairobi?.data.capital;
nairobi?.data.population_2019;`}
          />
          <Example
            title="Search"
            body="Typo-tolerant. TypeScript narrows item from type."
            code={`import { search } from "kenya-locations";
import type { SearchResult } from "kenya-locations";

const results: SearchResult[] = search("karen", {
  limit: 10,
  types: ["locality", "area"],
});

for (const result of results) {
  if (result.type === "county") result.item.capital;
  if (result.type === "ward") result.item.constituency;
}`}
          />
          <Example
            title="Missing places"
            body="LocationNotFoundError is thrown when a named child does not exist."
            code={`import { county, LocationNotFoundError } from "kenya-locations";

try {
  county("Nairobi")?.locality("DoesNotExist");
} catch (error) {
  if (error instanceof LocationNotFoundError) {
    error.message;
  }
}`}
          />
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="react">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          React
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          Hooks for the same lookups. Peer deps: React 18+ and kenya-locations.
        </p>
        <div className="mt-6">
          <CodeBlock filename="LocationPicker.tsx" language="tsx">
            {`import { useState } from "react";
import {
  useCounties,
  useConstituenciesInCounty,
  useSearch,
} from "kenya-locations-react";

function LocationPicker() {
  const [countyName, setCountyName] = useState("Nairobi");
  const [query, setQuery] = useState("");
  const counties = useCounties();
  const constituencies = useConstituenciesInCounty(countyName);
  const { results, isPending } = useSearch(query, {
    types: ["constituency", "ward"],
    debounceMs: 300,
  });

  return (
    <div>
      <select
        onChange={(event) => setCountyName(event.target.value)}
        value={countyName}
      >
        {counties.map((county) => (
          <option key={county.code} value={county.name}>
            {county.name}
          </option>
        ))}
      </select>
      <ul>
        {constituencies.map((item) => (
          <li key={item.code}>{item.name}</li>
        ))}
      </ul>
      <input onChange={(event) => setQuery(event.target.value)} value={query} />
      {isPending ? "Searching…" : results.map((result) => result.item.name)}
    </div>
  );
}`}
          </CodeBlock>
        </div>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hook</TableHead>
                <TableHead>Returns</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REACT_HOOKS.map((row) => (
                <TableRow key={row.hook}>
                  <TableCell className="font-mono text-xs">{row.hook}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.returns}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {row.note}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="kotlin">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Kotlin
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          Android, Spring Boot, Ktor, CLI. No init — data loads from the JAR on
          first access. A Compose app is in{" "}
          <RepoLink path="examples/android" />.
        </p>
        <div className="mt-6 space-y-8">
          <Example
            filename="CountyPicker.kt"
            language="kotlin"
            title="County picker"
            body="Same drill-down as JavaScript: county, then constituency, then wards."
            code={`val counties = KenyaLocations.getCounties()
val nairobi = KenyaLocations.getCountyByName("Nairobi")
val constituencies = KenyaLocations.getConstituenciesInCounty("Nairobi")
val wards = KenyaLocations.getWardsInConstituency("Westlands")

nairobi?.capital
nairobi?.population_2019`}
          />
          <Example
            filename="Search.kt"
            language="kotlin"
            title="Search"
            body="Typo-tolerant, ranked by closeness."
            code={`KenyaLocations.search("Nairob")
KenyaLocations.searchByType("west", SearchType.WARD)

// Java
List<County> all = KenyaLocations.INSTANCE.getCounties();`}
          />
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="swift">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Swift
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          Swift 5.9+, iOS 13+, macOS 10.15+. SearchResult is an enum with
          associated values.
        </p>
        <div className="mt-6 space-y-8">
          <Example
            filename="CountyPicker.swift"
            language="swift"
            title="County picker"
            body="Same drill-down: county, constituency, wards."
            code={`import KenyaLocations

let kl = KenyaLocations.shared
let counties = kl.getCounties()
let nairobi = kl.getCountyByName("Nairobi")
let constituencies = kl.getConstituenciesInCounty("Nairobi")
let wards = kl.getWardsInConstituency("Westlands")

print(nairobi?.capital ?? "")
print(nairobi?.population_2019 ?? 0)`}
          />
          <Example
            filename="Search.swift"
            language="swift"
            title="Search"
            body="Switch on the result type to read the matching fields."
            code={`for result in kl.search("Westlands") {
    switch result {
    case .county(let county):       print(county.capital)
    case .constituency(let item):   print(item.county)
    case .ward(let ward):           print(ward.constituency)
    case .locality(let locality):   print(locality.county)
    case .area(let area):           print(area.locality)
    case .subCounty(let subCounty): print(subCounty.county)
    }
}`}
          />
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="php">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          PHP
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          PHP 8.2+. No init — JSON loads on first access. Published on
          Packagist as{" "}
          <a
            className="underline underline-offset-4"
            href="https://packagist.org/packages/davidamunga/kenya-locations"
            rel="noreferrer"
            target="_blank"
          >
            davidamunga/kenya-locations
          </a>
          .
        </p>
        <div className="mt-6 space-y-8">
          <Example
            filename="CountyPicker.php"
            language="php"
            title="County picker"
            body="Same drill-down: county, constituency, wards. Name-or-code on scoped queries."
            code={`use KenyaLocations\\KenyaLocations;

$counties = KenyaLocations::getCounties();
$nairobi = KenyaLocations::getCountyByName('Nairobi');
$constituencies = KenyaLocations::getConstituenciesInCounty('Nairobi');
$wards = KenyaLocations::getWardsInConstituency('Westlands');

echo $nairobi?->capital;
echo $nairobi?->population2019;`}
          />
          <Example
            filename="Search.php"
            language="php"
            title="Search"
            body="Typo-tolerant. Filter by SearchType when you only want one kind."
            code={`use KenyaLocations\\KenyaLocations;
use KenyaLocations\\SearchType;

$results = KenyaLocations::search('Westlands', limit: 20);
$wardsOnly = KenyaLocations::searchByType('West', SearchType::Ward);

foreach ($results as $result) {
    echo $result->type->value . ': ' . $result->name();
}`}
          />
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="wordpress">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          WordPress
        </h2>
        <p className="mt-3 max-w-prose text-muted-foreground text-sm">
          PHP 8.2+. Install the zip from the{" "}
          <a
            className="underline underline-offset-4"
            href="https://github.com/DavidAmunga/kenya-locations/releases"
            rel="noreferrer"
            target="_blank"
          >
            GitHub release
          </a>
          . Not on WordPress.org. County → Location → Area on WooCommerce
          checkout (the Checkout block is handled automatically). Store address
          still uses locality / area under Country / State.
          Source:{" "}
          <RepoLink path="examples/wordpress" />.
        </p>
        <div className="mt-6 space-y-8">
          <Example
            filename="install.txt"
            title="Install the zip"
            body="Upload the release asset, then activate Kenya Locations. Composer is not required on the server."
            code={`1. Download kenya-locations-wordpress-*.zip from the GitHub release
2. WordPress → Plugins → Add New → Upload Plugin
3. Activate Kenya Locations
4. WooCommerce → Settings → General → set Locality and Area
5. Checkout shows County, Location, and Area when the country is Kenya`}
          />
          <Example
            filename="theme.php"
            language="php"
            title="Use the library in a theme"
            body="Bedrock and other Composer sites can require the PHP package directly. You do not need the zip for that."
            code={`use KenyaLocations\\KenyaLocations;

$nairobi = KenyaLocations::getCountyByName('Nairobi');
$localities = KenyaLocations::getLocalitiesInCounty('Nairobi');
$areas = KenyaLocations::getAreasInLocality('Karen');`}
          />
        </div>
      </section>

      <Separator />

      <section className="scroll-mt-24" id="contribute">
        <h2 className="font-heading font-semibold text-2xl tracking-tight">
          Contribute
        </h2>
        <p className="mt-3 mb-6 max-w-prose text-muted-foreground text-sm">
          Missing an estate? Submit it here to open a GitHub issue, or add it
          in <code>data/</code> and open a pull request. The pre-commit hook
          validates JSON on every commit.
        </p>
        <AreaSubmissionForm />
      </section>
    </div>
  );
}

function RepoLink({ path }: { path: string }) {
  const kind = path.endsWith(".html") || path.endsWith(".ts") ? "blob" : "tree";
  return (
    <a
      className="font-mono text-xs text-foreground underline-offset-4 hover:underline"
      href={`https://github.com/DavidAmunga/kenya-locations/${kind}/main/${path}`}
      rel="noreferrer"
      target="_blank"
    >
      {path}
    </a>
  );
}

function Example({
  title,
  body,
  code,
  filename,
  language,
}: {
  title: string;
  body: string;
  code: string;
  filename?: string;
  language?: string;
}) {
  return (
    <div>
      <h3 className="font-heading font-medium text-lg">{title}</h3>
      <p className="mt-1 mb-3 max-w-prose text-muted-foreground text-sm">{body}</p>
      <CodeBlock
        filename={filename ?? `${title.toLowerCase().replace(/\s+/g, "-")}.ts`}
        language={language}
      >
        {code}
      </CodeBlock>
    </div>
  );
}
