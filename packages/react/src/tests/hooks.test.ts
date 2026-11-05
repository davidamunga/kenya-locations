import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useCounties, useCounty } from "../hooks/useCounties";
import { useConstituencies, useConstituency, useConstituenciesInCounty } from "../hooks/useConstituencies";
import { useWards, useWardsInCounty, useWardsInConstituency, useConstituencyOfWard, useSubCountyOfWard } from "../hooks/useWards";
import { useSubCounties, useSubCountiesInCounty } from "../hooks/useSubCounties";
import { useLocalities, useLocalitiesInCounty, useLocality } from "../hooks/useLocalities";
import { useAreas, useAreasInLocality, useAreasInCounty } from "../hooks/useAreas";
import { useSearch } from "../hooks/useSearch";

vi.useFakeTimers();
afterEach(() => vi.clearAllTimers());

describe("useCounties", () => {
  it("returns all 47 counties", () => {
    const { result } = renderHook(() => useCounties());
    expect(result.current).toHaveLength(47);
  });

  it("returns stable reference", () => {
    const { result, rerender } = renderHook(() => useCounties());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useCounty", () => {
  it("returns CountyWrapper for known county", () => {
    const { result } = renderHook(() => useCounty("Nairobi"));
    expect(result.current?.name).toBe("Nairobi");
  });

  it("returns undefined for unknown county", () => {
    const { result } = renderHook(() => useCounty("Nowhere"));
    expect(result.current).toBeUndefined();
  });

  it("returns undefined when input is undefined", () => {
    const { result } = renderHook(() => useCounty(undefined));
    expect(result.current).toBeUndefined();
  });
});

describe("useConstituencies", () => {
  it("returns all 290 constituencies", () => {
    const { result } = renderHook(() => useConstituencies());
    expect(result.current).toHaveLength(290);
  });
});

describe("useConstituency", () => {
  it("resolves by name", () => {
    const { result } = renderHook(() => useConstituency("Westlands"));
    expect(result.current?.name).toBe("Westlands");
    expect(result.current?.wards().length).toBeGreaterThan(0);
  });

  it("resolves by code", () => {
    const { result } = renderHook(() => useConstituency("274"));
    expect(result.current?.name).toBe("Westlands");
  });

  it("returns undefined for unknown", () => {
    const { result } = renderHook(() => useConstituency("Nowhere"));
    expect(result.current).toBeUndefined();
  });
});

describe("useConstituenciesInCounty", () => {
  it("returns constituencies for Nairobi", () => {
    const { result } = renderHook(() => useConstituenciesInCounty("Nairobi"));
    expect(result.current.length).toBeGreaterThan(0);
    result.current.forEach((c) => expect(c.county).toBe("Nairobi"));
  });

  it("returns empty array for undefined", () => {
    const { result } = renderHook(() => useConstituenciesInCounty(undefined));
    expect(result.current).toEqual([]);
  });
});

describe("useWards", () => {
  it("returns all 1450 wards", () => {
    const { result } = renderHook(() => useWards());
    expect(result.current).toHaveLength(1450);
  });
});

describe("useWardsInCounty", () => {
  it("returns 85 wards for Nairobi", () => {
    const { result } = renderHook(() => useWardsInCounty("Nairobi"));
    expect(result.current).toHaveLength(85);
  });

  it("returns empty array for undefined", () => {
    const { result } = renderHook(() => useWardsInCounty(undefined));
    expect(result.current).toEqual([]);
  });
});

describe("useWardsInConstituency", () => {
  it("returns wards for Westlands constituency", () => {
    const { result } = renderHook(() => useWardsInConstituency("Westlands"));
    expect(result.current.length).toBeGreaterThan(0);
  });
});

describe("useConstituencyOfWard", () => {
  it("returns the constituency for a ward code", () => {
    const { result: wardsResult } = renderHook(() => useWards());
    const ward = wardsResult.current[0];

    const { result } = renderHook(() => useConstituencyOfWard(ward.code));
    expect(result.current?.name).toBe(ward.constituency);
  });
});

describe("useSubCountyOfWard", () => {
  it("returns a sub-county for a valid ward", () => {
    const { result: wardsResult } = renderHook(() => useWards());
    const ward = wardsResult.current[0];

    const { result } = renderHook(() => useSubCountyOfWard(ward.code));
    expect(result.current).toBeDefined();
  });
});

describe("useSubCounties", () => {
  it("returns all 307 sub-counties", () => {
    const { result } = renderHook(() => useSubCounties());
    expect(result.current).toHaveLength(307);
  });
});

describe("useSubCountiesInCounty", () => {
  it("returns sub-counties for Nairobi", () => {
    const { result } = renderHook(() => useSubCountiesInCounty("Nairobi"));
    expect(result.current.length).toBeGreaterThan(0);
  });
});

describe("useLocalities", () => {
  it("returns all 917 localities", () => {
    const { result } = renderHook(() => useLocalities());
    expect(result.current).toHaveLength(917);
  });
});

describe("useLocalitiesInCounty", () => {
  it("returns localities for Nairobi", () => {
    const { result } = renderHook(() => useLocalitiesInCounty("Nairobi"));
    expect(result.current.length).toBeGreaterThan(0);
  });
});

describe("useLocality", () => {
  it("returns LocalityWrapper for Westlands", () => {
    const { result } = renderHook(() => useLocality("Westlands", "Nairobi"));
    expect(result.current?.name).toBe("Westlands");
    expect(result.current?.areas().length).toBeGreaterThan(0);
  });

  it("returns undefined when name is undefined", () => {
    const { result } = renderHook(() => useLocality(undefined));
    expect(result.current).toBeUndefined();
  });
});

describe("useAreas", () => {
  it("returns all 1829 areas", () => {
    const { result } = renderHook(() => useAreas());
    expect(result.current).toHaveLength(1829);
  });
});

describe("useAreasInLocality", () => {
  it("returns areas for Westlands", () => {
    const { result } = renderHook(() => useAreasInLocality("Westlands"));
    expect(result.current.length).toBeGreaterThan(0);
  });

  it("only returns areas from the given county", () => {
    const { result } = renderHook(() =>
      useAreasInLocality("Bura", "Tana River")
    );
    expect(result.current).toHaveLength(2);
    expect(result.current.every((a) => a.county === "Tana River")).toBe(true);
  });
});

describe("useAreasInCounty", () => {
  it("returns areas for Nairobi", () => {
    const { result } = renderHook(() => useAreasInCounty("Nairobi"));
    expect(result.current.length).toBeGreaterThan(0);
  });
});

describe("useSearch", () => {
  it("returns results after debounce", async () => {
    const { result } = renderHook(() => useSearch("Nairobi", { debounceMs: 300 }));

    // On initial mount with a non-empty query the debounce timer is already running
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.results.length).toBeGreaterThan(0);
  });

  it("shows isPending while debounce is active", () => {
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useSearch(q, { debounceMs: 300 }),
      { initialProps: { q: "" } }
    );

    act(() => {
      rerender({ q: "Nairobi" });
    });

    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isPending).toBe(false);
  });

  it("respects the types filter", async () => {
    const { result } = renderHook(() =>
      useSearch("Nairobi", { types: ["county"], debounceMs: 0 })
    );
    result.current.results.forEach((r) => expect(r.type).toBe("county"));
  });

  it("returns empty results for empty query", async () => {
    const { result } = renderHook(() => useSearch("", { debounceMs: 0 }));
    expect(result.current.results).toEqual([]);
  });
});
