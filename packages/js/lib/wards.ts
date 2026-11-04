/**
 * Tree-shakeable exports for ward-related functions
 */

import type { Ward, County, SubCounty } from "./types";
import { wards } from "./data/wards";
import {
  constituencyOfWard,
  countyOfWard,
  getSubCountyByNameValue,
  getWardByCodeValue,
  getWardByNameValue,
  getWardsByNameValue,
  resolveCounty,
  resolveWard,
  wardsInCounty,
} from "./utils/lookups";
import { ConstituencyWrapper } from "./constituencies";

/**
 * Get all wards
 * @returns Array of all wards
 * @example
 * ```ts
 * import { getWards } from 'kenya-locations/wards';
 * const wards = getWards();
 * ```
 */
export function getWards(): Ward[] {
  return wards;
}

/**
 * Get a ward by code. Codes are zero-padded, so "1" finds "0001".
 * @param code Ward code
 * @returns Ward object or undefined if not found
 * @example
 * ```ts
 * import { getWardByCode } from 'kenya-locations/wards';
 * const ward = getWardByCode('0001');
 * ```
 */
export function getWardByCode(code: string): Ward | undefined {
  return getWardByCodeValue(code);
}

/**
 * Get a ward by name (case-insensitive).
 * Returns undefined when several wards share the name (e.g. "Township");
 * use {@link getWardsByName} or a ward code instead.
 * @param name Ward name
 * @returns Ward object or undefined if not found
 * @example
 * ```ts
 * import { getWardByName } from 'kenya-locations/wards';
 * const ward = getWardByName('Mountain View');
 * ```
 */
export function getWardByName(name: string): Ward | undefined {
  return getWardByNameValue(name);
}

/**
 * Get all wards matching a name across all constituencies.
 * @param name Ward name (case-insensitive)
 * @returns Array of wards
 * @example
 * ```ts
 * import { getWardsByName } from 'kenya-locations/wards';
 * const townships = getWardsByName('Township');
 * ```
 */
export function getWardsByName(name: string): Ward[] {
  return getWardsByNameValue(name);
}

/**
 * Get all wards in a county
 * @param countyNameOrCode County name or code
 * @returns Array of wards in the county
 * @example
 * ```ts
 * import { getWardsInCounty } from 'kenya-locations/wards';
 * const wardsInNairobi = getWardsInCounty('Nairobi');
 * ```
 */
export function getWardsInCounty(countyNameOrCode: string): Ward[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? wardsInCounty(county) : [];
}

/**
 * Get the county that a ward belongs to
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyOfWard } from 'kenya-locations/wards';
 * const county = getCountyOfWard('0001');
 * ```
 */
export function getCountyOfWard(wardNameOrCode: string): County | undefined {
  const ward = resolveWard(wardNameOrCode);
  return ward ? countyOfWard(ward) : undefined;
}

/**
 * Get the constituency a ward belongs to
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 * @returns ConstituencyWrapper or undefined if not found
 * @example
 * ```ts
 * import { getConstituencyOfWard } from 'kenya-locations/wards';
 * const constituency = getConstituencyOfWard('0001');
 * ```
 */
export function getConstituencyOfWard(
  wardNameOrCode: string
): ConstituencyWrapper | undefined {
  const ward = resolveWard(wardNameOrCode);
  const found = ward ? constituencyOfWard(ward) : undefined;
  return found ? new ConstituencyWrapper(found) : undefined;
}

/**
 * Get the sub-county a ward belongs to.
 * Sub-county names correspond to constituency names in the ward dataset.
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 * @returns SubCounty or undefined if not found
 * @example
 * ```ts
 * import { getSubCountyOfWard } from 'kenya-locations/wards';
 * const subCounty = getSubCountyOfWard('0001');
 * ```
 */
export function getSubCountyOfWard(
  wardNameOrCode: string
): SubCounty | undefined {
  const ward = resolveWard(wardNameOrCode);
  return ward ? getSubCountyByNameValue(ward.constituency) : undefined;
}

// Export types
export type { Ward };
