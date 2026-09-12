<?php

declare(strict_types=1);

namespace KenyaLocations;

use JsonException;
use RuntimeException;

/**
 * @internal
 *
 * Loads and caches the shared JSON location files.
 *
 * Looks in `packages/php/data` first (copied for publish / CI), then the
 * monorepo `data/` directory so local tests work without a copy step.
 */
final class Dataset
{
    /** @var array<string, list<array<string, mixed>>> */
    private static array $raw = [];

    /** @var list<County>|null */
    private static ?array $counties = null;

    /** @var list<SubCounty>|null */
    private static ?array $subCounties = null;

    /** @var list<Constituency>|null */
    private static ?array $constituencies = null;

    /** @var list<Ward>|null */
    private static ?array $wards = null;

    /** @var list<Locality>|null */
    private static ?array $localities = null;

    /** @var list<Area>|null */
    private static ?array $areas = null;

    /** @return list<County> */
    public static function counties(): array
    {
        return self::$counties ??= array_map(
            County::fromArray(...),
            self::load('counties.json'),
        );
    }

    /** @return list<SubCounty> */
    public static function subCounties(): array
    {
        return self::$subCounties ??= array_map(
            SubCounty::fromArray(...),
            self::load('sub-counties.json'),
        );
    }

    /** @return list<Constituency> */
    public static function constituencies(): array
    {
        return self::$constituencies ??= array_map(
            Constituency::fromArray(...),
            self::load('constituencies.json'),
        );
    }

    /** @return list<Ward> */
    public static function wards(): array
    {
        return self::$wards ??= array_map(
            Ward::fromArray(...),
            self::load('wards.json'),
        );
    }

    /** @return list<Locality> */
    public static function localities(): array
    {
        return self::$localities ??= array_map(
            Locality::fromArray(...),
            self::load('locality.json'),
        );
    }

    /** @return list<Area> */
    public static function areas(): array
    {
        return self::$areas ??= array_map(
            Area::fromArray(...),
            self::load('area.json'),
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function load(string $filename): array
    {
        if (isset(self::$raw[$filename])) {
            return self::$raw[$filename];
        }

        $path = self::resolvePath($filename);
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException("kenya-locations: unable to read {$path}");
        }

        try {
            $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("kenya-locations: invalid JSON in {$filename}", 0, $exception);
        }

        if (!is_array($decoded) || !array_is_list($decoded)) {
            throw new RuntimeException("kenya-locations: {$filename} must be a JSON array");
        }

        /** @var list<array<string, mixed>> $decoded */
        self::$raw[$filename] = $decoded;

        return $decoded;
    }

    private static function resolvePath(string $filename): string
    {
        foreach (self::dataDirectories() as $directory) {
            $path = $directory . DIRECTORY_SEPARATOR . $filename;
            if (is_file($path)) {
                return $path;
            }
        }

        throw new RuntimeException(
            "kenya-locations: {$filename} not found. Copy the shared data files with `composer copy-data`.",
        );
    }

    /**
     * @return list<string>
     */
    private static function dataDirectories(): array
    {
        $packageData = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        $repoData = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'data';

        $directories = [];
        foreach ([$packageData, $repoData] as $directory) {
            if (is_dir($directory)) {
                $directories[] = $directory;
            }
        }

        return $directories;
    }
}
