<?php

declare(strict_types=1);

/**
 * Build a self-contained WordPress plugin zip for GitHub releases.
 *
 * Copies the plugin, vendors davidamunga/kenya-locations (no symlink),
 * and writes dist/kenya-locations-wordpress-{version}.zip.
 */

$pluginRoot = dirname(__DIR__);
$repoRoot = dirname($pluginRoot, 2);
$phpPackage = $repoRoot . '/packages/php';
$distDir = $pluginRoot . '/dist';

$pluginFile = file_get_contents($pluginRoot . '/kenya-locations.php');
if ($pluginFile === false || !preg_match('/^\s*\*\s*Version:\s*(.+)$/m', $pluginFile, $match)) {
    fwrite(STDERR, "kenya-locations.php is missing a Version header.\n");
    exit(1);
}

$version = trim($match[1]);
$stage = sys_get_temp_dir() . '/kenya-locations-wp-zip-' . bin2hex(random_bytes(4));
$staged = $stage . '/kenya-locations';

$copy = static function (string $from, string $to): void {
    if (!is_dir($from)) {
        throw new RuntimeException("Missing {$from}");
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($from, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST,
    );

    foreach ($iterator as $file) {
        $target = $to . substr($file->getPathname(), strlen($from));
        if ($file->isDir()) {
            if (!is_dir($target) && !mkdir($target, 0777, true) && !is_dir($target)) {
                throw new RuntimeException("Unable to create {$target}");
            }
            continue;
        }

        $dir = dirname($target);
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new RuntimeException("Unable to create {$dir}");
        }

        if (!copy($file->getPathname(), $target)) {
            throw new RuntimeException("Unable to copy {$file->getPathname()}");
        }
    }
};

$remove = static function (string $path) use (&$remove): void {
    if (is_link($path) || is_file($path)) {
        unlink($path);
        return;
    }
    if (!is_dir($path)) {
        return;
    }
    foreach (scandir($path) ?: [] as $child) {
        if ($child === '.' || $child === '..') {
            continue;
        }
        $remove($path . '/' . $child);
    }
    rmdir($path);
};

$remove($stage);
if (!mkdir($staged, 0777, true) && !is_dir($staged)) {
    throw new RuntimeException("Unable to create {$staged}");
}

foreach (['kenya-locations.php', 'composer.json', 'readme.txt', 'README.md'] as $file) {
    if (!copy($pluginRoot . '/' . $file, $staged . '/' . $file)) {
        throw new RuntimeException("Unable to copy {$file}");
    }
}

$copy($pluginRoot . '/includes', $staged . '/includes');
$copy($pluginRoot . '/assets', $staged . '/assets');

$composer = json_decode((string) file_get_contents($staged . '/composer.json'), true, flags: JSON_THROW_ON_ERROR);
$composer['repositories'] = [[
    'type' => 'path',
    'url' => $phpPackage,
    'options' => ['symlink' => false],
]];
unset($composer['require-dev'], $composer['autoload-dev'], $composer['scripts']);
file_put_contents(
    $staged . '/composer.json',
    json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n",
);

$composerCommand = sprintf(
    'composer install --working-dir=%s --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader',
    escapeshellarg($staged),
);

passthru($composerCommand, $exitCode);
if ($exitCode !== 0) {
    fwrite(STDERR, "composer install failed.\n");
    exit($exitCode);
}

$vendored = $staged . '/vendor/davidamunga/kenya-locations';
if (is_link($vendored)) {
    fwrite(STDERR, "Vendored PHP package is still a symlink; the zip would break on other machines.\n");
    exit(1);
}
if (!is_file($vendored . '/src/KenyaLocations.php')) {
    fwrite(STDERR, "Vendored PHP package is missing src/KenyaLocations.php.\n");
    exit(1);
}

foreach ([
    $vendored . '/vendor',
    $vendored . '/tests',
    $vendored . '/.phpunit.cache',
    $vendored . '/phpunit.xml.dist',
    $vendored . '/scripts',
    $vendored . '/composer.lock',
    $vendored . '/package.json',
] as $devPath) {
    $remove($devPath);
}

if (!is_dir($distDir) && !mkdir($distDir, 0777, true) && !is_dir($distDir)) {
    throw new RuntimeException("Unable to create {$distDir}");
}

$zipName = "kenya-locations-wordpress-{$version}.zip";
$zipPath = $distDir . '/' . $zipName;
$stablePath = $distDir . '/kenya-locations-wordpress.zip';
foreach ([$zipPath, $stablePath] as $existing) {
    if (is_file($existing)) {
        unlink($existing);
    }
}

$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    fwrite(STDERR, "Unable to create {$zipPath}.\n");
    exit(1);
}

$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($staged, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::LEAVES_ONLY,
);

foreach ($files as $file) {
    if ($file->isDir()) {
        continue;
    }
    $absolute = $file->getPathname();
    $relative = 'kenya-locations/' . substr($absolute, strlen($staged) + 1);
    $zip->addFile($absolute, $relative);
}

$zip->close();
copy($zipPath, $stablePath);

$remove($stage);

echo $zipPath . PHP_EOL;
echo $stablePath . PHP_EOL;
