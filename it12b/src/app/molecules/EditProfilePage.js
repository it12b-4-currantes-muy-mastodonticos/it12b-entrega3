"use client";

import { useState, useEffect } from "react";
import { updateUser, getUserById } from "../apiCall";

export default function EditProfilePage({ userId, navigate }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    bio: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUpdating, setAvatarUpdating] = useState(false);

  // Cargar los datos del usuario para precargar el formulario
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserById(userId);
        console.log("User data fetched:", userData);
        setAvatar(userData.avatar_url || null); // Asignar avatar si existe
        setFormData({ 
          username: userData.username || "",
          email: userData.email || "",
          name: userData.name || "",
          bio: userData.bio || "",
        });
      } catch (error) {
        console.error("Error al cargar el usuario:", error);
      }
    }
    fetchUser();
  }, [userId]);

  // Función para actualizar el avatar inmediatamente
  const updateAvatar = async (file) => {
    setAvatarUpdating(true);
    try {
      const data = {avatar: file};
      // Actualizamos el usuario solo con el avatar
      const updatedUser = await updateUser(userId, data);
      console.log("Avatar updated:", updatedUser);
      // Actualizar el avatar mostrado con el resultado del servidor
      setAvatar(updatedUser.avatar_url);
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files && files[0]) {
      const file = files[0];
      // Muestra el preview inmediatamente
      //setAvatar(URL.createObjectURL(file));
      updateAvatar(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updatedUser = await updateUser(userId, formData);
      console.log("User updated:", updatedUser);
      navigate("UserProfile", { userId });
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      {/* Sección avatar*/}
        <div className="flex items-center mb-4">
            <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden mr-4">
                {avatar ? (
                <img
                    src={avatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                />
                ) : (
                <div className="w-full h-full bg-gray-200"></div>
                )}
            </div>
            <label className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-300">
                CHANGE PHOTO
                <input
                type="file"
                name="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
                />
            </label>
        </div>  
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md text-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md text-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Full name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md text-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Bio (max. 210 chars)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={210}
            className="w-full px-4 py-2 border rounded-md text-gray-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "SAVE"}
          </button>
        </div>
      </form>
    </div>
  );
}