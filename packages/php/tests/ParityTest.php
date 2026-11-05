<?php

declare(strict_types=1);

namespace KenyaLocations\Tests;

use KenyaLocations\KenyaLocations;
use KenyaLocations\SearchType;
use PHPUnit\Framework\TestCase;

/**
 * Runs the cases shared by every language package (tests/parity/cases.json at the monorepo
 * root). JS is the reference implementation; see the file's "$comment" for what is compared.
 * Each test reports every mismatch, not just the first.
 */
final class ParityTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $cases;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/tests/parity/cases.json';
        if (!is_file($path)) {
            self::markTestSkipped('tests/parity/cases.json is only available in the monorepo.');
        }
        self::$cases = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @param list<string> $mismatches */
    private function assertNoMismatches(array $mismatches): void
    {
        $this->assertSame([], $mismatches, "Parity mismatches:\n" . implode("\n", $mismatches));
    }

    public function testLookupsMatch(): void
    {
        $mismatches = [];
        foreach (self::$cases['lookups'] as $c) {
            $arg = $c['arg'];
            $actual = match ($c['call']) {
                'countyByCode' => KenyaLocations::getCountyByCode($arg)?->name,
                'countyByName' => KenyaLocations::getCountyByName($arg)?->code,
                'constituencyByCode' => KenyaLocations::getConstituencyByCode($arg)?->name,
                'constituencyByName' => KenyaLocations::getConstituencyByName($arg)?->code,
            };
            if ($actual !== $c['expect']) {
                $mismatches[] = sprintf('%s(%s): expected %s, got %s', $c['call'], $arg, json_encode($c['expect']), json_encode($actual));
            }
        }
        $this->assertNoMismatches($mismatches);
    }

    public function testCountsMatch(): void
    {
        $mismatches = [];
        foreach (self::$cases['counts'] as $c) {
            $arg = $c['arg'];
            $actual = count(match ($c['call']) {
                'constituenciesInCounty' => KenyaLocations::getConstituenciesInCounty($arg),
                'wardsInCounty' => KenyaLocations::getWardsInCounty($arg),
                'subCountiesInCounty' => KenyaLocations::getSubCountiesInCounty($arg),
                'wardsInConstituency' => KenyaLocations::getWardsInConstituency($arg),
            });
            if ($actual !== $c['expect']) {
                $mismatches[] = sprintf('%s(%s): expected %d, got %d', $c['call'], $arg, $c['expect'], $actual);
            }
        }
        $this->assertNoMismatches($mismatches);
    }

    public function testAreasInLocalityMatch(): void
    {
        $mismatches = [];
        foreach (self::$cases['areasInLocality'] as $c) {
            $names = array_map(
                static fn ($a) => $a->name,
                KenyaLocations::getAreasInLocality($c['locality'], $c['county'] ?? null),
            );
            $label = sprintf('areasInLocality(%s, %s)', $c['locality'], $c['county'] ?? 'null');
            if (isset($c['expectCount']) && count($names) !== $c['expectCount']) {
                $mismatches[] = sprintf('%s: expected %d areas, got %d', $label, $c['expectCount'], count($names));
            }
            foreach ($c['includes'] ?? [] as $name) {
                if (!in_array($name, $names, true)) {
                    $mismatches[] = "$label: missing $name";
                }
            }
        }
        $this->assertNoMismatches($mismatches);
    }

    public function testLocalitiesInCountyMatch(): void
    {
        $mismatches = [];
        foreach (self::$cases['localitiesInCounty'] as $c) {
            $names = array_map(static fn ($l) => $l->name, KenyaLocations::getLocalitiesInCounty($c['county']));
            foreach ($c['includes'] as $name) {
                if (!in_array($name, $names, true)) {
                    $mismatches[] = sprintf('localitiesInCounty(%s): missing %s', $c['county'], $name);
                }
            }
        }
        $this->assertNoMismatches($mismatches);
    }

    public function testSearchMatches(): void
    {
        $mismatches = [];
        foreach (self::$cases['search'] as $c) {
            $results = KenyaLocations::search($c['query'], $c['limit']);
            $hits = array_map(static fn ($r) => $r->type->value . ':' . $r->name(), $results);
            if (($c['empty'] ?? false) && $results !== []) {
                $mismatches[] = sprintf('search("%s"): expected no results, got %d', $c['query'], count($results));
            }
            foreach ($c['includes'] ?? [] as $want) {
                if (!in_array($want['type'] . ':' . $want['name'], $hits, true)) {
                    $mismatches[] = sprintf('search("%s"): missing %s:%s; got %s', $c['query'], $want['type'], $want['name'], implode(' | ', $hits));
                }
            }
        }
        $this->assertNoMismatches($mismatches);
    }

    public function testSearchByTypeMatches(): void
    {
        $mismatches = [];
        foreach (self::$cases['searchByType'] as $c) {
            $type = SearchType::from($c['type']);
            $results = KenyaLocations::searchByType($c['query'], $type, $c['limit']);
            $label = sprintf('searchByType("%s", %s)', $c['query'], $c['type']);
            if (($c['nonEmpty'] ?? false) && $results === []) {
                $mismatches[] = "$label: expected results, got none";
            }
            foreach ($results as $r) {
                if ($r->type !== $type) {
                    $mismatches[] = "$label: returned other types";
                    break;
                }
            }
            $names = array_map(static fn ($r) => $r->name(), $results);
            foreach ($c['includes'] ?? [] as $name) {
                if (!in_array($name, $names, true)) {
                    $mismatches[] = "$label: missing $name";
                }
            }
        }
        $this->assertNoMismatches($mismatches);
    }
}
