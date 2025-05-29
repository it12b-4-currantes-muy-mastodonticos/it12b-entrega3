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
  addWatcherToIssue,
} from "../../apiCall";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "./ShowIssuePage.css";

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

      const payload = {
        comment: {
          content: commentText.trim(),
        },
      };

      const newComment = await createComment(issueId, payload);

      setComments([...comments, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWatchClick = async () => {
    if (!currentUser) {
      alert("Debes estar logueado para observar esta issue.");
      return;
    }

    try {
      await addWatcherToIssue(issueId, currentUser.id);
      alert("Ahora estás observando esta issue.");
    } catch (error) {
      console.error("Error al añadir watcher:", error);
      alert("No se pudo añadir como watcher. Inténtalo de nuevo.");
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
          Back to issues
        </button>
      </div>
    );
  }

  const assignedUser = users.find((user) => user.id === issue.assigned_to_id);
  const creatorUser = users.find((user) => user.id === issue.user_id);
  const hasDescription = issue.description?.body;

  return (
    <div className="issuepage-root">
      <div className="issuepage-wrapper">
        {/* HEADER */}
        <div className="issuepage-header">
          <a
            href="#"
            className="issuepage-back"
            onClick={() => navigate("IndexIssues")}
          >
            Back to issues
          </a>
          <div className="issuepage-titleblock">
            <span>
              {editingField === "title" ? (
                <input
                  type="text"
                  value={fieldValue}
                  autoFocus
                  onChange={handleFieldChange}
                  onBlur={() => handleFieldBlur("title")}
                  onKeyDown={(e) => handleFieldKeyDown(e, "title")}
                  className="issuepage-title"
                  disabled={savingField}
                />
              ) : (
                <h1
                  className="issuepage-title"
                  onClick={() => handleFieldClick("title", issue.title)}
                  title="Haz click para editar"
                >
                  <span className="issuepage-id">#{issue.id}</span>
                  {issue.title}
                  {savingField && editingField === null && (
                    <span className="ml-2 text-xs text-gray-400">
                      Guardando...
                    </span>
                  )}
                </h1>
              )}
            </span>
          </div>
          <span className="issuepage-type">ISSUE</span>

          <div className="issuepage-meta">
            <span>Created by {creatorUser?.name}</span>
            <span>
              {format(new Date(issue.created_at), "dd MMM HH:mm", {
                locale: es,
              })}
            </span>
            {creatorUser?.avatar_url && (
              <img
                className="issuepage-avatar"
                src={creatorUser.avatar_url}
                alt={creatorUser.name}
              />
            )}
          </div>
        </div>
      </div>

      <div className="issuepage-main">
        {/* DESCRIPTIION */}
        <div className="issuepage-content">
          <div className="issuepage-description">
            {editingField === "description" ? (
              <textarea
                value={fieldValue}
                autoFocus
                onChange={handleFieldChange}
                onBlur={() => handleFieldBlur("description")}
                onKeyDown={(e) => handleFieldKeyDown(e, "description")}
                className="issuepage-description-body"
                disabled={savingField}
              />
            ) : (
              <div
                className="issuepage-description-body"
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

          {/* Attachments */}
          <div className="issuepage-attachments">
            <div className="issuepage-attachments-header">
              <b>{issue.attachments?.length || 0} Attachments</b>
              <button className="issuepage-attachments-add">+</button>
            </div>
            <table className="issuepage-attachments-table">
              <tbody>
                {issue.attachments?.map((a) => (
                  <tr key={a.id} className="issuepage-attachment-list-item">
                    <td>
                      <span className="issuepage-attachment-icon">📎</span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="issuepage-attachment-size"
                      >
                        {a.filename}
                      </a>
                    </td>
                    <td className="issuepage-attachment-size">
                      {(a.byte_size / 1024).toFixed(1)} KB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comments */}
          <div className="issuepage-comments">
            <div className="issuepage-comments-header">
              <b>{comments.length} Comments</b>
            </div>
            <div className="issuepage-comments-list">
              {comments.map((comment) => {
                const user = users.find((u) => u.id === comment.user_id);
                return (
                  <div key={comment.id} className="issuepage-comment">
                    <div className="issuepage-comment-meta">
                      {user?.avatar_url && (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="issuepage-comment-avatar"
                        />
                      )}
                      <span>{user?.name || "Usuario"}</span>
                      <span className="issuepage-comment-date">
                        {format(
                          new Date(comment.created_at),
                          "dd MMM yyyy HH:mm",
                          { locale: es }
                        )}
                      </span>
                    </div>
                    <div className="issuepage-comment-body">{comment.body}</div>
                  </div>
                );
              })}
            </div>
            <form
              onSubmit={handleAddComment}
              className="issuepage-comment-form"
            >
              <input
                className="issuepage-comment-input"
                placeholder="Type a new comment here"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
              />
              <button
                type="submit"
                className="issuepage-comment-submit-button"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Agregar comentario"}
              </button>
            </form>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="issuepage-sidebar">
          <div className="issuepage-status">
            <span className="issuepage-status-main">
              {issue.status?.name?.toUpperCase() || "OPEN"}
            </span>
          </div>
          <div className="issuepage-sidebar-section">
            <div className="issuepage-sidebar-label">type</div>
            <div className="issuepage-sidebar-value">
              {issue.issue_type?.name}
              <span
                className="issuepage-sidebar-dot"
                style={{ background: issue.issue_type?.color }}
              ></span>
            </div>
          </div>
          <div className="issuepage-sidebar-section">
            <div className="issuepage-sidebar-label">severity</div>
            <div className="issuepage-sidebar-value">
              {issue.severity?.name}
              <span
                className="issuepage-sidebar-dot"
                style={{ background: issue.severity?.color }}
              ></span>
            </div>
          </div>
          <div className="issuepage-sidebar-section">
            <div className="issuepage-sidebar-label">priority</div>
            <div className="issuepage-sidebar-value">
              {issue.priority?.name}
              <span
                className="issuepage-sidebar-dot"
                style={{ background: issue.priority?.color }}
              ></span>
            </div>
          </div>
          <div className="issuepage-sidebar-section">
            <div className="issuepage-sidebar-label">ASSIGNED</div>
            {assignedUser && (
              <div className="issuepage-sidebar-assigned">
                <img
                  src={assignedUser.avatar_url}
                  className="issuepage-sidebar-avatar"
                />
                <span>{assignedUser.name}</span>
              </div>
            )}
            <div className="issuepage-sidebar-buttons">
              <button className="issuepage-sidebar-btn">+ Add assigned</button>
              <button className="issuepage-sidebar-btn">Assign to me</button>
            </div>
          </div>
          <div className="issuepage-sidebar-section">
            <div className="issuepage-sidebar-label">WATCHERS</div>
            {/* Aquí iría la lista de watchers */}
            <div className="issuepage-sidebar-buttons">
              <button className="issuepage-sidebar-btn text-gray-500">+ Add watchers</button>
              <button className="issuepage-sidebar-btn text-gray-500"
                      onClick={handleWatchClick}>
                      👁 Watch
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
