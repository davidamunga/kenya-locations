import { createFileRoute } from "@tanstack/react-router";
import { DATA_VERSION, getCounties, getLocalitiesInCounty } from "kenya-locations";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { AppLink } from "@/components/app-link";
import { CountyIndex } from "@/components/county-index";
import { InstallTabs } from "@/components/docs";
import { DATASET, Explorer } from "@/components/explorer";
import { openSearch } from "@/components/search-command";
import { Kbd } from "@/components/ui/kbd";
import { constituencyHref, countyHref, localityHref, subCountyHref, wardHref } from "@/lib/places";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const EXAMPLES = [
  { label: "Nairobi", href: countyHref("047") },
  { label: "Westlands", href: constituencyHref("274") },
  { label: "Karen", href: localityHref("047", "Karen") },
  { label: "Cherang'any/Chebororwa", href: wardHref("0737") },
];

/**
 * Kenya is described three ways in the data. Electoral and administrative
 * units come from IEBC and KNBS; localities and areas are the estates,
 * neighbourhoods and towns people use in everyday addresses.
 */
const HIERARCHIES = [
  {
    title: "Electoral",
    source: "IEBC",
    description: "The units you vote in: constituencies elect MPs, wards elect MCAs.",
    path: ["County", "Constituency", "Ward"],
    counts: [
      { label: "counties", value: DATASET.counties },
      { label: "constituencies", value: DATASET.constituencies },
      { label: "wards", value: DATASET.wards },
    ],
    example: { label: "Westlands → its 5 wards", href: constituencyHref("274") },
  },
  {
    title: "Administrative",
    source: "KNBS",
    description: "How national government services and statistics are organised.",
    path: ["County", "Sub-county"],
    counts: [
      { label: "counties", value: DATASET.counties },
      { label: "sub-counties", value: DATASET.subCounties },
    ],
    example: { label: "Changamwe, Mombasa", href: subCountyHref("001") },
  },
  {
    title: "Everyday places",
    source: "Open to contributions",
    description: "Estates, neighbourhoods and towns: the names people put in an address.",
    path: ["County", "Locality", "Area"],
    counts: [
      { label: "localities", value: DATASET.localities },
      { label: "areas", value: DATASET.areas },
    ],
    example: { label: "Karen → Hardy, Karen C", href: localityHref("047", "Karen") },
  },
];

/** Counties with no localities yet, so the copy below stays true. */
const countiesWithoutLocalities = getCounties()
  .filter((county) => getLocalitiesInCounty(county.code).length === 0)
  .map((county) => county.name);

function listNames(names: string[]): string {
  return names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const totalPlaces =
  DATASET.counties +
  DATASET.constituencies +
  DATASET.wards +
  DATASET.subCounties +
  DATASET.localities +
  DATASET.areas;

function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <section className="flex max-w-3xl flex-col gap-5" id="top">
        <p className="text-muted-foreground text-sm">
          Open data · IEBC + KNBS · v{DATA_VERSION}
        </p>
        <h1 className="font-heading font-semibold text-4xl tracking-tight text-balance sm:text-5xl">
          Every county, ward and neighbourhood in Kenya
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Electoral and administrative divisions, plus the estates and neighbourhoods people use in
          addresses. Look up any place, see its codes and where it sits, and use the same data in
          JavaScript, React, Kotlin, Swift, Dart, PHP or WordPress.
        </p>

        <button
          className="group flex h-12 w-full max-w-xl items-center gap-3 rounded-xl border bg-background px-4 text-left text-muted-foreground shadow-xs/5 outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={openSearch}
          type="button"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="flex-1 truncate">
            Search {totalPlaces.toLocaleString()} places, or a code like 0737
          </span>
          <Kbd>/</Kbd>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Try</span>
          {EXAMPLES.map((example) => (
            <AppLink
              className="rounded-full border bg-background px-3 py-1 shadow-xs/5 transition-colors hover:bg-accent"
              href={example.href}
              key={example.href}
            >
              {example.label}
            </AppLink>
          ))}
        </div>
      </section>

      <section aria-labelledby="hierarchies-heading" className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading font-semibold text-2xl tracking-tight" id="hierarchies-heading">
            Three ways to describe a place
          </h2>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            They overlap but don't line up: a locality isn't a ward, and a sub-county isn't always a
            constituency.{" "}
            {countiesWithoutLocalities.length === 0
              ? "Every county has all three."
              : `Localities are still missing for ${listNames(countiesWithoutLocalities)}.`}
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HIERARCHIES.map((hierarchy) => (
            <li
              className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-xs/5"
              key={hierarchy.title}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{hierarchy.title}</h3>
                <span className="text-muted-foreground text-xs">{hierarchy.source}</span>
              </div>
              <p className="flex flex-wrap items-center gap-1.5 text-sm">
                {hierarchy.path.map((step, index) => (
                  <span className="contents" key={step}>
                    {index > 0 && <ArrowRightIcon className="size-3.5 text-muted-foreground" />}
                    <span className="rounded-md bg-muted px-1.5 py-0.5">{step}</span>
                  </span>
                ))}
              </p>
              <p className="text-muted-foreground text-sm">{hierarchy.description}</p>
              <dl className="flex flex-wrap gap-x-4 gap-y-1">
                {hierarchy.counts.map((count) => (
                  <div className="flex items-baseline gap-1" key={count.label}>
                    <dt className="sr-only">{count.label}</dt>
                    <dd className="font-heading font-semibold text-lg tabular-nums">
                      {count.value.toLocaleString()}
                    </dd>
                    <span aria-hidden className="text-muted-foreground text-xs">
                      {count.label}
                    </span>
                  </div>
                ))}
              </dl>
              <AppLink
                className="mt-auto inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                href={hierarchy.example.href}
              >
                {hierarchy.example.label}
                <ArrowRightIcon className="size-3.5" />
              </AppLink>
            </li>
          ))}
        </ul>
      </section>

      <CountyIndex />

      <Explorer />

      <section aria-labelledby="install-heading" className="flex flex-col gap-4 scroll-mt-24" id="install">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading font-semibold text-2xl tracking-tight" id="install-heading">
              Install
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              One dataset, seven libraries. Same lookups everywhere.
            </p>
          </div>
          <AppLink
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
            href="/docs"
          >
            Read the docs
            <ArrowRightIcon className="size-3.5" />
          </AppLink>
        </div>
        <InstallTabs />
      </section>
    </div>
  );
}
