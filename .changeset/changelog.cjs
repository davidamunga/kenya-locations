/**
 * Changelog format for kenya-locations.
 *
 * Writes what changed for users, with a trailing PR link and credit:
 *
 *   - Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. ([#49](…/pull/49)) by [@octocat](https://github.com/octocat)
 *
 * No commit hashes. The PR number and author come from the GitHub API
 * (@changesets/get-github-info) for the commit that added the changeset. That
 * needs GITHUB_TOKEN, which the Changesets workflow provides. Without it, or
 * when the lookup fails, the PR number is read from the squash-merge subject
 * ("... (#49)") and the entry carries no credit, so a lookup problem never
 * breaks a release.
 *
 * To credit someone other than the PR author, or several people, put a line in
 * the changeset:
 *
 *   Credit: @octocat, @hubot
 *
 * It is removed from the entry and replaces the PR author. Bots are never
 * credited.
 *
 * Options (in .changeset/config.json):
 *   { "repo": "owner/name" }  — used to build PR links.
 */

const { execFileSync } = require("node:child_process");

const CREDIT_LINE = /^credit:\s*(.+)$/im;
const HANDLE = /@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)/g;

/** Logins that are not people: GitHub Apps ("x[bot]") and the Claude co-author. */
function isBot(login) {
  return /\[bot\]$/i.test(login) || /^(claude|copilot|dependabot|github-actions)$/i.test(login);
}

function prNumberFor(commit) {
  if (!commit) return undefined;
  try {
    const subject = execFileSync("git", ["log", "-1", "--format=%s", commit], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const match = subject.match(/\(#(\d+)\)\s*$/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

function prLink(number, options) {
  if (!number) return "";
  const repo = options && options.repo;
  return repo
    ? ` ([#${number}](https://github.com/${repo}/pull/${number}))`
    : ` (#${number})`;
}

/** " by [@a](…), [@b](…)", or "" when there is no one to credit. */
function creditText(logins) {
  const people = [...new Set(logins)].filter((login) => !isBot(login));
  if (people.length === 0) return "";
  return ` by ${people.map((login) => `[@${login}](https://github.com/${login})`).join(", ")}`;
}

/** Split an explicit "Credit: @a, @b" line off a summary. */
function parseCredit(summary) {
  const match = summary.match(CREDIT_LINE);
  if (!match) return { summary, logins: undefined };
  const logins = [...match[1].matchAll(HANDLE)].map((m) => m[1]);
  return { summary: summary.replace(CREDIT_LINE, "").trim(), logins };
}

/** PR number and author login for a commit, from the GitHub API. */
async function lookup(commit, options) {
  if (!commit || !options || !options.repo || !process.env.GITHUB_TOKEN) return {};
  try {
    // ESM-only, so it cannot be require()d from this CommonJS file.
    const { getCommitInfo } = await import("@changesets/get-github-info");
    const info = await getCommitInfo({ repo: options.repo, commit });
    return {
      pull: info?.pull ? String(info.pull.number) : undefined,
      user: info?.author?.login,
    };
  } catch {
    return {};
  }
}

/**
 * One entry per changeset. The PR link and credit go at the end of the
 * entry, so a multi-line summary that opens with a lead-in ("Data fixes:")
 * reads cleanly.
 */
async function getReleaseLine(changeset, _type, options) {
  const { summary, logins } = parseCredit(changeset.summary);
  const found = await lookup(changeset.commit, options);
  const pull = found.pull || prNumberFor(changeset.commit);
  const credit = creditText(logins || (found.user ? [found.user] : []));

  const lines = summary.trim().split("\n");
  lines[lines.length - 1] += `${prLink(pull, options)}${credit}`;
  const [first, ...rest] = lines;
  const body = rest.map((line) => (line.trim() ? `  ${line}` : "")).join("\n");
  return `\n- ${first.trim()}${body ? `\n${body}` : ""}`;
}

/** Internal dependency bumps, e.g. React picking up a new core release. */
async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return "";
  const names = dependenciesUpdated
    .map((dep) => `\`${dep.name}\` ${dep.newVersion}`)
    .join(", ");
  return `\n- Uses ${names}.`;
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
  creditText,
  parseCredit,
  isBot,
};
