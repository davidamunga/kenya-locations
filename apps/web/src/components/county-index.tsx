import {
  getConstituenciesInCounty,
  getCounties,
  getLocalitiesInCounty,
  getWardsInCounty,
} from "kenya-locations";
import type { County } from "kenya-locations";
import { useMemo } from "react";
import { AppLink } from "@/components/app-link";
import { countyHref } from "@/lib/places";

/** Former provinces, in the order people usually list them. */
const REGIONS: County["region"][] = [
  "Nairobi",
  "Central",
  "Coast",
  "Eastern",
  "North Eastern",
  "Nyanza",
  "Rift Valley",
  "Western",
];

interface CountyCard {
  county: County;
  constituencies: number;
  wards: number;
  localities: number;
}

/** All 47 counties as links, grouped by former province. */
export function CountyIndex() {
  const groups = useMemo(() => {
    const cards: CountyCard[] = getCounties().map((county) => ({
      county,
      constituencies: getConstituenciesInCounty(county.code).length,
      wards: getWardsInCounty(county.code).length,
      localities: getLocalitiesInCounty(county.code).length,
    }));
    return REGIONS.map((region) => ({
      region,
      cards: cards
        .filter((card) => card.county.region === region)
        .sort((a, b) => a.county.name.localeCompare(b.county.name)),
    })).filter((group) => group.cards.length > 0);
  }, []);

  return (
    <section aria-labelledby="counties-heading" className="scroll-mt-24" id="counties">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading font-semibold text-2xl tracking-tight" id="counties-heading">
            Counties
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            All 47, grouped by former province. Open one to see its constituencies and wards, its
            sub-counties, and its localities and areas.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.region}>
            <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {group.region}
              <span className="ml-1.5 font-normal normal-case tracking-normal">
                {group.cards.length}
              </span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.cards.map(({ county, constituencies, wards, localities }) => (
                <li key={county.code}>
                  <AppLink
                    className="flex h-full flex-col gap-0.5 rounded-xl border bg-background px-3 py-2.5 shadow-xs/5 outline-none transition-colors hover:border-foreground/20 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                    href={countyHref(county.code)}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium text-sm">{county.name}</span>
                      <span className="shrink-0 font-mono text-muted-foreground text-xs">
                        {county.code}
                      </span>
                    </span>
                    <span className="truncate text-muted-foreground text-xs">
                      {constituencies} constituencies · {wards} wards
                    </span>
                    <span className="truncate text-muted-foreground text-xs">
                      {localities > 0 ? `${localities} localities` : "No localities yet"}
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
