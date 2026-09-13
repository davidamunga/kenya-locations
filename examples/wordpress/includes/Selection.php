<?php

declare(strict_types=1);

namespace KenyaLocationsExample;

/**
 * A County → Locality → Area choice.
 *
 * Localities and areas have no administrative codes — persist names,
 * scoped to the county so reused names stay unambiguous.
 */
final readonly class Selection
{
    public const COUNTY = '_kenya_county';
    public const LOCALITY = '_kenya_locality';
    public const AREA = '_kenya_area';
    public const COUNTY_NAME = '_kenya_county_name';

    public function __construct(
        public ?string $countyCode,
        public ?string $countyName,
        public ?string $localityName,
        public ?string $areaName,
    ) {
    }

    public static function empty(): self
    {
        return new self(null, null, null, null);
    }

    /**
     * Resolve and validate a cascade. A child is dropped when its parent
     * does not match, so stored meta cannot drift.
     */
    public static function fromNames(
        ?string $county,
        ?string $locality,
        ?string $area,
        ?Query $query = null,
    ): self {
        $query ??= new Query();

        $resolvedCounty = $county ? $query->county($county) : null;
        if ($resolvedCounty === null) {
            return self::empty();
        }

        $resolvedLocality = $locality
            ? $query->locality($locality, $resolvedCounty->name)
            : null;

        $resolvedArea = ($resolvedLocality !== null && $area)
            ? $query->area($area, $resolvedLocality->name, $resolvedCounty->name)
            : null;

        return new self(
            $resolvedCounty->code,
            $resolvedCounty->name,
            $resolvedLocality?->name,
            $resolvedArea?->name,
        );
    }

    /**
     * @param array<string, string|null> $meta
     */
    public static function fromMeta(array $meta): self
    {
        return new self(
            self::nullIfEmpty($meta[self::COUNTY] ?? null),
            self::nullIfEmpty($meta[self::COUNTY_NAME] ?? null),
            self::nullIfEmpty($meta[self::LOCALITY] ?? null),
            self::nullIfEmpty($meta[self::AREA] ?? null),
        );
    }

    /**
     * @return array<string, string>
     */
    public function toMeta(): array
    {
        $pairs = [
            self::COUNTY => $this->countyCode,
            self::COUNTY_NAME => $this->countyName,
            self::LOCALITY => $this->localityName,
            self::AREA => $this->areaName,
        ];

        $meta = [];
        foreach ($pairs as $key => $value) {
            if ($value !== null && $value !== '') {
                $meta[$key] = $value;
            }
        }

        return $meta;
    }

    public function isEmpty(): bool
    {
        return $this->countyCode === null;
    }

    public function formatted(): string
    {
        return implode(' / ', array_filter([
            $this->countyName,
            $this->localityName,
            $this->areaName,
        ], static fn (?string $part): bool => $part !== null && $part !== ''));
    }

    private static function nullIfEmpty(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
