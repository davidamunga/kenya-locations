import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AreaSubmissionForm } from "./AreaSubmissionForm";

const sonner = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: sonner }));

// jsdom has no PointerEvent, which Base UI's checkbox and dialog use.
if (!("PointerEvent" in window)) {
  Object.defineProperty(window, "PointerEvent", { value: MouseEvent, configurable: true });
}

// The real select needs pointer events jsdom lacks, so stand in a plain list of options.
vi.mock("@/components/ui/select", async () => {
  const { createContext, useContext } = await import("react");
  const Choose = createContext<(value: string) => void>(() => {});
  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange: (v: string) => void }) => (
      <Choose.Provider value={onValueChange}>{children}</Choose.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: () => null,
    SelectPopup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const choose = useContext(Choose);
      return (
        <button onClick={() => choose(value)} role="option" type="button">
          {children}
        </button>
      );
    },
  };
});

const ENDPOINT = "https://script.google.com/macros/s/test/exec";

async function openForm() {
  render(<AreaSubmissionForm />);
  fireEvent.click(screen.getByRole("button", { name: /submit an area/i }));
  await screen.findByRole("dialog");
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("AreaSubmissionForm without a submissions endpoint", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUBMISSIONS_URL", "");
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("falls back to a GitHub issue and shows no sheet-only fields", async () => {
    await openForm();
    expect(screen.getByRole("button", { name: /open github issue/i })).toBeTruthy();
    expect(screen.queryByLabelText(/your name/i)).toBeNull();
    expect(screen.queryByLabelText(/agree this can be published/i)).toBeNull();
  });
});

describe("AreaSubmissionForm with a submissions endpoint", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUBMISSIONS_URL", ENDPOINT);
    sonner.success.mockClear();
    sonner.error.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("asks for an optional name and the license, and hides the honeypot from people", async () => {
    await openForm();
    expect(screen.getByLabelText(/your name \(optional\)/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeTruthy();
    const honeypot = document.getElementById("website")!;
    expect(honeypot.getAttribute("tabindex")).toBe("-1");
    expect(honeypot.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("does not send without agreeing to the license", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await openForm();
    fill(/locality/i, "Westlands");
    fill(/^area$/i, "Highpoint");
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sonner.error).toHaveBeenCalled();
  });
});

describe("failed sends", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps the dialog open and offers GitHub when the endpoint can't be reached", async () => {
    vi.stubEnv("VITE_SUBMISSIONS_URL", ENDPOINT);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await openForm();
    fireEvent.click(await screen.findByRole("option", { name: "Nairobi" }));
    fill(/locality/i, "Westlands");
    fill(/^area$/i, "Highpoint");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    await waitFor(() => expect(sonner.error).toHaveBeenCalled());
    expect(sonner.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't send it"));
    expect(await screen.findByRole("button", { name: /use github instead/i })).toBeTruthy();
  });
});
