<?php
/**
 * Strict .env loader.
 * - Reads .env.local first (dev), falls back to .env (prod)
 * - NO hardcoded defaults — if a required var is missing, throws.
 */
function loadEnv() {
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;

    $rootDir = dirname(__DIR__, 2);
    $paths = [
        $rootDir . '/.env.local',
        $rootDir . '/.env',
    ];

    $loadedFrom = null;
    foreach ($paths as $path) {
        if (!file_exists($path)) continue;

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') === false) continue;

            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Strip quotes
            if (strlen($value) >= 2) {
                $first = $value[0];
                $last = substr($value, -1);
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            if (getenv($key) === false) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
        $loadedFrom = $path;
        break; // First match wins (.env.local over .env)
    }

    if (!$loadedFrom) {
        http_response_code(500);
        echo json_encode([
            "error" => "No .env.local or .env file found at project root: $rootDir"
        ]);
        exit();
    }
}

/**
 * Get a required env variable — throws 500 if missing.
 */
function envRequired($key) {
    $value = getenv($key);
    if ($value === false || $value === '') {
        http_response_code(500);
        echo json_encode([
            "error" => "Missing required environment variable: $key",
            "hint"  => "Add '$key=...' to your .env.local (dev) or .env (prod) file at project root."
        ]);
        exit();
    }
    return $value;
}

/**
 * Get an optional env variable (with explicit default).
 */
function env($key, $default = null) {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

loadEnv();
?>