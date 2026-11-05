import { useMemo } from "react";
import {
  getSubCounties,
  getSubCountiesInCounty,
  type SubCounty,
} from "kenya-locations";

/**
 * Returns all 302 sub-counties. Stable reference.
 */
export function useSubCounties(): SubCounty[] {
  return useMemo(() => getSubCounties(), []);
}

/**
 * Returns all sub-counties in a county (by name or code).
 *
 * @example
 * ```tsx
 * const subCounties = useSubCountiesInCounty('Nairobi');
 * ```
 */
export function useSubCountiesInCounty(
  countyNameOrCode: string | undefined
): SubCounty[] {
  return useMemo(
    () => (countyNameOrCode ? getSubCountiesInCounty(countyNameOrCode) : []),
    [countyNameOrCode]
  );
}
