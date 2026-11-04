import { cleanup, render, screen } from "@testing-library/react";
import { DATA_VERSION } from "kenya-locations";
import { afterEach, describe, expect, it } from "vitest";

import { DataPage } from "./data-page";

describe("/data", () => {
  afterEach(cleanup);

  it("lists every data file with JSON links pinned to the release", () => {
    render(<DataPage />);
    const json = screen.getAllByRole("link", { name: "JSON" });
    expect(json).toHaveLength(6);
    expect(json[0].getAttribute("href")).toBe(
      `https://cdn.jsdelivr.net/gh/DavidAmunga/kenya-locations@v${DATA_VERSION}/data/counties.json`,
    );
    expect(screen.getAllByRole("button", { name: "CSV" })).toHaveLength(6);
    expect(screen.getByText("1,450")).toBeTruthy();
  });

  it("shows the license, attribution and change history", () => {
    render(<DataPage />);
    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toBeTruthy();
    expect(screen.getByText(/with data from the Independent Electoral and Boundaries Commission/)).toBeTruthy();
    expect(screen.getByText("0737")).toBeTruthy();
  });
});
