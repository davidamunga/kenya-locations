<?php

declare(strict_types=1);

namespace KenyaLocations;

/**
 * Kenyan administrative divisions loaded from the shared JSON dataset.
 *
 * No initialisation is required — call the static methods directly.
 *
 * Every lookup handles names and codes the same way:
 *
 * - Codes are zero-padded, so "47" finds county "047".
 * - Names are case-insensitive. If nothing matches exactly, a looser match
 *   that ignores spaces, hyphens, apostrophes and accents is tried
 *   ("Muranga" finds "Murang'a").
 * - A name that matches more than one record resolves to null instead of an
 *   arbitrary record. Use the plural `...ByName` methods or pass a county to
 *   disambiguate.
 * - Localities are identified by county + name, because the same locality
 *   name exists in more than one county.
 * - County names include aliases, so "Nairobi City" finds Nairobi.
 * - Relationships are joined by code (`countyCode`, `constituencyCode`),
 *   never by name.
 */
final class KenyaLocations
{
    private const COUNTY_CODE_WIDTH = 3;
    private const CONSTITUENCY_CODE_WIDTH = 3;
    private const SUB_COUNTY_CODE_WIDTH = 5;
    private const WARD_CODE_WIDTH = 4;

    /** @var NameIndex<County>|null */
    private static ?NameIndex $countyNames = null;

    /** @var NameIndex<SubCounty>|null */
    private static ?NameIndex $subCountyNames = null;

    /** @var NameIndex<Constituency>|null */
    private static ?NameIndex $constituencyNames = null;

    /** @var NameIndex<Ward>|null */
    private static ?NameIndex $wardNames = null;

    /** @var NameIndex<Locality>|null */
    private static ?NameIndex $localityNames = null;

    /** @var NameIndex<Area>|null */
    private static ?NameIndex $areaNames = null;

    private function __construct()
    {
    }

    /** @return list<County> */
    public static function getCounties(): array
    {
        return Dataset::counties();
    }

    /** County by code; "47" and "047" both find Nairobi. */
    public static function getCountyByCode(string $code): ?County
    {
        $key = NameIndex::normaliseCode($code, self::COUNTY_CODE_WIDTH);

        foreach (Dataset::counties() as $county) {
            if ($county->code === $key) {
                return $county;
            }
        }

        return null;
    }

    public static function getCountyByName(string $name): ?County
    {
        return self::countyNames()->unique($name);
    }

    /** @return list<SubCounty> */
    public static function getSubCounties(): array
    {
        return Dataset::subCounties();
    }

    public static function getSubCountyByCode(string $code): ?SubCounty
    {
        $key = NameIndex::normaliseCode($code, self::SUB_COUNTY_CODE_WIDTH);

        foreach (Dataset::subCounties() as $subCounty) {
            if ($subCounty->code === $key) {
                return $subCounty;
            }
        }

        return null;
    }

    /** Sub-county by name, or null when the name is missing or reused. */
    public static function getSubCountyByName(string $name): ?SubCounty
    {
        return self::subCountyNames()->unique($name);
    }

    /** @return list<SubCounty> */
    public static function getSubCountiesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);

        return $county === null ? [] : self::filterByCounty(Dataset::subCounties(), $county);
    }

    public static function getCountyOfSubCounty(string $nameOrCode): ?County
    {
        $subCounty = self::resolveSubCounty($nameOrCode);

        return $subCounty === null ? null : self::getCountyByCode($subCounty->countyCode);
    }

    /** @return list<Constituency> */
    public static function getConstituencies(): array
    {
        return Dataset::constituencies();
    }

    public static function getConstituencyByCode(string $code): ?Constituency
    {
        $key = NameIndex::normaliseCode($code, self::CONSTITUENCY_CODE_WIDTH);

        foreach (Dataset::constituencies() as $constituency) {
            if ($constituency->code === $key) {
                return $constituency;
            }
        }

        return null;
    }

    public static function getConstituencyByName(string $name): ?Constituency
    {
        return self::constituencyNames()->unique($name);
    }

    /** @return list<Constituency> */
    public static function getConstituenciesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);

        return $county === null ? [] : self::filterByCounty(Dataset::constituencies(), $county);
    }

    public static function getCountyOfConstituency(string $nameOrCode): ?County
    {
        $constituency = self::resolveConstituency($nameOrCode);

        return $constituency === null ? null : self::getCountyByCode($constituency->countyCode);
    }

    /** @return list<Ward> */
    public static function getWards(): array
    {
        return Dataset::wards();
    }

    /** Ward by code; "133" and "0133" find the same ward. */
    public static function getWardByCode(string $code): ?Ward
    {
        $key = NameIndex::normaliseCode($code, self::WARD_CODE_WIDTH);

        foreach (Dataset::wards() as $ward) {
            if ($ward->code === $key) {
                return $ward;
            }
        }

        return null;
    }

    /**
     * Ward by name, or null when the name is missing or reused (for example
     * Township). Use {@see getWardsByName()} or a ward code to disambiguate.
     */
    public static function getWardByName(string $name): ?Ward
    {
        return self::wardNames()->unique($name);
    }

    /**
     * All wards matching a name across constituencies.
     *
     * @return list<Ward>
     */
    public static function getWardsByName(string $name): array
    {
        return self::wardNames()->all($name);
    }

    /** @return list<Ward> */
    public static function getWardsInConstituency(string $nameOrCode): array
    {
        $constituency = self::resolveConstituency($nameOrCode);

        return $constituency === null ? [] : self::wardsInConstituency($constituency);
    }

    /** @return list<Ward> */
    public static function getWardsInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);
        if ($county === null) {
            return [];
        }

        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $item): bool => $item->countyCode === $county->code,
        ));
    }

    public static function getCountyOfWard(string $wardNameOrCode): ?County
    {
        $ward = self::resolveWard($wardNameOrCode);

        return $ward === null ? null : self::countyOfWardRecord($ward);
    }

    /**
     * Wards in a sub-county.
     *
     * `$nameOrCode` may be a sub-county code or name.
     *
     * @return list<Ward>
     */
    public static function getWardsInSubCounty(string $nameOrCode): array
    {
        $subCounty = self::resolveSubCounty($nameOrCode);
        if ($subCounty === null) {
            return [];
        }

        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $ward): bool => $ward->subCountyCode === $subCounty->code,
        ));
    }

    /**
     * Sub-county of a ward.
     *
     * `$wardNameOrCode` may be a ward code or a ward name that is unique in Kenya.
     */
    public static function getSubCountyOfWard(string $wardNameOrCode): ?SubCounty
    {
        $ward = self::resolveWard($wardNameOrCode);

        return $ward === null ? null : self::getSubCountyByCode($ward->subCountyCode);
    }

    /**
     * Parent constituency of a ward.
     *
     * `$wardNameOrCode` may be an administrative code or a ward name. Codes
     * win when both could match. Returns null when the ward is missing, the
     * name is reused (for example Township), or the parent constituency
     * cannot be found.
     */
    public static function getConstituencyOfWard(string $wardNameOrCode): ?Constituency
    {
        $ward = self::resolveWard($wardNameOrCode);

        return $ward === null ? null : self::constituencyOfWardRecord($ward);
    }

    /** @return list<Locality> */
    public static function getLocalities(): array
    {
        return Dataset::localities();
    }

    /**
     * Locality by name, or null when the name is missing or used in more than
     * one county (for example Makadara). Pass a county to {@see getLocality()}
     * to disambiguate.
     */
    public static function getLocalityByName(string $name): ?Locality
    {
        return self::getLocality($name);
    }

    /**
     * Locality by name, optionally scoped to a county (name or code). Without
     * a county the name must be unique across Kenya.
     */
    public static function getLocality(string $name, ?string $countyName = null): ?Locality
    {
        if ($countyName === null) {
            return self::localityNames()->unique($name);
        }

        $county = self::resolveCounty($countyName);
        if ($county === null) {
            return null;
        }

        $matches = self::filterByCounty(self::localityNames()->all($name), $county);

        return count($matches) === 1 ? $matches[0] : null;
    }

    /**
     * All localities matching a name across counties.
     *
     * @return list<Locality>
     */
    public static function getLocalitiesByName(string $name): array
    {
        return self::localityNames()->all($name);
    }

    /** @return list<Locality> */
    public static function getLocalitiesInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);

        return $county === null ? [] : self::filterByCounty(Dataset::localities(), $county);
    }

    /** County of a locality, or null when the locality name is reused. */
    public static function getCountyOfLocality(string $localityName): ?County
    {
        $locality = self::getLocality($localityName);

        return $locality === null ? null : self::getCountyByCode($locality->countyCode);
    }

    /** @return list<Area> */
    public static function getAreas(): array
    {
        return Dataset::areas();
    }

    /**
     * Area by name, or null when the name is missing or reused. Use
     * {@see getAreasByName()} to get every match.
     */
    public static function getAreaByName(string $name): ?Area
    {
        return self::areaNames()->unique($name);
    }

    /**
     * All areas matching a name across localities.
     *
     * @return list<Area>
     */
    public static function getAreasByName(string $name): array
    {
        return self::areaNames()->all($name);
    }

    /**
     * Areas of one locality, matched on both locality name and county.
     *
     * Pass a county (name or code) when the locality name exists in more than
     * one county (for example Bura). Without a county the locality name must
     * be unique; a reused name returns an empty list.
     *
     * @return list<Area>
     */
    public static function getAreasInLocality(string $localityName, ?string $countyNameOrCode = null): array
    {
        $locality = self::getLocality($localityName, $countyNameOrCode);

        return $locality === null ? [] : self::areasOfLocality($locality);
    }

    /** @return list<Area> */
    public static function getAreasInCounty(string $nameOrCode): array
    {
        $county = self::resolveCounty($nameOrCode);

        return $county === null ? [] : self::filterByCounty(Dataset::areas(), $county);
    }

    /** County of an area, or null when the area name is reused. */
    public static function getCountyOfArea(string $areaName): ?County
    {
        $area = self::getAreaByName($areaName);

        return $area === null ? null : self::getCountyByCode($area->countyCode);
    }

    /** Locality of an area (in the area's own county), or null when the area name is reused. */
    public static function getLocalityOfArea(string $areaName): ?Locality
    {
        $area = self::getAreaByName($areaName);

        return $area === null ? null : self::getLocality($area->locality, $area->countyCode);
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

    /** County from its code (zero-padded) or its name. */
    private static function resolveCounty(string $nameOrCode): ?County
    {
        return self::getCountyByCode($nameOrCode) ?? self::countyNames()->unique($nameOrCode);
    }

    /** Constituency from its code (zero-padded) or its name. */
    private static function resolveConstituency(string $nameOrCode): ?Constituency
    {
        return self::getConstituencyByCode($nameOrCode) ?? self::constituencyNames()->unique($nameOrCode);
    }

    /** Sub-county from its code (zero-padded) or its name. */
    private static function resolveSubCounty(string $nameOrCode): ?SubCounty
    {
        return self::getSubCountyByCode($nameOrCode) ?? self::subCountyNames()->unique($nameOrCode);
    }

    /** Ward from its code (zero-padded), or from its name when that name is unique. */
    private static function resolveWard(string $nameOrCode): ?Ward
    {
        return self::getWardByCode($nameOrCode) ?? self::wardNames()->unique($nameOrCode);
    }

    private static function constituencyOfWardRecord(Ward $ward): ?Constituency
    {
        return self::getConstituencyByCode($ward->constituencyCode);
    }

    private static function countyOfWardRecord(Ward $ward): ?County
    {
        return self::getCountyByCode($ward->countyCode);
    }

    /** @return list<Ward> */
    private static function wardsInConstituency(Constituency $constituency): array
    {
        return array_values(array_filter(
            Dataset::wards(),
            static fn (Ward $item): bool => $item->constituencyCode === $constituency->code,
        ));
    }

    /** @return list<Area> */
    private static function areasOfLocality(Locality $locality): array
    {
        $name = NameIndex::lower($locality->name);

        return array_values(array_filter(
            Dataset::areas(),
            static fn (Area $item): bool => $item->countyCode === $locality->countyCode
                && NameIndex::lower($item->locality) === $name,
        ));
    }

    /**
     * Records whose `countyCode` is this county's code.
     *
     * @template T of SubCounty|Constituency|Locality|Area
     * @param list<T> $items
     * @return list<T>
     */
    private static function filterByCounty(array $items, County $county): array
    {
        return array_values(array_filter(
            $items,
            static fn (object $item): bool => $item->countyCode === $county->code,
        ));
    }

    /** @return NameIndex<County> */
    private static function countyNames(): NameIndex
    {
        return self::$countyNames ??= new NameIndex(Dataset::counties());
    }

    /** @return NameIndex<SubCounty> */
    private static function subCountyNames(): NameIndex
    {
        return self::$subCountyNames ??= new NameIndex(Dataset::subCounties());
    }

    /** @return NameIndex<Constituency> */
    private static function constituencyNames(): NameIndex
    {
        return self::$constituencyNames ??= new NameIndex(Dataset::constituencies());
    }

    /** @return NameIndex<Ward> */
    private static function wardNames(): NameIndex
    {
        return self::$wardNames ??= new NameIndex(Dataset::wards());
    }

    /** @return NameIndex<Locality> */
    private static function localityNames(): NameIndex
    {
        return self::$localityNames ??= new NameIndex(Dataset::localities());
    }

    /** @return NameIndex<Area> */
    private static function areaNames(): NameIndex
    {
        return self::$areaNames ??= new NameIndex(Dataset::areas());
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
}
