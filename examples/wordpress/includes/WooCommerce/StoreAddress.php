<?php

declare(strict_types=1);

namespace KenyaLocationsExample\WooCommerce;

use KenyaLocations\County;
use KenyaLocationsExample\Plugin;
use KenyaLocationsExample\Selection;

/**
 * Locality + area on WooCommerce → Settings → General → Store Address.
 */
final class StoreAddress
{
    public const LOCALITY = 'woocommerce_store_locality';
    public const AREA = 'woocommerce_store_area';

    public static function boot(): void
    {
        add_filter('woocommerce_general_settings', [self::class, 'settings']);
        add_action('woocommerce_admin_field_kenya_location_select', [self::class, 'renderSelect']);
        add_action('woocommerce_update_options_general', [self::class, 'syncNames']);
        add_action('admin_enqueue_scripts', [self::class, 'enqueue']);
    }

    /**
     * @param list<array<string, mixed>> $settings
     * @return list<array<string, mixed>>
     */
    public static function settings(array $settings): array
    {
        $extra = [
            [
                'title' => __('Locality', 'kenya-locations'),
                'desc' => __('Estate or neighbourhood for this store. Shown when the country is Kenya.', 'kenya-locations'),
                'id' => self::LOCALITY,
                'default' => '',
                'type' => 'kenya_location_select',
                'kenya_field' => 'locality',
                'desc_tip' => true,
            ],
            [
                'title' => __('Area', 'kenya-locations'),
                'desc' => __('Area within the locality for this store.', 'kenya-locations'),
                'id' => self::AREA,
                'default' => '',
                'type' => 'kenya_location_select',
                'kenya_field' => 'area',
                'desc_tip' => true,
            ],
        ];

        $out = [];
        foreach ($settings as $setting) {
            $out[] = $setting;
            if (($setting['id'] ?? '') === 'woocommerce_default_country') {
                foreach ($extra as $field) {
                    $out[] = $field;
                }
            }
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $value
     */
    public static function renderSelect(array $value): void
    {
        $id = (string) ($value['id'] ?? '');
        $field = (string) ($value['kenya_field'] ?? '');
        $selected = (string) get_option($id, $value['default'] ?? '');
        $options = self::optionsFor($field);
        $placeholder = $field === 'area'
            ? __('Select area', 'kenya-locations')
            : __('Select locality', 'kenya-locations');

        echo '<tr valign="top" class="kenya-locations-store-setting">';
        echo '<th scope="row" class="titledesc">';
        echo '<label for="' . esc_attr($id) . '">' . esc_html((string) ($value['title'] ?? '')) . '</label>';
        if (!empty($value['desc']) && function_exists('wc_help_tip')) {
            echo wc_help_tip((string) $value['desc']);
        }
        echo '</th><td class="forminp forminp-select">';
        echo '<select name="' . esc_attr($id) . '" id="' . esc_attr($id) . '"';
        echo ' data-kenya-field="' . esc_attr($field) . '"';
        echo ' data-placeholder="' . esc_attr($placeholder) . '"';
        if ($selected !== '') {
            echo ' data-selected="' . esc_attr($selected) . '"';
        }
        echo '>';
        echo '<option value="">' . esc_html($placeholder) . '</option>';
        foreach ($options as $option) {
            echo '<option value="' . esc_attr($option['value']) . '"';
            echo selected($selected, $option['value'], false);
            echo '>' . esc_html($option['name']) . '</option>';
        }
        echo '</select></td></tr>';
    }

    public static function enqueue(string $hook): void
    {
        if ($hook !== 'woocommerce_page_wc-settings') {
            return;
        }

        $tab = isset($_GET['tab']) ? sanitize_key((string) wp_unslash($_GET['tab'])) : 'general';
        if ($tab !== 'general') {
            return;
        }

        Plugin::enqueueAssets();
    }

    public static function syncNames(): void
    {
        $country = (string) get_option('woocommerce_default_country', '');
        $county = self::countyFromStoreCountry($country);
        $selection = Selection::fromNames(
            $county?->code,
            (string) get_option(self::LOCALITY, ''),
            (string) get_option(self::AREA, ''),
        );

        if ($county === null) {
            update_option(self::LOCALITY, '');
            update_option(self::AREA, '');

            return;
        }

        update_option(self::LOCALITY, $selection->localityName ?? '');
        update_option(self::AREA, $selection->areaName ?? '');
    }

    public static function countyFromStoreCountry(string $countryState): ?County
    {
        if ($countryState !== 'KE' && !str_starts_with($countryState, 'KE:')) {
            return null;
        }

        $state = str_contains($countryState, ':')
            ? explode(':', $countryState, 2)[1]
            : '';
        if ($state === '' || !function_exists('WC') || WC()->countries === null) {
            return Plugin::query()->county($state);
        }

        $label = (string) (WC()->countries->get_states('KE')[$state] ?? $state);

        return Plugin::query()->countyFromWooCommerceLabel($label);
    }

    /**
     * @return list<array{value: string, name: string}>
     */
    private static function optionsFor(string $field): array
    {
        $query = Plugin::query();
        $country = (string) get_option('woocommerce_default_country', '');
        $county = self::countyFromStoreCountry($country);

        if ($field === 'locality') {
            if ($county === null) {
                return [];
            }

            return array_map(
                static fn ($item): array => ['value' => $item->name, 'name' => $item->name],
                $query->localitiesInCounty($county->code),
            );
        }

        $locality = (string) get_option(self::LOCALITY, '');
        if ($locality === '' || $county === null) {
            return [];
        }

        return array_map(
            static fn ($item): array => ['value' => $item->name, 'name' => $item->name],
            $query->areasInLocality($locality, $county->code),
        );
    }
}
