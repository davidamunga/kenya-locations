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
        add_filter('render_block_woocommerce/checkout', [self::class, 'renderClassicInsteadOfBlock'], 5, 2);
        add_action('woocommerce_after_checkout_billing_form', [self::class, 'billing']);
        add_action('woocommerce_after_checkout_shipping_form', [self::class, 'shipping']);
        add_action('woocommerce_checkout_create_order', [self::class, 'saveOrder']);
        add_action('woocommerce_admin_order_data_after_billing_address', [self::class, 'adminBilling']);
        add_action('woocommerce_admin_order_data_after_shipping_address', [self::class, 'adminShipping']);
        add_filter('woocommerce_email_order_meta_fields', [self::class, 'emailFields'], 10, 3);
        add_action('woocommerce_order_details_after_customer_details', [self::class, 'orderDetails']);
    }

    /**
     * The Checkout block never fires woocommerce_after_checkout_billing_form.
     * On the storefront, render the classic shortcode instead so Locality / Area
     * appear without editing the page.
     *
     * @param array<string, mixed> $block
     */
    public static function renderClassicInsteadOfBlock(string $content, array $block = []): string
    {
        unset($block);

        if (!self::shouldReplaceCheckoutBlock('woocommerce/checkout', self::isFrontendCheckout())) {
            return $content;
        }

        if (!apply_filters('kenya_locations_replace_checkout_block', true)) {
            return $content;
        }

        Plugin::enqueueAssets();

        return '<div class="kenya-locations-classic-checkout woocommerce">'
            . do_shortcode('[woocommerce_checkout]')
            . '</div>';
    }

    public static function shouldReplaceCheckoutBlock(string $blockName, bool $isFrontendCheckout): bool
    {
        return $isFrontendCheckout && $blockName === 'woocommerce/checkout';
    }

    public static function billing(): void
    {
        if (!self::isCheckout()) {
            return;
        }

        Plugin::enqueueAssets();
        echo '<div class="kenya-locations-checkout kenya-locations-checkout--billing">';
        CascadingSelect::render(self::checkoutSelectArgs('billing'));
        echo '</div>';
    }

    public static function shipping(): void
    {
        if (!self::isCheckout()) {
            return;
        }

        Plugin::enqueueAssets();
        echo '<div class="kenya-locations-checkout kenya-locations-checkout--shipping">';
        CascadingSelect::render(self::checkoutSelectArgs('shipping'));
        echo '</div>';
    }

    public static function saveOrder(WC_Order $order): void
    {
        $billing = self::selectionFromPost('billing_kenya', $order->get_billing_state());
        self::writeOrderMeta($order, 'billing', $billing);
        self::syncOrderState($order, 'billing', $billing);

        $shippingState = $order->get_shipping_state();
        $shipping = self::selectionFromPost(
            'shipping_kenya',
            is_string($shippingState) && $shippingState !== '' ? $shippingState : $order->get_billing_state(),
        );
        self::writeOrderMeta($order, 'shipping', $shipping);
        self::syncOrderState($order, 'shipping', $shipping);
    }

    public static function adminBilling(WC_Order $order): void
    {
        self::adminBlock($order, 'billing', __('County / location / area', 'kenya-locations'));
    }

    public static function adminShipping(WC_Order $order): void
    {
        self::adminBlock($order, 'shipping', __('Shipping county / location / area', 'kenya-locations'));
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
                'label' => __('County / location / area', 'kenya-locations'),
                'value' => $billing->formatted(),
            ];
        }

        $shipping = self::fromOrder($order, 'shipping');
        if (!$shipping->isEmpty() && $shipping->formatted() !== $billing->formatted()) {
            $fields['kenya_shipping'] = [
                'label' => __('Shipping county / location / area', 'kenya-locations'),
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
        echo '<h2>' . esc_html__('County / location / area', 'kenya-locations') . '</h2>';
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

    /**
     * @param 'billing'|'shipping' $group
     * @return array{
     *     name: string,
     *     mode: 'full',
     *     country_from: string,
     *     sync_state: string,
     *     id_prefix: string,
     *     locality_label: string,
     *     locality_placeholder: string,
     *     field_class: string,
     *     variant: 'path',
     *     kicker: string,
     *     path_empty: string
     * }
     */
    private static function checkoutSelectArgs(string $group): array
    {
        return [
            'name' => $group . '_kenya',
            'mode' => 'full',
            'country_from' => '#' . $group . '_country',
            'sync_state' => '#' . $group . '_state',
            'id_prefix' => $group . '-kenya',
            'locality_label' => __('Location', 'kenya-locations'),
            'locality_placeholder' => __('Select location', 'kenya-locations'),
            'field_class' => 'kenya-locations__field',
            'variant' => 'path',
            'kicker' => __('Location', 'kenya-locations'),
            'path_empty' => '',
        ];
    }

    /**
     * @param 'billing'|'shipping' $group
     */
    private static function syncOrderState(WC_Order $order, string $group, Selection $selection): void
    {
        $state = self::wooCommerceStateCode($selection->countyCode);
        if ($state === null) {
            return;
        }

        if ($group === 'shipping') {
            $order->set_shipping_state($state);

            return;
        }

        $order->set_billing_state($state);
    }

    private static function wooCommerceStateCode(?string $countyCode): ?string
    {
        if ($countyCode === null || $countyCode === '' || !function_exists('WC') || WC()->countries === null) {
            return null;
        }

        $county = Plugin::query()->county($countyCode);
        if ($county === null) {
            return null;
        }

        foreach (WC()->countries->get_states('KE') ?: [] as $code => $label) {
            if (Plugin::query()->countyFromWooCommerceLabel((string) $label)?->code === $county->code) {
                return (string) $code;
            }
        }

        return null;
    }

    private static function isCheckout(): bool
    {
        return function_exists('is_checkout') && is_checkout();
    }

    private static function isFrontendCheckout(): bool
    {
        if (is_admin() && !wp_doing_ajax()) {
            return false;
        }

        if (!function_exists('is_checkout') || !is_checkout()) {
            return false;
        }

        return !function_exists('is_wc_endpoint_url') || !is_wc_endpoint_url();
    }

    private static function selectionFromPost(string $field, string $state): Selection
    {
        $raw = $_POST[$field] ?? [];
        if (!is_array($raw)) {
            $raw = [];
        }

        $county = null;
        if (isset($raw['county']) && is_string($raw['county'])) {
            $county = Plugin::query()->county(sanitize_text_field(wp_unslash($raw['county'])));
        }
        if ($county === null) {
            $county = Plugin::query()->countyFromCheckoutState($state);
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
