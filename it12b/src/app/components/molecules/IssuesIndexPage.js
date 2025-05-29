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
  const [currentUser, setCurrentUser] = useState(null);
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
      const [typesData, severitiesData, prioritiesData, statusesData, usersData] =
        await Promise.all([getTypes(), getSeverities(), getPriorities(), getStatuses(), getUsers()]);

      setTypes(typesData);
      setSeverities(severitiesData);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setAssignedTo(usersData);
      setCreatedBy(usersData);
      setUsers(usersData);

      // Parámetros para la API (sin incluir filter_unassigned)
      const params = {
        sort: sort.field,
        direction: sort.direction,
        search: filters.search || undefined,
      };

      // Añadir los filtros estándar
      if (filters.type.length > 0) params["filter_type[]"] = filters.type;
      if (filters.severity.length > 0) params["filter_severity[]"] = filters.severity;
      if (filters.priority.length > 0) params["filter_priority[]"] = filters.priority;
      if (filters.status.length > 0) params["filter_status[]"] = filters.status;
      if (filters.assignedTo.length > 0) params["filter_assignee[]"] = filters.assignedTo;
      if (filters.createdBy.length > 0) params["filter_creator[]"] = filters.createdBy;

      // Obtener issues desde la API
      const issuesData = await getIssues(params);

      // Procesar las issues para añadir detalles de usuario
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

      // FILTRO MANUAL: Si está activado el filtro "Sin asignar"
      let filteredIssues = processedIssues;
      if (filters.unassigned) {
        // Filtrar solo las issues que no tienen assigned_to_id
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

      // Estructura correcta para el PUT request
      const updateData = {
        issue: {
          assigned_to_id: userId,
        },
      };

      console.log("Enviando actualización:", updateData);
      //console.log(currentUser);
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
      console.error("Error al asignar usuario:", error);
      // Mostrar detalles adicionales del error para depuración
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        console.error("Estado HTTP:", error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

    // Añade esta función antes del return del componente
  const getSortedIssues = () => {
    // Si estamos ordenando por assigned_to_id y tenemos filtro unassigned
    if (sort.field === "assigned_to_id" && filters.unassigned) {
      return [...issues].sort((a, b) => {
        // Convertir a números o strings vacíos para comparación
        const aValue = a.assigned_to_id || "";
        const bValue = b.assigned_to_id || "";

        // Ordenar
        if (aValue === bValue) return 0;
        if (sort.direction === "asc") {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      });
    }

    // Para cualquier otro caso, usar las issues ya ordenadas por la API
    return issues;
  };



  const handleBulkInsert = async (issuesData) => {
    try {
      setLoading(true);

      const bulkIssuesText = issuesData.join("\n");

      console.log("Enviando bulk insert:", bulkIssuesText);

      const result = await bulkCreateIssues(bulkIssuesText);

      const params = {
        sort: sort.field,
        direction: sort.direction,
        search: filters.search || undefined,
      };

      // Añadir los filtros seleccionados
      if (filters.type.length > 0) params["filter_type[]"] = filters.type;
      if (filters.severity.length > 0) params["filter_severity[]"] = filters.severity;
      if (filters.priority.length > 0) params["filter_priority[]"] = filters.priority;
      if (filters.status.length > 0) params["filter_status[]"] = filters.status;
      if (filters.assignedTo.length > 0) params["filter_assignee[]"] = filters.assignedTo;
      if (filters.createdBy.length > 0) params["filter_creator[]"] = filters.createdBy;
      // Añadir filtro para issues sin asignar
      if (filters.unassigned) params.filter_unassigned = true;

      // Recargar las issues
      const updatedIssues = await getIssues(params);
      setIssues(updatedIssues);

      // Cierra el modal
      setShowBulkInsertModal(false);

      // Muestra una notificación de éxito con el número de issues creadas
      // Asumiendo que la API devuelve el número de issues creadas o se puede calcular
      const createdCount = result?.created_count || issuesData.length;
      alert(`Se han creado ${createdCount} issues correctamente.`);
    } catch (error) {
      console.error("Error en bulk insert:", error);
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        console.error("Estado HTTP:", error.response.status);
      }
      alert("Error al crear las issues. Por favor, inténtelo de nuevo.");
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

  // Calcular si hay filtros activos para mostrar un indicador en el botón
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
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Issues</h1>

      {/* Barra de búsqueda y botones */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar issues..."
            className="px-4 py-2 border rounded-md flex-grow text-gray-800"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => navigate("NewIssue")}
          >
            Nueva Issue
          </button>

          {/* Añade este botón para bulk insert */}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={() => setShowBulkInsertModal(true)}
          >
            Crear Múltiples Issues
          </button>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={() => setShowLoginModal(true)}
          >
            Iniciar Sesión
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
            Filtros
          </button>
          {/* Botón de configuración */}
          <button
              className="bg-gray-700 text-white p-2 rounded-md hover:bg-gray-800"
              onClick={() => navigate("AdminSettings")}
              title="Configuración"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>
        </div>

        {/* Filtros desplegables */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Filtro por tipo */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Tipo</h3>
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

            {/* Filtro por severidad */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Severidad</h3>
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

            {/* Filtro por prioridad */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Prioridad</h3>
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

            {/* Filtro por estado */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Estado</h3>
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

            {/* Filtro por asignado a */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Asignado a</h3>
              <div className="max-h-32 overflow-y-auto">
                {/* Agregar opción "Sin asignar" */}
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={filters.unassigned}
                    onChange={() => handleFilterChange("unassigned", !filters.unassigned)}
                  />
                  <span className="flex items-center gap-2 text-gray-800">
                    <span className="inline-block w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">-</span>
                    Sin asignar
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

            {/* Filtro por creado por */}
            <div>
              <h3 className="font-medium mb-2 text-gray-900">Creado por</h3>
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
            Cargando issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-gray-900">
            No se encontraron issues
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("title")}
                >
                  ID / Título{" "}
                  {sort.field === "title" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("type")}
                >
                  Tipo{" "}
                  {sort.field === "type" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("severity")}
                >
                  Severidad{" "}
                  {sort.field === "severity" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("priority")}
                >
                  Prioridad{" "}
                  {sort.field === "priority" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("status")}
                >
                  Estado{" "}
                  {sort.field === "status" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("updated_at")}
                >
                  Actualizado{" "}
                  {sort.field === "updated_at" &&
                    (sort.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("assigned_to_id")}
                >
                  Asignado a{" "}
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
                          Sin asignar
                        </span>
                      )}
                      <button
                        className="ml-2 p-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar que se navegue a la issue al hacer clic en este botón
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de login */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
        }}
      />

      {/* Opcional: Mostrar el usuario actual */}
      {currentUser && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-md flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            {currentUser.avatar && (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{currentUser.name}</div>
            <button
              className="text-red-600 text-sm hover:text-red-800 font-medium"
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem("currentUser");
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
      {showAssignPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Asignar usuario
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

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar usuario..."
                className="w-full px-4 py-2 border rounded-md text-gray-800"
                onChange={(e) => {
                  // Aquí podrías implementar una búsqueda local de usuarios
                  // Por simplicidad, no lo implementaremos ahora
                }}
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => handleAssignUser(null)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">-</span>
                </div>
                <span className="text-gray-800">Sin asignar</span>
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
