<?php

declare(strict_types=1);

namespace KenyaLocations;

/**
 * A Kenyan county with administrative and demographic metadata.
 */
final readonly class County
{
    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            code: (string) $data['code'],
            name: (string) $data['name'],
            capital: (string) $data['capital'],
            areaKm2: (float) $data['area_km2'],
            population2019: (int) $data['population_2019'],
            region: (string) $data['region'],
            postalCode: (string) $data['postal_code'],
        );
    }

    public function __construct(
        public string $code,
        public string $name,
        public string $capital,
        public float $areaKm2,
        public int $population2019,
        public string $region,
        public string $postalCode,
    ) {
    }
}
