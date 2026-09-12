<?php

declare(strict_types=1);

namespace KenyaLocations;

/**
 * Kenyan administrative divisions loaded from the shared JSON dataset.
 *
 * No initialisation is required — call the static methods directly.
 */
final class KenyaLocations
{
    private function __construct()
    {
    }

    /** @return list<County> */
    public static function getCounties(): array
    {
        return Dataset::counties();
    }

    public static function getCountyByCode(string $code): ?County
    {
        foreach (Dataset::counties() as $county) {
            if ($county->code === $code) {
                return $county;
            }
        }

        return null;
    }

    public static function getCountyByName(string $name): ?County
    {
        $needle = self::normalise($name);

        foreach (Dataset::counties() as $county) {
            if (self::normalise($county->name) === $needle) {
                return $county;
            }
        }

        return null;
    }

    /** @return list<SubCounty> */
    public static function getSubCounties(): array
    {
        return Dataset::subCounties();
    }

    public static function getSubCountyByCode(string $code): ?SubCounty
    {
        foreach (Dataset::subCounties() as $subCounty) {
            if ($subCounty->code === $code) {
                return $subCounty;
            }
        }

        return null;
    }

    public static function getSubCountyByName(string $name): ?SubCounty
    {
        $needle = self::normalise($name);

        foreach (Dataset::subCounties() as $subCounty) {
            if (self::normalise($subCounty->name) === $needle) {
                return $subCounty;
            }
        }

        return null;
    }

    /** @return list<SubCounty> */
    public static function getSubCountiesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);
        if ($county === null) {
            return [];
        }

        $needle = self::normalise($county->name);

        return array_values(array_filter(
            Dataset::subCounties(),
            static fn (SubCounty $item): bool => self::normalise($item->county) === $needle,
        ));
    }

    public static function getCountyOfSubCounty(string $nameOrCode): ?County
    {
        $subCounty = self::resolveSubCounty($nameOrCode);

        return $subCounty === null ? null : self::resolveCounty($subCounty->county);
    }

    /** @return list<Constituency> */
    public static function getConstituencies(): array
    {
        return Dataset::constituencies();
    }

    public static function getConstituencyByCode(string $code): ?Constituency
    {
        foreach (Dataset::constituencies() as $constituency) {
            if ($constituency->code === $code) {
                return $constituency;
            }
        }

        return null;
    }

    public static function getConstituencyByName(string $name): ?Constituency
    {
        $needle = self::normalise($name);

        foreach (Dataset::constituencies() as $constituency) {
            if (self::normalise($constituency->name) === $needle) {
                return $constituency;
            }
        }

        return null;
    }

    /** @return list<Constituency> */
    public static function getConstituenciesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);
        if ($county === null) {
            return [];
        }

        $needle = self::normalise($county->name);

        return array_values(array_filter(
            Dataset::constituencies(),
            static fn (Constituency $item): bool => self::normalise($item->county) === $needle,
        ));
    }

    public static function getCountyOfConstituency(string $nameOrCode): ?County
    {
        $constituency = self::resolveConstituency($nameOrCode);

        return $constituency === null ? null : self::resolveCounty($constituency->county);
    }

    /** @return list<Ward> */
    public static function getWards(): array
    {
        return Dataset::wards();
    }

    public static function getWardByCode(string $code): ?Ward
    {
        foreach (Dataset::wards() as $ward) {
            if ($ward->code === $code) {
                return $ward;
            }
        }

        return null;
    }

    public static function getWardByName(string $name): ?Ward
    {
        $needle = self::normalise($name);

        foreach (Dataset::wards() as $ward) {
            if (self::normalise($ward->name) === $needle) {
                return $ward;
            }
        }

        return null;
    }

    /** @return list<Ward> */
    public static function getWardsInConstituency(string $nameOrCode): array
    {
        $constituency = self::resolveConstituency($nameOrCode);
        if ($constituency === null) {
            return [];
        }

        $needle = self::normalise($constituency->name);

        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $item): bool => self::normalise($item->constituency) === $needle,
        ));
    }

    /** @return list<Ward> */
    public static function getWardsInCounty(string $nameOrCode): array
    {
        $names = [];
        foreach (self::getConstituenciesInCounty($nameOrCode) as $constituency) {
            $names[self::normalise($constituency->name)] = true;
        }

        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $item): bool => isset($names[self::normalise($item->constituency)]),
        ));
    }

    /**
     * Wards whose constituency name matches the sub-county.
     *
     * `$nameOrCode` may be a sub-county administrative code or name.
     *
     * @return list<Ward>
     */
    public static function getWardsInSubCounty(string $nameOrCode): array
    {
        $subCounty = self::resolveSubCounty($nameOrCode);
        if ($subCounty === null) {
            return [];
        }

        $needle = self::normalise($subCounty->name);

        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $item): bool => self::normalise($item->constituency) === $needle,
        ));
    }

    public static function getCountyOfWard(string $wardNameOrCode): ?County
    {
        $ward = self::findUniqueWard($wardNameOrCode);
        if ($ward === null) {
            return null;
        }

        $constituency = self::constituencyOf($ward);

        return $constituency === null ? null : self::resolveCounty($constituency->county);
    }

    public static function getSubCountyOfWard(string $wardNameOrCode): ?SubCounty
    {
        $ward = self::findUniqueWard($wardNameOrCode);

        return $ward === null ? null : self::resolveSubCounty($ward->constituency);
    }

    /**
     * Parent constituency of a ward.
     *
     * `$wardNameOrCode` may be an administrative code (exact) or a ward name
     * (case-insensitive). Codes win when both could match. Returns null when
     * the ward is missing, the name is reused (for example Township), or the
     * parent constituency cannot be found.
     */
    public static function getConstituencyOfWard(string $wardNameOrCode): ?Constituency
    {
        $ward = self::findUniqueWard($wardNameOrCode);

        return $ward === null ? null : self::constituencyOf($ward);
    }

    /** @return list<Locality> */
    public static function getLocalities(): array
    {
        return Dataset::localities();
    }

    public static function getLocalityByName(string $name): ?Locality
    {
        return self::getLocality($name);
    }

    /**
     * Locality by name, optionally scoped to a county when the name is reused.
     */
    public static function getLocality(string $name, ?string $countyName = null): ?Locality
    {
        $needle = self::normalise($name);

        if ($countyName !== null) {
            foreach (self::getLocalitiesInCounty($countyName) as $locality) {
                if (self::normalise($locality->name) === $needle) {
                    return $locality;
                }
            }

            return null;
        }

        foreach (Dataset::localities() as $locality) {
            if (self::normalise($locality->name) === $needle) {
                return $locality;
            }
        }

        return null;
    }

    /**
     * All localities matching a name across counties.
     *
     * @return list<Locality>
     */
    public static function getLocalitiesByName(string $name): array
    {
        $needle = self::normalise($name);

        return array_values(array_filter(
            Dataset::localities(),
            static fn (Locality $item): bool => self::normalise($item->name) === $needle,
        ));
    }

    /** @return list<Locality> */
    public static function getLocalitiesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);
        if ($county === null) {
            return [];
        }

        $needle = self::normalise($county->name);

        return array_values(array_filter(
            Dataset::localities(),
            static fn (Locality $item): bool => self::normalise($item->county) === $needle,
        ));
    }

    public static function getCountyOfLocality(string $localityName): ?County
    {
        $locality = self::getLocalityByName($localityName);

        return $locality === null ? null : self::resolveCounty($locality->county);
    }

    /** @return list<Area> */
    public static function getAreas(): array
    {
        return Dataset::areas();
    }

    public static function getAreaByName(string $name): ?Area
    {
        $matches = self::getAreasByName($name);

        return $matches[0] ?? null;
    }

    /**
     * All areas matching a name across localities.
     *
     * @return list<Area>
     */
    public static function getAreasByName(string $name): array
    {
        $needle = self::normalise($name);

        return array_values(array_filter(
            Dataset::areas(),
            static fn (Area $item): bool => self::normalise($item->name) === $needle,
        ));
    }

    /** @return list<Area> */
    public static function getAreasInLocality(string $localityName): array
    {
        $needle = self::normalise($localityName);

        return array_values(array_filter(
            Dataset::areas(),
            static fn (Area $item): bool => self::normalise($item->locality) === $needle,
        ));
    }

    /** @return list<Area> */
    public static function getAreasInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);
        if ($county === null) {
            return [];
        }

        $needle = self::normalise($county->name);

        return array_values(array_filter(
            Dataset::areas(),
            static fn (Area $item): bool => self::normalise($item->county) === $needle,
        ));
    }

    public static function getCountyOfArea(string $areaName): ?County
    {
        $area = self::getAreaByName($areaName);

        return $area === null ? null : self::resolveCounty($area->county);
    }

    public static function getLocalityOfArea(string $areaName): ?Locality
    {
        $area = self::getAreaByName($areaName);
        if ($area === null) {
            return null;
        }

        return self::getLocality($area->locality, $area->county);
    }

    /**
     * Fuzzy search across counties, sub-counties, constituencies, wards,
     * localities, and areas.
     *
     * Exact substring matches rank first, then typo-tolerant Levenshtein
     * matches (edit distance within 40% of the query length). Queries shorter
     * than two characters return no results.
     *
     * @param list<SearchType>|null $types
     * @return list<SearchResult>
     */
    public static function search(string $query, int $limit = 20, ?array $types = null): array
    {
        $q = trim($query);
        if (mb_strlen($q) < 2 || $limit <= 0) {
            return [];
        }

        $allowed = $types === null ? null : array_fill_keys(
            array_map(static fn (SearchType $type): string => $type->value, $types),
            true,
        );

        /** @var list<array{score: float, result: SearchResult}> $scored */
        $scored = [];

        $collect = static function (array $items, SearchType $type) use ($q, $allowed, &$scored): void {
            if ($allowed !== null && !isset($allowed[$type->value])) {
                return;
            }

            foreach ($items as $item) {
                $score = self::fuzzyScore($q, $item->name);
                if ($score !== null) {
                    $scored[] = [
                        'score' => $score,
                        'result' => new SearchResult($type, $item),
                    ];
                }
            }
        };

        $collect(Dataset::counties(), SearchType::County);
        $collect(Dataset::subCounties(), SearchType::SubCounty);
        $collect(Dataset::constituencies(), SearchType::Constituency);
        $collect(Dataset::wards(), SearchType::Ward);
        $collect(Dataset::localities(), SearchType::Locality);
        $collect(Dataset::areas(), SearchType::Area);

        usort($scored, static fn (array $a, array $b): int => $a['score'] <=> $b['score']);

        return array_map(
            static fn (array $entry): SearchResult => $entry['result'],
            array_slice($scored, 0, $limit),
        );
    }

    /**
     * @return list<SearchResult>
     */
    public static function searchByType(string $query, SearchType $type, int $limit = 20): array
    {
        return self::search($query, $limit, [$type]);
    }

    private static function constituencyOf(Ward $ward): ?Constituency
    {
        return self::resolveConstituency($ward->constituency);
    }

    private static function resolveCounty(string $nameOrCode): ?County
    {
        $key = trim($nameOrCode);
        if ($key === '') {
            return null;
        }

        foreach (Dataset::counties() as $county) {
            if ($county->code === $key) {
                return $county;
            }
        }

        $needle = self::normalise($key);
        foreach (Dataset::counties() as $county) {
            if (self::normalise($county->name) === $needle) {
                return $county;
            }
        }

        return null;
    }

    private static function resolveConstituency(string $nameOrCode): ?Constituency
    {
        $key = trim($nameOrCode);
        if ($key === '') {
            return null;
        }

        foreach (Dataset::constituencies() as $constituency) {
            if ($constituency->code === $key) {
                return $constituency;
            }
        }

        $needle = self::normalise($key);
        foreach (Dataset::constituencies() as $constituency) {
            if (self::normalise($constituency->name) === $needle) {
                return $constituency;
            }
        }

        return null;
    }

    private static function resolveSubCounty(string $nameOrCode): ?SubCounty
    {
        $key = trim($nameOrCode);
        if ($key === '') {
            return null;
        }

        foreach (Dataset::subCounties() as $subCounty) {
            if ($subCounty->code === $key) {
                return $subCounty;
            }
        }

        $needle = self::normalise($key);
        foreach (Dataset::subCounties() as $subCounty) {
            if (self::normalise($subCounty->name) === $needle) {
                return $subCounty;
            }
        }

        return null;
    }

    /**
     * Unique ward by administrative code (exact) or name (case-insensitive).
     * Codes win. Returns null when the name is reused or nothing matches.
     */
    private static function findUniqueWard(string $wardNameOrCode): ?Ward
    {
        $key = trim($wardNameOrCode);
        if ($key === '') {
            return null;
        }

        $byCode = array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $ward): bool => $ward->code === $key,
        ));
        if (count($byCode) === 1) {
            return $byCode[0];
        }

        $needle = self::normalise($key);
        $byName = array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $ward): bool => self::normalise($ward->name) === $needle,
        ));

        return count($byName) === 1 ? $byName[0] : null;
    }

    /**
     * Relevance score in [0.0, 1.0). 0.0 is an exact substring match.
     */
    private static function fuzzyScore(string $pattern, string $text): ?float
    {
        $p = mb_strtolower($pattern);
        $t = mb_strtolower($text);

        if (str_contains($t, $p)) {
            return 0.0;
        }

        $pLen = mb_strlen($p);
        $tLen = mb_strlen($t);
        if ($pLen < 2 || $tLen === 0) {
            return null;
        }

        $maxErrors = max(1, (int) floor($pLen * 0.4));
        $windowSize = $pLen + $maxErrors;
        $best = INF;

        for ($start = 0; $start < $tLen; $start++) {
            $end = min($start + $windowSize, $tLen);
            $window = mb_substr($t, $start, $end - $start);
            $distance = self::levenshtein($p, $window);

            if ($distance <= $maxErrors) {
                $score = $distance / $pLen;
                if ($score < $best) {
                    $best = $score;
                }
            }

            if ($best === 0.0) {
                break;
            }
        }

        return $best <= 0.4 ? $best : null;
    }

    private static function levenshtein(string $s, string $t): int
    {
        $sChars = self::characters($s);
        $tChars = self::characters($t);
        $m = count($sChars);
        $n = count($tChars);

        if ($m === 0) {
            return $n;
        }
        if ($n === 0) {
            return $m;
        }

        $dp = range(0, $n);

        for ($i = 1; $i <= $m; $i++) {
            $previous = $dp[0];
            $dp[0] = $i;

            for ($j = 1; $j <= $n; $j++) {
                $current = $dp[$j];
                $dp[$j] = $sChars[$i - 1] === $tChars[$j - 1]
                    ? $previous
                    : 1 + min($previous, $dp[$j], $dp[$j - 1]);
                $previous = $current;
            }
        }

        return $dp[$n];
    }

    /**
     * @return list<string>
     */
    private static function characters(string $value): array
    {
        return preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }

    private static function normalise(string $value): string
    {
        return mb_strtolower(trim($value));
    }
}
