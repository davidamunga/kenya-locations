/**
 * Tree-shakeable exports for locality-related functions
 */

import type { Locality, Area, County } from "./types";
import { localities } from "./data/locality";
import { LocationNotFoundError } from "./errors/LocationErrors";
import {
  areasInLocality,
  countyOfNamed,
  foldName,
  getLocalitiesByNameValue,
  localitiesInCounty,
  resolveCounty,
  resolveLocality,
} from "./utils/lookups";

/**
 * Locality wrapper class with methods to access related data
 */
export class LocalityWrapper {
  private readonly _data: Locality;

  constructor(data: Locality) {
    this._data = data;
  }

  /** Get the locality name */
  get name(): string {
    return this._data.name;
  }

  /** Get the county this locality belongs to */
  get county(): string {
    return this._data.county;
  }

  /** Get all data for the locality */
  get data(): Locality {
    return { ...this._data };
  }

  /**
   * Get all areas in this locality (only areas in the same county)
   */
  areas(): Area[] {
    return areasInLocality(this._data);
  }

  /**
   * Get an area by name
   * @param name Name of the area
   * @throws LocationNotFoundError if not found
   */
  area(name: string): Area {
    const areas = this.areas();
    const exact = areas.filter(
      (a) => a.name.toLowerCase() === name.trim().toLowerCase()
    );
    const matches =
      exact.length > 0
        ? exact
        : areas.filter((a) => foldName(a.name) === foldName(name));
    if (matches.length === 1) return matches[0];
    throw new LocationNotFoundError("Area", name);
  }

  /**
   * Get the county this locality belongs to
   */
  getCounty(): County | undefined {
    return countyOfNamed(this._data);
  }
}

/**
 * Get all localities
 * @returns Array of all localities
 * @example
 * ```ts
 * import { getLocalities } from 'kenya-locations/localities';
 * const localities = getLocalities();
 * ```
 */
export function getLocalities(): Locality[] {
  return localities;
}

/**
 * Get a locality by its name.
 * Returns undefined when the name exists in more than one county; use
 * {@link getLocalitiesByName} or {@link locality} with a county instead.
 * @param name Locality name (case-insensitive)
 * @returns LocalityWrapper instance or undefined if not found
 * @example
 * ```ts
 * import { getLocalityByName } from 'kenya-locations/localities';
 * const westlands = getLocalityByName('Westlands');
 * ```
 */
export function getLocalityByName(name: string): LocalityWrapper | undefined {
  const found = resolveLocality(name);
  return found ? new LocalityWrapper(found) : undefined;
}

/**
 * Get all localities in a county
 * @param countyNameOrCode County name or code
 * @returns Array of localities in the county
 * @example
 * ```ts
 * import { getLocalitiesInCounty } from 'kenya-locations/localities';
 * const nairobiLocalities = getLocalitiesInCounty('Nairobi');
 * ```
 */
export function getLocalitiesInCounty(countyNameOrCode: string): Locality[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? localitiesInCounty(county) : [];
}

/**
 * Get the county of a locality.
 * Returns undefined when the locality name exists in more than one county.
 * @param localityName The name of the locality
 * @returns County object or undefined if not found
 * @example
 * ```ts
 * import { getCountyOfLocality } from 'kenya-locations/localities';
 * const county = getCountyOfLocality('Westlands');
 * ```
 */
export function getCountyOfLocality(localityName: string): County | undefined {
  const found = resolveLocality(localityName);
  return found ? countyOfNamed(found) : undefined;
}

/**
 * Get all localities matching a name across all counties.
 * Useful when the same locality name exists in more than one county.
 * @param name Locality name (case-insensitive)
 * @returns Array of LocalityWrapper instances
 * @example
 * ```ts
 * import { getLocalitiesByName } from 'kenya-locations/localities';
 * const allMakadara = getLocalitiesByName('Makadara');
 * ```
 */
export function getLocalitiesByName(name: string): LocalityWrapper[] {
  return getLocalitiesByNameValue(name).map((l) => new LocalityWrapper(l));
}

/**
 * Get a locality by name, optionally within a county.
 * Without a county, the name must be unique in Kenya.
 * @param name Locality name
 * @param countyNameOrCode Optional county name or code
 * @returns LocalityWrapper instance or undefined if not found
 * @example
 * ```ts
 * import { locality } from 'kenya-locations/localities';
 * const westlands = locality('Westlands', 'Nairobi');
 * ```
 */
export function locality(
  name: string,
  countyNameOrCode?: string
): LocalityWrapper | undefined {
  const found = resolveLocality(name, countyNameOrCode);
  return found ? new LocalityWrapper(found) : undefined;
}

// Export types
export type { Locality };
