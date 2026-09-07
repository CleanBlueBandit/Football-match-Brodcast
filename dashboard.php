<?php
// dashboard.php (or index.php inside your protected directory)
session_start();

// Check if the user is logged in
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Protected Area</title>
</head>
<body>
    <h1>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>!</h1>
    <p>This is the secret directory. Only logged-in users can see this.</p>
    <a href="logout.php">Log Out</a>
</body>
</html>