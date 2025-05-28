"use client";

import { useState, useEffect } from "react";
import {
  getTypes, createType, updateType, deleteType,
  getSeverities, createSeverity, updateSeverity, deleteSeverity,
  getPriorities, createPriority, updatePriority, deletePriority,
  getStatuses, createStatus, updateStatus, deleteStatus
} from "../../apiCall";

export default function AdminSettingsPage({ navigate }) {
  // Estados para cada categoría
  const [types, setTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  // Estado para seguimiento de carga
  const [loading, setLoading] = useState(true);
  
  // Estado para el elemento que se está editando actualmente
  const [editingItem, setEditingItem] = useState(null);
  
  // Estado para elemento nuevo
  const [newItem, setNewItem] = useState({
    category: null, // 'type', 'severity', 'priority', 'status'
    name: '',
    color: '#3498db',
    is_closed: false,
  });

  // Estado para elemento de reemplazo (al eliminar)
  const [replacementItem, setReplacementItem] = useState({
    typeId: '',
    severityId: '',
    priorityId: '',
    statusId: '',
  });

  // Estado para mostrar/ocultar formulario de nuevo elemento
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  
  // Estado para errores
  const [error, setError] = useState(null);

  // Cargar datos al inicio
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesData, severitiesData, prioritiesData, statusesData] = await Promise.all([
          getTypes(),
          getSeverities(),
          getPriorities(),
          getStatuses()
        ]);

        setTypes(typesData);
        setSeverities(severitiesData);
        setPriorities(prioritiesData);
        setStatuses(statusesData);
        setError(null);
      } catch (error) {
        console.error("Error cargando datos de configuración:", error);
        setError("Error cargando configuración. Por favor, intente de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejar cambios en formulario de nuevo elemento o edición
  const handleItemChange = (e, isEditing = false) => {
    const { name, value, type, checked } = e.target;
    
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Guardar un nuevo elemento
  const handleSaveNewItem = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      let result;
      
      switch (newItem.category) {
        case 'type':
          result = await createType(newItem);
          setTypes([...types, result]);
          break;
        case 'severity':
          result = await createSeverity(newItem);
          setSeverities([...severities, result]);
          break;
        case 'priority':
          result = await createPriority(newItem);
          setPriorities([...priorities, result]);
          break;
        case 'status':
          result = await createStatus(newItem);
          setStatuses([...statuses, result]);
          break;
        default:
          throw new Error("Categoría desconocida");
      }
      
      // Reset form
      setNewItem({
        category: null,
        name: '',
        color: '#3498db',
        is_closed: false
      });
      setShowNewItemForm(false);
      setError(null);
    } catch (error) {
      console.error("Error creando elemento:", error);
      setError(`Error creando ${getCategoryDisplayName(newItem.category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un elemento existente
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      switch (editingItem.category) {
        case 'type':
          await updateType(editingItem.id, editingItem);
          setTypes(types.map(item => item.id === editingItem.id ? editingItem : item));
          break;
        case 'severity':
          await updateSeverity(editingItem.id, editingItem);
          setSeverities(severities.map(item => item.id === editingItem.id ? editingItem : item));
          break;
        case 'priority':
          await updatePriority(editingItem.id, editingItem);
          setPriorities(priorities.map(item => item.id === editingItem.id ? editingItem : item));
          break;
        case 'status':
          await updateStatus(editingItem.id, editingItem);
          setStatuses(statuses.map(item => item.id === editingItem.id ? editingItem : item));
          break;
        default:
          throw new Error("Categoría desconocida");
      }
      
      setEditingItem(null);
      setError(null);
    } catch (error) {
      console.error("Error actualizando elemento:", error);
      setError(`Error actualizando ${getCategoryDisplayName(editingItem.category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un elemento
  const handleDeleteItem = async (item, category) => {
    try {
      setLoading(true);
      let replacementId;
      
      switch (category) {
        case 'type':
          replacementId = replacementItem.typeId;
          await deleteType(item.id, replacementId);
          setTypes(types.filter(t => t.id !== item.id));
          break;
        case 'severity':
          replacementId = replacementItem.severityId;
          await deleteSeverity(item.id, replacementId);
          setSeverities(severities.filter(s => s.id !== item.id));
          break;
        case 'priority':
          replacementId = replacementItem.priorityId;
          await deletePriority(item.id, replacementId);
          setPriorities(priorities.filter(p => p.id !== item.id));
          break;
        case 'status':
          replacementId = replacementItem.statusId;
          await deleteStatus(item.id, replacementId);
          setStatuses(statuses.filter(s => s.id !== item.id));
          break;
        default:
          throw new Error("Categoría desconocida");
      }
      
      // Reset replacement state
      setReplacementItem({
        typeId: '',
        severityId: '',
        priorityId: '',
        statusId: ''
      });
      
      setError(null);
    } catch (error) {
      console.error("Error eliminando elemento:", error);
      setError(`Error eliminando ${getCategoryDisplayName(category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Editar un elemento existente
  const startEditing = (item, category) => {
    setEditingItem({
      ...item,
      category
    });
  };

  // Función auxiliar para obtener el nombre amigable de una categoría
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'type': return 'Tipo';
      case 'severity': return 'Severidad';
      case 'priority': return 'Prioridad';
      case 'status': return 'Estado';
      default: return 'Elemento';
    }
  };

  // Renderizar formulario de nuevo elemento o edición
  const renderItemForm = (isEditing = false) => {
    const item = isEditing ? editingItem : newItem;
    
    return (
      <form onSubmit={isEditing ? handleUpdateItem : handleSaveNewItem} className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
        {isEditing 
            ? `Editar ${getCategoryDisplayName(item.category)}` 
            : 'Nuevo Elemento'
        }
        </h3>
        
        {!isEditing && (
          <div className="mb-4">
            <label className="block text-gray-900 font-medium mb-2">
              Categoría
            </label>
            <select 
              name="category" 
              value={item.category || ''} 
              onChange={(e) => handleItemChange(e, isEditing)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="type">Tipo</option>
              <option value="severity">Severidad</option>
              <option value="priority">Prioridad</option>
              <option value="status">Estado</option>
            </select>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-900 font-medium mb-2">
            Nombre
          </label>
          <input 
            type="text" 
            name="name" 
            value={item.name || ''} 
            onChange={(e) => handleItemChange(e, isEditing)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-900 font-medium mb-2">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              name="color" 
              value={item.color || '#3498db'} 
              onChange={(e) => handleItemChange(e, isEditing)}
              className="p-1 border border-gray-300 rounded"
            />
            <input 
              type="text" 
              name="color" 
              value={item.color || '#3498db'} 
              onChange={(e) => handleItemChange(e, isEditing)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              pattern="^#([A-Fa-f0-9]{6})$"
              title="Código de color hexadecimal (ej: #FF0000)"
            />
          </div>
        </div>
        
        
        {item.category === 'status' && (
          <div className="mb-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                name="is_closed" 
                checked={item.is_closed || false} 
                onChange={(e) => handleItemChange(e, isEditing)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
              <span className="text-gray-900">¿Estado cerrado?</span>
            </label>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
            <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
            onClick={() => isEditing ? setEditingItem(null) : setShowNewItemForm(false)}
            >
            Cancelar
            </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    );
  };

  // Renderizar tabla de elementos
  const renderItemsTable = (items, category) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Color</th>
            {category === 'status' && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">¿Cerrado?</th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Acciones</th>
        </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                <div className="flex items-center">
                    <div 
                    className="w-6 h-6 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                    ></div>
                    {item.color}
                </div>
                </td>
                {category === 'status' && (
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {item.is_closed ? 'Sí' : 'No'}
                </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => startEditing(item, category)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => confirmDelete(item, category)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Confirmar eliminación
  const confirmDelete = (item, category) => {
    const isConfirmed = window.confirm(`¿Está seguro que desea eliminar "${item.name}"? Esta acción requerirá un elemento de reemplazo.`);
    
    if (isConfirmed) {
      showDeleteConfirmation(item, category);
    }
  };

  // Mostrar formulario para seleccionar elemento de reemplazo
  const showDeleteConfirmation = (item, category) => {
    // Obtener elementos disponibles para reemplazar (excluyendo el elemento a eliminar)
    let availableItems = [];
    let replacementField = "";
    
    switch (category) {
      case 'type':
        availableItems = types.filter(t => t.id !== item.id);
        replacementField = "typeId";
        break;
      case 'severity':
        availableItems = severities.filter(s => s.id !== item.id);
        replacementField = "severityId";
        break;
      case 'priority':
        availableItems = priorities.filter(p => p.id !== item.id);
        replacementField = "priorityId";
        break;
      case 'status':
        availableItems = statuses.filter(s => s.id !== item.id);
        replacementField = "statusId";
        break;
    }

    // Si no hay elementos de reemplazo disponibles
    if (availableItems.length === 0) {
      alert(`No se puede eliminar: No hay otro ${getCategoryDisplayName(category)} disponible para reemplazarlo.`);
      return;
    }
    
    // Establecer el primer item como valor por defecto para reemplazo
    setReplacementItem(prev => ({
      ...prev,
      [replacementField]: availableItems[0]?.id || ''
    }));
    
    // Mostrar modal para confirmar reemplazo
    const replacementHtml = `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">Seleccionar reemplazo</h3>
        <p class="mb-4 text-gray-900">Las issues que usan "${item.name}" ahora usarán:</p>
        <select id="replacement-select" class="w-full mb-4 p-2 border rounded text-gray-900">
            ${availableItems.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
        </select>
        <div class="flex justify-end gap-2">
            <button id="cancel-delete" class="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400">Cancelar</button>
            <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
        </div>
        </div>
    </div>
    `;
    
    // Insertar modal en el DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = replacementHtml;
    document.body.appendChild(modalContainer);
    
    // Configurar event listeners
    document.getElementById('cancel-delete').addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    document.getElementById('confirm-delete').addEventListener('click', () => {
      const selectedId = document.getElementById('replacement-select').value;
      setReplacementItem(prev => ({
        ...prev,
        [replacementField]: selectedId
      }));
      handleDeleteItem(item, category);
      document.body.removeChild(modalContainer);
    });
    
    // Actualizar estado de reemplazo cuando cambia la selección
    document.getElementById('replacement-select').addEventListener('change', (e) => {
      setReplacementItem(prev => ({
        ...prev,
        [replacementField]: e.target.value
      }));
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => navigate("IndexIssues")}
        >
          Volver a Issues
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Botón para añadir nuevo elemento */}
      {!showNewItemForm && !editingItem && (
        <button
          className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => setShowNewItemForm(true)}
        >
          Añadir Nuevo Elemento
        </button>
      )}
      
      {/* Formulario para nuevo elemento */}
      {showNewItemForm && !editingItem && renderItemForm(false)}
      
      {/* Formulario para editar elemento */}
      {editingItem && renderItemForm(true)}
      
      {/* Secciones para cada categoría */}
      <div className="space-y-8">
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tipos</h2>
          {loading && !types.length ? (
            <p>Cargando tipos...</p>
          ) : (
            renderItemsTable(types, 'type')
          )}
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Severidades</h2>
          {loading && !severities.length ? (
            <p>Cargando severidades...</p>
          ) : (
            renderItemsTable(severities, 'severity')
          )}
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prioridades</h2>
          {loading && !priorities.length ? (
            <p>Cargando prioridades...</p>
          ) : (
            renderItemsTable(priorities, 'priority')
          )}
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Estados</h2>
          {loading && !statuses.length ? (
            <p>Cargando estados...</p>
          ) : (
            renderItemsTable(statuses, 'status')
          )}
        </section>
      </div>
    </div>
  );
}