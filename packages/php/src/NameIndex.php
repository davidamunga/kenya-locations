<?php

declare(strict_types=1);

namespace KenyaLocations;

use Normalizer;

/**
 * @internal
 *
 * Name index shared by every by-name lookup.
 *
 * Case-insensitive exact matches win. Only when there are none is a looser
 * "folded" match tried, which ignores accents, spaces and punctuation
 * ("Muranga" finds "Murang'a").
 *
 * @template T of object{name: string}
 */
final class NameIndex
{
    /** @var array<string, list<T>> */
    private array $exact = [];

    /** @var array<string, list<T>> */
    private array $folded = [];

    /**
     * @param list<T> $items
     */
    public function __construct(array $items)
    {
        foreach ($items as $item) {
            $this->exact[self::lower($item->name)][] = $item;
            $this->folded[self::fold($item->name)][] = $item;
        }
    }

    /**
     * Every record with this name.
     *
     * @return list<T>
     */
    public function all(string $name): array
    {
        return $this->exact[self::lower($name)] ?? $this->folded[self::fold($name)] ?? [];
    }

    /**
     * The record with this name, or null when there are none or several.
     *
     * @return T|null
     */
    public function unique(string $name): ?object
    {
        $matches = $this->all($name);

        return count($matches) === 1 ? $matches[0] : null;
    }

    /** Lowercase and trim. */
    public static function lower(string $value): string
    {
        return mb_strtolower(trim($value));
    }

    /** Ignore case, accents, spaces and punctuation: "Murang'a" → "muranga". */
    public static function fold(string $value): string
    {
        if (class_exists(Normalizer::class)) {
            $decomposed = Normalizer::normalize($value, Normalizer::FORM_D);
            if (is_string($decomposed)) {
                $value = (string) preg_replace('/\p{Mn}+/u', '', $decomposed);
            }
        }

        return (string) preg_replace('/[^a-z0-9]/', '', mb_strtolower($value));
    }

    /** Zero-pad an all-digit code to `$width`; other input is returned trimmed. */
    public static function normaliseCode(string $value, int $width): string
    {
        $trimmed = trim($value);

        return preg_match('/^\d+$/', $trimmed) === 1
            ? str_pad($trimmed, $width, '0', STR_PAD_LEFT)
            : $trimmed;
    }
}
