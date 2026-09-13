<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Tests;

use KenyaLocationsExample\Selection;
use PHPUnit\Framework\TestCase;

final class SelectionTest extends TestCase
{
    public function testFromNamesResolvesCountyLocalityArea(): void
    {
        $selection = Selection::fromNames('047', 'Karen', 'Hardy');

        $this->assertSame('047', $selection->countyCode);
        $this->assertSame('Nairobi', $selection->countyName);
        $this->assertSame('Karen', $selection->localityName);
        $this->assertSame('Hardy', $selection->areaName);
        $this->assertSame('Nairobi / Karen / Hardy', $selection->formatted());
    }

    public function testDropsAreaWhenLocalityDoesNotMatch(): void
    {
        $selection = Selection::fromNames('047', 'Westlands', 'Hardy');

        $this->assertSame('047', $selection->countyCode);
        $this->assertSame('Westlands', $selection->localityName);
        $this->assertNull($selection->areaName);
        $this->assertSame('Nairobi / Westlands', $selection->formatted());
    }

    public function testUnknownCountyIsEmpty(): void
    {
        $selection = Selection::fromNames('999', 'Karen', 'Hardy');

        $this->assertTrue($selection->isEmpty());
        $this->assertSame([], $selection->toMeta());
    }

    public function testToMetaAndFromMetaRoundTrip(): void
    {
        $selection = Selection::fromNames('047', 'Karen', 'Hardy');
        $restored = Selection::fromMeta($selection->toMeta());

        $this->assertSame($selection->countyCode, $restored->countyCode);
        $this->assertSame($selection->localityName, $restored->localityName);
        $this->assertSame($selection->areaName, $restored->areaName);
        $this->assertSame($selection->formatted(), $restored->formatted());
    }

    public function testAcceptsCountyNameAsWellAsCode(): void
    {
        $selection = Selection::fromNames('Nairobi', 'Karen', 'Hardy');

        $this->assertSame('047', $selection->countyCode);
        $this->assertSame('Karen', $selection->localityName);
    }
}
