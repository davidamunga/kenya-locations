/**
 * Tree-shakeable exports for sub-county-related functions
 */

import type { SubCounty, County, Ward } from "./types";
import { subCounties } from "./data/sub-counties";
import {
  countyOfNamed,
  getConstituencyByNameValue,
  getSubCountyByCodeValue,
  getSubCountyByNameValue,
  resolveCounty,
  resolveSubCounty,
  subCountiesInCounty,
  wardsInConstituency,
} from "./utils/lookups";

/**
 * Get all sub-counties
 * @returns Array of all sub-counties
 * @example
 * ```ts
 * import { getSubCounties } from 'kenya-locations/sub-counties';
 * const subCounties = getSubCounties();
 * ```
 */
export function getSubCounties(): SubCounty[] {
  return subCounties;
}

/**
 * Get a sub-county by code
 * @param code Sub-county code
 * @returns SubCounty object or undefined if not found
 * @example
 * ```ts
 * import { getSubCountyByCode } from 'kenya-locations/sub-counties';
 * const subCounty = getSubCountyByCode('001');
 * ```
 */
export function getSubCountyByCode(code: string): SubCounty | undefined {
  return getSubCountyByCodeValue(code);
}

/**
 * Get a sub-county by name
 * @param name Sub-county name (case-insensitive)
 * @returns SubCounty object or undefined if not found
 * @example
 * ```ts
 * import { getSubCountyByName } from 'kenya-locations/sub-counties';
 * const subCounty = getSubCountyByName('Westlands');
 * ```
 */
export function getSubCountyByName(name: string): SubCounty | undefined {
  return getSubCountyByNameValue(name);
}

/**
 * Get all sub-counties in a county
 * @param nameOrCode County name or code
 * @returns Array of sub-counties in the county
 * @example
 * ```ts
 * import { getSubCountiesInCounty } from 'kenya-locations/sub-counties';
 * const subCounties = getSubCountiesInCounty('Nairobi');
 * ```
 */
export function getSubCountiesInCounty(nameOrCode: string): SubCounty[] {
  const county = resolveCounty(nameOrCode);
  return county ? subCountiesInCounty(county) : [];
}

/**
 * Get the county of a sub-county
 * @param subCountyName The name of the sub-county
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyOfSubCounty } from 'kenya-locations/sub-counties';
 * const county = getCountyOfSubCounty('Westlands');
 * ```
 */
export function getCountyOfSubCounty(
  subCountyName: string
): County | undefined {
  const sc = resolveSubCounty(subCountyName);
  return sc ? countyOfNamed(sc) : undefined;
}

/**
 * Get all wards in a sub-county by name or code.
 * Sub-county names correspond to constituency names in the ward dataset,
 * so this matches wards whose constituency field equals the sub-county name.
 * @param nameOrCode Sub-county name or code
 * @returns Array of wards in the sub-county
 * @example
 * ```ts
 * import { getWardsInSubCounty } from 'kenya-locations/sub-counties';
 * const wards = getWardsInSubCounty('154');       // by code
 * const wards2 = getWardsInSubCounty('Ainabkoi'); // by name
 * ```
 */
export function getWardsInSubCounty(nameOrCode: string): Ward[] {
  const sc = resolveSubCounty(nameOrCode);
  if (!sc) return [];
  const constituency = getConstituencyByNameValue(sc.name);
  return constituency ? wardsInConstituency(constituency) : [];
}

// Export types
export type { SubCounty };
