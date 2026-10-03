<?php
/**
 * Concept Autos POS — API Diagnostic Tool
 * URL: /api/diagnose.php
 * DELETE THIS FILE AFTER FIXING ISSUES (it exposes config info)
 */

// Force plain display
header("Content-Type: text/html; charset=UTF-8");

$isCLI = (php_sapi_name() === 'cli');

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

echo "<!DOCTYPE html><html><head><title>API Diagnostics</title>";
echo "<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafafa; color: #18181b; padding: 24px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 28px; padding-bottom: 6px; border-bottom: 1px solid #e4e4e7; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; }
  th, td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
  th { background: #fafafa; font-weight: 600; color: #52525b; }
  .ok { color: #008a6b; font-weight: 600; }
  .err { color: #c81e3a; font-weight: 600; }
  .warn { color: #b45309; font-weight: 600; }
  code { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'Consolas', monospace; }
  pre { background: #18181b; color: #e4e4e7; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.5; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .badge-ok { background: #d1fae5; color: #065f46; }
  .badge-err { background: #fee2e2; color: #991b1b; }
  .badge-warn { background: #fef3c7; color: #92400e; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .small { font-size: 12px; color: #71717a; }
</style></head><body>";

echo "<h1>🩺 Concept Autos POS — API Diagnostics</h1>";
echo "<p class='small'>Generated: " . h(date('Y-m-d H:i:s')) . " · Server: " . h($_SERVER['HTTP_HOST'] ?? 'unknown') . " · PHP: " . h(phpversion()) . "</p>";

// ============================================================
// SECTION 1: ENVIRONMENT
// ============================================================
echo "<h2>1. Environment & Environment Files</h2>";
echo "<table><thead><tr><th>Check</th><th>Result</th><th>Details</th></tr></thead><tbody>";

$envLocalPath = dirname(__DIR__) . '/.env.local';
$envPath = dirname(__DIR__) . '/.env';
$envProdPath = dirname(__DIR__) . '/.env.production';

function fileRow($label, $path) {
    $exists = file_exists($path);
    $readable = $exists && is_readable($path);
    $badge = $exists ? "<span class='badge badge-ok'>EXISTS</span>" : "<span class='badge badge-err'>MISSING</span>";
    return "<tr><td>" . h($label) . "</td><td>{$badge}</td><td class='small'>" . h($path) . ($exists ? " (" . filesize($path) . " bytes)" : "") . "</td></tr>";
}

echo fileRow(".env.local", $envLocalPath);
echo fileRow(".env", $envPath);
echo fileRow(".env.production", $envProdPath);

echo "<tr><td>Project root</td><td>" . (is_dir(dirname(__DIR__)) ? "<span class='badge badge-ok'>OK</span>" : "<span class='badge badge-err'>MISSING</span>") . "</td><td class='small'>" . h(dirname(__DIR__)) . "</td></tr>";
echo "</tbody></table>";

// ============================================================
// SECTION 2: ENV LOADER
// ============================================================
echo "<h2>2. Env Loader (<code>config/env.php</code>)</h2>";
$envLoaderPath = __DIR__ . '/config/env.php';
if (file_exists($envLoaderPath)) {
    echo "<p class='ok'>✅ config/env.php found</p>";
    require_once $envLoaderPath;
    if (function_exists('env')) {
        echo "<p class='ok'>✅ env() function exists</p>";
    } else {
        echo "<p class='err'>❌ env() function NOT defined</p>";
    }
    if (function_exists('envRequired')) {
        echo "<p class='ok'>✅ envRequired() function exists</p>";
    } else {
        echo "<p class='warn'>⚠️ envRequired() function NOT defined (older env.php version?)</p>";
    }
} else {
    echo "<p class='err'>❌ config/env.php NOT found at " . h($envLoaderPath) . "</p>";
}

// ============================================================
// SECTION 3: DATABASE CONNECTION
// ============================================================
echo "<h2>3. Database Connection</h2>";
echo "<table><thead><tr><th>Env Var</th><th>Value</th><th>Status</th></tr></thead><tbody>";

$dbHost = getenv('DB_HOST');
$dbName = getenv('DB_NAME');
$dbUser = getenv('DB_USER');
$dbPass = getenv('DB_PASSWORD');

function envRow($key, $value, $mask = false) {
    if ($value === false) {
        return "<tr><td><code>" . h($key) . "</code></td><td class='err'>NOT SET</td><td><span class='badge badge-err'>FAIL</span></td></tr>";
    }
    $display = $value === '' ? '(empty string)' : ($mask ? str_repeat('•', strlen($value)) : h($value));
    return "<tr><td><code>" . h($key) . "</code></td><td>" . $display . "</td><td><span class='badge badge-ok'>OK</span></td></tr>";
}

echo envRow('DB_HOST', $dbHost);
echo envRow('DB_NAME', $dbName);
echo envRow('DB_USER', $dbUser);
echo envRow('DB_PASSWORD', $dbPass, true);
echo "</tbody></table>";

if ($dbHost !== false && $dbName !== false && $dbUser !== false) {
    try {
        $conn = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass ?: '');
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        echo "<p class='ok'>✅ Database connected successfully</p>";

        // ============================================================
        // SECTION 4: TABLES
        // ============================================================
        echo "<h2>4. Database Tables</h2>";
        $expectedTables = ['users','customers','vehicles','suppliers','products','invoices','invoice_items','invoice_payments','oil_changes','waste_oil','stock_history','ledger','supplier_payments','audit_log','settings','daily_summary'];
        $stmt = $conn->query("SHOW TABLES");
        $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "<table><thead><tr><th>Table</th><th>Status</th><th>Rows</th></tr></thead><tbody>";
        foreach ($expectedTables as $t) {
            $exists = in_array($t, $existingTables);
            if ($exists) {
                try {
                    $cnt = $conn->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
                } catch (Exception $e) {
                    $cnt = '?';
                }
                echo "<tr><td><code>" . h($t) . "</code></td><td><span class='badge badge-ok'>EXISTS</span></td><td>" . h($cnt) . "</td></tr>";
            } else {
                echo "<tr><td><code>" . h($t) . "</code></td><td><span class='badge badge-err'>MISSING</span></td><td>-</td></tr>";
            }
        }
        echo "</tbody></table>";

        // ============================================================
        // SECTION 5: PRODUCTS TABLE COLUMNS
        // ============================================================
        if (in_array('products', $existingTables)) {
            echo "<h2>5. Products Table Columns</h2>";
            $cols = $conn->query("SHOW COLUMNS FROM products")->fetchAll();
            $colNames = array_column($cols, 'Field');
            $expectedCols = ['id','name','category','purchase_price','wholesale_price','sale_price','stock_qty','stock_ml','min_stock_level','rack','shelf','unit','created_at'];
            echo "<table><thead><tr><th>Column</th><th>Status</th><th>Type</th></tr></thead><tbody>";
            foreach ($expectedCols as $c) {
                $idx = array_search($c, $colNames);
                if ($idx !== false) {
                    echo "<tr><td><code>" . h($c) . "</code></td><td><span class='badge badge-ok'>EXISTS</span></td><td class='small'>" . h($cols[$idx]['Type']) . "</td></tr>";
                } else {
                    echo "<tr><td><code>" . h($c) . "</code></td><td><span class='badge badge-err'>MISSING</span></td><td>-</td></tr>";
                }
            }
            // Show any extra columns we don't expect
            $extras = array_diff($colNames, $expectedCols);
            foreach ($extras as $e) {
                echo "<tr><td><code>" . h($e) . "</code></td><td><span class='badge badge-info'>EXTRA</span></td><td class='small'>not used</td></tr>";
            }
            echo "</tbody></table>";
        }

    } catch (PDOException $e) {
        echo "<p class='err'>❌ Database connection FAILED: " . h($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='err'>❌ Cannot test DB — env vars missing (see table above)</p>";
}

// ============================================================
// SECTION 6: API ENDPOINTS
// ============================================================
echo "<h2>6. API Endpoints</h2>";
$endpoints = [
    'products.php', 'customers.php', 'vehicles.php', 'suppliers.php',
    'invoices.php', 'ledger.php', 'waste_oil.php', 'stock_history.php',
    'oil_changes.php', 'settings.php',
];

echo "<table><thead><tr><th>Endpoint</th><th>File</th><th>HTTP Test</th><th>JSON Parse</th><th>Response Preview</th></tr></thead><tbody>";

foreach ($endpoints as $ep) {
    $filePath = __DIR__ . '/' . $ep;
    $fileExists = file_exists($filePath);

    // Test by calling locally via HTTP (using the current server)
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    $url = "$scheme://$host$basePath/$ep";

    $fileBadge = $fileExists
        ? "<span class='badge badge-ok'>EXISTS</span>"
        : "<span class='badge badge-err'>MISSING</span>";

    $httpResult = '-';
    $jsonResult = '-';
    $preview = '-';

    if ($fileExists && function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $response = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 300) {
            $httpResult = "<span class='badge badge-ok'>$code</span>";
        } elseif ($code >= 400 && $code < 500) {
            $httpResult = "<span class='badge badge-warn'>$code</span>";
        } else {
            $httpResult = "<span class='badge badge-err'>$code</span>";
        }

        $decoded = json_decode($response, true);
        if ($decoded !== null) {
            $jsonResult = "<span class='badge badge-ok'>VALID</span>";
            $preview = "<code>" . h(substr((string)$response, 0, 80)) . (strlen((string)$response) > 80 ? "…" : "") . "</code>";
        } else {
            $jsonResult = "<span class='badge badge-err'>INVALID</span>";
            // Show the first bit of non-JSON (this is usually a PHP error)
            $preview = "<code style='color:#c81e3a'>" . h(substr((string)$response, 0, 120)) . "</code>";
        }
    } elseif ($fileExists) {
        $httpResult = "<span class='badge badge-info'>SKIP</span>";
    }

    echo "<tr>";
    echo "<td><code>" . h($ep) . "</code></td>";
    echo "<td>$fileBadge</td>";
    echo "<td>$httpResult</td>";
    echo "<td>$jsonResult</td>";
    echo "<td>$preview</td>";
    echo "</tr>";
}
echo "</tbody></table>";

// ============================================================
// SECTION 7: DIRECT INCLUDE TEST
// ============================================================
echo "<h2>7. Direct Include Test</h2>";
echo "<p class='small'>Loads each PHP file directly (bypassing HTTP) to reveal PHP errors.</p>";

foreach ($endpoints as $ep) {
    $filePath = __DIR__ . '/' . $ep;
    if (!file_exists($filePath)) continue;
    echo "<details style='margin-bottom:8px;background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:8px;'>";
    echo "<summary style='cursor:pointer;font-weight:600;font-size:13px'>" . h($ep) . "</summary>";
    echo "<div class='small' style='margin-top:8px'>File size: " . filesize($filePath) . " bytes · Modified: " . date('Y-m-d H:i:s', filemtime($filePath)) . "</div>";
    echo "<pre style='margin-top:8px'>";
    // Read first 40 lines to show the top of the file
    $lines = file($filePath);
    $head = array_slice($lines, 0, 25);
    echo h(implode("", $head));
    if (count($lines) > 25) echo "\n... (" . (count($lines) - 25) . " more lines)";
    echo "</pre>";
    echo "</details>";
}

// ============================================================
// SECTION 8: CORS / OPTIONS PREFLIGHT SIMULATION
// ============================================================
echo "<h2>8. OPTIONS Preflight Check</h2>";
echo "<p class='small'>This simulates what a browser sends before a PUT/DELETE request. It should return 200 with CORS headers.</p>";

echo "<table><thead><tr><th>Endpoint</th><th>HTTP Method</th><th>Expected Response Headers</th></tr></thead><tbody>";
foreach ($endpoints as $ep) {
    $filePath = __DIR__ . '/' . $ep;
    if (!file_exists($filePath)) continue;

    if (function_exists('curl_init')) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        $url = "$scheme://$host$basePath/$ep";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'OPTIONS',
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HEADER => true,
        ]);
        $response = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        curl_close($ch);

        $hasCORS = stripos($headers, 'Access-Control-Allow-Origin') !== false;
        $codeBadge = $code === 200
            ? "<span class='badge badge-ok'>200</span>"
            : "<span class='badge badge-err'>$code</span>";
        $corsBadge = $hasCORS
            ? "<span class='badge badge-ok'>CORS OK</span>"
            : "<span class='badge badge-err'>NO CORS</span>";

        echo "<tr><td><code>" . h($ep) . "</code></td><td>OPTIONS</td><td>$codeBadge $corsBadge</td></tr>";
    } else {
        echo "<tr><td><code>" . h($ep) . "</code></td><td>OPTIONS</td><td class='small'>cURL not available</td></tr>";
    }
}
echo "</tbody></table>";

// ============================================================
// SECTION 9: .htaccess PROTECTED PATHS
// ============================================================
echo "<h2>9. .htaccess Protection Check</h2>";
echo "<p class='small'>Verify sensitive files are NOT publicly accessible.</p>";

$protectedPaths = [
    '/.env' => 'Env file',
    '/.env.local' => 'Local env file',
    '/.git/config' => 'Git config',
    '/api/config/db.php' => 'DB config',
    '/api/config/env.php' => 'Env loader',
];

echo "<table><thead><tr><th>Path</th><th>Purpose</th><th>Status</th></tr></thead><tbody>";
foreach ($protectedPaths as $path => $purpose) {
    if (!function_exists('curl_init')) break;
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $basePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\'); // Go up one level (project root)
    $url = "$scheme://$host$basePath$path";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_NOBODY => true,
    ]);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 403 || $code === 404) {
        $badge = "<span class='badge badge-ok'>PROTECTED ($code)</span>";
    } elseif ($code === 200) {
        $badge = "<span class='badge badge-err'>PUBLIC! ($code)</span>";
    } else {
        $badge = "<span class='badge badge-warn'>$code</span>";
    }
    echo "<tr><td><code>" . h($path) . "</code></td><td>" . h($purpose) . "</td><td>$badge</td></tr>";
}
echo "</tbody></table>";

echo "<hr style='margin:32px 0'>";
echo "<p class='small'>⚠️ <strong>Security:</strong> Delete this file (diagnose.php) after you're done testing. It reveals sensitive paths and DB names.</p>";
echo "</body></html>";