import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate: vi.fn() }),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname } }),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }) }));

import { SiteHeader } from "./site-header";

class NoopObserver {
  observe() {}
  disconnect() {}
}
globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver;

describe("SiteHeader", () => {
  afterEach(cleanup);

  it("links to home sections as anchors on the home page", () => {
    pathname = "/";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Counties" }).getAttribute("href")).toBe("#counties");
    expect(within(nav).getByRole("link", { name: "Contribute" }).getAttribute("href")).toBe("/docs#contribute");
  });

  it("points section links back home from a place page", () => {
    pathname = "/ward/0737";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Explore" }).getAttribute("href")).toBe("/#explore");
    expect(within(nav).getByRole("link", { name: "Data" }).getAttribute("href")).toBe("/data");
  });

  it("has a search button", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Search places" })).toBeTruthy();
  });
});
