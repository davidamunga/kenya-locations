import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate }),
}));

import { countyPlace, wardPlace } from "@/lib/places";
import { PlaceNotFound, PlacePage } from "./place-page";

describe("PlacePage", () => {
  afterEach(cleanup);

  it("renders the title, breadcrumb links and details", () => {
    render(<PlacePage place={wardPlace("0737")!} />);
    expect(screen.getByRole("heading", { level: 1, name: "Cherang'any/Chebororwa" })).toBeTruthy();
    const crumbs = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(crumbs).getByRole("link", { name: "Marakwet West" }).getAttribute("href")).toBe(
      "/constituency/148",
    );
    expect(screen.getByText("IEBC code").nextSibling?.textContent).toBe("0737");
  });

  it("navigates in-app on a plain click, but leaves modified clicks to the browser", () => {
    render(<PlacePage place={countyPlace("047")!} />);
    const constituencies = screen.getByRole("heading", { name: /^Constituencies/ }).closest("section")!;
    const link = within(constituencies).getByRole("link", { name: /Westlands/ });
    fireEvent.click(link);
    expect(navigate).toHaveBeenCalledWith({ href: "/constituency/274" });
    navigate.mockReset();
    fireEvent.click(link, { metaKey: true });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("filters long lists", () => {
    render(<PlacePage place={countyPlace("047")!} />);
    const filter = screen.getByRole("searchbox", { name: "Filter localities" });
    fireEvent.change(filter, { target: { value: "karen" } });
    const list = filter.closest("section")!;
    const links = within(list).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((a) => a.textContent?.toLowerCase().includes("karen"))).toBe(true);
  });

  it("shows aliases and the code snippets", () => {
    render(<PlacePage place={countyPlace("047")!} />);
    expect(screen.getByText("Nairobi City")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Kotlin" })).toBeTruthy();
    expect(screen.getByText(/getCountyByCode\("047"\)/)).toBeTruthy();
  });
});

describe("PlaceNotFound", () => {
  afterEach(cleanup);

  it("explains code padding", () => {
    render(<PlaceNotFound id="9999" kind="Ward" />);
    expect(screen.getByRole("heading", { name: "Not found" })).toBeTruthy();
    expect(screen.getByText(/zero-padded/)).toBeTruthy();
  });
});
