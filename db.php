<?php
// db.php
$host = 'sql105.infinityfree.com'; 
$db_user = 'if0_41972243';
$db_pass = 'whoops, i disclosed this in the previous version. no worries tho, its rotated';
$db_name = 'if0_41972243_pswd_db';

// Create connection using MySQLi
$conn = new mysqli($host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
