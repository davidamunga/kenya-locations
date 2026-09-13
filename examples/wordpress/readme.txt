=== Kenya Locations ===
Contributors: davidamunga
Donate link: https://davidamunga.com
Tags: kenya, counties, localities, areas, woocommerce
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 8.2
Stable tag: 0.1.7
License: MIT
License URI: https://opensource.org/licenses/MIT

Kenyan County → Locality → Area fields for WordPress and WooCommerce, from the same dataset as kenya-locations.

== Description ==

This plugin ships a copy of `davidamunga/kenya-locations`. It does not copy the JSON itself.

* REST drill-down under `/wp-json/kenya-locations/v1/`
* Shortcode `[kenya_location]`
* Post / page metabox
* WooCommerce → Settings → General → Store Address: Locality and Area
* WooCommerce checkout: County, Location, and Area when the country is Kenya

The default Checkout **block** is rendered as classic checkout automatically so those fields appear without editing the page.

== Installation ==

1. Download `kenya-locations-wordpress-*.zip` from the [GitHub release](https://github.com/davidamunga/kenya-locations/releases).
2. In WordPress go to **Plugins → Add New → Upload Plugin**.
3. Choose the zip and click **Install Now**, then **Activate**.
4. PHP 8.2+ is required. In Local, set the site PHP version to 8.2 or newer.

Alternatively, unzip the folder into `wp-content/plugins/kenya-locations/` so that `kenya-locations.php` sits in that directory, then activate **Kenya Locations**.

Do not unzip only the inner files into `plugins/`. WordPress expects one plugin folder.

== After you activate ==

* **Store address:** WooCommerce → Settings → General. Keep Country / State as Kenya, then set Locality and Area.
* **Checkout:** Country must be Kenya. County, Location, and Area cascade; WooCommerce’s State field is hidden for Kenya. The Checkout block is swapped for classic checkout on the storefront.
* **Content:** edit a post or page for the Kenya location metabox, or add `[kenya_location]`.

== Frequently Asked Questions ==

= Is this on WordPress.org? =

Not yet. Install from the GitHub release zip.

= Do I need Composer on the server? =

No. The release zip already contains `vendor/`.

= Do I need to replace the Checkout block? =

No. On the storefront the plugin renders classic checkout so Locality and Area appear. The editor still shows the Checkout block.

= Why is Nairobi listed as “Nairobi County”? =

That label comes from WooCommerce’s Kenya states. The plugin maps it to the Nairobi county in the shared dataset.

== Changelog ==

= 0.1.7 =

* Checkout section title is Location.

= 0.1.6 =

* Checkout title is “The names locals use”, not “Delivery place”.

= 0.1.5 =

* Checkout place path: County → Location → Area as one civic picker, not three loose fields.

= 0.1.4 =

* Checkout shows County, Location, and Area. WooCommerce State is hidden for Kenya.

= 0.1.3 =

* Checkout block pages show County, Location, and Area without replacing the block by hand.

= 0.1.2 =

* Store address and checkout use County → Locality → Area.
