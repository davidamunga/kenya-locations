import { CheckIcon, CopyIcon, DownloadIcon, SearchIcon } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { AppLink } from "@/components/app-link";
import { openSearch } from "@/components/search-command";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { Place, PlaceGroup } from "@/lib/places";
import { toCsv } from "@/lib/places";
import { snippetsFor } from "@/lib/snippets";

/** Lists longer than this get a filter box. */
const FILTER_THRESHOLD = 12;

export function PlacePage({ place }: { place: Place }) {
  const snippets = useMemo(() => snippetsFor(place.snippet), [place.snippet]);
  const json = useMemo(() => `${JSON.stringify(place.record, null, 2)}\n`, [place.record]);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <header className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            {place.crumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink render={<AppLink href={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-2">
          <Badge className="w-fit" variant="outline">
            {place.kindLabel}
          </Badge>
          <h1 className="font-heading font-semibold text-3xl tracking-tight text-balance sm:text-4xl">
            {place.title}
          </h1>
          <p className="text-muted-foreground text-sm">{place.summary}</p>
          {place.aliases.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Also known as </span>
              {place.aliases.join(", ")}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          {place.groups.map((group) => (
            <PlaceGroupSection group={group} key={group.title} />
          ))}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <section aria-labelledby="facts-heading" className="rounded-xl border p-4">
            <h2 className="font-medium text-sm" id="facts-heading">
              Details
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {place.facts.map((fact) => (
                <div className="min-w-0" key={fact.label}>
                  <dt className="text-muted-foreground text-xs">{fact.label}</dt>
                  <dd className={fact.code ? "font-mono font-medium" : "font-medium"}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="code-heading" className="flex min-w-0 flex-col gap-3">
            <h2 className="font-medium text-sm" id="code-heading">
              Use it in code
            </h2>
            <Tabs defaultValue="js">
              <TabsList className="flex w-full flex-wrap" variant="underline">
                {snippets.map((snippet) => (
                  <TabsTab key={snippet.id} value={snippet.id}>
                    {snippet.label}
                  </TabsTab>
                ))}
              </TabsList>
              {snippets.map((snippet) => (
                <TabsPanel className="pt-3" key={snippet.id} value={snippet.id}>
                  <CodeBlock filename={snippet.filename}>{snippet.code}</CodeBlock>
                </TabsPanel>
              ))}
            </Tabs>
          </section>

          <section aria-labelledby="record-heading" className="flex min-w-0 flex-col gap-3">
            <h2 className="font-medium text-sm" id="record-heading">
              Record
            </h2>
            <CodeBlock filename="record.json" language="json">
              {json}
            </CodeBlock>
          </section>
        </aside>
      </div>
    </article>
  );
}

function PlaceGroupSection({ group }: { group: PlaceGroup }) {
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle
      ? group.items.filter((item) => item.label.toLowerCase().includes(needle))
      : group.items;
  }, [filter, group.items]);
  const headingId = `group-${group.csvName}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading font-semibold text-xl tracking-tight" id={headingId}>
          {group.title}{" "}
          <span className="font-normal text-muted-foreground text-base tabular-nums">
            {group.items.length.toLocaleString()}
          </span>
        </h2>
        {group.rows.length > 0 && <CsvActions group={group} />}
      </div>

      {group.note && <p className="max-w-prose text-muted-foreground text-xs">{group.note}</p>}

      {group.items.length > FILTER_THRESHOLD && (
        <InputGroup className="max-w-xs">
          <InputGroupInput
            aria-label={`Filter ${group.title.toLowerCase()}`}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={`Filter ${group.items.length} ${group.title.toLowerCase()}`}
            type="search"
            value={filter}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      )}

      {group.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">None listed yet.</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {group.title.toLowerCase()} match “{filter}”.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <li className="bg-background" key={`${item.label}-${item.meta ?? ""}`}>
              {item.href ? (
                <AppLink
                  className="flex h-full items-baseline justify-between gap-3 px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
                  href={item.href}
                >
                  <span className="min-w-0 truncate font-medium">{item.label}</span>
                  {item.meta && (
                    <span className="shrink-0 font-mono text-muted-foreground text-xs">{item.meta}</span>
                  )}
                </AppLink>
              ) : (
                <div className="flex h-full items-baseline justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.meta && (
                    <span className="shrink-0 font-mono text-muted-foreground text-xs">{item.meta}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CsvActions({ group }: { group: PlaceGroup }) {
  const [copied, setCopied] = useState(false);
  const csv = useMemo(() => toCsv(group.rows), [group.rows]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.csvName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1">
      <Button onClick={copy} size="sm" variant="ghost">
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy CSV"}
      </Button>
      <Button onClick={download} size="sm" variant="ghost">
        <DownloadIcon />
        CSV
      </Button>
    </div>
  );
}

/** Shown when a URL names a place that doesn't exist. */
export function PlaceNotFound({ kind, id }: { kind: string; id: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 pt-16 pb-24 sm:px-6">
      <Badge variant="outline">{kind}</Badge>
      <h1 className="font-heading font-semibold text-3xl tracking-tight">Not found</h1>
      <p className="text-muted-foreground">
        There's no {kind.toLowerCase()} “{id}”. Codes are zero-padded: counties and constituencies
        have three digits (047), wards four (0737).
      </p>
      <div className="flex gap-2">
        <Button onClick={openSearch}>
          <SearchIcon />
          Search places
        </Button>
        <Button render={<AppLink href="/" />} variant="outline">
          Home
        </Button>
      </div>
    </div>
  );
}
