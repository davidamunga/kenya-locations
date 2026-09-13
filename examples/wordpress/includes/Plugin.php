<?php

declare(strict_types=1);

namespace KenyaLocationsExample;

use KenyaLocationsExample\Admin\LocationMetabox;
use KenyaLocationsExample\Fields\CascadingSelect;
use KenyaLocationsExample\Rest\LocationsController;
use KenyaLocationsExample\WooCommerce\CheckoutFields;
use KenyaLocationsExample\WooCommerce\StoreAddress;

final class Plugin
{
    public const VERSION = '0.1.2';
    public const TEXT_DOMAIN = 'kenya-locations';
    public const SCRIPT = 'kenya-locations-cascading';
    public const STYLE = 'kenya-locations-cascading';

    public static function boot(): void
    {
        add_action('rest_api_init', [LocationsController::class, 'register']);
        add_action('init', [self::class, 'registerShortcode']);
        add_action('add_meta_boxes', [LocationMetabox::class, 'register']);
        add_action('save_post', [LocationMetabox::class, 'save']);
        add_action('wp_enqueue_scripts', [self::class, 'registerAssets']);
        add_action('admin_enqueue_scripts', [self::class, 'registerAssets']);
        CheckoutFields::boot();
        StoreAddress::boot();
    }

    public static function dir(): string
    {
        return dirname(__DIR__);
    }

    public static function url(string $path = ''): string
    {
        return plugins_url($path, self::dir() . '/kenya-locations.php');
    }

    public static function query(): Query
    {
        static $query;

        return $query ??= new Query();
    }

    public static function registerShortcode(): void
    {
        add_shortcode('kenya_location', [self::class, 'shortcode']);
    }

    /**
     * @param array<string, string>|string $atts
     */
    public static function shortcode(array|string $atts): string
    {
        $atts = shortcode_atts(
            [
                'name' => 'kenya_location',
            ],
            is_array($atts) ? $atts : [],
            'kenya_location',
        );

        self::enqueueAssets();

        ob_start();
        CascadingSelect::render([
            'name' => (string) $atts['name'],
            'mode' => 'full',
        ]);

        return (string) ob_get_clean();
    }

    public static function registerAssets(): void
    {
        $base = self::url('assets');

        wp_register_style(
            self::STYLE,
            $base . '/css/cascading-select.css',
            [],
            self::VERSION,
        );

        wp_register_script(
            self::SCRIPT,
            $base . '/js/cascading-select.js',
            [],
            self::VERSION,
            true,
        );

        wp_localize_script(self::SCRIPT, 'kenyaLocations', [
            'root' => esc_url_raw(rest_url('kenya-locations/v1')),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);
    }

    public static function enqueueAssets(): void
    {
        wp_enqueue_style(self::STYLE);
        wp_enqueue_script(self::SCRIPT);
    }
}
