/**
 * Tree-shakeable exports for county-related functions
 */

import type { County, Area, Ward } from "./types";
import { counties } from "./data/counties";
import {
  areasInCounty,
  areasInLocality,
  constituenciesInCounty,
  getCountyByCodeValue,
  getCountyByNameValue,
  localitiesInCounty,
  resolveConstituency,
  resolveCounty,
  resolveLocality,
  wardsInCounty,
} from "./utils/lookups";
import { LocationNotFoundError } from "./errors/LocationErrors";
import { ConstituencyWrapper } from "./constituencies";
import { LocalityWrapper } from "./localities";

/**
 * County wrapper class with methods to access related data
 */
export class CountyWrapper {
  private readonly _data: County;

  constructor(data: County) {
    this._data = data;
  }

  /** Get the county code */
  get code(): string {
    return this._data.code;
  }

  /** Get the county name */
  get name(): string {
    return this._data.name;
  }

  /** Get all data for the county */
  get data(): County {
    return { ...this._data };
  }

  /**
   * Get all constituencies in this county
   */
  constituencies(): ConstituencyWrapper[] {
    return constituenciesInCounty(this._data).map(
      (c) => new ConstituencyWrapper(c)
    );
  }

  /**
   * Get a constituency in this county by name or code
   * @throws LocationNotFoundError if not found
   */
  constituency(nameOrCode: string): ConstituencyWrapper {
    const found = resolveConstituency(nameOrCode);
    if (found && found.county.toLowerCase() === this._data.name.toLowerCase()) {
      return new ConstituencyWrapper(found);
    }
    throw new LocationNotFoundError("Constituency", nameOrCode);
  }

  /**
   * Get all localities in this county
   */
  localities(): LocalityWrapper[] {
    return localitiesInCounty(this._data).map((l) => new LocalityWrapper(l));
  }

  /**
   * Get a locality in this county by name
   * @throws LocationNotFoundError if not found
   */
  locality(name: string): LocalityWrapper {
    const found = resolveLocality(name, this._data.code);
    if (found) return new LocalityWrapper(found);
    throw new LocationNotFoundError("Locality", name);
  }

  /**
   * Get all areas in this county
   */
  areas(): Area[] {
    return areasInCounty(this._data);
  }

  /**
   * Get all wards in this county
   */
  wards(): Ward[] {
    return wardsInCounty(this._data);
  }

  /**
   * Get areas by locality name
   */
  areasByLocality(localityName: string): Area[] {
    const found = resolveLocality(localityName, this._data.code);
    return found ? areasInLocality(found) : [];
  }
}

/**
 * Get all counties
 * @returns Array of all counties
 * @example
 * ```ts
 * import { getCounties } from 'kenya-locations/counties';
 * const counties = getCounties();
 * ```
 */
export function getCounties(): County[] {
  return counties;
}

/**
 * Get a county by its code. Codes are zero-padded, so "47" finds "047".
 * @param code County code (e.g., '001', '047')
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyByCode } from 'kenya-locations/counties';
 * const mombasa = getCountyByCode('001');
 * ```
 */
export function getCountyByCode(code: string): County | undefined {
  return getCountyByCodeValue(code);
}

/**
 * Get a county by name
 * @param name County name (case-insensitive)
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyByName } from 'kenya-locations/counties';
 * const nairobi = getCountyByName('Nairobi');
 * ```
 */
export function getCountyByName(name: string): County | undefined {
  return getCountyByNameValue(name);
}

/**
 * Get a county by name or code with chainable methods
 * @param nameOrCode County name or code
 * @returns CountyWrapper instance or undefined if not found
 * @example
 * ```ts
 * import { county } from 'kenya-locations/counties';
 * const nairobi = county('Nairobi');
 * const constituencies = nairobi?.constituencies();
 * ```
 */
export function county(nameOrCode: string): CountyWrapper | undefined {
  const found = resolveCounty(nameOrCode);
  return found ? new CountyWrapper(found) : undefined;
}

// Export types
export type { County };
