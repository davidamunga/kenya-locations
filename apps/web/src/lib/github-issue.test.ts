import { describe, expect, it } from "vitest";
import { buildAreaIssueUrl, DATA_ISSUE_REPO } from "./github-issue";

describe("buildAreaIssueUrl", () => {
  it("opens a prefilled data issue", () => {
    const url = new URL(
      buildAreaIssueUrl({
        county: " Nairobi ",
        locality: "Westlands",
        area: "Gigiri",
      })
    );

    expect(url.origin + url.pathname).toBe(
      `https://github.com/${DATA_ISSUE_REPO}/issues/new`
    );
    expect(url.searchParams.get("title")).toBe(
      "[DATA] Add area: Gigiri (Westlands, Nairobi)"
    );
    expect(url.searchParams.get("labels")).toBe("data,contribution");
    expect(url.searchParams.get("body")).toContain("**County**: Nairobi");
    expect(url.searchParams.get("body")).toContain("- [x] New Areas");
    expect(url.searchParams.get("body")).toContain('name: "Gigiri"');
  });
});
