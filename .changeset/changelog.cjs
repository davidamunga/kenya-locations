/**
 * Changelog format for kenya-locations.
 *
 * Writes what changed for users, with a trailing PR link:
 *
 *   - Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. (#49)
 *
 * No author credits and no commit hashes. The PR number is read from the
 * squash-merge subject of the commit that added the changeset ("... (#49)"),
 * so no GitHub token or network access is needed.
 *
 * Options (in .changeset/config.json):
 *   { "repo": "owner/name" }  — used to build PR links.
 */

const { execFileSync } = require("node:child_process");

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

/**
 * One entry per changeset. The PR link goes at the end of the entry, so a
 * multi-line summary that opens with a lead-in ("Data fixes:") reads cleanly.
 */
async function getReleaseLine(changeset, _type, options) {
  const lines = changeset.summary.trim().split("\n");
  lines[lines.length - 1] += prLink(prNumberFor(changeset.commit), options);
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

module.exports = { getReleaseLine, getDependencyReleaseLine };
