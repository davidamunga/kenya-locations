<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Fields;

use KenyaLocationsExample\Plugin;
use KenyaLocationsExample\Selection;

final class CascadingSelect
{
    /**
     * @param array{
     *     name?: string,
     *     mode?: 'full'|'child',
     *     selection?: Selection,
     *     county_from?: string,
     *     country_from?: string,
     *     id_prefix?: string
     * } $args
     */
    public static function render(array $args): void
    {
        $name = $args['name'] ?? 'kenya_location';
        $mode = $args['mode'] ?? 'full';
        $selection = $args['selection'] ?? Selection::empty();
        $idPrefix = $args['id_prefix'] ?? preg_replace('/[^a-z0-9]+/i', '-', $name) ?: 'kenya-location';
        $query = Plugin::query();

        $localities = $selection->countyCode
            ? $query->localitiesInCounty($selection->countyCode)
            : [];
        $areas = $selection->localityName
            ? $query->areasInLocality($selection->localityName, $selection->countyCode)
            : [];

        $rootAttrs = [
            'class' => 'kenya-locations',
            'data-kenya-locations' => '1',
        ];
        if ($mode === 'child') {
            if (isset($args['county_from'])) {
                $rootAttrs['data-kenya-county-from'] = $args['county_from'];
            }
            if (isset($args['country_from'])) {
                $rootAttrs['data-kenya-country-from'] = $args['country_from'];
            }
        }

        echo '<div';
        foreach ($rootAttrs as $attr => $value) {
            echo ' ' . esc_attr($attr) . '="' . esc_attr((string) $value) . '"';
        }
        echo '>';

        if ($mode === 'full') {
            self::select(
                id: $idPrefix . '-county',
                name: $name . '[county]',
                label: __('County', 'kenya-locations'),
                field: 'county',
                placeholder: __('Select county', 'kenya-locations'),
                selected: $selection->countyCode,
                options: array_map(
                    static fn ($county): array => ['value' => $county->code, 'name' => $county->name],
                    $query->counties(),
                ),
            );
        }

        self::select(
            id: $idPrefix . '-locality',
            name: $name . '[locality]',
            label: __('Locality', 'kenya-locations'),
            field: 'locality',
            placeholder: __('Select locality', 'kenya-locations'),
            selected: $selection->localityName,
            options: array_map(
                static fn ($locality): array => ['value' => $locality->name, 'name' => $locality->name],
                $localities,
            ),
        );

        self::select(
            id: $idPrefix . '-area',
            name: $name . '[area]',
            label: __('Area', 'kenya-locations'),
            field: 'area',
            placeholder: __('Select area', 'kenya-locations'),
            selected: $selection->areaName,
            options: array_map(
                static fn ($area): array => ['value' => $area->name, 'name' => $area->name],
                $areas,
            ),
        );

        echo '</div>';
    }

    /**
     * @param list<array{value: string, name: string}> $options
     */
    private static function select(
        string $id,
        string $name,
        string $label,
        string $field,
        string $placeholder,
        ?string $selected,
        array $options,
    ): void {
        echo '<p class="kenya-locations__field">';
        echo '<label for="' . esc_attr($id) . '">' . esc_html($label) . '</label>';
        echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($name) . '"';
        echo ' data-kenya-field="' . esc_attr($field) . '"';
        echo ' data-placeholder="' . esc_attr($placeholder) . '"';
        if ($selected) {
            echo ' data-selected="' . esc_attr($selected) . '"';
        }
        echo '>';
        echo '<option value="">' . esc_html($placeholder) . '</option>';
        foreach ($options as $option) {
            echo '<option value="' . esc_attr($option['value']) . '"';
            echo selected($selected, $option['value'], false);
            echo '>' . esc_html($option['name']) . '</option>';
        }
        echo '</select></p>';
    }
}
