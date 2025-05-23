"use client";

import { useState, useEffect } from "react";
import {
  getTypes,
  getSeverities,
  getPriorities,
  createIssue,
} from "../apiCall";

export default function NewIssuePage({ navigate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type_id: "",
    severity_id: "",
    priority_id: "",
  });

  const [types, setTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesData, severitiesData, prioritiesData] = await Promise.all([
          getTypes(),
          getSeverities(),
          getPriorities(),
        ]);

        setTypes(typesData);
        setSeverities(severitiesData);
        setPriorities(prioritiesData);

        // Establecer valores por defecto
        if (typesData.length > 0)
          setFormData((prev) => ({ ...prev, type_id: typesData[0].id }));
        if (severitiesData.length > 0)
          setFormData((prev) => ({
            ...prev,
            severity_id: severitiesData[0].id,
          }));
        if (prioritiesData.length > 0)
          setFormData((prev) => ({
            ...prev,
            priority_id: prioritiesData[0].id,
          }));
      } catch (error) {
        console.error("Error fetching form data:", error);
        setError("No se pudieron cargar los datos del formulario");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        return;
      }

      const newIssue = await createIssue(formData);
      navigate("ShowIssue", { issueId: newIssue.id });
    } catch (error) {
      console.error("Error creating issue:", error);
      setError("Error al crear la issue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">Cargando formulario...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nueva Issue</h1>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          onClick={() => navigate("IndexIssues")}
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-medium mb-2"
              htmlFor="title"
            >
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-medium mb-2"
              htmlFor="description"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-2 border rounded-md"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="type_id"
              >
                Tipo
              </label>
              <select
                id="type_id"
                name="type_id"
                value={formData.type_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="severity_id"
              >
                Severidad
              </label>
              <select
                id="severity_id"
                name="severity_id"
                value={formData.severity_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                {severities.map((severity) => (
                  <option key={severity.id} value={severity.id}>
                    {severity.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="priority_id"
              >
                Prioridad
              </label>
              <select
                id="priority_id"
                name="priority_id"
                value={formData.priority_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 mr-2"
              onClick={() => navigate("IndexIssues")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              disabled={submitting}
            >
              {submitting ? "Creando..." : "Crear Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
