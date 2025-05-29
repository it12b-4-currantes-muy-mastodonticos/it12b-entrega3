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
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // Select options
  const [priorities, setPriorities] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [dueDateValue, setDueDateValue] = useState(issue?.due_date || "");
  const [dueDateReasonValue, setDueDateReasonValue] = useState(issue?.due_date_reason || "");

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

  const handleOpenDueDateModal = () => {
    setDueDateValue(issue?.due_date || "");
    setDueDateReasonValue(issue?.due_date_reason || "");
    setShowDueDateModal(true);
  };

  const handleSaveDueDate = async () => {
    setSavingField(true);
    try {
      const payload = {
        title: issue.title,
        description: issue.description?.body,
        assigned_to_id: issue.assigned_to_id,
        status_id: issue.status_id,
        priority_id: issue.priority_id,
        severity_id: issue.severity_id,
        issue_type_id: issue.issue_type_id,
        due_date: dueDateValue,
        due_date_reason: dueDateReasonValue,
        blocked: issue.blocked,
      };

      const updatedIssue = await updateIssue(issueId, { issue: payload });
      setIssue(updatedIssue);
      setShowDueDateModal(false);
    } catch (e) {
      alert("Error saving due date");
    } finally {
      setSavingField(false);
    }
  };

  const setQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDueDateValue(date.toISOString().split('T')[0]);
  };

  const handleDeleteDueDate = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDueDate = async () => {
    setSavingField(true);
    try {
      const payload = {
        title: issue.title,
        description: issue.description?.body,
        assigned_to_id: issue.assigned_to_id,
        status_id: issue.status_id,
        priority_id: issue.priority_id,
        severity_id: issue.severity_id,
        issue_type_id: issue.issue_type_id,
        due_date: null,
        due_date_reason: null,
        blocked: issue.blocked,
      };

      const updatedIssue = await updateIssue(issueId, { issue: payload });
      setIssue(updatedIssue);
      setDueDateValue("");
      setDueDateReasonValue("");
      setShowDueDateModal(false);
      setShowDeleteConfirm(false);
    } catch (e) {
      alert("Error deliting the due date");
    } finally {
      setSavingField(false);
    }
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
              <div className="issuepage-sidebar-label">DUE DATE</div>
              {issue.due_date ? (
                <div className="issuepage-sidebar-due-date">
                  <div className="issuepage-sidebar-date-value">
                    {format(new Date(issue.due_date), "dd MMM yyyy", { locale: es })}
                  </div>
                  {issue.due_date_reason && (
                    <div className="issuepage-sidebar-date-reason">
                      {issue.due_date_reason}
                    </div>
                  )}
                  <button 
                    className="issuepage-sidebar-btn" 
                    onClick={handleOpenDueDateModal}
                  >
                    Editar fecha
                  </button>
                </div>
              ) : (
                <button 
                  className="issuepage-sidebar-btn" 
                  onClick={handleOpenDueDateModal}
                >
                  <svg viewBox="0 0 24 24" className="calendar-icon" width="18" height="18">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Set due date
                </button>
              )}
          </div>
        </aside>
      </div>

      {showDueDateModal && (
        <div className="issuepage-modal-overlay">
          <div className="issuepage-due-date-modal">
            <div className="issuepage-modal-header">
              <h2>Set due date</h2>
              <button 
                className="issuepage-modal-close" 
                onClick={() => setShowDueDateModal(false)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            <div className="issuepage-modal-content">
              <div className="issuepage-date-picker">
                <input 
                  type="date" 
                  value={dueDateValue} 
                  onChange={(e) => setDueDateValue(e.target.value)} 
                  className="issuepage-date-input"
                  placeholder="Select date"
                />
              </div>
              
              <div className="issuepage-quick-dates">
                <button onClick={() => setQuickDate(7)} className="issuepage-quick-date-btn">
                  In one week
                </button>
                <button onClick={() => setQuickDate(14)} className="issuepage-quick-date-btn">
                  In two weeks
                </button>
                <button onClick={() => setQuickDate(30)} className="issuepage-quick-date-btn">
                  In one month
                </button>
                <button onClick={() => setQuickDate(90)} className="issuepage-quick-date-btn">
                  In three months
                </button>
              </div>
              
              <div className="issuepage-due-date-reason">
                <h3>Reason for the due date</h3>
                <textarea 
                  value={dueDateReasonValue} 
                  onChange={(e) => setDueDateReasonValue(e.target.value)} 
                  className="issuepage-reason-textarea"
                  placeholder="Why does this issue need a due date?"
                />
              </div>
            </div>
            <div className="issuepage-modal-footer">
              <button 
                className="issuepage-modal-save" 
                onClick={handleSaveDueDate}
                disabled={savingField}
              >
                {savingField ? "Saving..." : "SAVE"}
              </button>
              {issue.due_date && (
                <button 
                  className="issuepage-modal-delete" 
                  onClick={handleDeleteDueDate}
                  disabled={savingField}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete due date
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {showDeleteConfirm && (
        <div className="issuepage-delete-confirm-overlay">
          <div className="issuepage-delete-confirm">
            <div className="issuepage-delete-confirm-header">
              <h3>Delete Due Date</h3>
            </div>
            <div className="issuepage-delete-confirm-content">
              <p>¿Are you sure you want to delete this due date?</p>
            </div>
            <div className="issuepage-delete-confirm-actions">
              <button 
                className="issuepage-delete-confirm-cancel" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="issuepage-delete-confirm-confirm" 
                onClick={confirmDeleteDueDate}
                disabled={savingField}
              >
                {savingField ? "Eliminando..." : "Eliminar fecha"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
