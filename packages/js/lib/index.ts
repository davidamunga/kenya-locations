export {
  KenyaLocations,
  // County
  getCounties,
  getCountyByCode,
  getCountyByName,
  county,
  CountyWrapper,
  // Constituency
  getConstituencies,
  getConstituencyByCode,
  getConstituencyByName,
  getConstituenciesInCounty,
  getWardsInConstituency,
  getCountyOfConstituency,
  ConstituencyWrapper,
  // Ward
  getWards,
  getWardByCode,
  getWardByName,
  getWardsByName,
  getWardsInCounty,
  getWardsInSubCounty,
  getCountyOfWard,
  getConstituencyOfWard,
  getSubCountyOfWard,
  // Sub-county
  getSubCounties,
  getSubCountyByCode,
  getSubCountyByName,
  getSubCountiesInCounty,
  getCountyOfSubCounty,
  // Locality
  getLocalities,
  getLocalityByName,
  getLocalitiesByName,
  getLocalitiesInCounty,
  getCountyOfLocality,
  getLocalityOfArea,
  locality,
  LocalityWrapper,
  // Area
  getAreas,
  getAreaByName,
  getAreasByName,
  getAreasInLocality,
  getAreasInCounty,
  getCountyOfArea,
  // Search
  search,
  searchByType,
  // Errors (legacy aliases)
  NotFoundError,
  KenyaLocationsError,
} from "./KenyaLocations";

export { DATA_VERSION } from "./version";

export type {
  County,
  Constituency,
  Ward,
  SearchResult,
  SubCounty,
  Locality,
  Area,
  SearchType,
} from "./types";

export { counties, constituencies, wards } from "./data";
export { subCounties } from "./data/sub-counties";
export { localities } from "./data/locality";
export { areas } from "./data/area";

export {
  LocationError,
  LocationNotFoundError,
  InvalidLocationCodeError,
  SearchError,
  DataValidationError,
  ConfigurationError,
} from "./errors/LocationErrors";
