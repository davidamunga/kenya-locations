import {
  DATA_VERSION,
  getAreas,
  getConstituencies,
  getCounties,
  getLocalities,
  getSubCounties,
  getWards,
} from "kenya-locations";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import history from "../../../../data/history.json";
import meta from "../../../../data/meta.json";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { toCsv } from "@/lib/places";

const REPO = "DavidAmunga/kenya-locations";
const pinnedUrl = (file: string) => `https://cdn.jsdelivr.net/gh/${REPO}@v${DATA_VERSION}/data/${file}`;
const latestUrl = (file: string) => `https://raw.githubusercontent.com/${REPO}/main/data/${file}`;

interface DataFile {
  file: string;
  title: string;
  description: string;
  rows: () => object[];
}

const FILES: DataFile[] = [
  {
    file: "counties.json",
    title: "Counties",
    description: "IEBC and ISO codes, capital, region, area, 2019 population, postal code, aliases.",
    rows: getCounties,
  },
  {
    file: "constituencies.json",
    title: "Constituencies",
    description: "IEBC codes 001–290 with their county code.",
    rows: getConstituencies,
  },
  {
    file: "wards.json",
    title: "Wards",
    description: "IEBC codes 0001–1450 with constituency and county codes.",
    rows: getWards,
  },
  {
    file: "sub-counties.json",
    title: "Sub-counties",
    description: "Being rebuilt from the KNBS list; many entries are constituency names today.",
    rows: getSubCounties,
  },
  {
    file: "locality.json",
    title: "Localities",
    description: "Estates and neighbourhoods, keyed by county code and name.",
    rows: getLocalities,
  },
  {
    file: "area.json",
    title: "Areas",
    description: "Places within each locality.",
    rows: getAreas,
  },
];

interface HistoryEntry {
  date: string;
  release?: string;
  type: string;
  code?: string;
  change: string;
  name?: string;
  from?: string;
  to?: string;
  note?: string;
}

export function DataPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <header className="max-w-2xl">
        <h1 className="font-heading font-semibold text-3xl tracking-tight sm:text-4xl">
          Download the data
        </h1>
        <p className="mt-3 text-muted-foreground">
          The JSON files every library is built from. Use them directly in a spreadsheet, a
          database or another language. Each record links to its parents by code.
        </p>
      </header>

      <section aria-labelledby="files-heading" className="flex flex-col gap-4">
        <h2 className="font-heading font-semibold text-xl tracking-tight" id="files-heading">
          Files
        </h2>
        <ul className="divide-y overflow-hidden rounded-xl border bg-background shadow-xs/5">
          {FILES.map((entry) => (
            <FileRow entry={entry} key={entry.file} />
          ))}
        </ul>
        <p className="max-w-prose text-muted-foreground text-xs">
          JSON links are pinned to release v{DATA_VERSION}, so they won't change under you.
          “Latest” follows the main branch. CSV is generated in your browser from the same data.
        </p>
        <CodeBlock filename="terminal" language="sh">
          {`curl -L ${pinnedUrl("wards.json")} -o wards.json`}
        </CodeBlock>
      </section>

      <section aria-labelledby="license-heading" className="flex flex-col gap-4 scroll-mt-24" id="license">
        <h2 className="font-heading font-semibold text-xl tracking-tight" id="license-heading">
          License
        </h2>
        <div className="flex max-w-3xl flex-col gap-3 rounded-xl border bg-background p-4 shadow-xs/5">
          <p className="text-sm">
            The data is licensed{" "}
            <a className="underline underline-offset-4" href={meta.license_url} rel="noreferrer" target="_blank">
              CC BY 4.0
            </a>
            : use it for anything, including commercially, as long as you credit it. The library code
            is MIT.
          </p>
          <Attribution text={meta.attribution} />
        </div>
      </section>

      <section aria-labelledby="sources-heading" className="flex flex-col gap-4">
        <h2 className="font-heading font-semibold text-xl tracking-tight" id="sources-heading">
          Sources
        </h2>
        <p className="max-w-prose text-muted-foreground text-sm">
          Electoral boundaries follow the {meta.boundary_set} delimitation.
        </p>
        <dl className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(meta.files).map(([file, info]) => {
            const details = info as { sources: string[]; notes?: string };
            return (
              <div className="rounded-xl border bg-background p-3 shadow-xs/5" key={file}>
                <dt className="font-mono text-xs">{file}</dt>
                <dd className="mt-1 text-sm">
                  {details.sources.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {details.sources.map((source) => (
                        <li key={source}>{source}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">{details.notes}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="history-heading" className="flex flex-col gap-4">
        <h2 className="font-heading font-semibold text-xl tracking-tight" id="history-heading">
          Change history
        </h2>
        <p className="max-w-prose text-muted-foreground text-sm">
          Codes that were added, renamed, merged or removed, so you can update stored codes. Also
          in{" "}
          <a className="underline underline-offset-4" href={pinnedUrl("history.json")} rel="noreferrer" target="_blank">
            history.json
          </a>
          .
        </p>
        <div className="overflow-x-auto rounded-xl border bg-background shadow-xs/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground text-xs">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Release</th>
                <th className="px-3 py-2 font-medium">Change</th>
                <th className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(history as HistoryEntry[]).map((entry, index) => (
                <tr key={`${entry.date}-${entry.code ?? index}`}>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{entry.date}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{entry.release ?? ""}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {entry.change} {entry.type}{" "}
                    {entry.code && <span className="font-mono text-xs">{entry.code}</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{describe(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function describe(entry: HistoryEntry): string {
  if (entry.from !== undefined && entry.to !== undefined) {
    return `“${entry.from}” → “${entry.to}”${entry.note ? ` · ${entry.note}` : ""}`;
  }
  return [entry.name, entry.note].filter(Boolean).join(" · ");
}

function FileRow({ entry }: { entry: DataFile }) {
  const rows = entry.rows();

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.file.replace(/\.json$/, ".csv");
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-sm">
          {entry.title}{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            {rows.length.toLocaleString()}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">{entry.description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Button render={<a href={pinnedUrl(entry.file)} rel="noreferrer" target="_blank" />} size="sm" variant="outline">
          JSON
        </Button>
        <Button onClick={downloadCsv} size="sm" variant="outline">
          <DownloadIcon />
          CSV
        </Button>
        <Button
          render={<a href={latestUrl(entry.file)} rel="noreferrer" target="_blank" />}
          size="sm"
          variant="ghost"
        >
          Latest
        </Button>
      </div>
    </li>
  );
}

function Attribution({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2">
      <p className="min-w-0 flex-1 text-sm">{text}</p>
      <Button
        aria-label={copied ? "Copied" : "Copy attribution"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        size="icon-sm"
        variant="ghost"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
