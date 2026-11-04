import { useMemo } from "react";
import {
  getWards,
  getWardsInCounty,
  getWardsInConstituency,
  getConstituencyOfWard,
  getSubCountyOfWard,
  type Ward,
  type SubCounty,
  type ConstituencyWrapper,
} from "kenya-locations";

/**
 * Returns all 1,450 wards. Stable reference.
 */
export function useWards(): Ward[] {
  return useMemo(() => getWards(), []);
}

/**
 * Returns all wards in a county (by name or code).
 *
 * @example
 * ```tsx
 * const wards = useWardsInCounty('Nairobi'); // 85 wards
 * ```
 */
export function useWardsInCounty(
  countyNameOrCode: string | undefined
): Ward[] {
  return useMemo(
    () => (countyNameOrCode ? getWardsInCounty(countyNameOrCode) : []),
    [countyNameOrCode]
  );
}

/**
 * Returns all wards in a constituency (by name or code).
 *
 * @example
 * ```tsx
 * const wards = useWardsInConstituency('Westlands');
 * ```
 */
export function useWardsInConstituency(
  constituencyNameOrCode: string | undefined
): Ward[] {
  return useMemo(
    () =>
      constituencyNameOrCode
        ? getWardsInConstituency(constituencyNameOrCode)
        : [],
    [constituencyNameOrCode]
  );
}

/**
 * Returns the constituency a ward belongs to (by ward name or code).
 */
export function useConstituencyOfWard(
  wardNameOrCode: string | undefined
): ConstituencyWrapper | undefined {
  return useMemo(
    () => (wardNameOrCode ? getConstituencyOfWard(wardNameOrCode) : undefined),
    [wardNameOrCode]
  );
}

/**
 * Returns the sub-county a ward belongs to (by ward name or code).
 */
export function useSubCountyOfWard(
  wardNameOrCode: string | undefined
): SubCounty | undefined {
  return useMemo(
    () => (wardNameOrCode ? getSubCountyOfWard(wardNameOrCode) : undefined),
    [wardNameOrCode]
  );
}
