"use client";

import { useState, useEffect } from "react";
import {
  getIssueById,
  getCommentsByIssueId,
  createComment,
  getUsers,
  updateIssue, // Importar la función para actualizar issues
  getPriorities, // Importar para obtener las opciones disponibles
  getSeverities,
  getStatuses,
  getTypes,
} from "../../apiCall";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ShowIssuePage({ issueId, navigate }) {
  // Estados existentes
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Nuevos estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editedIssue, setEditedIssue] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar usuarios para mostrar nombres completos
        const usersData = await getUsers();
        setUsers(usersData);

        // Obtener el usuario actual del localStorage
        const userId = localStorage.getItem("currentUserId");
        if (userId) {
          const currentUserData = usersData.find(
            (user) => user.id === parseInt(userId)
          );
          setCurrentUser(currentUserData);
        }

        // Cargar datos de la issue
        const issueData = await getIssueById(issueId);
        setIssue(issueData);

        // Cargar comentarios
        const commentsData = await getCommentsByIssueId(issueId);
        setComments(commentsData);

        // Cargar opciones para los campos select de edición
        const [prioritiesData, severitiesData, statusesData, typesData] =
          await Promise.all([
            getPriorities(),
            getSeverities(),
            getStatuses(),
            getTypes(),
          ]);

        setPriorities(prioritiesData);
        setSeverities(severitiesData);
        setStatuses(statusesData);
        setTypes(typesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [issueId]);

  // Inicializar el estado de edición cuando se carga la issue
  useEffect(() => {
    if (issue) {
      setEditedIssue({
        title: issue.title,
        description: issue.description?.body || "",
        assigned_to_id: issue.assigned_to_id || "",
        status_id: issue.status_id,
        priority_id: issue.priority_id,
        severity_id: issue.severity_id,
        issue_type_id: issue.issue_type_id,
        due_date: issue.due_date || "",
        due_date_reason: issue.due_date_reason || "",
        blocked: issue.blocked,
      });
    }
  }, [issue]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const newComment = await createComment(issueId, commentText);
      setComments([...comments, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedIssue({
      ...editedIssue,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Guardar los cambios
  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      // Preparar los datos para enviar
      const issueData = {
        title: editedIssue.title,
        description: editedIssue.description,
        assigned_to_id: editedIssue.assigned_to_id || null,
        status_id: editedIssue.status_id,
        priority_id: editedIssue.priority_id,
        severity_id: editedIssue.severity_id,
        issue_type_id: editedIssue.issue_type_id,
        due_date: editedIssue.due_date || null,
        due_date_reason: editedIssue.due_date_reason || null,
        blocked: editedIssue.blocked,
      };

      // Llamar a la API para actualizar
      const updatedIssue = await updateIssue(issueId, { issue: issueData });

      // Actualizar el estado local
      setIssue(updatedIssue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving issue:", error);
      alert("Error al guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md mb-4">
          Error: No se pudo cargar la issue
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={() => navigate("IndexIssues")}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const assignedUser = users.find((user) => user.id === issue.assigned_to_id);
  const creatorUser = users.find((user) => user.id === issue.user_id);
  const hasDescription = issue.description?.body;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Navegación y acciones */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("IndexIssues")}
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Volver a issues
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Encabezado de la issue */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={editedIssue.title}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold mb-2">
                #{issue.id} {issue.title}
              </h1>
            )}

            {!isEditing && (
              <div className="flex items-center">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: issue.status?.color,
                    color: "#fff",
                  }}
                >
                  {issue.status?.name}
                </span>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="status_id"
                  value={editedIssue.status_id}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="issue_type_id"
                  value={editedIssue.issue_type_id}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  name="priority_id"
                  value={editedIssue.priority_id}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severidad
                </label>
                <select
                  name="severity_id"
                  value={editedIssue.severity_id}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {severities.map((severity) => (
                    <option key={severity.id} value={severity.id}>
                      {severity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="blocked"
                  name="blocked"
                  checked={editedIssue.blocked}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="blocked"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Bloqueada
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.issue_type?.color,
                  color: "#fff",
                }}
              >
                {issue.issue_type?.name}
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.priority?.color,
                  color: "#fff",
                }}
              >
                {issue.priority?.name}
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.severity?.color,
                  color: "#fff",
                }}
              >
                {issue.severity?.name}
              </span>
              {issue.blocked && (
                <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium">
                  Bloqueada
                </span>
              )}
            </div>
          )}

          {/* Descripción */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
            {isEditing ? (
              <textarea
                name="description"
                value={editedIssue.description}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32"
                placeholder="Describe el issue..."
              />
            ) : (
              <div className="prose max-w-none">
                {hasDescription ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: issue.description.body }}
                  ></div>
                ) : (
                  <em className="text-gray-500">Sin descripción</em>
                )}
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-4">
            <div>
              <h3 className="text-md font-semibold mb-3">Detalles</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Creado por:</span>
                  <div className="flex items-center">
                    {creatorUser?.avatar_url ? (
                      <img
                        src={creatorUser.avatar_url}
                        alt={creatorUser.name}
                        width={24}
                        height={24}
                        className="rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                    )}
                    <span>{creatorUser?.name || "Usuario desconocido"}</span>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Asignado a:</span>
                  {isEditing ? (
                    <select
                      name="assigned_to_id"
                      value={editedIssue.assigned_to_id}
                      onChange={handleEditChange}
                      className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin asignar</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      {assignedUser ? (
                        <>
                          {assignedUser.avatar_url ? (
                            <img
                              src={assignedUser.avatar_url}
                              alt={assignedUser.name}
                              width={24}
                              height={24}
                              className="rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                          )}
                          <span>{assignedUser.name}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Sin asignar</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Creado:</span>
                  <span>
                    {format(new Date(issue.created_at), "dd MMM yyyy HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Última modif.:</span>
                  <span>
                    {format(new Date(issue.updated_at), "dd MMM yyyy HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>

                {isEditing ? (
                  <>
                    <div className="flex items-start">
                      <span className="text-gray-500 w-28">Fecha límite:</span>
                      <input
                        type="date"
                        name="due_date"
                        value={editedIssue.due_date || ""}
                        onChange={handleEditChange}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {editedIssue.due_date && (
                      <div className="flex items-start">
                        <span className="text-gray-500 w-28">Motivo:</span>
                        <input
                          type="text"
                          name="due_date_reason"
                          value={editedIssue.due_date_reason || ""}
                          onChange={handleEditChange}
                          placeholder="Motivo de la fecha límite"
                          className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  issue.due_date && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-28">Fecha límite:</span>
                      <div>
                        <span>
                          {format(new Date(issue.due_date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                        {issue.due_date_reason && (
                          <p className="text-sm text-gray-500 mt-1">
                            {issue.due_date_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              {/* Adjuntos */}
              <h3 className="text-md font-semibold mb-3">
                Adjuntos ({issue.attachments?.length || 0})
              </h3>
              {issue.attachments && issue.attachments.length > 0 ? (
                <div className="space-y-2">
                  {issue.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {attachment.filename}
                      </a>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(attachment.byte_size / 1024)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin adjuntos</p>
              )}

              {/* Si estamos en modo edición, podríamos añadir un input de archivo aquí */}
              {isEditing && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    La función para adjuntar archivos no está disponible en esta
                    versión.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comentarios - sin cambios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* ... código existente para comentarios ... */}
      </div>
    </div>
  );
}
