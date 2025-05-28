"use client";

import { useState } from 'react';

export default function BulkInsertModal({ onClose, onSubmit }) {
  const [issueText, setIssueText] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Dividir el texto en líneas y filtrar líneas vacías
    const issues = issueText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (issues.length === 0) {
      alert('Por favor, introduce al menos un título de issue.');
      return;
    }
    
    // Llamar a la función de envío con la lista de títulos
    onSubmit(issues);
  };
  
  return (
    <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Crear múltiples issues</h3>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingresa una issue por línea:
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 text-gray-800"
            placeholder="Issue 1&#10;Issue 2&#10;Issue 3"
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            required
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Crear Issues
          </button>
        </div>
      </form>
    </div>
  );
}