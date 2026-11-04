<?php

declare(strict_types=1);

namespace KenyaLocationsExample;

use KenyaLocations\Area;
use KenyaLocations\Constituency;
use KenyaLocations\County;
use KenyaLocations\Locality;
use KenyaLocations\SearchResult;
use KenyaLocations\SubCounty;
use KenyaLocations\Ward;

/**
 * Maps library DTOs to the snake_case JSON the shared dataset already uses.
 */
final class Serializer
{
    /**
     * @return array{
     *     code: string,
     *     name: string,
     *     capital: string,
     *     area_km2: float,
     *     population_2019: int,
     *     region: string,
     *     postal_code: string,
     *     iso_code: string,
     *     aliases: list<string>
     * }
     */
    public static function county(County $county): array
    {
        return [
            'code' => $county->code,
            'name' => $county->name,
            'capital' => $county->capital,
            'area_km2' => $county->areaKm2,
            'population_2019' => $county->population2019,
            'region' => $county->region,
            'postal_code' => $county->postalCode,
            'iso_code' => $county->isoCode,
            'aliases' => $county->aliases,
        ];
    }

    /**
     * @return array{code: string, name: string, county: string, county_code: string}
     */
    public static function constituency(Constituency $constituency): array
    {
        return [
            'code' => $constituency->code,
            'name' => $constituency->name,
            'county' => $constituency->county,
            'county_code' => $constituency->countyCode,
        ];
    }

    /**
     * @return array{
     *     code: string,
     *     name: string,
     *     constituency: string,
     *     constituency_code: string,
     *     county_code: string
     * }
     */
    public static function ward(Ward $ward): array
    {
        return [
            'code' => $ward->code,
            'name' => $ward->name,
            'constituency' => $ward->constituency,
            'constituency_code' => $ward->constituencyCode,
            'county_code' => $ward->countyCode,
        ];
    }

    /**
     * @return array{code: string, name: string, county: string, county_code: string}
     */
    public static function subCounty(SubCounty $subCounty): array
    {
        return [
            'code' => $subCounty->code,
            'name' => $subCounty->name,
            'county' => $subCounty->county,
            'county_code' => $subCounty->countyCode,
        ];
    }

    /**
     * @return array{name: string, county: string, county_code: string}
     */
    public static function locality(Locality $locality): array
    {
        return [
            'name' => $locality->name,
            'county' => $locality->county,
            'county_code' => $locality->countyCode,
        ];
    }

    /**
     * @return array{name: string, locality: string, county: string, county_code: string}
     */
    public static function area(Area $area): array
    {
        return [
            'name' => $area->name,
            'locality' => $area->locality,
            'county' => $area->county,
            'county_code' => $area->countyCode,
        ];
    }

    /**
     * @return array{type: string, name: string, item: array<string, mixed>}
     */
    public static function searchResult(SearchResult $result): array
    {
        return [
            'type' => $result->type->value,
            'name' => $result->name(),
            'item' => self::item($result->item),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function item(County|SubCounty|Constituency|Ward|Locality|Area $item): array
    {
        return match (true) {
            $item instanceof County => self::county($item),
            $item instanceof SubCounty => self::subCounty($item),
            $item instanceof Constituency => self::constituency($item),
            $item instanceof Ward => self::ward($item),
            $item instanceof Locality => self::locality($item),
            $item instanceof Area => self::area($item),
        };
    }
}
