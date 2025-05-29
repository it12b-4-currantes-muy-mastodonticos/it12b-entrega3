"use client";

export default function IssueList({ issues, onIssueClick }) {
  if (!issues || issues.length === 0) {
    return <div className="p-8 text-center text-gray-900">No se encontraron issues</div>;
  }

  return (
    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
            ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
            Título
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
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {issues.map((issue) => (
          <tr
            key={issue.id}
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => onIssueClick(issue.id)}
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
                  fontWeight: 600,
                }}
              >
                {issue.status?.name}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}