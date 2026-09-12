<?php

declare(strict_types=1);

namespace KenyaLocations;

/**
 * A ranked search hit and the location entity it matched.
 */
final readonly class SearchResult
{
    public function __construct(
        public SearchType $type,
        public County|SubCounty|Constituency|Ward|Locality|Area $item,
    ) {
    }

    public function name(): string
    {
        return $this->item->name;
    }
}
