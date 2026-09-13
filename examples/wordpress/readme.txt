=== Kenya Locations ===
Contributors: davidamunga
Donate link: https://davidamunga.com
Tags: kenya, counties, localities, areas, woocommerce
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 8.2
Stable tag: 0.1.2
License: MIT
License URI: https://opensource.org/licenses/MIT

Kenyan County → Locality → Area fields for WordPress and WooCommerce, from the same dataset as kenya-locations.

== Description ==

This plugin ships a copy of `davidamunga/kenya-locations`. It does not copy the JSON itself.

* REST drill-down under `/wp-json/kenya-locations/v1/`
* Shortcode `[kenya_location]`
* Post / page metabox
* WooCommerce → Settings → General → Store Address: Locality and Area
* Classic WooCommerce checkout: Locality and Area after the Kenya county field

The Cart / Checkout **blocks** are not supported. Use the classic `[woocommerce_checkout]` shortcode.

== Installation ==

1. Download `kenya-locations-wordpress-*.zip` from the [GitHub release](https://github.com/davidamunga/kenya-locations/releases).
2. In WordPress go to **Plugins → Add New → Upload Plugin**.
3. Choose the zip and click **Install Now**, then **Activate**.
4. PHP 8.2+ is required. In Local, set the site PHP version to 8.2 or newer.

Alternatively, unzip the folder into `wp-content/plugins/kenya-locations/` so that `kenya-locations.php` sits in that directory, then activate **Kenya Locations**.

Do not unzip only the inner files into `plugins/`. WordPress expects one plugin folder.

== After you activate ==

* **Store address:** WooCommerce → Settings → General. Keep Country / State as Kenya, then set Locality and Area.
* **Checkout:** classic checkout only. Country must be Kenya; the county field drives localities.
* **Content:** edit a post or page for the Kenya location metabox, or add `[kenya_location]`.

== Frequently Asked Questions ==

= Is this on WordPress.org? =

Not yet. Install from the GitHub release zip.

= Do I need Composer on the server? =

No. The release zip already contains `vendor/`.

= Why is Nairobi listed as “Nairobi County”? =

That label comes from WooCommerce’s Kenya states. The plugin maps it to the Nairobi county in the shared dataset.

== Changelog ==

= 0.1.2 =

* Store address and checkout use County → Locality → Area.
