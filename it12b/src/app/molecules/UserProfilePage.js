"use client";

import { useState, useEffect } from "react";
import {
  getUserById,
  getAssignedIssuesByUserId,
  getWatchersByUserId,
  getCommentsByUserId,
} from "../apiCall";
import IssueList from "../components/IssueList";

export default function UserProfilePage({ userId, navigate }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("assignedIssues");
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [watchedIssues, setWatchedIssues] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);

        const [assigned, watched, userComments] = await Promise.all([
          getAssignedIssuesByUserId(userId),
          getWatchersByUserId(userId),
          getCommentsByUserId(userId),
        ]);

        setAssignedIssues(assigned);
        setWatchedIssues(watched);
        setComments(userComments);
      } catch (error) {
        console.error("Error fetching user profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando perfil...</div>;
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-8">Usuario no encontrado</div>;
  }

  const handleIssueClick = (issueId) => {
    navigate("ShowIssue", { issueId });
  };

  return (
    <div className="flex bg-white min-h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-white p-6 shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mb-4">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-500">@{user.username}</p>

          {/* Contadores */}
          <div className="mt-6 flex justify-center gap-x-8">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{assignedIssues.length}</p>
              <p className="text-sm text-gray-500">Open Assigned Issues</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{watchedIssues.length}</p>
              <p className="text-sm text-gray-500">Watched Issues</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{comments.length}</p>
              <p className="text-sm text-gray-500">Comments</p>
            </div>
          </div>


          <p className="text-sm text-gray-700 mt-4 text-center">
            {user.bio || "Sin biografía"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-6">
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${
              activeTab === "assignedIssues" ? "border-b-2 border-blue-500 font-bold" : ""
            }`}
            onClick={() => setActiveTab("assignedIssues")}
          >
            Open Assigned Issues
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "watchedIssues" ? "border-b-2 border-blue-500 font-bold" : ""
            }`}
            onClick={() => setActiveTab("watchedIssues")}
          >
            Watched Issues
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "comments" ? "border-b-2 border-blue-500 font-bold" : ""
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "assignedIssues" && (
            <div>
              <h3 className="text-lg font-bold mb-4">Open Assigned Issues</h3>
              <IssueList issues={assignedIssues} onIssueClick={handleIssueClick} />
            </div>
          )}

          {activeTab === "watchedIssues" && (
            <div>
              <h3 className="text-lg font-bold mb-4">Watched Issues</h3>
              <IssueList issues={watchedIssues} onIssueClick={handleIssueClick} />
            </div>
          )}

          {activeTab === "comments" && (
            <div>
                <h3 className="text-lg font-bold mb-4">Comments</h3>
                {comments.length > 0 ? (
                    <ul className="space-y-4">
                        {comments.map((comment) => (
                        <li key={comment.id} className="border-b pb-4">
                            <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleIssueClick(comment.issue.id);
                            }}
                            className="text-blue-500 hover:underline font-bold"
                            >
                            #{comment.issue.id} {comment.issue.title}
                            </a>
                            <p className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                            </p>
                            <p className="text-gray-700">{comment.content}</p>
                        </li>
                        ))}
                    </ul>
                ) : (
                <p>No has hecho comentarios.</p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}