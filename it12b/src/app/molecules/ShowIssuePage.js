"use client";

import { useState, useEffect } from "react";
import {
  getIssueById,
  getCommentsByIssueId,
  createComment,
  getUsers,
} from "../apiCall";
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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [issueId]);

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
          <button
            onClick={() => navigate("EditIssue", { issueId })}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
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
        </div>
      </div>

      {/* Encabezado de la issue */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold mb-2">
              #{issue.id} {issue.title}
            </h1>
            <div className="flex items-center">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: issue.status?.color, color: "#fff" }}
              >
                {issue.status?.name}
              </span>
            </div>
          </div>

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
              style={{ backgroundColor: issue.priority?.color, color: "#fff" }}
            >
              {issue.priority?.name}
            </span>
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: issue.severity?.color, color: "#fff" }}
            >
              {issue.severity?.name}
            </span>
            {issue.blocked && (
              <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium">
                Bloqueada
              </span>
            )}
          </div>

          {/* Descripción */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
            <div className="prose max-w-none">
              {hasDescription ? (
                <div
                  dangerouslySetInnerHTML={{ __html: issue.description.body }}
                ></div>
              ) : (
                <em className="text-gray-500">Sin descripción</em>
              )}
            </div>
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

                {issue.due_date && (
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
            </div>
          </div>
        </div>
      </div>

      {/* Comentarios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Comentarios ({comments.length})
          </h2>

          {/* Formulario para añadir comentario */}
          {currentUser && (
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex items-start mb-3">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Añade un comentario..."
                  className="flex-grow border border-gray-300 rounded-md p-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </form>
          )}

          {/* Lista de comentarios */}
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const commentUser = comment.user;
                return (
                  <div
                    key={comment.id}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {commentUser?.avatar_url ? (
                          <img
                            src={commentUser.avatar_url}
                            alt={commentUser.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <span className="font-medium">
                              {commentUser?.name || "Usuario desconocido"}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {format(
                                new Date(comment.created_at),
                                "dd MMM yyyy HH:mm",
                                { locale: es }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="prose max-w-none">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-4">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
