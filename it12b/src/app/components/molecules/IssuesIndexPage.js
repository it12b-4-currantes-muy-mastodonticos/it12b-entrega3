"use client";

import { useState, useEffect } from "react";
import {
  getIssues,
  getTypes,
  getSeverities,
  getPriorities,
  getStatuses,
  getUsers,
  updateIssue,
  bulkCreateIssues,
} from "../../apiCall";
import LoginModal from "../organisms/loginModal";
import BulkInsertModal from "../organisms/BulkInsertModal";

export default function IssuesIndexPage({ navigate }) {
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [createdBy, setCreatedBy] = useState([]);
  const [issues, setIssues] = useState([]);
  const [types, setTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
  if (typeof localStorage !== "undefined") {
    const storedUser = localStorage.getItem("currentUser");
    return storedUser ? JSON.parse(storedUser) : null;
  }
  return null;
});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: [],
    severity: [],
    priority: [],
    status: [],
    search: "",
    assignedTo: [],
    createdBy: [],
    unassigned: false,
  });
  const [sort, setSort] = useState({
    field: "updated_at",
    direction: "desc",
  });
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [currentIssueId, setCurrentIssueId] = useState(null);
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // Initial data loading (no changes)
      const [typesData, severitiesData, prioritiesData, statusesData, usersData] =
        await Promise.all([getTypes(), getSeverities(), getPriorities(), getStatuses(), getUsers()]);

      setTypes(typesData);
      setSeverities(severitiesData);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setAssignedTo(usersData);
      setCreatedBy(usersData);
      setUsers(usersData);

      // API parameters (without filter_unassigned)
      const params = {
        sort: sort.field,
        direction: sort.direction,
        search: filters.search || undefined,
      };

      // Add standard filters
      if (filters.type.length > 0) params["filter_type[]"] = filters.type;
      if (filters.severity.length > 0) params["filter_severity[]"] = filters.severity;
      if (filters.priority.length > 0) params["filter_priority[]"] = filters.priority;
      if (filters.status.length > 0) params["filter_status[]"] = filters.status;
      if (filters.assignedTo.length > 0) params["filter_assignee[]"] = filters.assignedTo;
      if (filters.createdBy.length > 0) params["filter_creator[]"] = filters.createdBy;

      // Get issues from API
      const issuesData = await getIssues(params);

      // Process issues to add user details
      const processedIssues = issuesData.map((issue) => {
        if (issue.assigned_to_id) {
          const assignedUser = usersData.find(
            (user) => user.id === issue.assigned_to_id
          );
          if (assignedUser) {
            issue.assigned_to_user = assignedUser;
          }
        }
        return issue;
      });

      // MANUAL FILTER: If "Unassigned" filter is active
      let filteredIssues = processedIssues;
      if (filters.unassigned) {
        // Filter only issues without assigned_to_id
        filteredIssues = processedIssues.filter(issue => !issue.assigned_to_id);
      }

      setIssues(filteredIssues);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [filters, sort]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === "search") {
      setFilters((prev) => ({ ...prev, search: value }));
    } else if (filterType === "unassigned") {
      setFilters((prev) => ({ ...prev, unassigned: value }));
    } else {
      setFilters((prev) => {
        const currentValues = [...prev[filterType]];
        const valueIndex = currentValues.indexOf(value);

        if (valueIndex === -1) {
          currentValues.push(value);
        } else {
          currentValues.splice(valueIndex, 1);
        }

        return { ...prev, [filterType]: currentValues };
      });
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      setLoading(true);

      // Correct structure for PUT request
      const updateData = {
        issue: {
          assigned_to_id: userId,
        },
      };

      console.log("Sending update:", updateData);
      await updateIssue(currentIssueId, updateData);

      const assignedUser = users.find((user) => user.id === userId);

      setIssues(
        issues.map((issue) =>
          issue.id === currentIssueId
            ? {
                ...issue,
                assigned_to_id: userId,
                assigned_to_user: userId ? assignedUser : null,
              }
            : issue
        )
      );

      setShowAssignPopup(false);
      setCurrentIssueId(null);
    } catch (error) {
      console.error("Error assigning user:", error);
      // Show additional error details for debugging
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("HTTP Status:", error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

    // Add this function before the component return
  const getSortedIssues = () => {
    // If we're sorting by assigned_to_id and have unassigned filter
    if (sort.field === "assigned_to_id" && filters.unassigned) {
      return [...issues].sort((a, b) => {
        // Convert to numbers or empty strings for comparison
        const aValue = a.assigned_to_id || "";
        const bValue = b.assigned_to_id || "";

        // Sort
        if (aValue === bValue) return 0;
        if (sort.direction === "asc") {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      });
    }

    // For any other case, use issues already sorted by API
    return issues;
  };



  const handleBulkInsert = async (issuesData) => {
    try {
      setLoading(true);

      const bulkIssuesText = issuesData.join("\n");

      console.log("Sending bulk insert:", bulkIssuesText);

      const result = await bulkCreateIssues(bulkIssuesText);

      const params = {
        sort: sort.field,
        direction: sort.direction,
        search: filters.search || undefined,
      };

      // Add selected filters
      if (filters.type.length > 0) params["filter_type[]"] = filters.type;
      if (filters.severity.length > 0) params["filter_severity[]"] = filters.severity;
      if (filters.priority.length > 0) params["filter_priority[]"] = filters.priority;
      if (filters.status.length > 0) params["filter_status[]"] = filters.status;
      if (filters.assignedTo.length > 0) params["filter_assignee[]"] = filters.assignedTo;
      if (filters.createdBy.length > 0) params["filter_creator[]"] = filters.createdBy;
      // Add filter for unassigned issues
      if (filters.unassigned) params.filter_unassigned = true;

      // Reload issues
      const updatedIssues = await getIssues(params);
      setIssues(updatedIssues);

      // Close modal
      setShowBulkInsertModal(false);

      // Show success notification with number of issues created
      // Assuming the API returns the number of issues created or can be calculated
      const createdCount = result?.created_count || issuesData.length;
      alert(`${createdCount} issues have been created successfully.`);
    } catch (error) {
      console.error("Error in bulk insert:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("HTTP Status:", error.response.status);
      }
      alert("Error creating issues. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (field) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Calculate if there are active filters to show an indicator on the button
  const hasActiveFilters = () => {
    return (
      filters.type.length > 0 ||
      filters.severity.length > 0 ||
      filters.priority.length > 0 ||
      filters.status.length > 0 ||
      filters.assignedTo.length > 0 ||
      filters.createdBy.length > 0 ||
      filters.unassigned
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
  <h1 className="text-3xl font-bold text-gray-900">Issues</h1>

  {currentUser && (
    <div className="flex items-center gap-2">
      {currentUser.avatar_url ? (
        <img
          src={currentUser.avatar_url}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
          {currentUser.name?.charAt(0) || "?"}
        </div>
      )}
      <span className="text-gray-900 font-medium">{currentUser.name}</span>
    </div>
  )}
</div>

      {/* Search bar and buttons */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search issues..."
            className="px-4 py-2 border rounded-md flex-grow text-gray-800"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

          {currentUser ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => navigate("NewIssue")}
          >
            New Issue
          </button>
          ) : (
            <></>
          )}

          {/* Add this button for bulk insert */}
          {currentUser ? (
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={() => setShowBulkInsertModal(true)}
          >
            Create Multiple Issues
          </button>
          ) : (
            <></>
          )}

          {currentUser ? (
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem("currentUser");
                localStorage.removeItem("currentUserId");
                localStorage.removeItem("user_id");
                console.log("User logged out: ", localStorage);
              }}
            >
              Log Out
            </button>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              onClick={() => setShowLoginModal(true)}
            >
              Log In
            </button>
          )}

          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            onClick={() => navigate("UsersIndex")}
            title="Users Directory"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Users Directory
            </div>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              showFilters
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {hasActiveFilters() && (
              <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
            )}
            Filters
          </button>
          {/* Settings button */}
          <button
              className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-800"
              onClick={() => navigate("AdminSettings")}
              title="Settings"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>
        </div>

        {/* Dropdown filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Type filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Type</h3>
              <div className="max-h-32 overflow-y-auto">
                {types.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type.id)}
                      onChange={() => handleFilterChange("type", type.id)}
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></span>
                      {type.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Severity</h3>
              <div className="max-h-32 overflow-y-auto">
                {severities.map((severity) => (
                  <label
                    key={severity.id}
                    className="flex items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={filters.severity.includes(severity.id)}
                      onChange={() =>
                        handleFilterChange("severity", severity.id)
                      }
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: severity.color }}
                      ></span>
                      {severity.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Priority</h3>
              <div className="max-h-32 overflow-y-auto">
                {priorities.map((priority) => (
                  <label
                    key={priority.id}
                    className="flex items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority.id)}
                      onChange={() =>
                        handleFilterChange("priority", priority.id)
                      }
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: priority.color }}
                      ></span>
                      {priority.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Status</h3>
              <div className="max-h-32 overflow-y-auto">
                {statuses.map((status) => (
                  <label
                    key={status.id}
                    className="flex items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status.id)}
                      onChange={() => handleFilterChange("status", status.id)}
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      ></span>
                      {status.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assigned to filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Assigned to</h3>
              <div className="max-h-32 overflow-y-auto">
                {/* Add "Unassigned" option */}
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={filters.unassigned}
                    onChange={() => handleFilterChange("unassigned", !filters.unassigned)}
                  />
                  <span className="flex items-center gap-2 text-gray-800">
                    <span className="inline-block w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">-</span>
                    Unassigned
                  </span>
                </label>
                {assignedTo.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={filters.assignedTo.includes(user.id)}
                      onChange={() => handleFilterChange("assignedTo", user.id)}
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <span className="inline-block w-5 h-5 rounded-full bg-gray-300"></span>
                      )}
                      {user.name || user.username}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Created by filter */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Created by</h3>
              <div className="max-h-32 overflow-y-auto">
                {createdBy.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={filters.createdBy.includes(user.id)}
                      onChange={() => handleFilterChange("createdBy", user.id)}
                    />
                    <span className="flex items-center gap-2 text-gray-800">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <span className="inline-block w-5 h-5 rounded-full bg-gray-300"></span>
                      )}
                      {user.name || user.username}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-900">
            Loading issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-gray-900">
            No issues found
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("title")}
                >
                  ID / Title{" "}
                  {sort.field === "title" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("type")}
                >
                  Type{" "}
                  {sort.field === "type" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("severity")}
                >
                  Severity{" "}
                  {sort.field === "severity" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("priority")}
                >
                  Priority{" "}
                  {sort.field === "priority" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("status")}
                >
                  Status{" "}
                  {sort.field === "status" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("updated_at")}
                >
                  Updated{" "}
                  {sort.field === "updated_at" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("assigned_to_id")}
                >
                  Assigned to{" "}
                  {sort.field === "assigned_to_id" && (sort.direction === "asc" ? "↑" : "↓")}
                </th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {getSortedIssues().map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate("ShowIssue", { issueId: issue.id })}
                >
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-blue-800">
                        #{issue.id}
                      </span>
                      <span className="text-gray-900">{issue.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: issue.issue_type?.color }}
                      ></span>
                      {issue.issue_type?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: issue.severity?.color }}
                      ></span>
                      {issue.severity?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: issue.priority?.color }}
                      ></span>
                      {issue.priority?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${issue.status?.color}33`,
                        color: issue.status?.color,
                        textShadow: "0 0 2px rgba(255,255,255,0.8)",
                        fontWeight: 600,
                      }}
                    >
                      {issue.status?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(issue.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {issue.assigned_to_user ? (
                        <>
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            {issue.assigned_to_user.avatar_url ? (
                              <img
                                src={issue.assigned_to_user.avatar_url}
                                alt={issue.assigned_to_user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full bg-gray-300 flex items-center justify-center text-xs">
                                {issue.assigned_to_user.name?.charAt(0) || "?"}
                              </span>
                            )}
                          </div>
                          <span className="truncate max-w-[100px]">
                            {issue.assigned_to_user.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">
                          Unassigned
                        </span>
                      )}
                      {currentUser ? (
                      <button
                        className="ml-2 p-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent navigating to the issue when clicking this button
                          setCurrentIssueId(issue.id);
                          setShowAssignPopup(true);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      ) : ([])}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Login modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
        }}
      />
      {showAssignPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign user
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAssignPopup(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => handleAssignUser(null)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">-</span>
                </div>
                <span className="text-gray-800">Unassigned</span>
              </div>

              {assignedTo.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => handleAssignUser(user.id)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full bg-gray-300 flex items-center justify-center text-xs">
                        {user.name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-800">
                    {user.name || user.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showBulkInsertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <BulkInsertModal
            onClose={() => setShowBulkInsertModal(false)}
            onSubmit={handleBulkInsert}
          />
        </div>
      )}
    </div>
  );
}