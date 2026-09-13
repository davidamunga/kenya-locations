# WordPress plugin

A drop-in plugin that **consumes** the local PHP library (`packages/php`) — County → Locality → Area, REST drill-down, a post metabox, WooCommerce store address, and checkout meta.

This is **not** on WordPress.org. GitHub releases attach a self-contained zip (`kenya-locations-wordpress-*.zip`) with `vendor/` already inside. Installation steps are in [`readme.txt`](readme.txt).

## What it adds

- `GET /wp-json/kenya-locations/v1/counties`
- `GET /wp-json/kenya-locations/v1/counties/{codeOrName}/localities`
- `GET /wp-json/kenya-locations/v1/localities/{name}/areas?county=`
- `GET /wp-json/kenya-locations/v1/search?q=&type=&limit=`
- Shortcode `[kenya_location]`
- Metabox on posts and pages (county code + locality / area names)
- WooCommerce **Store Address** (Settings → General): locality + area under Country / State
- WooCommerce checkout: County → Location → Area when the country is Kenya (WooCommerce State is hidden)

The Checkout block is replaced with `[woocommerce_checkout]` on the storefront so Locality / Area appear without editing the page. Filter `kenya_locations_replace_checkout_block` to disable that. Electoral constituency/ward fields are not used here.

WooCommerce stores Kenya counties as `KE01`…`KE47`, which are **not** IEBC codes. The script reads the state **label** (the county name) when loading localities.

## Install from a release

1. Open the [GitHub release](https://github.com/davidamunga/kenya-locations/releases) and download `kenya-locations-wordpress-*.zip`.
2. WordPress → **Plugins → Add New → Upload Plugin**.
3. Activate **Kenya Locations**. Requires PHP 8.2+.

## Develop in this repo

From the monorepo root:

```bash
cd examples/wordpress
composer install
composer test
composer zip    # writes dist/kenya-locations-wordpress-{version}.zip
```

Symlink this folder into `wp-content/plugins/kenya-locations` on a local WordPress 6.4+ site (PHP 8.2+). Activate **Kenya Locations**.

```
[kenya_location]
```

```php
$nairobi = kenya_locations()->county('Nairobi');
$localities = kenya_locations()->localitiesInCounty('Nairobi');
$areas = kenya_locations()->areasInLocality('Karen', 'Nairobi');
```

Post meta keys: `_kenya_county`, `_kenya_county_name`, `_kenya_locality`, `_kenya_area`.

Store address options: `woocommerce_store_locality`, `woocommerce_store_area`. These appear on **WooCommerce → Settings → General** when Country / State is Kenya.

## Use the published package instead

In a real Bedrock or Composer-managed WordPress project, drop the path repository and depend on Packagist:

```bash
composer require davidamunga/kenya-locations
```

```php
use KenyaLocations\KenyaLocations;

$areas = KenyaLocations::getAreasInLocality('Karen');
```

You do not need this example plugin for that. See the [PHP README](../../packages/php/README.md).
