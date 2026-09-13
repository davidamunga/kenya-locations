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
     *     sync_state?: string,
     *     locality_label?: string,
     *     locality_placeholder?: string,
     *     field_class?: string,
     *     variant?: 'default'|'path',
     *     kicker?: string,
     *     path_empty?: string,
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

        $localityLabel = $args['locality_label'] ?? __('Locality', 'kenya-locations');
        $localityPlaceholder = $args['locality_placeholder'] ?? __('Select locality', 'kenya-locations');
        $fieldClass = $args['field_class'] ?? 'kenya-locations__field';
        $variant = $args['variant'] ?? 'default';
        $kicker = $args['kicker'] ?? '';
        $pathEmpty = $args['path_empty'] ?? '';
        $pathId = $idPrefix . '-path';

        $rootClass = $variant === 'path' ? 'kenya-locations kenya-locations--path' : 'kenya-locations';
        $rootAttrs = [
            'class' => $rootClass,
            'data-kenya-locations' => '1',
        ];
        if (isset($args['county_from'])) {
            $rootAttrs['data-kenya-county-from'] = $args['county_from'];
        }
        if (isset($args['country_from'])) {
            $rootAttrs['data-kenya-country-from'] = $args['country_from'];
        }
        if (isset($args['sync_state'])) {
            $rootAttrs['data-kenya-sync-state'] = $args['sync_state'];
        }

        echo '<div';
        foreach ($rootAttrs as $attr => $value) {
            echo ' ' . esc_attr($attr) . '="' . esc_attr((string) $value) . '"';
        }
        echo '>';

        if ($variant === 'path') {
            echo '<div class="kenya-locations__intro">';
            if ($kicker !== '') {
                echo '<p class="kenya-locations__kicker">' . esc_html($kicker) . '</p>';
            }
            echo '<p class="kenya-locations__path" data-kenya-path data-empty="' . esc_attr($pathEmpty) . '" id="' . esc_attr($pathId) . '" aria-live="polite">';
            echo esc_html($pathEmpty);
            echo '</p></div><div class="kenya-locations__steps">';
        }

        $step = 1;
        if ($mode === 'full') {
            self::select(
                id: $idPrefix . '-county',
                name: $name . '[county]',
                label: __('County', 'kenya-locations'),
                field: 'county',
                placeholder: __('Select county', 'kenya-locations'),
                selected: $selection->countyCode,
                fieldClass: $fieldClass,
                describedBy: $variant === 'path' ? $pathId : null,
                step: $variant === 'path' ? $step++ : null,
                options: array_map(
                    static fn ($county): array => ['value' => $county->code, 'name' => $county->name],
                    $query->counties(),
                ),
            );
        }

        self::select(
            id: $idPrefix . '-locality',
            name: $name . '[locality]',
            label: $localityLabel,
            field: 'locality',
            placeholder: $localityPlaceholder,
            selected: $selection->localityName,
            fieldClass: $fieldClass,
            describedBy: null,
            step: $variant === 'path' ? $step++ : null,
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
            fieldClass: $fieldClass,
            describedBy: null,
            step: $variant === 'path' ? $step : null,
            options: array_map(
                static fn ($area): array => ['value' => $area->name, 'name' => $area->name],
                $areas,
            ),
        );

        if ($variant === 'path') {
            echo '</div>';
        }

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
        string $fieldClass,
        ?string $describedBy,
        ?int $step,
        array $options,
    ): void {
        echo '<p class="' . esc_attr($fieldClass) . '">';
        echo '<label for="' . esc_attr($id) . '">';
        if ($step !== null) {
            echo '<span class="kenya-locations__index" aria-hidden="true">' . esc_html(str_pad((string) $step, 2, '0', STR_PAD_LEFT)) . '</span>';
        }
        echo esc_html($label) . '</label>';
        echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($name) . '"';
        echo ' data-kenya-field="' . esc_attr($field) . '"';
        echo ' data-placeholder="' . esc_attr($placeholder) . '"';
        if ($describedBy) {
            echo ' aria-describedby="' . esc_attr($describedBy) . '"';
        }
        if ($selected) {
            echo ' data-selected="' . esc_attr($selected) . '"';
        }
        if ($options === [] && $field !== 'county') {
            echo ' disabled';
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
