import { createFileRoute } from "@tanstack/react-router";
import { DATA_VERSION } from "kenya-locations";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import type * as React from "react";
import { AppLink } from "@/components/app-link";
import { CountyIndex } from "@/components/county-index";
import { InstallTabs } from "@/components/docs";
import { DATASET, Explorer } from "@/components/explorer";
import { openSearch } from "@/components/search-command";
import { Kbd } from "@/components/ui/kbd";
import { constituencyHref, countyHref, localityHref, wardHref } from "@/lib/places";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const EXAMPLES = [
  { label: "Nairobi", href: countyHref("047") },
  { label: "Westlands", href: constituencyHref("274") },
  { label: "Cherang'any/Chebororwa", href: wardHref("0737") },
  { label: "Bura, Garissa", href: localityHref("007", "Bura") },
];

const STATS = [
  { label: "Counties", value: DATASET.counties, href: "#counties" },
  { label: "Constituencies", value: DATASET.constituencies, href: "/data" },
  { label: "Wards", value: DATASET.wards, href: "/data" },
  { label: "Sub-counties", value: DATASET.subCounties, href: "/data" },
  { label: "Localities", value: DATASET.localities, href: "/data" },
  { label: "Areas", value: DATASET.areas, href: "/data" },
];

const totalPlaces =
  DATASET.counties +
  DATASET.constituencies +
  DATASET.wards +
  DATASET.subCounties +
  DATASET.localities +
  DATASET.areas;

function StatLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    "flex flex-col gap-0.5 px-4 py-3 outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/40";
  // Same-page anchors stay plain links; other pages navigate in-app.
  return href.startsWith("#") ? (
    <a className={className} href={href}>
      {children}
    </a>
  ) : (
    <AppLink className={className} href={href}>
      {children}
    </AppLink>
  );
}

function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <section className="flex max-w-3xl flex-col gap-5" id="top">
        <p className="text-muted-foreground text-sm">
          Open data · IEBC + KNBS · v{DATA_VERSION}
        </p>
        <h1 className="font-heading font-semibold text-4xl tracking-tight text-balance sm:text-5xl">
          Every county, constituency and ward in Kenya
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Look up any place, see its codes and where it sits, and use the same data in
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

      <section aria-label="What's in the data">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-xs/5 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map((stat) => (
            <li className="bg-background" key={stat.label}>
              <StatLink href={stat.href}>
                <span className="font-heading font-semibold text-2xl tabular-nums tracking-tight">
                  {stat.value.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-xs">{stat.label}</span>
              </StatLink>
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
