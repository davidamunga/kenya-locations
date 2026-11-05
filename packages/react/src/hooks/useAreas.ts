import { useMemo } from "react";
import {
  getAreas,
  getAreasInLocality,
  getAreasInCounty,
  type Area,
} from "kenya-locations";

/**
 * Returns all 1,829 areas. Stable reference.
 */
export function useAreas(): Area[] {
  return useMemo(() => getAreas(), []);
}

/**
 * Returns all areas in a locality.
 *
 * Pass the county when the locality name exists in more than one county
 * (e.g. "Makadara"); without it, an ambiguous name returns no areas.
 *
 * @example
 * ```tsx
 * const areas = useAreasInLocality('Makadara', 'Nairobi');
 * ```
 */
export function useAreasInLocality(
  localityName: string | undefined,
  countyNameOrCode?: string
): Area[] {
  return useMemo(
    () =>
      localityName ? getAreasInLocality(localityName, countyNameOrCode) : [],
    [localityName, countyNameOrCode]
  );
}

/**
 * Returns all areas in a county (by exact county name).
 *
 * @example
 * ```tsx
 * const areas = useAreasInCounty('Nairobi');
 * ```
 */
export function useAreasInCounty(countyName: string | undefined): Area[] {
  return useMemo(
    () => (countyName ? getAreasInCounty(countyName) : []),
    [countyName]
  );
}
