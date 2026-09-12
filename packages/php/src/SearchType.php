<?php

declare(strict_types=1);

namespace KenyaLocations;

enum SearchType: string
{
    case County = 'county';
    case SubCounty = 'sub-county';
    case Constituency = 'constituency';
    case Ward = 'ward';
    case Locality = 'locality';
    case Area = 'area';
}
