<?php

declare(strict_types=1);

namespace KenyaLocations;

final readonly class Ward
{
    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            code: (string) $data['code'],
            name: (string) $data['name'],
            constituency: (string) $data['constituency'],
            constituencyCode: (string) $data['constituency_code'],
            countyCode: (string) $data['county_code'],
        );
    }

    public function __construct(
        public string $code,
        public string $name,
        public string $constituency,
        /** Code of the parent constituency. */
        public string $constituencyCode,
        /** Code of the parent county, e.g. "047". */
        public string $countyCode,
    ) {
    }
}
