<?php

declare(strict_types=1);

namespace KenyaLocationsExample\WooCommerce;

use KenyaLocationsExample\Fields\CascadingSelect;
use KenyaLocationsExample\Plugin;
use KenyaLocationsExample\Selection;
use WC_Order;

final class CheckoutFields
{
    public static function boot(): void
    {
        add_action('woocommerce_after_checkout_billing_form', [self::class, 'billing']);
        add_action('woocommerce_after_checkout_shipping_form', [self::class, 'shipping']);
        add_action('woocommerce_checkout_create_order', [self::class, 'saveOrder']);
        add_action('woocommerce_admin_order_data_after_billing_address', [self::class, 'adminBilling']);
        add_action('woocommerce_admin_order_data_after_shipping_address', [self::class, 'adminShipping']);
        add_filter('woocommerce_email_order_meta_fields', [self::class, 'emailFields'], 10, 3);
        add_action('woocommerce_order_details_after_customer_details', [self::class, 'orderDetails']);
    }

    public static function billing(): void
    {
        if (!self::isCheckout()) {
            return;
        }

        Plugin::enqueueAssets();
        echo '<div class="kenya-locations-checkout kenya-locations-checkout--billing">';
        echo '<h3>' . esc_html__('Locality and area', 'kenya-locations') . '</h3>';
        CascadingSelect::render([
            'name' => 'billing_kenya',
            'mode' => 'child',
            'county_from' => '#billing_state',
            'country_from' => '#billing_country',
            'id_prefix' => 'billing-kenya',
        ]);
        echo '</div>';
    }

    public static function shipping(): void
    {
        if (!self::isCheckout()) {
            return;
        }

        Plugin::enqueueAssets();
        echo '<div class="kenya-locations-checkout kenya-locations-checkout--shipping">';
        CascadingSelect::render([
            'name' => 'shipping_kenya',
            'mode' => 'child',
            'county_from' => '#shipping_state',
            'country_from' => '#shipping_country',
            'id_prefix' => 'shipping-kenya',
        ]);
        echo '</div>';
    }

    public static function saveOrder(WC_Order $order): void
    {
        $billing = self::selectionFromPost('billing_kenya', $order->get_billing_state());
        self::writeOrderMeta($order, 'billing', $billing);

        $shippingState = $order->get_shipping_state();
        $shipping = self::selectionFromPost(
            'shipping_kenya',
            is_string($shippingState) && $shippingState !== '' ? $shippingState : $order->get_billing_state(),
        );
        self::writeOrderMeta($order, 'shipping', $shipping);
    }

    public static function adminBilling(WC_Order $order): void
    {
        self::adminBlock($order, 'billing', __('Locality / area', 'kenya-locations'));
    }

    public static function adminShipping(WC_Order $order): void
    {
        self::adminBlock($order, 'shipping', __('Shipping locality / area', 'kenya-locations'));
    }

    /**
     * @param array<string, array{label: string, value: string}> $fields
     * @return array<string, array{label: string, value: string}>
     */
    public static function emailFields(array $fields, bool $sentToAdmin, WC_Order $order): array
    {
        unset($sentToAdmin);

        $billing = self::fromOrder($order, 'billing');
        if (!$billing->isEmpty()) {
            $fields['kenya_billing'] = [
                'label' => __('Locality / area', 'kenya-locations'),
                'value' => $billing->formatted(),
            ];
        }

        $shipping = self::fromOrder($order, 'shipping');
        if (!$shipping->isEmpty() && $shipping->formatted() !== $billing->formatted()) {
            $fields['kenya_shipping'] = [
                'label' => __('Shipping locality / area', 'kenya-locations'),
                'value' => $shipping->formatted(),
            ];
        }

        return $fields;
    }

    public static function orderDetails(WC_Order $order): void
    {
        $billing = self::fromOrder($order, 'billing');
        if ($billing->isEmpty()) {
            return;
        }

        echo '<section class="woocommerce-kenya-location">';
        echo '<h2>' . esc_html__('Locality / area', 'kenya-locations') . '</h2>';
        echo '<p>' . esc_html($billing->formatted()) . '</p>';
        echo '</section>';
    }

    /**
     * @param 'billing'|'shipping' $group
     */
    public static function fromOrder(WC_Order $order, string $group): Selection
    {
        $prefix = $group === 'shipping' ? '_kenya_shipping' : '_kenya';

        $read = static function (string $suffix) use ($order, $prefix): ?string {
            $value = $order->get_meta($prefix . $suffix, true);

            return is_string($value) && $value !== '' ? $value : null;
        };

        return Selection::fromMeta([
            Selection::COUNTY => $read('_county'),
            Selection::COUNTY_NAME => $read('_county_name'),
            Selection::LOCALITY => $read('_locality'),
            Selection::AREA => $read('_area'),
        ]);
    }

    private static function isCheckout(): bool
    {
        return function_exists('is_checkout') && is_checkout();
    }

    private static function selectionFromPost(string $field, string $state): Selection
    {
        $raw = $_POST[$field] ?? [];
        if (!is_array($raw)) {
            $raw = [];
        }

        $county = Plugin::query()->countyFromCheckoutState($state);
        if ($county === null && isset($raw['county']) && is_string($raw['county'])) {
            $county = Plugin::query()->county(sanitize_text_field(wp_unslash($raw['county'])));
        }

        return Selection::fromNames(
            $county?->code,
            self::posted($raw, 'locality'),
            self::posted($raw, 'area'),
        );
    }

    /**
     * @param 'billing'|'shipping' $group
     */
    private static function writeOrderMeta(WC_Order $order, string $group, Selection $selection): void
    {
        $prefix = $group === 'shipping' ? '_kenya_shipping' : '_kenya';

        foreach ([
            '_county',
            '_county_name',
            '_locality',
            '_area',
            '_constituency',
            '_ward',
            '_constituency_name',
            '_ward_name',
        ] as $suffix) {
            $order->delete_meta_data($prefix . $suffix);
        }

        $map = [
            '_county' => $selection->countyCode,
            '_county_name' => $selection->countyName,
            '_locality' => $selection->localityName,
            '_area' => $selection->areaName,
        ];

        foreach ($map as $suffix => $value) {
            if ($value !== null && $value !== '') {
                $order->update_meta_data($prefix . $suffix, $value);
            }
        }
    }

    /**
     * @param 'billing'|'shipping' $group
     */
    private static function adminBlock(WC_Order $order, string $group, string $label): void
    {
        $selection = self::fromOrder($order, $group);
        if ($selection->isEmpty()) {
            return;
        }

        echo '<p><strong>' . esc_html($label) . ':</strong> ' . esc_html($selection->formatted()) . '</p>';
    }

    /**
     * @param array<mixed> $raw
     */
    private static function posted(array $raw, string $key): ?string
    {
        if (!isset($raw[$key]) || !is_string($raw[$key])) {
            return null;
        }

        $value = sanitize_text_field(wp_unslash($raw[$key]));

        return $value === '' ? null : $value;
    }
}
