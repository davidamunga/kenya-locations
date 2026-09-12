<?php

declare(strict_types=1);

namespace KenyaLocations;

final readonly class SubCounty
{
    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            code: (string) $data['code'],
            name: (string) $data['name'],
            county: (string) $data['county'],
        );
    }

    public function __construct(
        public string $code,
        public string $name,
        public string $county,
    ) {
    }
}
