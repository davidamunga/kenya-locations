import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate }),
}));

import { SearchCommand, openSearch } from "./search-command";

async function openAndType(query: string) {
  act(() => openSearch());
  const input = await screen.findByRole("combobox", { name: "Search places" });
  fireEvent.change(input, { target: { value: query } });
  return input;
}

describe("SearchCommand", () => {
  beforeEach(() => navigate.mockReset());
  afterEach(cleanup);

  it("opens with Ctrl+K and with /", async () => {
    render(<SearchCommand />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("combobox", { name: "Search places" })).toBeTruthy();
  });

  it("ignores / while typing in another field", () => {
    render(
      <>
        <input aria-label="other" />
        <SearchCommand />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText("other"), { key: "/" });
    expect(screen.queryByRole("combobox", { name: "Search places" })).toBeNull();
  });

  it("shows code matches first and opens the place on click", async () => {
    render(<SearchCommand />);
    await openAndType("0737");
    const option = await screen.findByRole("option", { name: /Cherang'any\/Chebororwa/ });
    fireEvent.click(option);
    expect(navigate).toHaveBeenCalledWith({ href: "/ward/0737" });
  });

  it("opens the highlighted place with Enter", async () => {
    render(<SearchCommand />);
    const input = await openAndType("47");
    await screen.findByRole("option", { name: /Nairobi/ });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/county/047" }));
  });

  it("says so when nothing matches", async () => {
    render(<SearchCommand />);
    await openAndType("zzzzqqqq");
    expect(await screen.findByText(/No places match/)).toBeTruthy();
  });
});
