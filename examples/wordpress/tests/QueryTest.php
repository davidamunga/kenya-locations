<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Tests;

use KenyaLocationsExample\Query;
use PHPUnit\Framework\TestCase;

final class QueryTest extends TestCase
{
    private Query $query;

    protected function setUp(): void
    {
        $this->query = new Query();
    }

    public function testListsAllCounties(): void
    {
        $this->assertCount(47, $this->query->counties());
    }

    public function testResolvesCountyByNameOrCode(): void
    {
        $this->assertSame('047', $this->query->county('Nairobi')?->code);
        $this->assertSame('Nairobi', $this->query->county('047')?->name);
    }

    public function testConstituenciesInCountyAcceptNameOrCode(): void
    {
        $byName = $this->query->constituenciesInCounty('Nairobi');
        $byCode = $this->query->constituenciesInCounty('047');

        $this->assertNotEmpty($byName);
        $this->assertSame(
            array_map(static fn ($item) => $item->code, $byName),
            array_map(static fn ($item) => $item->code, $byCode),
        );
        $this->assertContains('274', array_map(static fn ($item) => $item->code, $byName));
    }

    public function testUnknownCountyHasNoConstituencies(): void
    {
        $this->assertSame([], $this->query->constituenciesInCounty('Not A County'));
    }

    public function testWardsInWestlands(): void
    {
        $wards = $this->query->wardsInConstituency('Westlands');
        $codes = array_map(static fn ($ward) => $ward->code, $wards);

        $this->assertContains('1370', $codes);
    }

    public function testSearchFindsNairobiTypo(): void
    {
        $results = $this->query->search('Nairob', 5, 'county');

        $this->assertNotEmpty($results);
        $this->assertSame('Nairobi', $results[0]->name());
    }

    public function testSearchRejectsUnknownType(): void
    {
        $this->assertSame([], $this->query->search('Nairobi', 5, 'planet'));
    }

    public function testCheckoutStateMatchesNameOrIebcCode(): void
    {
        $this->assertSame('047', $this->query->countyFromCheckoutState('Nairobi')?->code);
        $this->assertSame('Nairobi', $this->query->countyFromCheckoutState('047')?->name);
    }

    public function testWooCommerceKeCodeIsNotAnIebcCounty(): void
    {
        $this->assertNull($this->query->countyFromCheckoutState('KE47'));
    }

    public function testWooCommerceStoreLabelMapsToCounty(): void
    {
        $this->assertSame('047', $this->query->countyFromWooCommerceLabel('Nairobi County')?->code);
        $this->assertSame('047', $this->query->countyFromWooCommerceLabel('Kenya — Nairobi County')?->code);
        $this->assertSame('Murang\'a', $this->query->countyFromWooCommerceLabel('Murang’a')?->name);
    }

    public function testLocalitiesAndAreasInNairobi(): void
    {
        $localities = $this->query->localitiesInCounty('047');
        $names = array_map(static fn ($item) => $item->name, $localities);

        $this->assertContains('Karen', $names);

        $areas = $this->query->areasInLocality('Karen', '047');
        $areaNames = array_map(static fn ($item) => $item->name, $areas);

        $this->assertContains('Hardy', $areaNames);
        $this->assertSame('Karen', $this->query->locality('Karen', 'Nairobi')?->name);
        $this->assertSame('Hardy', $this->query->area('Hardy', 'Karen', '047')?->name);
    }
}
