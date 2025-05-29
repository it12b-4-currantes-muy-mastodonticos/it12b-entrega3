"use client";

import { useState, useEffect } from "react";
import {
  getUserById,
  getAssignedIssuesByUserId,
  getWatchersByUserId,
  getCommentsByUserId,
} from "../../apiCall";
import IssueList from "../organisms/IssueList";

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
      <div className="w-1/5 bg-white p-6 shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-300 overflow-hidden mb-4">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#008aa8]">{user.name}</h2>
          <p className="text-lg text-gray-500">@{user.username}</p>

          <hr className="w-full border-t my-6" />


          {/* Contadores */}
          <div className="flex justify-center gap-x-8">
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-gray-500">{assignedIssues.length}</p>
              <p className="text-base text-gray-500">Open Assigned Issues</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-gray-500">{watchedIssues.length}</p>
              <p className="text-base text-gray-500">Watched Issues</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-gray-500">{comments.length}</p>
              <p className="text-base text-gray-500">Comments</p>
            </div>
          </div>

          <hr className="w-full border-t my-6" />


          <p className="text-lg text-gray-600 text-center">
            {user.bio || ""}
          </p>
          <div className="mt-4 flex justify-center">
            <button
              className="bg-[#83eede] text-gray-700 my-6 px-4 py-2 rounded-md hover:bg-[#008aa8] hover:text-white transition-colors duration-300"
              onClick={() => navigate("EditProfile", { userId })}
            >
              EDIT BIO
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-6">
        <div className="mb-4">
          <button
            className="flex items-center text-gray-600 hover:text-[#008aa8] transition-colors"
            onClick={() => navigate("UsersIndex")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to Users Directory
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-t border-gray-200 mb-4">
          <button
            className={`px-4 py-4 relative ${
              activeTab === "assignedIssues" ? "border-l border-r border-gray-200 font-bold text-gray-500 bg-white top-[1px]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("assignedIssues")}
          >
            Open Assigned Issues
          </button>
          <button
            className={`px-4 py-4 relative ${
              activeTab === "watchedIssues" ? "border-l border-r border-gray-200 font-bold text-gray-500 bg-white top-[1px]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("watchedIssues")}
          >
            Watched Issues
          </button>
          <button
            className={`px-4 py-4 relative ${
              activeTab === "comments" ? "border-l border-r border-gray-200 font-bold text-gray-500 bg-white top-[1px]" : "text-gray-500"
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
              <IssueList issues={assignedIssues} onIssueClick={handleIssueClick} />
            </div>
          )}

          {activeTab === "watchedIssues" && (
            <div>
              <IssueList issues={watchedIssues} onIssueClick={handleIssueClick} />
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              {comments.length > 0 ? (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="border-b pb-4">
                      <div className="flex items-center">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleIssueClick(comment.issue.id);
                          }}
                          className="text-[#008aa8] hover:text-[#4c566a] font-bold mr-4"
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
                      </div>
                      <p className="my-3 text-gray-700">{comment.content}</p>
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