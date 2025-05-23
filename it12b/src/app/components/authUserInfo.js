"use client";

import { useState, useEffect } from "react";
import { getAuthenticatedUser } from "../apiCall";

export default function AuthUserInfo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getAuthenticatedUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching authenticated user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined" && localStorage.getItem("currentUser")) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Cargando información de usuario...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-3 rounded-md mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-gray-600">@{user.username}</div>
        </div>
      </div>
    </div>
  );
}
