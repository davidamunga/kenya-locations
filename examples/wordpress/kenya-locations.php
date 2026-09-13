<?php
/**
 * Plugin Name: Kenya Locations
 * Plugin URI: https://github.com/davidamunga/kenya-locations/releases
 * Description: Cascading County → Locality → Area fields backed by davidamunga/kenya-locations. Install from the GitHub release zip.
 * Version: 0.1.7
 * Requires at least: 6.4
 * Requires PHP: 8.2
 * Author: David Amunga
 * Author URI: https://davidamunga.com
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: kenya-locations
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

$kenya_locations_autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($kenya_locations_autoload)) {
    add_action('admin_notices', static function (): void {
        echo '<div class="notice notice-error"><p>';
        echo esc_html__(
            'Kenya Locations is missing vendor/autoload.php. Install the GitHub release zip, or run composer install in the plugin folder.',
            'kenya-locations',
        );
        echo '</p></div>';
    });

    return;
}

require_once $kenya_locations_autoload;

KenyaLocationsExample\Plugin::boot();

if (!function_exists('kenya_locations')) {
    function kenya_locations(): KenyaLocationsExample\Query
    {
        return KenyaLocationsExample\Plugin::query();
    }
}
