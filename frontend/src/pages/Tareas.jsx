//importa React y los hooks basicos, useState(estado) y useEffect(efectos secundarios)
import React, { useEffect, useState } from "react";
import "../styles/Tareas.css";

//endpoint php de la api(URL a traves de la cual se consumen los datos)
const API_URL = "http://localhost/integradorweb/backend/api.php";

//componente principal de la pagina de tareas y estados
export default function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");

  //estado darkMode inicializado desde localStorage
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  //efecto para aplicar tema (modo oscuro/claro) y persistir en localStorage
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  //obtiene las tareas del backend
  const cargarTareas = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTareas(data);
    } catch {
      setError("Ups, no pudimos conectar 😞");
    } finally {
      setCargando(false);
    }
  };

  //carga las tareas al montar el componente
  useEffect(() => {
    cargarTareas();
  }, []);

  //crea una nueva tarea POST
  const agregarTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Título obligatorio");
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          estado: "pendiente",
          prioridad: "media",
        }),
      });
      if (!res.ok) throw new Error();
      const nueva = await res.json();
      setTareas([nueva, ...tareas]);
      setTitulo("");
      setDescripcion("");
      setError(null);
    } catch {
      setError("Ups, no pudimos guardar la tarea 😞");
    }
  };

  //elimina una tarea DELETE
  const borrarTarea = async (id) => {
    try {
      await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
      setTareas(tareas.filter((t) => t.id !== id));
    } catch {
      setError("No se pudo eliminar la tarea 😞");
    }
  };

  //actualizar estado a completada (PUT)
  const marcarCompletada = async (tarea) => {
    const actualizado = { ...tarea, estado: "completada" };
    try {
      await fetch(`${API_URL}?id=${tarea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actualizado),
      });
      setTareas(tareas.map((t) => (t.id === tarea.id ? actualizado : t)));
    } catch {
      setError("No se pudo actualizar la tarea 😞");
    }
  };

  //flujo de edicion de tareas
  const iniciarEdicion = (tarea) => {
    setEditId(tarea.id);
    setEditTitulo(tarea.titulo);
    setEditDescripcion(tarea.descripcion || "");
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditTitulo("");
    setEditDescripcion("");
  };

  const guardarEdicion = async (tarea) => {
    if (!editTitulo.trim()) {
      setError("Titulo obligatorio");
      return;
    }
    const actualizado = {
      ...tarea,
      titulo: editTitulo,
      descripcion: editDescripcion,
    };
    try {
      await fetch(`${API_URL}?id=${tarea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actualizado),
      });
      setTareas(tareas.map((t) => (t.id === tarea.id ? actualizado : t)));
      cancelarEdicion();
      setError(null);
    } catch {
      setError("No se pudo actualizar la tarea 😞");
    }
  };

  return (
    <div className="tareas-container">
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>📋 Lista de Tareas</h1>
        <button
          type="button"
          className="modo-btn"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "🌞 Modo Claro" : "🌙 Modo Oscuro"}
        </button>
      </div>

      {cargando && <p className="msg">Cargando...</p>}
      {error && <p className="msg error">{error}</p>}
      {!cargando && !error && tareas.length === 0 && (
        <p className="msg">No hay tareas</p>
      )}

      <form onSubmit={agregarTarea} className="form-tarea">
        <input
          type="text"
          placeholder="Titulo..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          placeholder="Descripcion (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <button type="submit">Agregar</button>
      </form>

      {tareas.length > 0 && (
        <ul className="lista-tareas">
          {tareas.map((t) => (
            <li key={t.id} className={t.estado === "completada" ? "done" : ""}>
              <div className="tarea-info">
                {editId === t.id ? (
                  <>
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                    />
                    <textarea
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <strong>{t.titulo}</strong>
                    {t.descripcion && <p>{t.descripcion}</p>}
                    {t.fecha_creacion && (
                      <small>
                        🕓 Creada el{" "}
                        {new Date(t.fecha_creacion).toLocaleString()}
                      </small>
                    )}
                  </>
                )}
              </div>
              <div className="acciones">
                {editId === t.id ? (
                  <>
                    <button type="button" onClick={() => guardarEdicion(t)}>💾 Guardar</button>
                    <button type="button" onClick={cancelarEdicion}>❌ Cancelar</button>
                  </>
                ) : (
                  <>
                    {t.estado !== "completada" && (
                      <button type="button" onClick={() => marcarCompletada(t)}>
                        ✅ Completar
                      </button>
                    )}
                    <button type="button" onClick={() => iniciarEdicion(t)}>✏️ Editar</button>
                    <button type="button" onClick={() => borrarTarea(t.id)}>🗑️ Borrar</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}