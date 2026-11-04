import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ navigate: vi.fn() }) }));

import { CountyIndex } from "./county-index";

describe("CountyIndex", () => {
  afterEach(cleanup);

  it("links all 47 counties to their pages, grouped by former province", () => {
    render(<CountyIndex />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(47);
    expect(links.every((a) => /^\/county\/\d{3}$/.test(a.getAttribute("href") ?? ""))).toBe(true);
    const nairobi = screen.getByRole("heading", { level: 3, name: /^Nairobi/ }).parentElement!;
    expect(within(nairobi).getByRole("link", { name: /Nairobi/ }).getAttribute("href")).toBe("/county/047");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
  });

  it("shows each county's constituency and ward counts", () => {
    render(<CountyIndex />);
    expect(
      screen.getByRole("link", { name: /Nairobi.*17 constituencies · 85 wards.*77 localities/ }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Wajir.*No localities yet/ })).toBeTruthy();
  });
});
