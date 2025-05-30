"use client";

import { useState } from "react";
import IssuesIndexPage from "../components/molecules/IssuesIndexPage";
import ShowIssuePage from "../components/molecules/ShowIssuePage";
import NewIssuePage from "../components/molecules/NewIssuePage";
import AdminSettingsPage from "../components/molecules/AdminSettingsPage";
import UserProfilePage from "../components/molecules/UserProfilePage";
import EditProfilePage from "../components/molecules/EditProfilePage";
import UsersIndexPage from "../components/molecules/UserIndexPage";

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState("");
  const [screenParams, setScreenParams] = useState({});

  // Función para navegar entre pantallas
  const navigate = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    setScreenParams(params);
  };

  // Renderiza la pantalla actual basada en currentScreen
  const renderScreen = () => {
    switch (currentScreen) {
      case "IndexIssues":
        return <IssuesIndexPage navigate={navigate} />;
      case "ShowIssue":
        return (
          <ShowIssuePage issueId={screenParams.issueId} navigate={navigate} />
        );
      case "NewIssue":
        return <NewIssuePage navigate={navigate} />;
      case "AdminSettings":
        return <AdminSettingsPage navigate={navigate} />;
      case "UsersIndex": // Añade este caso
        return <UsersIndexPage navigate={navigate} />;
      case "UserProfile":
        return <UserProfilePage userId={screenParams.userId} navigate={navigate} />;
      case "EditProfile":
        return <EditProfilePage userId={screenParams.userId} navigate={navigate} />;
      default:
        return <IssuesIndexPage navigate={navigate} />;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}
