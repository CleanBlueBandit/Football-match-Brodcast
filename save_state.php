<?php
// save_state.php
header('Content-Type: application/json');

// Get the raw JSON data sent by JavaScript
$data = file_get_contents('php://input');

if ($data) {
    // Write the data to state.json
    file_put_contents('state.json', $data);
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "No data received"]);
}
?>