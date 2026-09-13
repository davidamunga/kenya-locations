<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Tests;

use KenyaLocations\KenyaLocations;
use KenyaLocations\SearchType;
use KenyaLocationsExample\Serializer;
use PHPUnit\Framework\TestCase;

final class SerializerTest extends TestCase
{
    public function testCountyUsesSnakeCaseDatasetKeys(): void
    {
        $nairobi = KenyaLocations::getCountyByCode('047');
        $this->assertNotNull($nairobi);

        $this->assertSame([
            'code' => '047',
            'name' => 'Nairobi',
            'capital' => 'Nairobi',
            'area_km2' => 694.9,
            'population_2019' => 4397073,
            'region' => 'Nairobi',
            'postal_code' => '00100',
        ], Serializer::county($nairobi));
    }

    public function testWardAndConstituencyShape(): void
    {
        $constituency = KenyaLocations::getConstituencyByCode('274');
        $ward = KenyaLocations::getWardByCode('1370');
        $this->assertNotNull($constituency);
        $this->assertNotNull($ward);

        $this->assertSame([
            'code' => '274',
            'name' => 'Westlands',
            'county' => 'Nairobi',
        ], Serializer::constituency($constituency));

        $this->assertSame([
            'code' => '1370',
            'name' => 'Mountain view',
            'constituency' => 'Westlands',
        ], Serializer::ward($ward));
    }

    public function testSearchResultIncludesTypeAndItem(): void
    {
        $results = KenyaLocations::searchByType('Nairobi', SearchType::County, 1);
        $this->assertNotEmpty($results);

        $payload = Serializer::searchResult($results[0]);

        $this->assertSame('county', $payload['type']);
        $this->assertSame('Nairobi', $payload['name']);
        $this->assertSame('047', $payload['item']['code']);
        $this->assertSame(4397073, $payload['item']['population_2019']);
    }
}
