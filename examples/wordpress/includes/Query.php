<?php

declare(strict_types=1);

namespace KenyaLocationsExample;

use KenyaLocations\Area;
use KenyaLocations\Constituency;
use KenyaLocations\County;
use KenyaLocations\KenyaLocations;
use KenyaLocations\Locality;
use KenyaLocations\SearchResult;
use KenyaLocations\SearchType;
use KenyaLocations\Ward;

/**
 * Thin pass-through so WordPress code never calls KenyaLocations statically
 * except here. No WordPress functions.
 */
final class Query
{
    /** @return list<County> */
    public function counties(): array
    {
        return KenyaLocations::getCounties();
    }

    public function county(string $codeOrName): ?County
    {
        $key = trim($codeOrName);
        if ($key === '') {
            return null;
        }

        return KenyaLocations::getCountyByCode($key)
            ?? KenyaLocations::getCountyByName($key);
    }

    /**
     * Resolve a WooCommerce `state` value. IEBC codes and county names work.
     * WooCommerce's own `KE01`…`KE47` codes are not IEBC codes — pass the
     * option label (county name) from the checkout script instead.
     */
    public function countyFromCheckoutState(string $state): ?County
    {
        return $this->countyFromWooCommerceLabel($state);
    }

    /**
     * Map a WooCommerce country/state label to an IEBC county.
     *
     * Handles "Nairobi County", "Kenya — Nairobi County", and curly apostrophes
     * in names such as Murang'a.
     */
    public function countyFromWooCommerceLabel(string $label): ?County
    {
        $name = trim($label);
        if ($name === '') {
            return null;
        }

        $name = preg_replace('/^.*[—–-]\s+/u', '', $name) ?? $name;
        $name = preg_replace('/\s+County$/iu', '', $name) ?? $name;
        $name = str_replace(["\u{2019}", "\u{2018}", '’', '‘'], "'", $name);

        return $this->county($name);
    }

    public function constituency(string $codeOrName): ?Constituency
    {
        $key = trim($codeOrName);
        if ($key === '') {
            return null;
        }

        return KenyaLocations::getConstituencyByCode($key)
            ?? KenyaLocations::getConstituencyByName($key);
    }

    public function ward(string $codeOrName): ?Ward
    {
        $key = trim($codeOrName);
        if ($key === '') {
            return null;
        }

        return KenyaLocations::getWardByCode($key)
            ?? KenyaLocations::getWardByName($key);
    }

    /** @return list<Constituency> */
    public function constituenciesInCounty(string $codeOrName): array
    {
        return KenyaLocations::getConstituenciesInCounty($codeOrName);
    }

    /** @return list<Ward> */
    public function wardsInConstituency(string $codeOrName): array
    {
        return KenyaLocations::getWardsInConstituency($codeOrName);
    }

    public function locality(string $name, ?string $county = null): ?Locality
    {
        $key = trim($name);
        if ($key === '') {
            return null;
        }

        return KenyaLocations::getLocality($key, $county !== null && $county !== '' ? $county : null);
    }

    public function area(string $name, ?string $locality = null, ?string $county = null): ?Area
    {
        $key = trim($name);
        if ($key === '') {
            return null;
        }

        $countyName = null;
        if ($county !== null && $county !== '') {
            $countyName = $this->county($county)?->name;
        }

        foreach (KenyaLocations::getAreasByName($key) as $area) {
            if ($locality !== null && $locality !== '' && strcasecmp($area->locality, $locality) !== 0) {
                continue;
            }
            if ($countyName !== null && strcasecmp($area->county, $countyName) !== 0) {
                continue;
            }

            return $area;
        }

        return null;
    }

    /** @return list<Locality> */
    public function localitiesInCounty(string $codeOrName): array
    {
        return KenyaLocations::getLocalitiesInCounty($codeOrName);
    }

    /**
     * @return list<Area>
     */
    public function areasInLocality(string $localityName, ?string $county = null): array
    {
        $areas = KenyaLocations::getAreasInLocality($localityName);
        if ($county === null || $county === '') {
            return $areas;
        }

        $resolved = $this->county($county);
        if ($resolved === null) {
            return [];
        }

        $needle = strtolower($resolved->name);

        return array_values(array_filter(
            $areas,
            static fn (Area $area): bool => strtolower($area->county) === $needle,
        ));
    }

    /**
     * @return list<SearchResult>
     */
    public function search(string $query, int $limit = 20, ?string $type = null): array
    {
        $limit = max(1, min($limit, 50));

        if ($type === null || $type === '') {
            return KenyaLocations::search($query, limit: $limit);
        }

        $searchType = SearchType::tryFrom($type);
        if ($searchType === null) {
            return [];
        }

        return KenyaLocations::searchByType($query, $searchType, $limit);
    }
}
