"use client";

import { useState, useEffect } from "react";
import {
  getIssueById,
  getCommentsByIssueId,
  createComment,
  getUsers,
  updateIssue,
  getPriorities,
  getSeverities,
  getStatuses,
  getTypes,
} from "../../apiCall";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ShowIssuePage({ issueId, navigate }) {
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Inline editing
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [savingField, setSavingField] = useState(false);

  // Select options
  const [priorities, setPriorities] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersData = await getUsers();
        setUsers(usersData);

        const userId = localStorage.getItem("currentUserId");
        if (userId) {
          const currentUserData = usersData.find(
            (user) => user.id === parseInt(userId)
          );
          setCurrentUser(currentUserData);
        }

        const issueData = await getIssueById(issueId);
        setIssue(issueData);

        const commentsData = await getCommentsByIssueId(issueId);
        setComments(commentsData);

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

  // Inline edit handlers
  const handleFieldClick = (field, value) => {
    setEditingField(field);
    setFieldValue(value ?? "");
  };

  const handleFieldChange = (e) => {
    setFieldValue(e.target.value);
  };

  const saveField = async (field) => {
    if (!issue) return;
    setSavingField(true);
    try {
      let updated = { ...issue };

      // Actualiza el campo correspondiente
      switch (field) {
        case "title":
          updated.title = fieldValue;
          break;
        case "description":
          updated.description = { body: fieldValue };
          break;
        case "status_id":
          updated.status_id = parseInt(fieldValue);
          break;
        case "issue_type_id":
          updated.issue_type_id = parseInt(fieldValue);
          break;
        case "priority_id":
          updated.priority_id = parseInt(fieldValue);
          break;
        case "severity_id":
          updated.severity_id = parseInt(fieldValue);
          break;
        case "assigned_to_id":
          updated.assigned_to_id = fieldValue ? parseInt(fieldValue) : null;
          break;
        case "due_date":
          updated.due_date = fieldValue;
          break;
        case "due_date_reason":
          updated.due_date_reason = fieldValue;
          break;
        default:
          break;
      }

      // Prepara el payload para updateIssue
      const payload = {
        title: updated.title,
        description: updated.description?.body,
        assigned_to_id: updated.assigned_to_id,
        status_id: updated.status_id,
        priority_id: updated.priority_id,
        severity_id: updated.severity_id,
        issue_type_id: updated.issue_type_id,
        due_date: updated.due_date,
        due_date_reason: updated.due_date_reason,
        blocked: updated.blocked,
      };

      const updatedIssue = await updateIssue(issueId, { issue: payload });
      setIssue(updatedIssue);
    } catch (e) {
      alert("Error guardando el campo");
    } finally {
      setEditingField(null);
      setSavingField(false);
    }
  };

  const handleFieldBlur = (field) => {
    saveField(field);
  };

  const handleFieldKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveField(field);
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  const handleCheckboxChange = async (e) => {
    setSavingField(true);
    try {
      const updated = { ...issue, blocked: e.target.checked };
      const payload = {
        title: updated.title,
        description: updated.description?.body,
        assigned_to_id: updated.assigned_to_id,
        status_id: updated.status_id,
        priority_id: updated.priority_id,
        severity_id: updated.severity_id,
        issue_type_id: updated.issue_type_id,
        due_date: updated.due_date,
        due_date_reason: updated.due_date_reason,
        blocked: updated.blocked,
      };
      const updatedIssue = await updateIssue(issueId, { issue: payload });
      setIssue(updatedIssue);
    } catch (e) {
      alert("Error guardando el campo");
    } finally {
      setSavingField(false);
    }
  };

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
      {/* Navegación */}
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
      </div>

      {/* Encabezado de la issue */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              {editingField === "title" ? (
                <input
                  type="text"
                  value={fieldValue}
                  autoFocus
                  onChange={handleFieldChange}
                  onBlur={() => handleFieldBlur("title")}
                  onKeyDown={(e) => handleFieldKeyDown(e, "title")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  disabled={savingField}
                />
              ) : (
                <h1
                  className="text-2xl font-bold mb-2 cursor-pointer text-gray-500"
                  onClick={() => handleFieldClick("title", issue.title)}
                  title="Haz click para editar"
                >
                  #{issue.id} {issue.title}
                  {savingField && editingField === null && (
                    <span className="ml-2 text-xs text-gray-400">
                      Guardando...
                    </span>
                  )}
                </h1>
              )}
            </div>
            <div className="flex items-center">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.status?.color,
                  color: "#000",
                }}
              >
                {issue.status?.name}
              </span>
            </div>
          </div>

          {/* Campos tipo, prioridad, severidad, estado */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Tipo */}
            {editingField === "issue_type_id" ? (
              <select
                value={fieldValue}
                autoFocus
                onChange={handleFieldChange}
                onBlur={() => handleFieldBlur("issue_type_id")}
                onKeyDown={(e) => handleFieldKeyDown(e, "issue_type_id")}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.issue_type?.color,
                  color: "#000",
                }}
                disabled={savingField}
              >
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: issue.issue_type?.color,
                  color: "#000",
                }}
                onClick={() =>
                  handleFieldClick("issue_type_id", issue.issue_type_id)
                }
                title="Haz click para editar"
              >
                {issue.issue_type?.name}
              </span>
            )}

            {/* Prioridad */}
            {editingField === "priority_id" ? (
              <select
                value={fieldValue}
                autoFocus
                onChange={handleFieldChange}
                onBlur={() => handleFieldBlur("priority_id")}
                onKeyDown={(e) => handleFieldKeyDown(e, "priority_id")}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.priority?.color,
                  color: "#000",
                }}
                disabled={savingField}
              >
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: issue.priority?.color,
                  color: "#000",
                }}
                onClick={() =>
                  handleFieldClick("priority_id", issue.priority_id)
                }
                title="Haz click para editar"
              >
                {issue.priority?.name}
              </span>
            )}

            {/* Severidad */}
            {editingField === "severity_id" ? (
              <select
                value={fieldValue}
                autoFocus
                onChange={handleFieldChange}
                onBlur={() => handleFieldBlur("severity_id")}
                onKeyDown={(e) => handleFieldKeyDown(e, "severity_id")}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: issue.severity?.color,
                  color: "#000",
                }}
                disabled={savingField}
              >
                {severities.map((severity) => (
                  <option key={severity.id} value={severity.id}>
                    {severity.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: issue.severity?.color,
                  color: "#000",
                }}
                onClick={() =>
                  handleFieldClick("severity_id", issue.severity_id)
                }
                title="Haz click para editar"
              >
                {issue.severity?.name}
              </span>
            )}

            {/* Bloqueada */}
            <label className="flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={issue.blocked}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                disabled={savingField}
              />
              <span className="ml-1 text-xs text-gray-900">Bloqueada</span>
            </label>
          </div>

          {/* Descripción */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-500">
              Descripción
            </h2>
            {editingField === "description" ? (
              <textarea
                value={fieldValue}
                autoFocus
                onChange={handleFieldChange}
                onBlur={() => handleFieldBlur("description")}
                onKeyDown={(e) => handleFieldKeyDown(e, "description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-32"
                disabled={savingField}
              />
            ) : (
              <div
                className="prose max-w-none cursor-pointer text-gray-500"
                onClick={() =>
                  handleFieldClick("description", issue.description?.body)
                }
                title="Haz click para editar"
                dangerouslySetInnerHTML={{
                  __html:
                    issue.description?.body ||
                    "<em class='text-gray-500'>Sin descripción</em>",
                }}
              />
            )}
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-4">
            <div>
              <h3 className="text-black font-semibold mb-3">Detalles</h3>
              <div className="space-y-2">
                {/* Creado por */}
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
                    <span className="text-gray-500">
                      {creatorUser?.name || "Usuario desconocido"}
                    </span>
                  </div>
                </div>

                {/* Asignado a */}
                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Asignado a:</span>
                  {editingField === "assigned_to_id" ? (
                    <select
                      value={fieldValue}
                      autoFocus
                      onChange={handleFieldChange}
                      onBlur={() => handleFieldBlur("assigned_to_id")}
                      onKeyDown={(e) => handleFieldKeyDown(e, "assigned_to_id")}
                      className="px-3 py-1 border border-gray-300 rounded-md shadow-sm"
                      disabled={savingField}
                    >
                      <option value="">Sin asignar</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() =>
                        handleFieldClick("assigned_to_id", issue.assigned_to_id)
                      }
                      title="Haz click para editar"
                    >
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
                          <span className="text-gray-500">
                            {assignedUser.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Sin asignar</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Fechas */}
                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Creado:</span>
                  <span className="text-gray-500">
                    {format(new Date(issue.created_at), "dd MMM yyyy HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>

                {/* Fecha límite */}
                <div className="flex items-start">
                  <span className="text-gray-500 w-28">Fecha límite:</span>
                  {editingField === "due_date" ? (
                    <input
                      type="date"
                      value={fieldValue || ""}
                      autoFocus
                      onChange={handleFieldChange}
                      onBlur={() => handleFieldBlur("due_date")}
                      onKeyDown={(e) => handleFieldKeyDown(e, "due_date")}
                      className="px-3 py-1 border border-gray-300 rounded-md shadow-sm"
                      disabled={savingField}
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-gray-500"
                      onClick={() =>
                        handleFieldClick("due_date", issue.due_date)
                      }
                      title="Haz click para editar"
                    >
                      {issue.due_date ? (
                        format(new Date(issue.due_date), "dd MMM yyyy", {
                          locale: es,
                        })
                      ) : (
                        <span className="text-gray-500">Sin fecha</span>
                      )}
                    </span>
                  )}
                </div>
                {/* Motivo fecha límite */}
                {issue.due_date && (
                  <div className="flex items-start">
                    <span className="text-gray-500 w-28">Motivo:</span>
                    {editingField === "due_date_reason" ? (
                      <input
                        type="text"
                        value={fieldValue || ""}
                        autoFocus
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("due_date_reason")}
                        onKeyDown={(e) =>
                          handleFieldKeyDown(e, "due_date_reason")
                        }
                        placeholder="Motivo de la fecha límite"
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm"
                        disabled={savingField}
                      />
                    ) : (
                      <span
                        className="cursor-pointer text-gray-500"
                        onClick={() =>
                          handleFieldClick(
                            "due_date_reason",
                            issue.due_date_reason
                          )
                        }
                        title="Haz click para editar"
                      >
                        {issue.due_date_reason || (
                          <span className="text-gray-500">Sin motivo</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Adjuntos */}
            <div>
              <h3 className="text-black font-semibold mb-3">
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
            </div>
          </div>
        </div>
      </div>

      {/* Comentarios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-black font-semibold mb-3">Comentarios</h3>
          <form onSubmit={handleAddComment} className="mb-4">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-2"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Agregar comentario"}
            </button>
          </form>
          <div>
            {comments.length === 0 && (
              <p className="text-gray-500">Sin comentarios</p>
            )}
            {comments.map((comment) => {
              const user = users.find((u) => u.id === comment.user_id);
              return (
                <div key={comment.id} className="mb-4 border-b pb-2">
                  <div className="flex items-center mb-1">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        width={20}
                        height={20}
                        className="rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded-full mr-2"></div>
                    )}
                    <span className="font-semibold">
                      {user?.name || "Usuario"}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {format(
                        new Date(comment.created_at),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: es,
                        }
                      )}
                    </span>
                  </div>
                  <div className="ml-7">{comment.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
