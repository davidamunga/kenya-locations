/**
 * Former Kenyan province a county belongs to.
 */
export type CountyRegion =
  | "Nairobi"
  | "Central"
  | "Coast"
  | "Eastern"
  | "North Eastern"
  | "Nyanza"
  | "Rift Valley"
  | "Western";

/**
 * Interface for County data
 */
export interface County {
  /** IEBC county code, "001"–"047" */
  code: string;
  /** ISO 3166-2 code, e.g. "KE-30" for Nairobi. Numbered alphabetically, so it differs from `code`. */
  iso_code: string;
  name: string;
  /** County headquarters / capital town */
  capital: string;
  /** Area in square kilometres (KNBS) */
  area_km2: number;
  /** Population from the 2019 Kenya Population and Housing Census (KNBS) */
  population_2019: number;
  /** Former province this county belongs to */
  region: CountyRegion;
  /** Kenya Post primary postal code for the county capital */
  postal_code: string;
  /** Other names the county is known by, e.g. "Nairobi City" */
  aliases: string[];
}

/**
 * Interface for SubCounty data
 */
export interface SubCounty {
  code: string;
  name: string;
  county: string;
  /** Code of the county it belongs to */
  county_code: string;
}

/**
 * Interface for Constituency data
 */
export interface Constituency {
  code: string;
  name: string;
  county: string;
  /** Code of the county it belongs to */
  county_code: string;
}

/**
 * Interface for Ward data
 */
export interface Ward {
  code: string;
  name: string;
  constituency: string;
  /** Code of the constituency it belongs to */
  constituency_code: string;
  /** Code of the county it belongs to */
  county_code: string;
}

/**
 * Interface for Locality data
 */
export interface Locality {
  name: string;
  county: string;
  /** Code of the county it belongs to */
  county_code: string;
}

/**
 * Interface for Area data
 */
export interface Area {
  name: string;
  locality: string;
  county: string;
  /** Code of the county it belongs to */
  county_code: string;
}

/**
 * Search result
 * @example
 * ```ts
 * for (const result of search('Nairobi')) {
 *   if (result.type === 'county') {
 *     console.log(result.item.code); // County
 *   } else if (result.type === 'ward') {
 *     console.log(result.item.constituency); // Ward
 *   }
 * }
 * ```
 */
export type SearchResult =
  | { type: "county"; item: County }
  | { type: "constituency"; item: Constituency }
  | { type: "ward"; item: Ward }
  | { type: "sub-county"; item: SubCounty }
  | { type: "locality"; item: Locality }
  | { type: "area"; item: Area };

/**
 * Available search types
 */
export type SearchType =
  | "county"
  | "constituency"
  | "ward"
  | "sub-county"
  | "locality"
  | "area";

/**
 * @deprecated This interface is unused. Use {@link DATA_VERSION} to read the
 * current data version at runtime.
 */
export interface KenyaDivisionsOptions {
  dataVersion?: string;
}
