import api from "./axios.js";

  api.interceptors.request.use(config => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.token) {
          // Ajusta el formato según lo que espere tu API
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
    return config;
  });

// Users
export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const getAuthenticatedUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

// Issues
export const getIssues = async (params = {}) => {
  const response = await api.get("/issues", { params });
  return response.data;
};

export const getIssueById = async (id) => {
  const response = await api.get(`/issues/${id}`);
  return response.data;
};

export const createIssue = async (formData) => {
  const response = await api.post(`/issues`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const bulkCreateIssues = async (issuesText) => {
  const response = await api.post("/issues/bulk_create", {
    bulk_issues: issuesText
  });
  return response.data;
};

export const updateIssue = async (id, issueData) => {
  const response = await api.put(`/issues/${id}`, issueData);
  return response.data;
};

export const deleteIssue = async (id) => {
  const response = await api.delete(`/issues/${id}`);
  return response.data;
};

// Comments
export const getCommentsByUserId = async (userId) => {
  const response = await api.get(`/users/${userId}/comments`);
  return response.data;
};

export const getCommentsByIssueId = async (issueId) => {
  const response = await api.get(`/issues/${issueId}/comments`);
  return response.data;
};

export const createComment = async (issueId, commentData) => {
  const response = await api.post(`/issues/${issueId}/comments`, commentData);
  return response.data;
};

// Watchers
export const getWatchersByUserId = async (userId) => {
  const response = await api.get(`/users/${userId}/watchers`);
  return response.data;
};

export const getWatchersByIssueId = async (issueId) => {
  const response = await api.get(`/issues/${issueId}/watchers`);
  return response.data;
};

export const addWatcherToIssue = async (issueId, watcherData) => {
  const response = await api.post(`/issues/${issueId}/watchers`, watcherData);
  return response.data;
};

export const removeWatcherFromIssue = async (issueId, watcherId) => {
  const response = await api.delete(`/issues/${issueId}/watchers/${watcherId}`);
  return response.data;
};

// Types
export const getTypes = async () => {
  const response = await api.get("/types");
  return response.data;
};

export const getTypeById = async (id) => {
  const response = await api.get(`/types/${id}`);
  return response.data;
};

export const createType = async (typeData) => {
  const response = await api.post("/types", typeData);
  return response.data;
};

export const updateType = async (id, typeData) => {
  const response = await api.put(`/types/${id}`, typeData);
  return response.data;
};

export const deleteType = async (id, newTypeId) => {
  const response = await api.delete(`/types/${id}`, {
    params: { new_type_id: newTypeId },
  });
  return response.data;
};

// Severities
export const getSeverities = async () => {
  const response = await api.get("/severities");
  return response.data;
};

export const getSeverityById = async (id) => {
  const response = await api.get(`/severities/${id}`);
  return response.data;
};

export const createSeverity = async (severityData) => {
  const response = await api.post("/severities", severityData);
  return response.data;
};

export const updateSeverity = async (id, severityData) => {
  const response = await api.put(`/severities/${id}`, severityData);
  return response.data;
};

export const deleteSeverity = async (id, newSeverityId) => {
  const response = await api.delete(`/severities/${id}`, {
    params: { new_severity_id: newSeverityId },
  });
  return response.data;
};

// Priorities
export const getPriorities = async () => {
  const response = await api.get("/priorities");
  return response.data;
};

export const getPriorityById = async (id) => {
  const response = await api.get(`/priorities/${id}`);
  return response.data;
};

export const createPriority = async (priorityData) => {
  const response = await api.post("/priorities", priorityData);
  return response.data;
};

export const updatePriority = async (id, priorityData) => {
  const response = await api.put(`/priorities/${id}`, priorityData);
  return response.data;
};

export const deletePriority = async (id, newPriorityId) => {
  const response = await api.delete(`/priorities/${id}`, {
    params: { new_priority_id: newPriorityId },
  });
  return response.data;
};

// Statuses
export const getStatuses = async () => {
  const response = await api.get("/statuses");
  return response.data;
};

export const getStatusById = async (id) => {
  const response = await api.get(`/statuses/${id}`);
  return response.data;
};

export const createStatus = async (statusData) => {
  const response = await api.post("/statuses", statusData);
  return response.data;
};

export const updateStatus = async (id, statusData) => {
  const response = await api.put(`/statuses/${id}`, statusData);
  return response.data;
};

export const deleteStatus = async (id, newStatusId) => {
  const response = await api.delete(`/statuses/${id}`, {
    params: { new_status_id: newStatusId },
  });
  return response.data;
};
