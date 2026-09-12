<?php

declare(strict_types=1);

namespace KenyaLocations;

final readonly class Area
{
    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) $data['name'],
            locality: (string) $data['locality'],
            county: (string) $data['county'],
        );
    }

    public function __construct(
        public string $name,
        public string $locality,
        public string $county,
    ) {
    }
}
