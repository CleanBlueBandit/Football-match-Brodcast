<?php
// auth_lock.php
session_start();

// Check if the session variable exists and is set to true
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    // If not logged in, kick them back to the login page
    header("Location: /login.php");
    exit; // Immediately stop the rest of the page from loading
}
?>