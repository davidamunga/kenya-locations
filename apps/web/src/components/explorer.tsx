import {
  getAreas,
  getAreasInLocality,
  getConstituencies,
  getConstituenciesInCounty,
  getCounties,
  getLocalities,
  getLocalitiesInCounty,
  getSubCounties,
  getSubCountiesInCounty,
  getWards,
  getWardsInConstituency,
  getWardsInSubCounty,
  search,
} from "kenya-locations";
import type { County, SearchResult, SearchType } from "kenya-locations";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AreaSubmissionForm } from "@/components/AreaSubmissionForm";
import { LocationCombobox } from "@/components/location-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SEARCH_TYPES: SearchType[] = [
  "county",
  "constituency",
  "ward",
  "sub-county",
  "locality",
  "area",
];

function countyLabel(county: County): string {
  return county.name === county.capital
    ? county.name
    : `${county.name} · ${county.capital}`;
}

function resultMeta(result: SearchResult): string {
  switch (result.type) {
    case "county": {
      const parts = [
        result.item.capital !== result.item.name ? result.item.capital : null,
        result.item.region,
        `${result.item.population_2019.toLocaleString()} (2019)`,
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "constituency":
    case "sub-county":
    case "locality":
      return result.item.county;
    case "ward":
      return result.item.constituency;
    case "area":
      return `${result.item.locality}, ${result.item.county}`;
    default: {
      const _never: never = result;
      return String(_never);
    }
  }
}

export function Explorer() {
  const counties = useMemo(() => getCounties(), []);
  const countyOptions = useMemo(
    () =>
      counties.map((county) => ({
        value: county.name,
        label: countyLabel(county),
      })),
    [counties],
  );

  const [countyAdmin, setCountyAdmin] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");

  const [countyLocality, setCountyLocality] = useState("");
  const [locality, setLocality] = useState("");
  const [area, setArea] = useState("");

  const [countySub, setCountySub] = useState("");
  const [subCounty, setSubCounty] = useState("");

  const [query, setQuery] = useState("");
  const [searchTypes, setSearchTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const constituencies = countyAdmin
    ? getConstituenciesInCounty(countyAdmin)
    : [];
  const wards = constituency ? getWardsInConstituency(constituency) : [];
  const localities = countyLocality ? getLocalitiesInCounty(countyLocality) : [];
  const areas = locality
    ? getAreasInLocality(locality, countyLocality || undefined)
    : [];
  const subCounties = countySub ? getSubCountiesInCounty(countySub) : [];
  const subCountyWards = subCounty ? getWardsInSubCounty(subCounty) : [];

  const selectedCounty = counties.find((item) => item.name === countyAdmin);
  const selectedLocalityCounty = counties.find(
    (item) => item.name === countyLocality,
  );

  const results =
    query.length > 1
      ? search(query, {
          limit: 16,
          ...(searchTypes.length > 0 && {
            types: searchTypes as SearchType[],
          }),
        })
      : [];

  return (
    <section className="scroll-mt-24" id="explore">
      <Frame>
        <FrameHeader>
          <FrameTitle>Explore</FrameTitle>
          <FrameDescription>
            Pick a county. These are the same getters the libraries expose.
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="relative z-10 p-0">
          <Tabs className="gap-0" defaultValue="electoral">
            <div className="border-b px-3 py-2 sm:px-5">
              <TabsList className="flex w-full flex-wrap" variant="underline">
                <TabsTab value="electoral">Electoral</TabsTab>
                <TabsTab value="locality">Localities</TabsTab>
                <TabsTab value="subcounty">Sub-counties</TabsTab>
                <TabsTab value="search">Search</TabsTab>
              </TabsList>
            </div>

            <TabsPanel className="space-y-5 p-5" value="electoral">
              <p className="max-w-prose text-sm text-muted-foreground">
                County → constituency → ward.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LocationCombobox
                  items={countyOptions}
                  label="County"
                  onValueChange={(value) => {
                    setCountyAdmin(value);
                    setConstituency("");
                    setWard("");
                  }}
                  placeholder="Select a county"
                  value={countyAdmin}
                />
                <LocationCombobox
                  disabled={!countyAdmin}
                  items={constituencies.map((item) => ({
                    value: item.code,
                    label: item.name,
                  }))}
                  label="Constituency"
                  onValueChange={(value) => {
                    setConstituency(value);
                    setWard("");
                  }}
                  placeholder="Select a constituency"
                  value={constituency}
                />
                <LocationCombobox
                  disabled={!constituency}
                  items={wards.map((item) => ({
                    value: item.code,
                    label: item.name,
                  }))}
                  label="Ward"
                  onValueChange={setWard}
                  placeholder="Select a ward"
                  value={ward}
                />
              </div>
              {selectedCounty && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <Meta label="Code" value={selectedCounty.code} />
                  {selectedCounty.capital !== selectedCounty.name && (
                    <Meta label="Capital" value={selectedCounty.capital} />
                  )}
                  <Meta label="Region" value={selectedCounty.region} />
                  <Meta
                    label="Area"
                    value={`${selectedCounty.area_km2.toLocaleString()} km²`}
                  />
                  <Meta
                    label="Population (2019)"
                    value={selectedCounty.population_2019.toLocaleString()}
                  />
                  <Meta label="Postal code" value={selectedCounty.postal_code} />
                </dl>
              )}
              {countyAdmin && (
                <Path
                  parts={[
                    countyAdmin,
                    constituencies.find((item) => item.code === constituency)
                      ?.name,
                    wards.find((item) => item.code === ward)?.name,
                  ]}
                />
              )}
            </TabsPanel>

            <TabsPanel className="space-y-5 p-5" value="locality">
              <p className="max-w-prose text-sm text-muted-foreground">
                County → locality → area. Estates and neighbourhoods, not
                electoral wards.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LocationCombobox
                  items={countyOptions}
                  label="County"
                  onValueChange={(value) => {
                    setCountyLocality(value);
                    setLocality("");
                    setArea("");
                  }}
                  placeholder="Select a county"
                  value={countyLocality}
                />
                <LocationCombobox
                  disabled={!countyLocality}
                  items={localities.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  label="Locality"
                  onValueChange={(value) => {
                    setLocality(value);
                    setArea("");
                  }}
                  placeholder="Select a locality"
                  value={locality}
                />
                <LocationCombobox
                  disabled={!locality}
                  items={areas.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  label="Area"
                  onValueChange={setArea}
                  placeholder="Select an area"
                  value={area}
                />
              </div>
              {selectedLocalityCounty && (
                <p className="text-sm text-muted-foreground">
                  {getLocalitiesInCounty(selectedLocalityCounty.name).length}{" "}
                  localities in {selectedLocalityCounty.name}.
                </p>
              )}
              {countyLocality && (
                <Path parts={[countyLocality, locality, area]} />
              )}
              <AreaSubmissionForm />
            </TabsPanel>

            <TabsPanel className="space-y-5 p-5" value="subcounty">
              <p className="max-w-prose text-sm text-muted-foreground">
                County → sub-county → wards. Administrative, not the same as
                constituencies.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LocationCombobox
                  items={countyOptions}
                  label="County"
                  onValueChange={(value) => {
                    setCountySub(value);
                    setSubCounty("");
                  }}
                  placeholder="Select a county"
                  value={countySub}
                />
                <LocationCombobox
                  disabled={!countySub}
                  items={subCounties.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  label="Sub-county"
                  onValueChange={setSubCounty}
                  placeholder="Select a sub-county"
                  value={subCounty}
                />
                <div className="flex min-h-0 flex-col gap-2">
                  <span className="font-medium text-sm">
                    Wards ({subCountyWards.length})
                  </span>
                  <div className="h-40 rounded-lg border">
                    <ScrollArea className="h-40 p-2" overscrollContain>
                      {subCountyWards.length === 0 ? (
                        <p className="px-1 py-2 text-sm text-muted-foreground">
                          Select a sub-county to list its wards.
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {subCountyWards.map((item) => (
                            <li key={item.code}>{item.name}</li>
                          ))}
                        </ul>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </TabsPanel>

            <TabsPanel className="space-y-5 p-5" value="search">
              <p className="max-w-prose text-sm text-muted-foreground">
                Typos are fine. Results are ranked by closeness.
              </p>
              <InputGroup>
                <InputGroupInput
                  autoCorrect="off"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try Nairob, Westlnds, or Karen"
                  spellCheck={false}
                  type="search"
                  value={query}
                />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
              <Button
                aria-expanded={showFilters}
                onClick={() => setShowFilters((open) => !open)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Filter types
                <ChevronDownIcon
                  className={showFilters ? "rotate-180" : undefined}
                />
              </Button>
              {showFilters && (
                <ToggleGroup
                  className="flex w-full flex-wrap"
                  multiple
                  onValueChange={(values) => setSearchTypes(values as string[])}
                  size="sm"
                  value={searchTypes}
                >
                  {SEARCH_TYPES.map((type) => (
                    <ToggleGroupItem key={type} value={type}>
                      {type}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              {query.length > 1 && results.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No matches. Try a shorter spelling, or clear type filters.
                </p>
              )}
              {results.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {results.map((result) => (
                    <li
                      className="flex items-start justify-between gap-3 px-3 py-2.5"
                      key={`${result.type}-${result.item.name}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {result.item.name}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {resultMeta(result)}
                        </p>
                      </div>
                      <Badge variant="outline">{result.type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </TabsPanel>
          </Tabs>
        </FramePanel>
      </Frame>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Path({ parts }: { parts: Array<string | undefined> }) {
  const visible = parts.filter(Boolean) as string[];
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((part, index) => (
        <span className="contents" key={part}>
          {index > 0 && (
            <span className="text-muted-foreground text-xs">/</span>
          )}
          <Badge variant="outline">{part}</Badge>
        </span>
      ))}
    </div>
  );
}

export const DATASET = {
  counties: getCounties().length,
  subCounties: getSubCounties().length,
  constituencies: getConstituencies().length,
  wards: getWards().length,
  localities: getLocalities().length,
  areas: getAreas().length,
};
