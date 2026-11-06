import { describe, expect, it, vi } from "vitest";
import {
  type AreaSubmission,
  buildSubmissionBody,
  getSubmissionsUrl,
  nameProblem,
  sendAreaSubmission,
  submissionProblem,
} from "./submissions";

const valid: AreaSubmission = {
  countyCode: "047",
  locality: " Westlands ",
  area: "Highpoint  Estate",
  displayName: " Jane Doe ",
  consent: true,
};

const reply = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe("nameProblem", () => {
  it.each(["Highpoint", "Kwa Jose", "St. Mary's (Annex)", "Murang’a", "Kibera/Laini Saba"])("accepts %s", (name) => {
    expect(nameProblem("Area", name)).toBeUndefined();
  });

  it.each([
    ["a", "too short"],
    ["x".repeat(61), "60 characters"],
    ["see http://x.example", "link"],
    ["www.x.com", "link"],
    ["=SUM(A1)", "can only have"],
    ["<b>x</b>", "can only have"],
    ["12345", "can only have"],
  ])("rejects %s", (name, message) => {
    expect(nameProblem("Area", name)).toContain(message);
  });
});

describe("submissionProblem", () => {
  it("needs a county, then checks both names", () => {
    expect(submissionProblem(valid)).toBeUndefined();
    expect(submissionProblem({ ...valid, countyCode: "" })).toBe("Choose a county.");
    expect(submissionProblem({ ...valid, locality: "x" })).toContain("Locality");
    expect(submissionProblem({ ...valid, area: "<script>" })).toContain("Area");
  });
});

describe("buildSubmissionBody", () => {
  it("sends trimmed names, the consent and an empty honeypot", () => {
    expect(JSON.parse(buildSubmissionBody(valid))).toEqual({
      county_code: "047",
      locality: "Westlands",
      area: "Highpoint Estate",
      display_name: "Jane Doe",
      consent: true,
      website: "",
    });
  });
});

describe("sendAreaSubmission", () => {
  it("posts text/plain JSON, so the browser sends no preflight", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply({ ok: true }));
    const result = await sendAreaSubmission(valid, { url: "https://script.google.com/macros/s/x/exec", fetchImpl });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://script.google.com/macros/s/x/exec");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("text/plain;charset=utf-8");
    expect(JSON.parse(init.body).area).toBe("Highpoint Estate");
  });

  it("reports a refusal from the endpoint, a failed request and a missing endpoint", async () => {
    const url = "https://script.google.com/macros/s/x/exec";
    expect(await sendAreaSubmission(valid, { url, fetchImpl: vi.fn().mockResolvedValue(reply({ ok: false, error: "invalid_name" })) })).toEqual({ ok: false, reason: "rejected" });
    expect(await sendAreaSubmission(valid, { url, fetchImpl: vi.fn().mockResolvedValue(reply({}, false)) })).toEqual({ ok: false, reason: "network" });
    expect(await sendAreaSubmission(valid, { url, fetchImpl: vi.fn().mockRejectedValue(new Error("offline")) })).toEqual({ ok: false, reason: "network" });
    expect(await sendAreaSubmission(valid, { url: undefined, fetchImpl: vi.fn() })).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("getSubmissionsUrl", () => {
  it("is undefined unless the build sets an https URL", () => {
    vi.stubEnv("VITE_SUBMISSIONS_URL", "");
    expect(getSubmissionsUrl()).toBeUndefined();
    vi.stubEnv("VITE_SUBMISSIONS_URL", "http://insecure.example/exec");
    expect(getSubmissionsUrl()).toBeUndefined();
    vi.stubEnv("VITE_SUBMISSIONS_URL", "https://script.google.com/macros/s/x/exec");
    expect(getSubmissionsUrl()).toBe("https://script.google.com/macros/s/x/exec");
    vi.unstubAllEnvs();
  });
});
