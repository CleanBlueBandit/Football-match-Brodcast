<?php
// Function to get the real visitor IP
function getVisitorIP() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return $_SERVER['HTTP_X_FORWARDED_FOR'];
    return $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
}

// Time handling
$dateTbilisi = new DateTime("now", new DateTimeZone('Asia/Tbilisi'));
$tbilisiTime = $dateTbilisi->format('Y-m-d H:i:s');
$serverTime = date('Y-m-d H:i:s');

// Network & Connection Info
$ip = getVisitorIP();
$port = $_SERVER['REMOTE_PORT'] ?? 'Unknown';
$protocol = $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown';

// Request Details
$method = $_SERVER['REQUEST_METHOD'] ?? 'Unknown';
$uri = $_SERVER['REQUEST_URI'] ?? 'Unknown';
$referer = $_SERVER['HTTP_REFERER'] ?? 'Direct / No Referer';

// Browser / Client Info
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$lang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'Unknown';

// Form & URL Data 
// Captures URL parameters (e.g., ?id=5) safely
$getData = !empty($_GET) ? json_encode($_GET) : 'None';
// Captures WHICH form fields were sent, but NOT the values (to protect passwords)
$postKeys = !empty($_POST) ? implode(', ', array_keys($_POST)) : 'None';

// Format the log entry
$logEntry = "=== SECURITY LOG: $tbilisiTime (GMT+4) ===\n";
$logEntry .= "Server Time:  $serverTime\n";
$logEntry .= "IP Address:   $ip\n";
$logEntry .= "Remote Port:  $port\n";
$logEntry .= "Request:      $method $uri $protocol\n";
$logEntry .= "URL Data:     $getData\n";
$logEntry .= "Form Fields:  $postKeys\n";
$logEntry .= "Referer:      $referer\n";
$logEntry .= "User Agent:   $userAgent\n";
$logEntry .= "Language:     $lang\n";
$logEntry .= "===========================================\n\n";

// Save to file securely
$logFile = 'visitor_logs.txt';
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
?>