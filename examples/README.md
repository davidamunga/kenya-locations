# Examples

Runnable apps that show the same county picker and search as the docs site.

| Path | What it uses |
| --- | --- |
| [`android/`](android/) | Native Compose app using the Kotlin/JVM library (`packages/kotlin`) |
| [`flutter/`](flutter/) | Flutter app reading shared JSON in `data/` |
| [`wordpress/`](wordpress/) | WordPress plugin using the PHP library (`packages/php`); zip is attached to each `v*` GitHub release |

```bash
# Native Android (Kotlin library)
cd examples/android && ./gradlew :app:installDebug

# Flutter (JSON assets)
cd examples/flutter && flutter run

# WordPress example plugin (PHP library)
cd examples/wordpress && composer install && composer test
```

JavaScript usage is in [`packages/js/examples/basic-usage.html`](../packages/js/examples/basic-usage.html). The live web demo is [`apps/web`](../apps/web).
