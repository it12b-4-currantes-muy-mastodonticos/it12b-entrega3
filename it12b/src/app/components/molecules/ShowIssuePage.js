"use client";

import { useState, useEffect, useRef } from "react";
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

  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);

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

  useEffect(() => {
    if (
      editingField === "status_id" &&
      fieldValue !== "" &&
      issue?.status_id !== parseInt(fieldValue)
    ) {
      saveField("status_id");
    }
  }, [fieldValue]);

  useEffect(() => {
    saveField("attachments");
  }, [files]);

  // Inline edit handlers
  const handleFieldClick = (field, value) => {
    setEditingField(field);
    setFieldValue(value ?? "");
  };

  const handleFieldChange = (e) => {
    setFieldValue(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const saveField = async (field) => {
    if (!issue) return;
    setSavingField(true);

    try {
      let updated = { ...issue };

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
        case "attachments":
          // Se maneja aparte, ver más abajo
          break;
        default:
          break;
      }

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
        // Solo ids de adjuntos ya existentes
        attachments: issue.attachments?.map((a) => a.id) || [],
      };

      const updatedIssue = await updateIssue(issueId, { issue: payload });
      setIssue(updatedIssue);

      if (field === "attachments" && files?.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("update[attachments][]", file);
        });

        await updateIssue(issueId, formData);

        const refreshedIssue = await getIssueById(issueId);
        setIssue(refreshedIssue);
      }
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="file-input"
                multiple
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="issuepage-attachments-add"
              >
                +
              </button>
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
            <div className="issuepage-comments-list">
              {comments.map((comment) => {
                const user = users.find((u) => u.id === comment.user_id);
                return (
                  <div key={comment.id} className="issuepage-comment">
                    <div className="issuepage-comment-wrapper">
                      {user?.avatar_url && (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="issuepage-comment-avatar"
                        />
                      )}
                      <div className="issuepage-comment-text">
                        <div className="issuepage-comment-meta">
                          <span className="issuepage-comment-author">
                            {user?.name || "Usuario"}
                          </span>
                          <span className="issuepage-comment-date">
                            {format(
                              new Date(comment.created_at),
                              "dd MMM yyyy HH:mm",
                              { locale: es }
                            )}
                          </span>
                        </div>
                        <div className="issuepage-comment-body">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="issuepage-sidebar">
          {editingField === "status_id" ? (
            <select
              value={fieldValue}
              autoFocus
              onChange={handleFieldChange}
              onBlur={() => handleFieldBlur("status_id")}
              onKeyDown={(e) => handleFieldKeyDown(e, "status_id")}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: "#fff",
                color: "#000",
              }}
              disabled={savingField}
            >
              {statuses.map((stat) => (
                <option key={stat.id} value={stat.id}>
                  {stat.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="issuepage-status"
              onClick={() => handleFieldClick("status_id", issue.status_id)}
              title="Haz clic para cambiar el estado"
            >
              <span className="issuepage-status-open">
                {issue.status?.open ? "OPEN" : "CLOSED"}
              </span>
              <span
                className="issuepage-status-main"
                style={{
                  backgroundColor: issue.status?.color,
                }}
              >
                {issue.status?.name?.toUpperCase()}
              </span>
            </div>
          )}

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
          </div>
        </aside>
      </div>
    </div>
  );
}
