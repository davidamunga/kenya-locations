import type {
  County,
  Constituency,
  Ward,
  SearchResult,
  SubCounty,
  Area,
  Locality,
} from "./types";
import { counties } from "./data/counties";
import { constituencies } from "./data/constituencies";
import { wards } from "./data/wards";
import { subCounties } from "./data/sub-counties";
import { localities } from "./data/locality";
import { areas } from "./data/area";
import {
  search as searchFunction,
  searchByType as searchByTypeFunction,
} from "./utils/search";
import {
  areasInCounty,
  areasInLocality,
  constituenciesInCounty,
  constituencyOfWard,
  countyOfNamed,
  countyOfWard,
  foldName,
  getAreaByNameValue,
  getAreasByNameValue,
  getConstituencyByCodeValue,
  getConstituencyByNameValue,
  getCountyByCodeValue,
  getCountyByNameValue,
  getLocalitiesByNameValue,
  getSubCountyByCodeValue,
  getSubCountyByNameValue,
  getWardByCodeValue,
  getWardByNameValue,
  getWardsByNameValue,
  localitiesInCounty,
  localityOfArea,
  resolveConstituency,
  resolveCounty,
  resolveLocality,
  resolveSubCounty,
  resolveWard,
  subCountiesInCounty,
  subCountyOfWard,
  wardsInConstituency,
  wardsInCounty,
  wardsInSubCounty,
} from "./utils/lookups";
import { LocationError, LocationNotFoundError } from "./errors/LocationErrors";

// --- Wrapper Classes ---

/**
 * Locality class with methods to access area data
 * @example
 *   const westlands = locality('Westlands', 'Nairobi');
 *   westlands?.areas();
 */
class LocalityWrapper {
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
   * Get the county this locality belongs to
   * @returns CountyWrapper or undefined if not found
   */
  getCounty(): CountyWrapper | undefined {
    const county = countyOfNamed(this._data);
    return county ? new CountyWrapper(county) : undefined;
  }

  /**
   * Get all areas in this locality (only areas in the same county)
   * @returns Array of Area
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
    const found = findByName(this.areas(), name);
    if (found) return found;
    throw new LocationNotFoundError("Area", name);
  }
}

/**
 * County class with methods to access constituency, locality, and area data
 * @example
 *   const nairobi = county('Nairobi');
 *   nairobi?.constituencies();
 *   nairobi?.localities();
 */
class CountyWrapper {
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
   * @returns Array of ConstituencyWrapper
   */
  constituencies(): ConstituencyWrapper[] {
    return constituenciesInCounty(this._data).map(
      (c) => new ConstituencyWrapper(c)
    );
  }

  /**
   * Get a constituency by name or code
   * @param nameOrCode Name or code of the constituency
   * @throws LocationNotFoundError if not found in this county
   */
  constituency(nameOrCode: string): ConstituencyWrapper {
    const found = resolveConstituency(nameOrCode);
    if (found && sameName(found.county, this._data.name)) {
      return new ConstituencyWrapper(found);
    }
    throw new LocationNotFoundError("Constituency", nameOrCode);
  }

  /**
   * Get all wards in this county
   * @returns Array of Ward
   */
  wards(): Ward[] {
    return wardsInCounty(this._data);
  }

  /**
   * Get all localities in this county
   * @returns Array of LocalityWrapper
   */
  localities(): LocalityWrapper[] {
    return localitiesInCounty(this._data).map((l) => new LocalityWrapper(l));
  }

  /**
   * Get a locality by name
   * @param name Name of the locality
   * @throws LocationNotFoundError if not found
   */
  locality(name: string): LocalityWrapper {
    const found = resolveLocality(name, this._data.code);
    if (found) return new LocalityWrapper(found);
    throw new LocationNotFoundError("Locality", name);
  }

  /**
   * Get all areas in this county
   * @returns Array of Area
   */
  areas(): Area[] {
    return areasInCounty(this._data);
  }

  /**
   * Get areas by locality name
   * @param localityName Name of the locality
   * @returns Array of Area
   */
  areasByLocality(localityName: string): Area[] {
    const found = resolveLocality(localityName, this._data.code);
    return found ? areasInLocality(found) : [];
  }
}

/**
 * Constituency class with methods to access ward data
 * @example
 *   const westlands = getConstituencyByCode('274');
 *   westlands?.wards();
 */
class ConstituencyWrapper {
  private readonly _data: Constituency;

  constructor(data: Constituency) {
    this._data = data;
  }

  /** Get the constituency code */
  get code(): string {
    return this._data.code;
  }
  /** Get the constituency name */
  get name(): string {
    return this._data.name;
  }
  /** Get the county this constituency belongs to */
  get county(): string {
    return this._data.county;
  }
  /** Get all data for the constituency */
  get data(): Constituency {
    return { ...this._data };
  }

  /**
   * Get the county this constituency belongs to
   * @returns CountyWrapper
   */
  getCounty(): CountyWrapper | undefined {
    const county = countyOfNamed(this._data);
    return county ? new CountyWrapper(county) : undefined;
  }

  /**
   * Get a ward in this constituency by name or code
   * @throws LocationNotFoundError if no ward matches in this constituency
   * @throws LocationError if several wards in this constituency share the name
   */
  ward(nameOrCode: string): Ward {
    return wardInConstituency(this._data, nameOrCode);
  }

  /**
   * Get all wards in this constituency
   */
  wards(): Ward[] {
    return wardsInConstituency(this._data);
  }
}

// --- Helpers ---

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function findByName<T extends { name: string }>(
  items: readonly T[],
  name: string
): T | undefined {
  const exact = items.filter((item) => sameName(item.name, name));
  if (exact.length > 0) return exact.length === 1 ? exact[0] : undefined;
  const folded = items.filter((item) => foldName(item.name) === foldName(name));
  return folded.length === 1 ? folded[0] : undefined;
}

function wardInConstituency(
  constituency: Constituency,
  nameOrCode: string
): Ward {
  const byCode = getWardByCodeValue(nameOrCode);
  if (byCode && sameName(byCode.constituency, constituency.name)) return byCode;

  const inConstituency = wardsInConstituency(constituency);
  const matches = inConstituency.filter((w) => sameName(w.name, nameOrCode));
  if (matches.length > 1) {
    throw new LocationError(
      `Multiple wards named '${nameOrCode}' found in constituency '${constituency.name}'. Use specific ward code instead.`
    );
  }
  const found = matches[0] ?? findByName(inConstituency, nameOrCode);
  if (!found) throw new LocationNotFoundError("Ward", nameOrCode);
  return found;
}

// --- Standalone Functions ---

/**
 * Get all counties
 */
export function getCounties(): County[] {
  return counties;
}

/**
 * Get all sub-counties
 */
export function getSubCounties(): SubCounty[] {
  return subCounties;
}

/**
 * Get all wards
 */
export function getWards(): Ward[] {
  return wards;
}

/**
 * Get all localities
 */
export function getLocalities(): Locality[] {
  return localities;
}

/**
 * Get all areas
 */
export function getAreas(): Area[] {
  return areas;
}

/**
 * Get a county by its code. Codes are zero-padded, so "47" finds "047".
 */
export function getCountyByCode(code: string): County | undefined {
  return getCountyByCodeValue(code);
}

/**
 * Get a locality by its name.
 * Returns undefined when the name exists in more than one county. Use
 * {@link getLocalitiesByName} for all matches, or {@link locality} with a
 * county to pick one.
 */
export function getLocalityByName(name: string): LocalityWrapper | undefined {
  const found = resolveLocality(name);
  return found ? new LocalityWrapper(found) : undefined;
}

/**
 * Get all localities matching a name across all counties.
 * Useful when the same locality name exists in more than one county.
 * @param name Locality name (case-insensitive)
 * @returns Array of LocalityWrapper instances
 */
export function getLocalitiesByName(name: string): LocalityWrapper[] {
  return getLocalitiesByNameValue(name).map((l) => new LocalityWrapper(l));
}

/**
 * Get an area by its name.
 * Returns undefined when several areas share the name; use
 * {@link getAreasByName} for all matches.
 */
export function getAreaByName(name: string): Area | undefined {
  return getAreaByNameValue(name);
}

/**
 * Get all localities in a county
 * @param countyNameOrCode County name or code
 */
export function getLocalitiesInCounty(countyNameOrCode: string): Locality[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? localitiesInCounty(county) : [];
}

/**
 * Get all areas in a locality.
 * Pass the county when the locality name exists in more than one county;
 * without it, an ambiguous name returns no areas.
 * @param localityName Locality name
 * @param countyNameOrCode Optional county name or code
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
 */
export function getAreasInCounty(countyNameOrCode: string): Area[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? areasInCounty(county) : [];
}

/**
 * Get the county of a locality.
 * Returns undefined when the locality name exists in more than one county.
 */
export function getCountyOfLocality(localityName: string): County | undefined {
  const found = resolveLocality(localityName);
  return found ? countyOfNamed(found) : undefined;
}

/**
 * Get the county of an area.
 * Returns undefined when several areas share the name.
 */
export function getCountyOfArea(areaName: string): County | undefined {
  const area = getAreaByNameValue(areaName);
  return area ? countyOfNamed(area) : undefined;
}

/**
 * Get the locality of an area (in the area's own county).
 * Returns undefined when several areas share the name.
 */
export function getLocalityOfArea(areaName: string): Locality | undefined {
  const area = getAreaByNameValue(areaName);
  return area ? localityOfArea(area) : undefined;
}

/**
 * Get all sub-counties in a county
 * @param nameOrCode County name or code
 */
export function getSubCountiesInCounty(nameOrCode: string): SubCounty[] {
  const county = resolveCounty(nameOrCode);
  return county ? subCountiesInCounty(county) : [];
}

/**
 * Get wards in a sub-county.
 * @param nameOrCode Sub-county name or code
 */
export function getWardsInSubCounty(nameOrCode: string): Ward[] {
  const sc = resolveSubCounty(nameOrCode);
  return sc ? wardsInSubCounty(sc) : [];
}

/**
 * Get the county of a sub-county
 * @param subCountyNameOrCode Sub-county name or code
 */
export function getCountyOfSubCounty(
  subCountyNameOrCode: string
): County | undefined {
  const sc = resolveSubCounty(subCountyNameOrCode);
  return sc ? countyOfNamed(sc) : undefined;
}

/**
 * Get the county of a ward.
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 */
export function getCountyOfWard(wardNameOrCode: string): County | undefined {
  const ward = resolveWard(wardNameOrCode);
  return ward ? countyOfWard(ward) : undefined;
}

/**
 * Get a county by name or code with chainable methods
 */
export function county(nameOrCode: string): CountyWrapper | undefined {
  const found = resolveCounty(nameOrCode);
  return found ? new CountyWrapper(found) : undefined;
}

/**
 * Get a locality by name, optionally within a county.
 * Without a county, the name must be unique in Kenya.
 * @param name Locality name
 * @param countyNameOrCode Optional county name or code
 */
export function locality(
  name: string,
  countyNameOrCode?: string
): LocalityWrapper | undefined {
  const found = resolveLocality(name, countyNameOrCode);
  return found ? new LocalityWrapper(found) : undefined;
}

/**
 * Get all constituencies
 */
export function getConstituencies(): Constituency[] {
  return constituencies;
}

/**
 * Get a constituency by its code. Codes are zero-padded, so "1" finds "001".
 */
export function getConstituencyByCode(
  code: string
): ConstituencyWrapper | undefined {
  const found = getConstituencyByCodeValue(code);
  return found ? new ConstituencyWrapper(found) : undefined;
}

/**
 * Get all wards in a county
 * @param countyNameOrCode County name or code
 */
export function getWardsInCounty(countyNameOrCode: string): Ward[] {
  const county = resolveCounty(countyNameOrCode);
  return county ? wardsInCounty(county) : [];
}

/**
 * Search across all location types with fuzzy matching
 */
export function search(
  query: string,
  options: {
    limit?: number;
    types?: (
      | "county"
      | "constituency"
      | "ward"
      | "sub-county"
      | "locality"
      | "area"
    )[];
  } = {}
): SearchResult[] {
  return searchFunction(query, options);
}

/**
 * Search a single location type with fuzzy matching
 */
export function searchByType(
  query: string,
  type: "county" | "constituency" | "ward" | "sub-county" | "locality" | "area",
  limit?: number
): SearchResult[] {
  return searchByTypeFunction(query, type, limit);
}

/**
 * Get all wards in a constituency
 * @param constituencyNameOrCode Constituency name or code
 */
export function getWardsInConstituency(constituencyNameOrCode: string): Ward[] {
  const constituency = resolveConstituency(constituencyNameOrCode);
  return constituency ? wardsInConstituency(constituency) : [];
}

/**
 * Get the county of a constituency
 * @param constituencyNameOrCode Constituency name or code
 */
export function getCountyOfConstituency(
  constituencyNameOrCode: string
): County | undefined {
  const constituency = resolveConstituency(constituencyNameOrCode);
  return constituency ? countyOfNamed(constituency) : undefined;
}

/**
 * Get a county by name (case-insensitive; "Muranga" finds "Murang'a")
 */
export function getCountyByName(name: string): County | undefined {
  return getCountyByNameValue(name);
}

/**
 * Get a constituency by name (case-insensitive)
 */
export function getConstituencyByName(
  name: string
): ConstituencyWrapper | undefined {
  const found = getConstituencyByNameValue(name);
  return found ? new ConstituencyWrapper(found) : undefined;
}

/**
 * Get a ward by its code. Codes are zero-padded, so "1" finds "0001".
 */
export function getWardByCode(code: string): Ward | undefined {
  return getWardByCodeValue(code);
}

/**
 * Get a ward by name.
 * Returns undefined when several wards share the name (e.g. "Township");
 * use {@link getWardsByName} or a ward code instead.
 */
export function getWardByName(name: string): Ward | undefined {
  return getWardByNameValue(name);
}

/**
 * Get all wards matching a name across all constituencies.
 * @param name Ward name (case-insensitive)
 */
export function getWardsByName(name: string): Ward[] {
  return getWardsByNameValue(name);
}

/**
 * Get a sub-county by its code. Codes are zero-padded.
 */
export function getSubCountyByCode(code: string): SubCounty | undefined {
  return getSubCountyByCodeValue(code);
}

/**
 * Get a sub-county by name (case-insensitive)
 */
export function getSubCountyByName(name: string): SubCounty | undefined {
  return getSubCountyByNameValue(name);
}

/**
 * Get all constituencies in a county
 * @param nameOrCode County name or code
 */
export function getConstituenciesInCounty(
  nameOrCode: string
): ConstituencyWrapper[] {
  const county = resolveCounty(nameOrCode);
  return county
    ? constituenciesInCounty(county).map((c) => new ConstituencyWrapper(c))
    : [];
}

/**
 * Get the sub-county of a ward.
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 */
export function getSubCountyOfWard(
  wardNameOrCode: string
): SubCounty | undefined {
  const ward = resolveWard(wardNameOrCode);
  return ward ? subCountyOfWard(ward) : undefined;
}

/**
 * Get the constituency of a ward
 * @param wardNameOrCode Ward code, or a ward name that is unique in Kenya
 */
export function getConstituencyOfWard(
  wardNameOrCode: string
): ConstituencyWrapper | undefined {
  const ward = resolveWard(wardNameOrCode);
  const found = ward ? constituencyOfWard(ward) : undefined;
  return found ? new ConstituencyWrapper(found) : undefined;
}

/**
 * Get all areas matching a name across all localities.
 * Useful when the same area name exists in more than one locality.
 * @param name Area name (case-insensitive)
 */
export function getAreasByName(name: string): Area[] {
  return getAreasByNameValue(name);
}

/**
 * Main class for working with Kenya's administrative locations.
 *
 * @deprecated Use the tree-shakeable standalone functions instead.
 * Import directly from `kenya-locations` or its subpath exports
 * (e.g. `kenya-locations/counties`, `kenya-locations/wards`).
 * The class will be removed in a future major version.
 */
export class KenyaLocations {
  private static instance: KenyaLocations;

  /**
   * Get the singleton instance of KenyaLocations
   */
  public static getInstance(): KenyaLocations {
    if (!KenyaLocations.instance) {
      KenyaLocations.instance = new KenyaLocations();
    }
    return KenyaLocations.instance;
  }

  public static getCounties = getCounties;
  public static getSubCounties = getSubCounties;
  public static getWards = getWards;
  public static getLocalities = getLocalities;
  public static getAreas = getAreas;
  public static getCountyByCode = getCountyByCode;
  public static getLocalityByName = getLocalityByName;
  public static getLocalitiesByName = getLocalitiesByName;
  public static getAreaByName = getAreaByName;
  public static getLocalitiesInCounty = getLocalitiesInCounty;
  public static getAreasInLocality = getAreasInLocality;
  public static getAreasInCounty = getAreasInCounty;
  public static getCountyOfLocality = getCountyOfLocality;
  public static getCountyOfArea = getCountyOfArea;
  public static getLocalityOfArea = getLocalityOfArea;
  public static getSubCountiesInCounty = getSubCountiesInCounty;
  public static getWardsInSubCounty = getWardsInSubCounty;
  public static getCountyOfSubCounty = getCountyOfSubCounty;
  public static getCountyOfWard = getCountyOfWard;
  public static getSubCountyOfWard = getSubCountyOfWard;
  public static county = county;
  public static locality = locality;
  public static getConstituencies = getConstituencies;
  public static getConstituencyByCode = getConstituencyByCode;
  public static getConstituencyByName = getConstituencyByName;
  public static getConstituenciesInCounty = getConstituenciesInCounty;
  public static getConstituencyOfWard = getConstituencyOfWard;
  public static getWardsInCounty = getWardsInCounty;
  public static getWardByCode = getWardByCode;
  public static getWardByName = getWardByName;
  public static getWardsByName = getWardsByName;
  public static getSubCountyByCode = getSubCountyByCode;
  public static getSubCountyByName = getSubCountyByName;
  public static getCountyByName = getCountyByName;
  public static getAreasByName = getAreasByName;
  public static search = search;
  public static searchByType = searchByType;
  public static getWardsInConstituency = getWardsInConstituency;
  public static getCountyOfConstituency = getCountyOfConstituency;
}

export { CountyWrapper, ConstituencyWrapper, LocalityWrapper };

// Backward-compatible error aliases
export {
  LocationError as KenyaLocationsError,
  LocationNotFoundError as NotFoundError,
};

export default KenyaLocations;
