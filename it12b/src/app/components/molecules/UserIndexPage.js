"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getUsers } from "../../apiCall";

export default function UsersIndexPage({ navigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);


  useEffect(() => {

    const loggedUserId = localStorage.getItem("currentUserId") || localStorage.getItem("user_id");
    setCurrentUserId(loggedUserId);

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users Directory</h1>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => navigate("IndexIssues")}
        >
          Back to Issues
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
        <input
          type="text"
          placeholder="Search users by name, username or email..."
          className="px-4 py-2 border rounded-md w-full text-gray-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => navigate("UserProfile", { userId: user.id })}
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  layout="fill"
                  objectFit="cover"
                  unoptimized={true}
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-[#008aa8] mb-1">
                  {user.name || "No Name"}
                </h2>
                <p className="text-gray-600">@{user.username}</p>
                {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}

                
                
                {String(user.id) === String(currentUserId) && (
                  <div className="flex justify-end mt-4">
                    <button
                      className="bg-[#83eede] text-gray-700 px-3 py-1 rounded text-sm hover:bg-[#008aa8] hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("EditProfile", { userId: user.id });
                      }}
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No users found</p>
        </div>
      )}
    </div>
  );
}