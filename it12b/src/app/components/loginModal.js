import { useState, useEffect } from "react";
import { getUsers } from "../apiCall";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

// Modificación 2: Descomentar y modificar el código que obtiene tokens
  const handleLogin = () => {
    if (selectedUser) {
      // Descomentar esta sección y asegurarse de que funcione correctamente
      const tokenMap = {
        1: process.env.NEXT_PUBLIC_USER_TOKEN_1,
        2: process.env.NEXT_PUBLIC_USER_TOKEN_2,
        3: process.env.NEXT_PUBLIC_USER_TOKEN_3,
        4: process.env.NEXT_PUBLIC_USER_TOKEN_4,
        5: process.env.NEXT_PUBLIC_USER_TOKEN_5,
        6: process.env.NEXT_PUBLIC_USER_TOKEN_6,
      };

      const token = tokenMap[selectedUser.id];
      console.log(`[LoginModal] Usuario ID: ${selectedUser.id}, Token: ${token}`);
      
      // Construir el objeto usuario con el token
      const userWithAuth = {
        ...selectedUser,
        token: token
      };
      
      // Guardar usuario con token en localStorage
      localStorage.setItem("currentUser", JSON.stringify(userWithAuth));
      localStorage.setItem("currentUserId", selectedUser.id);

      // Pasar usuario con token al callback
      onLogin(userWithAuth);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Seleccionar Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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

        {loading ? (
          <div className="text-center py-4">Cargando usuarios...</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="max-h-60 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 border-b cursor-pointer flex items-center ${
                      selectedUser?.id === user.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden mr-3">
                      {user.avatar && (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        @{user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        UserId: {user.id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 mr-2"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
                  selectedUser
                    ? "hover:bg-blue-600"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={handleLogin}
                disabled={!selectedUser}
              >
                Iniciar Sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
