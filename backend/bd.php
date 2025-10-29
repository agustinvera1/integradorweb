 <?php

function getConexion() {
    $host = '127.0.0.1';    
    $port = '3307';          
    $db   = 'bdd-tareas';     
    $user = 'root';
    $pass = '1234';    

    try {
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
        exit();
    }
}
