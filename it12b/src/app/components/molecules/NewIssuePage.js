"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  getTypes,
  getSeverities,
  getPriorities,
  getStatuses,
  getUsers,
  createIssue,
} from "../../apiCall";
import LoginModal from "../organisms/loginModal";

export default function NewIssuePage({ navigate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type_id: "",
    severity_id: "",
    priority_id: "",
    status_id: "",
    assigned_to_id: "",
    due_date: "", 
    due_date_reason: "",
  });

  const [types, setTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const typeDropdownRef = useRef(null);
  const severityDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const assigneeDropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          setShowLoginModal(true);
        }
        
        const [typesData, severitiesData, prioritiesData, statusesData, usersData] = await Promise.all([
          getTypes(),
          getSeverities(),
          getPriorities(),
          getStatuses(),
          getUsers(),
        ]);

        setTypes(typesData);
        setSeverities(severitiesData);
        setPriorities(prioritiesData);
        setStatuses(statusesData);
        setUsers(usersData);

        // Establecer valores por defecto en una sola actualización
        setFormData(prev => ({ 
          ...prev, 
          type_id: typesData.find(t => t.name === 'Bug')?.id || typesData[0]?.id || "",
          severity_id: severitiesData[0]?.id || "",
          priority_id: prioritiesData[0]?.id || "",
          status_id: statusesData[0]?.id || ""
        }));
      } catch (error) {
        console.error("Error fetching form data:", error);
        setError("No se pudieron cargar los datos del formulario");
      } finally {
        setLoading(false);
      }
    };

    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (severityDropdownRef.current && !severityDropdownRef.current.contains(event.target)) {
        setShowSeverityDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setShowPriorityDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    fetchData();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "due_date") {
    const currentStatus = getSelectedStatus();
    if (currentStatus && !currentStatus.open) {
      setError("You cannot establish a due date in a closed issue");
      return;
    }
    if (!value) {
      setFormData(prev => ({ ...prev, [name]: value, due_date_reason: "" }));
      return;
    }
  }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeSelect = (typeId) => {
    setFormData(prev => ({ ...prev, type_id: typeId }));
    setShowTypeDropdown(false);
  };
  
  const handleSeveritySelect = (severityId) => {
    setFormData(prev => ({ ...prev, severity_id: severityId }));
    setShowSeverityDropdown(false);
  };
  
  const handlePrioritySelect = (priorityId) => {
    setFormData(prev => ({ ...prev, priority_id: priorityId }));
    setShowPriorityDropdown(false);
  };
  
const handleStatusSelect = (statusId) => {
  setFormData(prev => {
    const newFormData = { ...prev, status_id: statusId };
    const newStatus = statuses.find(s => s.id === statusId);
    if (!newStatus.open) {
      newFormData.due_date = "";
      newFormData.due_date_reason = "";
    }
    
    return newFormData;
  });
  setShowStatusDropdown(false);
};
  
  const handleAssigneeSelect = (userId) => {
    setFormData(prev => ({ ...prev, assigned_to_id: userId }));
    setShowAssigneeDropdown(false);
  };
  
  const assignToMe = () => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, assigned_to_id: currentUser.id }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("user_id", currentUser.id.toString());
      
      const formDataToSubmit = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          if (key === "type_id") {
              formDataToSubmit.append(`issue[issue_type_id]`, formData[key]);
          }
          else formDataToSubmit.append(`issue[${key}]`, formData[key]);
        }
      });
      
      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSubmit.append("issue[attachments][]", file);
        });
      }

      const newIssue = await createIssue(formDataToSubmit);
      
      navigate("ShowIssue", { issueId: newIssue.id });
    } catch (error) {
      console.error("Error creating issue:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user_id");
        setCurrentUser(null);
        setError("Tu sesión ha caducado. Por favor, inicia sesión de nuevo.");
        setShowLoginModal(true);
      } else {
        setError("Error al crear la issue: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getItemByIdFromList = (list, id) => {
    return list.find(item => item.id === id) || null;
  };
  
  const getSelectedType = () => getItemByIdFromList(types, formData.type_id);
  const getSelectedSeverity = () => getItemByIdFromList(severities, formData.severity_id);
  const getSelectedPriority = () => getItemByIdFromList(priorities, formData.priority_id);
  const getSelectedStatus = () => getItemByIdFromList(statuses, formData.status_id);
  const getSelectedUser = () => getItemByIdFromList(users, formData.assigned_to_id);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user_id", user.id);
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <style jsx>{`
          .loading-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 300px;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="taiga-container">
      <div className="lightbox-container">
        <div className="lightbox-header">

          <h1 className="title-page">New Issue</h1>

          <button 
            className="close-button"
            onClick={() => navigate("IndexIssues")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {!currentUser && (
            <button
              className="login-button"
              onClick={() => setShowLoginModal(true)}
            >
              Log in
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!currentUser ? (
          <div className="login-required-message">
            Debes iniciar sesión para crear una issue.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="issue-form">
            <div className="form-wrapper">
              <div className="main">
                <fieldset>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="Subject"
                  />
                </fieldset>

                <fieldset>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="10"
                    className="description"
                    placeholder="Please add descreptive texto to help others better understand the issue"
                  ></textarea>
                </fieldset>
                
                <fieldset>
                  <section className="attachments">
                    <div className="attachments-header">
                      <h3 className="attachments-title">
                        <span className="attachments-num">{files.length}</span>
                        <span className="attachments-text">Attachments</span>
                      </h3>
                      <div className="add-attach">
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
                          className="add-attachment-button"
                        >
                        <svg className="icon-add" viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                        </button>
                      </div>
                    </div>

                    <div className="attachment-list">
                      {files.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <div className="attachment-content">
                            <span className="icon-file">📎</span>
                            <span className="attachment-name">{file.name}</span>
                            <a
                              href={index.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-name"
                            >
                              {index.filename}
                            </a>
                            <span className="attachment-size">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <button 
                            className="delete-button" 
                            onClick={() => removeFile(index)}
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </fieldset>
              </div>

              <aside className="sidebar">
                <fieldset className="status-field">
                  <div className="dropdown-container" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="status-dropdown"
                      style={{ backgroundColor: getSelectedStatus()?.color || '#70728f' }}
                    >
                      <span>{getSelectedStatus()?.name || 'Estado'}</span>
                      <svg className="icon-arrow" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </button>
                    
                    {showStatusDropdown && (
                      <div className="dropdown">
                        <ul>
                          {statuses.map((status) => (
                            <li key={status.id} onClick={() => handleStatusSelect(status.id)}>
                              <div className="dropdown-item">
                                <span>{status.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </fieldset>

                <section className="assigned-section">
                  <div className="dropdown-container" ref={assigneeDropdownRef}>
                    <button
                      type="button" 
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="assignee-dropdown"
                    >
                      <span className="assigned-name">
                        {getSelectedUser()?.name || 'Unassigned'}
                      </span>
                      <svg className="icon-arrow" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </button>
                    {showAssigneeDropdown && (
                      <div className="dropdown">
                        <ul>
                          <li onClick={() => handleAssigneeSelect("")}>
                            <div className="dropdown-item">
                              <span className="unassigned-option">Unassigned</span>
                            </div>
                          </li>
                          {users.map((user) => (
                            <li key={user.id} onClick={() => handleAssigneeSelect(user.id)}>
                              <div className="dropdown-item">
                                {user.avatar_url && (
                                  <img src={user.avatar_url} alt={user.name} className="user-avatar-small" />
                                )}
                                <span>{user.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="self-assign-container">
                    <span className="or-text">o</span>
                    <button type="button" onClick={assignToMe} className="self-assign">
                      Assign to me
                    </button>
                  </div>
                </section>

                <div className="field-container" id="issue-type-container">
                  <div className="field-label">Type</div>
                  <div className="dropdown-container" ref={typeDropdownRef}>
                    <div 
                      className="field-value"
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    >
                      <span>{getSelectedType()?.name || 'Type'}</span>
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: getSelectedType()?.color || '#ff4c33' }}
                      ></span>
                    </div>
                    
                    {showTypeDropdown && (
                      <div className="dropdown">
                        <ul>
                          {types.map((type) => (
                            <li key={type.id} onClick={() => handleTypeSelect(type.id)}>
                              <div className="dropdown-item">
                                <span>{type.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="field-container" id="severity-container">
                  <div className="field-label">Severity</div>
                  <div className="dropdown-container" ref={severityDropdownRef}>
                    <div 
                      className="field-value"
                      onClick={() => setShowSeverityDropdown(!showSeverityDropdown)}
                    >
                      <span>{getSelectedSeverity()?.name || 'Severity'}</span>
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: getSelectedSeverity()?.color || '#00e354' }}
                      ></span>
                    </div>
                    
                    {showSeverityDropdown && (
                      <div className="dropdown">
                        <ul>
                          {severities.map((severity) => (
                            <li key={severity.id} onClick={() => handleSeveritySelect(severity.id)}>
                              <div className="dropdown-item">
                                <span>{severity.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="field-container" id="priority-container">
                  <div className="field-label">Priority</div>
                  <div className="dropdown-container" ref={priorityDropdownRef}>
                    <div 
                      className="field-value"
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    >
                      <span>{getSelectedPriority()?.name || 'Priority'}</span>
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: getSelectedPriority()?.color || '#efca01' }}
                      ></span>
                    </div>
                    
                    {showPriorityDropdown && (
                      <div className="dropdown">
                        <ul>
                          {priorities.map((priority) => (
                            <li key={priority.id} onClick={() => handlePrioritySelect(priority.id)}>
                              <div className="dropdown-item">
                                <span>{priority.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="field-container" id="due-date-container">
                  <div className="field-label">Due date</div>
                  <div className="dropdown-container">
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="date-input"
                      placeholder="Select date"
                    />
                  </div>
                  
                  <div className="due-date-reason-wrapper">
                    {formData.due_date ? (
                      <div className="due-date-reason">
                        <div className="field-label">Reason for the due date</div>
                        <textarea
                          name="due_date_reason"
                          value={formData.due_date_reason}
                          onChange={handleChange}
                          placeholder="Why does this issue need a due date?"
                          className="reason-textarea"
                        />
                      </div>
                    ) : (
                      <div className="due-date-reason-placeholder"></div>
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <span>Creando...</span>
                  </div>
                ) : (
                  "Create Issue"
                )}
              </button>
            </div>
          </form>
        )}
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => !currentUser && navigate("IndexIssues")}
          onLogin={handleLogin}
        />
      </div>
        
      <style jsx>{`

        .attachments {
          margin-top: 24px;
        }

        .attachments-text {
          font: inherit;
          color: #4c566a;
        }
        
        .attachments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f5f7f9;
          padding: 10px;
          border-radius: 2px;
        }
        
        .attachments-title {
          font-size: 14px;
          font: inherit;
          color:rgb(0, 0, 0);
          margin: 0;
        }
        
        .attachments-num {
          margin-right: 4px;
          color: #4c566a;
        }
        
        .file-input {
          display: none;
        }
        
        .add-attachment-button {
          background: none;
          border: none;
          color: #5b8aa8;
          cursor: pointer;
          padding: 4px;
        }
        
        .icon-add {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          stroke-width: 2;
          fill: none;
        }
        
        .attachment-list {
          margin-top: 8px;
        }
        
        .attachment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f1f4;
        }
        
        .attachment-content {
          display: flex;
          align-items: center;
          flex-grow: 1;
        }
        
        .icon-file {
          width: 20px;
          height: 20px;
          stroke: #767676;
          stroke-width: 1.5;
          fill: none;
          margin-right: 8px;
        }
        
        .attachment-name {
          flex-grow: 1;
          font-size: 14px;
          color: #000000;
        }
        
        .attachment-size {
          color: #767676;
          font-size: 12px;
          margin-left: 8px;
          margin-right: 8px;
        }
        
        .delete-button {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 4px;
        }
        
        .delete-button:hover {
          color: #e44057;
        }
        
        .icon-delete {
          width: 16px;
          height: 16px;
          stroke: currentColor;
          stroke-width: 2;
          fill: none;
        }
        
        .status-field {
          margin-bottom: 24px;
        }
        
        .dropdown-container {
          position: relative;
        }
        
        .status-dropdown {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 8px 12px;
          border: none;
          border-radius: 3px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          text-align: left;
        }
        
        .icon-arrow {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        
        .dropdown {
          position: absolute;
          left: 0;
          top: 100%;
          width: 100%;
          background: white;
          border: 1px solid #d8dee9;
          border-radius: 5px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          z-index: 10;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .dropdown ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .dropdown li {
          cursor: pointer;
        }
        
        .dropdown-item {
          justify-content: flex-start;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          font-size: 14px;
          color: #000000;
          font: inherit;
        }
        
        .dropdown li:hover .dropdown-item {
          background-color: #f5f7f9;
        }

        .dropdown-item span {
          color: #000000;
        }
        
        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: auto;
          margin-right: 0;
        }
        
        .dropdown-item .color-dot {
          margin-left: 8px;
          margin-right: 0;
        }
        
        .assigned-section {
          margin-bottom: 8px;
        }
        
        .assignee-dropdown {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 8px 12px;
          background: white;
          border: 1px solidrgb(255, 255, 255);
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          text-align: left;
          color: #000000;
        }

        .assigned-name {
          color: #000000;
          font-weight: 500;
        }
        
        .user-avatar-small {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .self-assign-container {
          display: flex;
          align-items: center;
          margin-top: 8px;
        }
        
        .or-text {
          color: #767676;
          font-size: 14px;
          margin-right: 8px;
        }
        
        .self-assign {
          color:rgb(94, 91, 168);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 14px;
        }
        
        .field-container {
          margin-bottom: 8px;
          position: relative;
        }
        
        .field-label {
          color:rgba(0, 0, 0, 0.5);
          font-size: 13px;
          margin-bottom: 6px;
        }
        
        .field-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d8dee9;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
        }

        .taiga-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: transparent;
          min-height: 100vh;
        }
        
        .lightbox-container {
          background-color: #ffffff;
          padding: 5px;
          border-radius: 4px;
          box-shadow: none;
          width: 100%;
        }
        
        .lightbox-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
          position: relative;
        }

        .close-button {
          position: absolute;
          right: 0;
          top: 0;
          color: #000000;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .close-button:hover {
          color: #5b8aa8;
        }
        
        .title {
          font-size: 22px;
          font-weight: normal;
          text-align: center;
          font: inherit;
          color:rgb(0, 0, 0);
          margin: 0 auto;
        }

        .title-page {
          font-size: 22px;
          font-weight: bold;
          text-align: center;
          color:rgb(0, 0, 0);
          margin: 0 auto;
        }
        
        .user-info {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          align-items: center;
          z-index: 5;
        }
        
        .user-label {
          margin-right: 8px;
          font-size: 14px;
        }
        
        .user-avatar-container {
          display: flex;
          align-items: center;
          background-color: #f5f7f9;
          border-radius: 20px;
          padding: 4px 12px;
        }
        
        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .user-name {
          font-weight: 500;
          font-size: 14px;
        }
        
        .login-button {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #5b8aa8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .error-message {
          color: #e44057;
          background: #f1f1f4;
          border: 2px solid #e44057;
          font-size: 14px;
          margin-bottom: 16px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .login-required-message {
          color: #856404;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .issue-form {
          width: 100%;
        }
        
        .form-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
        }
        
        .main {
          flex: 3;
          min-width: 300px;
        }
        
        .sidebar {
          flex: 1;
          min-width: 220px;
          padding-left: 20px;
          border-left: 1px solid #e2e3e9;
        }
        
        fieldset {
          border: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .field-value span {
          color: #000000;
        }
        
        .input, .description {
          width: 100%;
          padding: 10px;
          border: 1px solid #d8dee9;
          border-radius: 2px;
          font-size: 14px;
          margin-bottom: 16px;
          color: #000000;
        }
        
        .description {
          min-height: 200px;
          resize: vertical;
        }
        
        .attachments {
          margin-top: 24px;
        }
        
        .attachment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f1f4;
        }

        .delete-button {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 4px;
        }
        
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: 24px;
          gap: 12px;
        }
        
        .cancel-button {
          padding: 8px 8px;
          background: white;
          border: 1px solid #d8dee9;
          border-radius: 4px;
          color: #767676;
          cursor: pointer;
          font-size: 14px;
        }
        
        .submit-button {
          padding: 8px 16px;
          background:rgb(135, 224, 244);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .submit-button:hover {
          background:rgb(1, 128, 145);
        }
        
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading {
          display: flex;
          align-items: center;
        }

        .date-input {
          width: 100%;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d8dee9;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color:rgb(0, 0, 0);
        }

        .quick-date-button:hover {
          background-color: #e5e9f0;
        }

        .due-date-reason {
          margin-top: 12px;
          height: 100%;
          color: #000000;
        }

        .reason-textarea {
          width: 100%;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d8dee9;
          border-radius: 3px;
          font-size: 14px;
          color: #000000;
          height: calc(100% - 25px);
          min-height: 80px;
          resize: vertical;
          margin-top: 4px;
        }

        .due-date-reason-wrapper {
          min-height: 130px; /* Altura aproximada del campo de razón + su etiqueta */
          margin-top: 12px;
        }

        .due-date-reason-placeholder {
          height: 100%;
        }
        
        ::placeholder {
          color: #767676;
          opacity: 0.7;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .form-wrapper {
            flex-direction: column;
          }
          
          .sidebar {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            margin-top: 20px;
          }
        }
      `}</style>
    </div>
  );
}