<?php

declare(strict_types=1);

namespace KenyaLocations\Tests;

use KenyaLocations\County;
use KenyaLocations\KenyaLocations;
use KenyaLocations\SearchType;
use PHPUnit\Framework\TestCase;

final class KenyaLocationsTest extends TestCase
{
    public function testLoadsAll47Counties(): void
    {
        $this->assertCount(47, KenyaLocations::getCounties());
    }

    public function testFindsNairobiByName(): void
    {
        $nairobi = KenyaLocations::getCountyByName('Nairobi');

        $this->assertNotNull($nairobi);
        $this->assertSame('Nairobi', $nairobi->capital);
    }

    public function testCountyNameLookupIsCaseInsensitive(): void
    {
        $this->assertSame('Nairobi', KenyaLocations::getCountyByName('nairobi')?->name);
        $this->assertSame('Nairobi', KenyaLocations::getCountyByName('NAIROBI')?->name);
    }

    public function testFindsNairobiByCode(): void
    {
        $nairobi = KenyaLocations::getCountyByCode('047');

        $this->assertNotNull($nairobi);
        $this->assertSame('Nairobi', $nairobi->name);
        $this->assertSame(4397073, $nairobi->population2019);
        $this->assertSame('Nairobi', $nairobi->region);
    }

    public function testReturnsNullForUnknownCountyName(): void
    {
        $this->assertNull(KenyaLocations::getCountyByName('Unknown County'));
    }

    public function testReturnsNullForUnknownCountyCode(): void
    {
        $this->assertNull(KenyaLocations::getCountyByCode('999'));
    }

    public function testLoadsSubCounties(): void
    {
        $this->assertNotEmpty(KenyaLocations::getSubCounties());
    }

    public function testLoadsConstituencies(): void
    {
        $this->assertNotEmpty(KenyaLocations::getConstituencies());
    }

    public function testLoadsWards(): void
    {
        $this->assertNotEmpty(KenyaLocations::getWards());
    }

    public function testLoadsLocalities(): void
    {
        $this->assertNotEmpty(KenyaLocations::getLocalities());
    }

    public function testLoadsAreas(): void
    {
        $this->assertNotEmpty(KenyaLocations::getAreas());
    }

    public function testFindsConstituenciesInNairobiCounty(): void
    {
        $constituencies = KenyaLocations::getConstituenciesInCounty('Nairobi');

        $this->assertNotEmpty($constituencies);
        foreach ($constituencies as $constituency) {
            $this->assertSame('Nairobi', $constituency->county);
        }
    }

    public function testCountyScopedLookupsAreCaseInsensitive(): void
    {
        $this->assertNotEmpty(KenyaLocations::getConstituenciesInCounty('nairobi'));
        $this->assertNotEmpty(KenyaLocations::getSubCountiesInCounty('NAIROBI'));
        $this->assertNotEmpty(KenyaLocations::getWardsInCounty('Nairobi'));
        $this->assertNotEmpty(KenyaLocations::getLocalitiesInCounty('nairobi'));
        $this->assertNotEmpty(KenyaLocations::getAreasInCounty('Nairobi'));
    }

    public function testFindsWardsInAConstituency(): void
    {
        $wards = KenyaLocations::getWardsInConstituency('Westlands');

        $this->assertNotEmpty($wards);
        foreach ($wards as $ward) {
            $this->assertSame('Westlands', $ward->constituency);
        }
    }

    public function testFindsLocalitiesInACounty(): void
    {
        $localities = KenyaLocations::getLocalitiesInCounty('Nairobi');

        $this->assertNotEmpty($localities);
        foreach ($localities as $locality) {
            $this->assertSame('Nairobi', $locality->county);
        }
    }

    public function testFindsAreasInALocality(): void
    {
        $areas = KenyaLocations::getAreasInLocality('Westlands');

        $this->assertNotEmpty($areas);
        foreach ($areas as $area) {
            $this->assertSame('Westlands', $area->locality);
        }
    }

    public function testLooksUpConstituencyAndWardByCode(): void
    {
        $constituency = KenyaLocations::getConstituencyByCode('274');
        $ward = KenyaLocations::getWardByCode('1370');

        $this->assertSame('Westlands', $constituency?->name);
        $this->assertSame('Mountain view', $ward?->name);
    }

    public function testSearchFindsAnExactCountyMatch(): void
    {
        $results = KenyaLocations::search('Nairobi');

        $this->assertNotEmpty($results);
        $this->assertSame(SearchType::County, $results[0]->type);
        $this->assertInstanceOf(County::class, $results[0]->item);
        $this->assertSame('Nairobi', $results[0]->item->name);
    }

    public function testSearchIsCaseInsensitive(): void
    {
        $results = KenyaLocations::search('NAIROBI');

        $this->assertTrue($this->containsCounty($results, 'Nairobi'));
    }

    public function testSearchMatchesSubstrings(): void
    {
        $results = KenyaLocations::search('Nairo');

        $this->assertTrue($this->containsCounty($results, 'Nairobi'));
    }

    public function testSearchToleratesSpellingMistakes(): void
    {
        $results = KenyaLocations::search('Nairob');

        $this->assertTrue($this->containsCounty($results, 'Nairobi'));
    }

    public function testSearchReturnsFuzzyMatchesForTypos(): void
    {
        $results = KenyaLocations::search('Mombassa');

        $this->assertTrue($this->containsCounty($results, 'Mombasa'));
    }

    public function testSearchesAcrossSupportedLocationTypes(): void
    {
        $this->assertTrue(
            $this->containsType(KenyaLocations::search('Nairobi', limit: 1000), SearchType::County),
        );
        $this->assertTrue(
            $this->containsType(KenyaLocations::search('Alego Usonga', limit: 1000), SearchType::Constituency),
        );
        $this->assertTrue(
            $this->containsType(KenyaLocations::search('Bomet Central', limit: 1000), SearchType::SubCounty),
        );
        $this->assertTrue(
            $this->containsType(
                KenyaLocations::search(KenyaLocations::getWards()[0]->name, limit: 1000),
                SearchType::Ward,
            ),
        );
        $this->assertTrue(
            $this->containsType(
                KenyaLocations::search(KenyaLocations::getLocalities()[0]->name, limit: 1000),
                SearchType::Locality,
            ),
        );
        $this->assertTrue(
            $this->containsType(
                KenyaLocations::search(KenyaLocations::getAreas()[0]->name, limit: 1000),
                SearchType::Area,
            ),
        );
    }

    public function testSearchByTypeRestrictsResultsToOneType(): void
    {
        $results = KenyaLocations::searchByType('Nairobi', SearchType::County);

        $this->assertNotEmpty($results);
        foreach ($results as $result) {
            $this->assertSame(SearchType::County, $result->type);
        }
    }

    public function testSearchResultExposesADisplayName(): void
    {
        $results = KenyaLocations::search('Nairobi');

        $this->assertNotEmpty($results);
        $this->assertSame('Nairobi', $results[0]->name());
    }

    public function testSearchRespectsTheResultLimit(): void
    {
        $results = KenyaLocations::search('West', limit: 5);

        $this->assertCount(5, $results);
    }

    public function testResolvesAUniqueWardNameToItsConstituency(): void
    {
        $constituency = KenyaLocations::getConstituencyOfWard('Mountain view');

        $this->assertSame('Westlands', $constituency?->name);
    }

    public function testResolvesAWardByAdministrativeCode(): void
    {
        $constituency = KenyaLocations::getConstituencyOfWard('1370');

        $this->assertSame('Westlands', $constituency?->name);
    }

    public function testReturnsNullWhenAWardNameIsUsedMoreThanOnce(): void
    {
        $this->assertNull(KenyaLocations::getConstituencyOfWard('Township'));
    }

    public function testResolvesACollidingWardNameViaItsCode(): void
    {
        $constituency = KenyaLocations::getConstituencyOfWard('0133');

        $this->assertSame('Garissa Township', $constituency?->name);
    }

    public function testReturnsNullForAnUnknownWard(): void
    {
        $this->assertNull(KenyaLocations::getConstituencyOfWard('Unknown Ward'));
    }

    public function testSearchReturnsEmptyResultsForAQueryShorterThanTwoCharacters(): void
    {
        $this->assertSame([], KenyaLocations::search('a'));
    }

    public function testSearchReturnsEmptyResultsForAnUnknownLocation(): void
    {
        $this->assertSame([], KenyaLocations::search('zzzzzzzz'));
    }

    public function testSearchReturnsEmptyResultsForAZeroLimit(): void
    {
        $this->assertSame([], KenyaLocations::search('Nairobi', limit: 0));
    }

    public function testSearchRanksExactSubstringMatchesBeforeFuzzyMatches(): void
    {
        $results = KenyaLocations::search('Nairobi');

        $this->assertNotEmpty($results);
        $this->assertSame(SearchType::County, $results[0]->type);
        $this->assertSame('Nairobi', $results[0]->item->name);
    }

    public function testCountyScopedLookupsAcceptACountyCode(): void
    {
        $byName = KenyaLocations::getConstituenciesInCounty('Nairobi');
        $byCode = KenyaLocations::getConstituenciesInCounty('047');

        $this->assertNotEmpty($byCode);
        $this->assertCount(count($byName), $byCode);
        $this->assertNotEmpty(KenyaLocations::getSubCountiesInCounty('047'));
        $this->assertNotEmpty(KenyaLocations::getWardsInCounty('047'));
        $this->assertNotEmpty(KenyaLocations::getLocalitiesInCounty('047'));
        $this->assertNotEmpty(KenyaLocations::getAreasInCounty('047'));
    }

    public function testFindsWardsInAConstituencyByCode(): void
    {
        $byName = KenyaLocations::getWardsInConstituency('Westlands');
        $byCode = KenyaLocations::getWardsInConstituency('274');

        $this->assertNotEmpty($byCode);
        $this->assertCount(count($byName), $byCode);
        foreach ($byCode as $ward) {
            $this->assertSame('Westlands', $ward->constituency);
        }
    }

    public function testResolvesTheCountyOfAConstituencyByNameOrCode(): void
    {
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfConstituency('Westlands')?->name);
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfConstituency('274')?->name);
        $this->assertNull(KenyaLocations::getCountyOfConstituency('Nowhere'));
    }

    public function testResolvesTheCountyOfASubCounty(): void
    {
        $this->assertSame('Uasin Gishu', KenyaLocations::getCountyOfSubCounty('Ainabkoi')?->name);
        $this->assertSame('Uasin Gishu', KenyaLocations::getCountyOfSubCounty('154')?->name);
        $this->assertNull(KenyaLocations::getCountyOfSubCounty('Nowhere'));
    }

    public function testFindsWardsInASubCountyByNameOrCode(): void
    {
        $byName = KenyaLocations::getWardsInSubCounty('Ainabkoi');
        $byCode = KenyaLocations::getWardsInSubCounty('154');

        $this->assertNotEmpty($byName);
        $this->assertCount(count($byName), $byCode);
        foreach ($byName as $ward) {
            $this->assertSame('Ainabkoi', $ward->constituency);
        }
        $this->assertSame([], KenyaLocations::getWardsInSubCounty('Nowhere'));
    }

    public function testResolvesTheCountyOfAUniqueWard(): void
    {
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfWard('Mountain view')?->name);
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfWard('1370')?->name);
        $this->assertNull(KenyaLocations::getCountyOfWard('Township'));
        $this->assertSame('Garissa', KenyaLocations::getCountyOfWard('0133')?->name);
        $this->assertNull(KenyaLocations::getCountyOfWard('Unknown Ward'));
    }

    public function testResolvesTheSubCountyOfAUniqueWard(): void
    {
        $this->assertSame('Westlands', KenyaLocations::getSubCountyOfWard('Mountain view')?->name);
        $this->assertSame('Westlands', KenyaLocations::getSubCountyOfWard('1370')?->name);
        $this->assertNull(KenyaLocations::getSubCountyOfWard('Township'));
        $this->assertNull(KenyaLocations::getSubCountyOfWard('Unknown Ward'));
    }

    public function testResolvesTheCountyAndLocalityOfAnArea(): void
    {
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfArea('Gigiri')?->name);
        $this->assertSame('Westlands', KenyaLocations::getLocalityOfArea('Gigiri')?->name);
        $this->assertSame('Nairobi', KenyaLocations::getCountyOfLocality('Westlands')?->name);
        $this->assertNull(KenyaLocations::getCountyOfArea('Nowhere'));
        $this->assertNull(KenyaLocations::getLocalityOfArea('Nowhere'));
        $this->assertNull(KenyaLocations::getCountyOfLocality('Nowhere'));
    }

    public function testFindsEveryLocalitySharingAName(): void
    {
        $matches = KenyaLocations::getLocalitiesByName('Westlands');

        $this->assertNotEmpty($matches);
        foreach ($matches as $locality) {
            $this->assertSame('Westlands', $locality->name);
        }
        $this->assertSame([], KenyaLocations::getLocalitiesByName('Nowhere'));
    }

    public function testFindsEveryAreaSharingAName(): void
    {
        $first = KenyaLocations::getAreas()[0];
        $matches = KenyaLocations::getAreasByName($first->name);

        $this->assertNotEmpty($matches);
        $this->assertSame(
            count(KenyaLocations::getAreasByName(mb_strtolower($first->name))),
            count(KenyaLocations::getAreasByName(mb_strtoupper($first->name))),
        );
        $this->assertSame([], KenyaLocations::getAreasByName('NonExistentArea12345'));
    }

    public function testScopesALocalityLookupToACounty(): void
    {
        $westlands = KenyaLocations::getLocality('Westlands', 'Nairobi');

        $this->assertSame('Westlands', $westlands?->name);
        $this->assertSame('Nairobi', $westlands?->county);
        $this->assertNull(KenyaLocations::getLocality('Westlands', 'Mombasa'));
        $this->assertSame('Westlands', KenyaLocations::getLocality('Westlands')?->name);
    }

    /**
     * @param list<\KenyaLocations\SearchResult> $results
     */
    private function containsCounty(array $results, string $name): bool
    {
        foreach ($results as $result) {
            if ($result->type === SearchType::County && $result->item instanceof County && $result->item->name === $name) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param list<\KenyaLocations\SearchResult> $results
     */
    private function containsType(array $results, SearchType $type): bool
    {
        foreach ($results as $result) {
            if ($result->type === $type) {
                return true;
            }
        }

        return false;
    }
}
