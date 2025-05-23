"use client";

import { useState, useEffect } from "react";
import { getIssueById } from "../apiCall";

export default function ShowIssuePage({ issueId, navigate }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        const data = await getIssueById(issueId);
        setIssue(data);
      } catch (error) {
        console.error("Error fetching issue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [issueId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando issue...</div>;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Issue #{issue.id}</h1>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          onClick={() => navigate("IndexIssues")}
        >
          Volver al listado
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{issue.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <span className="text-gray-500 text-sm">Tipo:</span>
              <div className="flex items-center mt-1">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: issue.issue_type?.color }}
                ></span>
                <span>{issue.issue_type?.name}</span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-gray-500 text-sm">Severidad:</span>
              <div className="flex items-center mt-1">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: issue.severity?.color }}
                ></span>
                <span>{issue.severity?.name}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <span className="text-gray-500 text-sm">Prioridad:</span>
              <div className="flex items-center mt-1">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: issue.priority?.color }}
                ></span>
                <span>{issue.priority?.name}</span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-gray-500 text-sm">Estado:</span>
              <div className="mt-1">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${issue.status?.color}33`,
                    color: issue.status?.color,
                  }}
                >
                  {issue.status?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-gray-500 text-sm">Descripción:</span>
          <div className="mt-2 bg-gray-50 p-4 rounded-md">
            {issue.description ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: issue.description }}
              ></div>
            ) : (
              <p className="text-gray-400 italic">Sin descripción</p>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Creada el {new Date(issue.created_at).toLocaleDateString()} •
          Actualizada el {new Date(issue.updated_at).toLocaleDateString()}
        </div>
      </div>

      {/* Aquí puedes añadir comentarios, adjuntos, etc. */}
    </div>
  );
}
