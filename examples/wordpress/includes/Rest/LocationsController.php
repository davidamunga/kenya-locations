<?php

declare(strict_types=1);

namespace KenyaLocationsExample\Rest;

use KenyaLocationsExample\Plugin;
use KenyaLocationsExample\Serializer;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class LocationsController
{
    public static function register(): void
    {
        $controller = new self();
        $controller->registerRoutes();
    }

    public function registerRoutes(): void
    {
        $namespace = 'kenya-locations/v1';
        $read = [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
        ];

        register_rest_route($namespace, '/counties', [
            ...$read,
            'callback' => [$this, 'counties'],
        ]);

        register_rest_route($namespace, '/counties/(?P<county>[^/]+)', [
            ...$read,
            'callback' => [$this, 'county'],
            'args' => [
                'county' => [
                    'required' => true,
                    'sanitize_callback' => [self::class, 'sanitizePath'],
                ],
            ],
        ]);

        register_rest_route($namespace, '/counties/(?P<county>[^/]+)/constituencies', [
            ...$read,
            'callback' => [$this, 'constituenciesInCounty'],
            'args' => [
                'county' => [
                    'required' => true,
                    'sanitize_callback' => [self::class, 'sanitizePath'],
                ],
            ],
        ]);

        register_rest_route($namespace, '/constituencies/(?P<constituency>[^/]+)/wards', [
            ...$read,
            'callback' => [$this, 'wardsInConstituency'],
            'args' => [
                'constituency' => [
                    'required' => true,
                    'sanitize_callback' => [self::class, 'sanitizePath'],
                ],
            ],
        ]);

        register_rest_route($namespace, '/counties/(?P<county>[^/]+)/localities', [
            ...$read,
            'callback' => [$this, 'localitiesInCounty'],
            'args' => [
                'county' => [
                    'required' => true,
                    'sanitize_callback' => [self::class, 'sanitizePath'],
                ],
            ],
        ]);

        register_rest_route($namespace, '/localities/(?P<locality>[^/]+)/areas', [
            ...$read,
            'callback' => [$this, 'areasInLocality'],
            'args' => [
                'locality' => [
                    'required' => true,
                    'sanitize_callback' => [self::class, 'sanitizePath'],
                ],
                'county' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route($namespace, '/search', [
            ...$read,
            'callback' => [$this, 'search'],
            'args' => [
                'q' => [
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'type' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_key',
                ],
                'limit' => [
                    'required' => false,
                    'default' => 20,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }

    public static function sanitizePath(mixed $value): string
    {
        return rawurldecode(sanitize_text_field(wp_unslash((string) $value)));
    }

    public function counties(): WP_REST_Response
    {
        return new WP_REST_Response(array_map(
            Serializer::county(...),
            Plugin::query()->counties(),
        ));
    }

    public function county(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $county = Plugin::query()->county((string) $request['county']);
        if ($county === null) {
            return new WP_Error(
                'kenya_locations_not_found',
                'County not found.',
                ['status' => 404],
            );
        }

        return new WP_REST_Response(Serializer::county($county));
    }

    public function constituenciesInCounty(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response(array_map(
            Serializer::constituency(...),
            Plugin::query()->constituenciesInCounty((string) $request['county']),
        ));
    }

    public function wardsInConstituency(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response(array_map(
            Serializer::ward(...),
            Plugin::query()->wardsInConstituency((string) $request['constituency']),
        ));
    }

    public function localitiesInCounty(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response(array_map(
            Serializer::locality(...),
            Plugin::query()->localitiesInCounty((string) $request['county']),
        ));
    }

    public function areasInLocality(WP_REST_Request $request): WP_REST_Response
    {
        $county = $request->get_param('county');

        return new WP_REST_Response(array_map(
            Serializer::area(...),
            Plugin::query()->areasInLocality(
                (string) $request['locality'],
                is_string($county) && $county !== '' ? $county : null,
            ),
        ));
    }

    public function search(WP_REST_Request $request): WP_REST_Response
    {
        $type = $request->get_param('type');
        $results = Plugin::query()->search(
            (string) $request->get_param('q'),
            (int) $request->get_param('limit'),
            is_string($type) && $type !== '' ? $type : null,
        );

        return new WP_REST_Response(array_map(
            Serializer::searchResult(...),
            $results,
        ));
    }
}
