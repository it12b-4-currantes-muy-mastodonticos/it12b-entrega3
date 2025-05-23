"use client";

import { useState, useEffect } from "react";
import {
  getIssues,
  getTypes,
  getSeverities,
  getPriorities,
  getStatuses,
} from "../apiCall";
import LoginModal from "../components/loginModal";

export default function IssuesIndexPage({ navigate }) {
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
  });
  const [sort, setSort] = useState({
    field: "updated_at",
    direction: "desc",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar los datos de filtrado
        const [typesData, severitiesData, prioritiesData, statusesData] =
          await Promise.all([
            getTypes(),
            getSeverities(),
            getPriorities(),
            getStatuses(),
          ]);

        setTypes(typesData);
        setSeverities(severitiesData);
        setPriorities(prioritiesData);
        setStatuses(statusesData);

        // Construir los parámetros de consulta
        const params = {
          sort: sort.field,
          direction: sort.direction,
          search: filters.search || undefined,
        };

        // Añadir los filtros seleccionados
        if (filters.type.length > 0) params["filter_type[]"] = filters.type;
        if (filters.severity.length > 0)
          params["filter_severity[]"] = filters.severity;
        if (filters.priority.length > 0)
          params["filter_priority[]"] = filters.priority;
        if (filters.status.length > 0)
          params["filter_status[]"] = filters.status;

        // Obtener las issues con los filtros aplicados
        const issuesData = await getIssues(params);
        setIssues(issuesData);
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
    } else {
      // Toggle selection for multiselect filters
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
      filters.status.length > 0
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

        <button
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          onClick={() => setShowLoginModal(true)}
        >
          Iniciar Sesión
        </button>
                <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            showFilters ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {hasActiveFilters() && (
            <span className="inline-block w-2 h-2 rounded-full bg-white"></span>
          )}
          Filtros
        </button>
      </div>

      {/* Filtros desplegables */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    onChange={() => handleFilterChange("severity", severity.id)}
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
                    onChange={() => handleFilterChange("priority", priority.id)}
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
                <label key={status.id} className="flex items-center gap-2 mb-1">
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
        </div>
      )}
    </div>

    {/* Tabla de issues - sin cambios */}
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      {loading ? (
        <div className="p-8 text-center text-gray-900">Cargando issues...</div>
      ) : issues.length === 0 ? (
        <div className="p-8 text-center text-gray-900">No se encontraron issues</div>
      ) : (
        <table className="min-w-full">
          <thead className="bg-white border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange("id")}
              >
                ID{" "}
                {sort.field === "id" && (sort.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange("title")}
              >
                Título{" "}
                {sort.field === "title" &&
                  (sort.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Severidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Estado
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange("updated_at")}
              >
                Actualizado{" "}
                {sort.field === "updated_at" &&
                  (sort.direction === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.map((issue) => (
              <tr
                key={issue.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate("ShowIssue", { issueId: issue.id })}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-800">
                  #{issue.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{issue.title}</td>
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
                      fontWeight: 600
                    }}
                  >
                    {issue.status?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(issue.updated_at).toLocaleDateString()}
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
  </div>
  );
}