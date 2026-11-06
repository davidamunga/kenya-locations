/**
 * Sending a suggested area to the submissions sheet.
 *
 * The endpoint is a Google Apps Script web app (scripts/submissions/apps-script)
 * that appends a row to a public sheet; a weekly workflow later turns new rows
 * into a pull request. Its URL comes from VITE_SUBMISSIONS_URL. Without it the
 * form falls back to opening a prefilled GitHub issue.
 *
 * The rules below mirror scripts/submissions/lib.js, which has the last word.
 */

export const MAX_NAME_LENGTH = 60;
export const MIN_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 40;

const PLACE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’.,\-/&()]*$/u;
const HAS_LETTER = /\p{L}/u;

export interface AreaSubmission {
  /** Three digits, "001"–"047". */
  countyCode: string;
  locality: string;
  area: string;
  /** Shown in the changelog; optional. */
  displayName?: string;
  /** Agreed that the suggestion is published under the data license. */
  consent: boolean;
  /** Honeypot: people never fill this in. */
  website?: string;
}

export type SubmissionResult = { ok: true } | { ok: false; reason: "unavailable" | "rejected" | "network" };

/** The endpoint URL, or undefined when this build has none. Read at call time so tests can stub it. */
export function getSubmissionsUrl(): string | undefined {
  const url = import.meta.env.VITE_SUBMISSIONS_URL;
  return typeof url === "string" && url.startsWith("https://") ? url : undefined;
}

export function tidy(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** A message for the first problem with a place name, or undefined. */
export function nameProblem(label: string, raw: string): string | undefined {
  const value = tidy(raw);
  if (value.length < MIN_NAME_LENGTH) return `${label} is too short.`;
  if (value.length > MAX_NAME_LENGTH) return `${label} must be ${MAX_NAME_LENGTH} characters or fewer.`;
  if (/https?:|www\./i.test(value)) return `${label} can't be a link.`;
  if (!PLACE_NAME.test(value) || !HAS_LETTER.test(value)) {
    return `${label} can only have letters, numbers, spaces and ' . , - / & ( ).`;
  }
  return undefined;
}

/** A message for the first problem with the form, or undefined when it can be sent. */
export function submissionProblem(input: AreaSubmission): string | undefined {
  if (!/^\d{3}$/.test(input.countyCode)) return "Choose a county.";
  return nameProblem("Locality", input.locality) ?? nameProblem("Area", input.area);
}

/** The JSON body the Apps Script reads. Names are trimmed; the script and the importer check them again. */
export function buildSubmissionBody(input: AreaSubmission): string {
  return JSON.stringify({
    county_code: input.countyCode,
    locality: tidy(input.locality),
    area: tidy(input.area),
    display_name: tidy(input.displayName ?? ""),
    consent: input.consent,
    website: input.website ?? "",
  });
}

/**
 * POST to the endpoint. text/plain keeps it a "simple" request, so the browser
 * sends no preflight (Apps Script web apps do not answer one).
 */
export async function sendAreaSubmission(
  input: AreaSubmission,
  { url = getSubmissionsUrl(), fetchImpl = fetch }: { url?: string; fetchImpl?: typeof fetch } = {},
): Promise<SubmissionResult> {
  if (!url) return { ok: false, reason: "unavailable" };
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: buildSubmissionBody(input),
    });
    if (!response.ok) return { ok: false, reason: "network" };
    const result = (await response.json()) as { ok?: boolean };
    return result.ok === true ? { ok: true } : { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
