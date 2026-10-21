<?php

$projectRoot = dirname(__DIR__);
$publicRoot = $projectRoot . '/public';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route backend PHP files.
if (str_starts_with($path, '/backend/')) {
    $file = $projectRoot . $path;

    if (is_file($file) && str_ends_with($file, '.php')) {
        require $file;
        return true;
    }

    http_response_code(404);
    echo 'Backend file not found.';
    return true;
}

// Serve frontend files.
if ($path === '/') {
    $path = '/index.html';
}

$file = $publicRoot . $path;

if (is_file($file)) {
    return false;
}

http_response_code(404);
echo 'Page not found.';