"use client";

import { useState, useEffect } from "react";
import {
  getTypes, createType, updateType, deleteType,
  getSeverities, createSeverity, updateSeverity, deleteSeverity,
  getPriorities, createPriority, updatePriority, deletePriority,
  getStatuses, createStatus, updateStatus, deleteStatus,
  getUsers
} from "../../apiCall";

export default function AdminSettingsPage({ navigate }) {
  // States for each category
  const [types, setTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [userContext, setUserContext] = useState(null);
  
  // State for loading tracking
  const [loading, setLoading] = useState(true);
  
  // State for the element being edited currently
  const [editingItem, setEditingItem] = useState(null);
  
  // State for new element
  const [newItem, setNewItem] = useState({
    category: null, // 'type', 'severity', 'priority', 'status'
    name: '',
    color: '#3498db',
    is_closed: false,
  });

  // State for replacement element (when deleting)
  const [replacementItem, setReplacementItem] = useState({
    typeId: '',
    severityId: '',
    priorityId: '',
    statusId: '',
  });

  // State to show/hide new item form
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  
  // State for errors
  const [error, setError] = useState(null);

  // Load data on start
  useEffect(() => {

    setLoading(true);

    const userId = localStorage.getItem("currentUserId");
    if (userId) {
      setUserContext(userId);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesData, severitiesData, prioritiesData, statusesData] = await Promise.all([
          getTypes(),
          getSeverities(),
          getPriorities(),
          getStatuses()
        ]);

        // Process the statuses to convert 'open' to 'is_closed'
        const processedStatuses = statusesData.map(status => ({
          ...status,
          is_closed: !status.open, // Important: is_closed is the opposite of open
        }));
        
        console.log('Processed statuses:', processedStatuses);

        setTypes(typesData);
        setSeverities(severitiesData);
        setPriorities(prioritiesData);
        setStatuses(processedStatuses);
        setError(null);
      } catch (error) {
        console.error("Error loading configuration data:", error);
        setError("Error loading configuration. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle changes in new item or editing form
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

  // Save a new element
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
        case 'status': {
          // Convert is_closed to open (which is the opposite)
          const statusData = {
            ...newItem,
            open: !newItem.is_closed, // Important: open is the opposite of is_closed
            is_closed: undefined // Remove the is_closed property
          };
          
          result = await createStatus(statusData);
          
          // Make sure the result has is_closed for the local state
          const processedResult = {
            ...result,
            is_closed: !result.open // Set is_closed as the opposite of open
          };
          
          setStatuses([...statuses, processedResult]);
          break;
        }
        default:
          throw new Error("Unknown category");
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
      setShowModal(false);
    } catch (error) {
      console.error("Error creating element:", error);
      setError(`Error creating ${getCategoryDisplayName(newItem.category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Update an existing element
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
        case 'status': {
          const statusData = {
            ...editingItem,
            open: !editingItem.is_closed, // Important: open is the opposite of is_closed
            is_closed: undefined // Remove is_closed
          };
          
          await updateStatus(editingItem.id, statusData);
          
          setStatuses(statuses.map(item => 
            item.id === editingItem.id ? {
              ...editingItem,
              open: !editingItem.is_closed // Maintain consistency in local state
            } : item
          ));
          setShowModal(false);
          break;
        }
        default:
          throw new Error("Unknown category");
      }
      
      setEditingItem(null);
      setError(null);
    } catch (error) {
      console.error("Error updating element:", error);
      setError(`Error updating ${getCategoryDisplayName(editingItem.category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete an element
  const handleDeleteItem = async (item, category) => {
    try {
      setLoading(true);
      let replacementId;
      
      switch (category) {
        case 'type':
          replacementId = document.getElementById('replacement-select')?.value || replacementItem.typeId;
          await deleteType(item.id, replacementId);
          setTypes(types.filter(t => t.id !== item.id));
          break;
        case 'severity':
          replacementId = document.getElementById('replacement-select')?.value || replacementItem.severityId;
          await deleteSeverity(item.id, replacementId);
          setSeverities(severities.filter(s => s.id !== item.id));
          break;
        case 'priority':
          replacementId = document.getElementById('replacement-select')?.value || replacementItem.priorityId;
          await deletePriority(item.id, replacementId);
          setPriorities(priorities.filter(p => p.id !== item.id));
          break;
        case 'status':
          replacementId = document.getElementById('replacement-select')?.value || replacementItem.statusId;
          await deleteStatus(item.id, replacementId);
          setStatuses(statuses.filter(s => s.id !== item.id));
          break;
        default:
          throw new Error("Unknown category");
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
      console.error("Error deleting element:", error);
      setError(`Error deleting ${getCategoryDisplayName(category)}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing element
const startEditing = (item, category) => {
  // Primero establecer el objeto editingItem con los datos correctos
  setEditingItem({
    ...item,
    category
  });
  
  // Luego establecer el tipo de modal y mostrarlo después de un pequeño delay
  // Este delay permite que React actualice el estado de editingItem antes de usar el valor
  setTimeout(() => {
    setModalType('edit');
    setShowModal(true);
  }, 10);
};

  // Helper function to get friendly name of a category
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'type': return 'Type';
      case 'severity': return 'Severity';
      case 'priority': return 'Priority';
      case 'status': return 'Status';
      default: return 'Element';
    }
  };

  // Render new element or edit form
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('new'); 
  const renderItemForm = (isEditing = false) => {
    const item = isEditing ? editingItem : newItem;

    if (!item) {
      console.error("Item is null in renderItemForm:", { isEditing, editingItem, newItem });
      return null; // No renderizar nada si el item es null
    }
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing 
                ? `Edit ${getCategoryDisplayName(item.category)}` 
                : 'New Element'
              }
            </h3>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowModal(false);
                if (isEditing) setEditingItem(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={isEditing ? handleUpdateItem : handleSaveNewItem}>
            {!isEditing && (
              <div className="mb-4">
                <label className="block text-gray-900 font-medium mb-2">
                  Category
                </label>
                <select 
                  name="category" 
                  value={item.category || ''} 
                  onChange={(e) => handleItemChange(e, isEditing)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="type">Type</option>
                  <option value="severity">Severity</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-900 font-medium mb-2">
                Name
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
                  title="Hexadecimal color code (e.g. #FF0000)"
                />
              </div>
            </div>
            
            {item.category === 'status' && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="is_closed" 
                    checked={!!item.is_closed} 
                    onChange={(e) => handleItemChange(e, isEditing)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-900">Is closed status?</span>
                </label>
              </div>
            )}
                    
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowModal(false);
                  if (isEditing) setEditingItem(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  // Render table of elements
  const renderItemsTable = (items, category) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Color</th>
            {category === 'status' && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Is Closed?</th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
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
                    {(item.is_closed === true || 
                      item.is_closed === 'true' || 
                      item.is_closed === 1 || 
                      item.is_closed === '1') ? 'Yes' : 'No'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {userContext && (
                      <>
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
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Confirm deletion
  const confirmDelete = (item, category) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${item.name}"? This action will require a replacement element.`);
    
    if (isConfirmed) {
      showDeleteConfirmation(item, category);
    }
  };

  // Show form to select replacement element
  const showDeleteConfirmation = (item, category) => {
    // Get available elements to replace (excluding the element to delete)
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

    // If there are no replacement elements available
    if (availableItems.length === 0) {
      alert(`Cannot delete: There is no other ${getCategoryDisplayName(category)} available to replace it.`);
      return;
    }
    
    // Set the first item as default value for replacement
    setReplacementItem(prev => ({
      ...prev,
      [replacementField]: availableItems[0]?.id || ''
    }));
    
    // Show modal to confirm replacement
    const replacementHtml = `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">Select replacement</h3>
        <p class="mb-4 text-gray-900">Issues using "${item.name}" will now use:</p>
        <select id="replacement-select" class="w-full mb-4 p-2 border rounded text-gray-900">
            ${availableItems.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
        </select>
        <div class="flex justify-end gap-2">
            <button id="cancel-delete" class="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400">Cancel</button>
            <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
        </div>
        </div>
    </div>
    `;
    
    // Insert modal into DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = replacementHtml;
    document.body.appendChild(modalContainer);
    
    // Set up event listeners
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
    
    // Update replacement state when selection changes
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
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <button
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        onClick={() => navigate("IndexIssues")}
      >
        Back to Issues
      </button>
    </div>
    
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}
    
    {/* Button to add new element */}
    {userContext && (
      <button
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={() => {
          setModalType('new');
          setShowModal(true);
        }}
      >
        Add New Element
      </button>
    )}
    
    {/* Modal for new/edit element */}
    {showModal && (modalType === 'new' || (modalType === 'edit' && editingItem)) && renderItemForm(modalType === 'edit')}    
    {/* Sections for each category */}
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Types</h2>
        {loading && !types.length ? (
          <p>Loading types...</p>
        ) : (
          renderItemsTable(types, 'type')
        )}
      </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Severities</h2>
          {loading && !severities.length ? (
            <p>Loading severities...</p>
          ) : (
            renderItemsTable(severities, 'severity')
          )}
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Priorities</h2>
          {loading && !priorities.length ? (
            <p>Loading priorities...</p>
          ) : (
            renderItemsTable(priorities, 'priority')
          )}
        </section>
        
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Statuses</h2>
          {loading && !statuses.length ? (
            <p>Loading statuses...</p>
          ) : (
            renderItemsTable(statuses, 'status')
          )}
        </section>
      </div>
    </div>
  );
}