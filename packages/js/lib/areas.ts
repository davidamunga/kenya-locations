/**
 * Tree-shakeable exports for area-related functions
 */

import type { Area, Locality, County } from "./types";
import { areas } from "./data/area";
import {
  areasInCounty,
  areasInLocality,
  countyOfNamed,
  getAreaByNameValue,
  getAreasByNameValue,
  localityOfArea,
  resolveCounty,
  resolveLocality,
} from "./utils/lookups";

/**
 * Get all areas
 * @returns Array of all areas
 * @example
 * ```ts
 * import { getAreas } from 'kenya-locations/areas';
 * const areas = getAreas();
 * ```
 */
export function getAreas(): Area[] {
  return areas;
}

/**
 * Get an area by its name.
 * Returns undefined when several areas share the name; use
 * {@link getAreasByName} for all matches.
 * @param name Area name (case-insensitive)
 * @returns Area object or undefined if not found
 * @example
 * ```ts
 * import { getAreaByName } from 'kenya-locations/areas';
 * const gigiri = getAreaByName('Gigiri');
 * ```
 */
export function getAreaByName(name: string): Area | undefined {
  return getAreaByNameValue(name);
}

/**
 * Get all areas in a locality.
 * Pass the county when the locality name exists in more than one county;
 * without it, an ambiguous name returns no areas.
 * @param localityName Locality name
 * @param countyNameOrCode Optional county name or code
 * @returns Array of areas in the locality
 * @example
 * ```ts
 * import { getAreasInLocality } from 'kenya-locations/areas';
 * const westlandsAreas = getAreasInLocality('Westlands', 'Nairobi');
 * ```
 */
export function getAreasInLocality(
  localityName: string,
  countyNameOrCode?: string
): Area[] {
  const found = resolveLocality(localityName, countyNameOrCode);
  return found ? areasInLocality(found) : [];
}

/**
 * Get all areas in a county
 * @param countyNameOrCode County name or code
 * @returns Array of areas in the county
 * @example
 * ```ts
 * import { getAreasInCounty } from 'kenya-locations/areas';
 * const nairobiAreas = getAreasInCounty('Nairobi');
 * ```
 */
export function getAreasInCounty(countyNameOrCode: string): Area[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? areasInCounty(county) : [];
}

/**
 * Get the county of an area.
 * Returns undefined when several areas share the name.
 * @param areaName The name of the area
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyOfArea } from 'kenya-locations/areas';
 * const county = getCountyOfArea('Gigiri');
 * ```
 */
export function getCountyOfArea(areaName: string): County | undefined {
  const area = getAreaByNameValue(areaName);
  return area ? countyOfNamed(area) : undefined;
}

/**
 * Get the locality of an area (in the area's own county).
 * Returns undefined when several areas share the name.
 * @param areaName The name of the area
 * @returns Locality object or undefined if not found
 * @example
 * ```ts
 * import { getLocalityOfArea } from 'kenya-locations/areas';
 * const locality = getLocalityOfArea('Gigiri');
 * ```
 */
export function getLocalityOfArea(areaName: string): Locality | undefined {
  const area = getAreaByNameValue(areaName);
  return area ? localityOfArea(area) : undefined;
}

/**
 * Get all areas matching a name across all localities.
 * Useful when the same area name exists in more than one locality.
 * @param name Area name (case-insensitive)
 * @returns Array of Area objects
 * @example
 * ```ts
 * import { getAreasByName } from 'kenya-locations/areas';
 * const allTown = getAreasByName('Town');
 * ```
 */
export function getAreasByName(name: string): Area[] {
  return getAreasByNameValue(name);
}

// Export types
export type { Area };
