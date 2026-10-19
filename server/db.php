<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "small_gym_db";

    
$conn = new mysqli($servername, $username, $password, $dbname);


if ($conn->connect_error) {
    error_log("Connection failed: " . $conn->connect_error);
} else {
    echo "Database connected successfully via MySQLi!";
}

?>