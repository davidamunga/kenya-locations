<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Admin;

use KenyaLocationsExample\Fields\CascadingSelect;
use KenyaLocationsExample\Plugin;
use KenyaLocationsExample\Selection;

final class LocationMetabox
{
    public const ID = 'kenya-locations';
    public const NONCE = 'kenya_locations_metabox';

    public static function register(): void
    {
        foreach (['post', 'page'] as $screen) {
            add_meta_box(
                self::ID,
                __('Kenya location', 'kenya-locations'),
                [self::class, 'render'],
                $screen,
                'side',
            );
        }
    }

    public static function render(\WP_Post $post): void
    {
        Plugin::enqueueAssets();
        wp_nonce_field(self::NONCE, self::NONCE);

        CascadingSelect::render([
            'name' => 'kenya_location',
            'mode' => 'full',
            'selection' => self::fromPost((int) $post->ID),
            'id_prefix' => 'kenya-location-metabox',
        ]);
    }

    public static function save(int $postId): void
    {
        if (!isset($_POST[self::NONCE]) || !is_string($_POST[self::NONCE])) {
            return;
        }

        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[self::NONCE])), self::NONCE)) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $postId)) {
            return;
        }

        $raw = $_POST['kenya_location'] ?? [];
        if (!is_array($raw)) {
            return;
        }

        $selection = Selection::fromNames(
            self::field($raw, 'county'),
            self::field($raw, 'locality'),
            self::field($raw, 'area'),
        );

        foreach (self::metaKeys() as $key) {
            delete_post_meta($postId, $key);
        }

        foreach ($selection->toMeta() as $key => $value) {
            update_post_meta($postId, $key, $value);
        }
    }

    public static function fromPost(int $postId): Selection
    {
        $meta = [];
        foreach (self::metaKeys() as $key) {
            $value = get_post_meta($postId, $key, true);
            $meta[$key] = is_string($value) ? $value : null;
        }

        return Selection::fromMeta($meta);
    }

    /**
     * @return list<string>
     */
    private static function metaKeys(): array
    {
        return [
            Selection::COUNTY,
            Selection::COUNTY_NAME,
            Selection::LOCALITY,
            Selection::AREA,
        ];
    }

    /**
     * @param array<mixed> $raw
     */
    private static function field(array $raw, string $key): ?string
    {
        if (!isset($raw[$key]) || !is_string($raw[$key])) {
            return null;
        }

        $value = sanitize_text_field(wp_unslash($raw[$key]));

        return $value === '' ? null : $value;
    }
}
