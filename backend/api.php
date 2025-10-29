<?php

require_once(__DIR__ . "/bd.php");

// cabeceras CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// responder preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = getConexion();
$method = $_SERVER['REQUEST_METHOD'];

// ===============================================
// METODO GET → obtener tareas
// ===============================================
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $pdo->prepare("SELECT * FROM tareas WHERE id = ?");
        $stmt->execute([$id]);
        $tarea = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($tarea) {
            echo json_encode($tarea);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Tarea no encontrada"]);
        }
    } else {
        $stmt = $pdo->query("SELECT * FROM tareas ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    exit();
}

// METODO POST → crear nueva tarea
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar titulo obligatorio
    if (empty(trim($data['titulo'] ?? ''))) {
        http_response_code(400);
        echo json_encode(["error" => "El campo 'titulo' es obligatorio"]);
        exit();
    }

    $titulo = $data['titulo'];
    $descripcion = $data['descripcion'] ?? '';
    $estado = $data['estado'] ?? 'pendiente';
    $prioridad = $data['prioridad'] ?? 'media';
    $fecha_limite = $data['fecha_limite'] ?? null;
    $fecha_creacion = date("Y-m-d H:i:s");

    try {
        $stmt = $pdo->prepare("INSERT INTO tareas (titulo, descripcion, estado, prioridad, fecha_limite, fecha_creacion)
                               VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titulo, $descripcion, $estado, $prioridad, $fecha_limite, $fecha_creacion]);

        $nuevoId = $pdo->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "id" => $nuevoId,
            "titulo" => $titulo,
            "descripcion" => $descripcion,
            "estado" => $estado,
            "prioridad" => $prioridad,
            "fecha_limite" => $fecha_limite,
            "fecha_creacion" => $fecha_creacion
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error al crear la tarea: " . $e->getMessage()]);
    }
    exit();
}

// METODO PUT → actualizar tarea existente
if ($method === 'PUT') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el parámetro 'id'"]);
        exit();
    }

    $id = intval($_GET['id']);
    $data = json_decode(file_get_contents("php://input"), true);

    try {
        $stmt = $pdo->prepare("UPDATE tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, fecha_limite = ? WHERE id = ?");
        $stmt->execute([
            $data['titulo'] ?? '',
            $data['descripcion'] ?? '',
            $data['estado'] ?? 'pendiente',
            $data['prioridad'] ?? 'media',
            $data['fecha_limite'] ?? null,
            $id
        ]);

        echo json_encode(["message" => "Tarea actualizada correctamente"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error al actualizar la tarea: " . $e->getMessage()]);
    }
    exit();
}

// METODO DELETE → eliminar tarea
if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el parámetro 'id'"]);
        exit();
    }

    $id = intval($_GET['id']);

    try {
        $stmt = $pdo->prepare("DELETE FROM tareas WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Tarea eliminada correctamente"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error al eliminar la tarea: " . $e->getMessage()]);
    }
    exit();
}

// METODO NO SOPORTADO
http_response_code(405);
echo json_encode(["error" => "Metodo no permitido"]);
exit();
