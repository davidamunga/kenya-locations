import { useMemo } from "react";
import {
  getLocalities,
  getLocalitiesInCounty,
  locality as getLocalityWrapper,
  type Locality,
  type LocalityWrapper,
} from "kenya-locations";

/**
 * Returns all 917 localities. Stable reference.
 */
export function useLocalities(): Locality[] {
  return useMemo(() => getLocalities(), []);
}

/**
 * Returns all localities in a county (by exact county name).
 *
 * @example
 * ```tsx
 * const localities = useLocalitiesInCounty('Nairobi');
 * ```
 */
export function useLocalitiesInCounty(
  countyName: string | undefined
): Locality[] {
  return useMemo(
    () => (countyName ? getLocalitiesInCounty(countyName) : []),
    [countyName]
  );
}

/**
 * Returns a `LocalityWrapper` for the given locality name, optionally scoped
 * to a specific county to disambiguate duplicates.
 *
 * @example
 * ```tsx
 * const westlands = useLocality('Westlands', 'Nairobi');
 * const areas = westlands?.areas() ?? [];
 * ```
 */
export function useLocality(
  name: string | undefined,
  countyName?: string
): LocalityWrapper | undefined {
  return useMemo(
    () => (name ? getLocalityWrapper(name, countyName) : undefined),
    [name, countyName]
  );
}
