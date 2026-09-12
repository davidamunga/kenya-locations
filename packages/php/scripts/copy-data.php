<?php

declare(strict_types=1);

$packageRoot = dirname(__DIR__);
$repoData = dirname($packageRoot, 2) . '/data';
$packageData = $packageRoot . '/data';

if (!is_dir($repoData)) {
    fwrite(STDERR, "Shared data directory not found: {$repoData}\n");
    exit(1);
}

if (!is_dir($packageData) && !mkdir($packageData, 0777, true) && !is_dir($packageData)) {
    fwrite(STDERR, "Unable to create {$packageData}\n");
    exit(1);
}

$copied = 0;
foreach (glob($repoData . '/*.json') ?: [] as $file) {
    $target = $packageData . '/' . basename($file);
    if (!copy($file, $target)) {
        fwrite(STDERR, "Unable to copy {$file} → {$target}\n");
        exit(1);
    }
    $copied++;
}

echo "Copied {$copied} JSON file(s) → packages/php/data/\n";
