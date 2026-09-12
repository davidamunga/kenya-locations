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
        );
    }

    public function __construct(
        public string $code,
        public string $name,
        public string $constituency,
    ) {
    }
}
