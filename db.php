<?php
// db.php
$host = 'sql105.infinityfree.com'; // Replace with your InfinityFree MySQL Hostname
$db_user = 'if0_41972243'; // Replace with your InfinityFree MySQL Username
$db_pass = 'ooZHEKr9rJj'; // Replace with your vPanel password
$db_name = 'if0_41972243_pswd_db'; // Replace with your Database Name

// Create connection using MySQLi
$conn = new mysqli($host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>