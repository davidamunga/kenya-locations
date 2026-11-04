<?php

declare(strict_types=1);

namespace KenyaLocations;

final readonly class Locality
{
    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) $data['name'],
            county: (string) $data['county'],
            countyCode: (string) $data['county_code'],
        );
    }

    public function __construct(
        public string $name,
        public string $county,
        /** Code of the parent county, e.g. "047". */
        public string $countyCode,
    ) {
    }
}
