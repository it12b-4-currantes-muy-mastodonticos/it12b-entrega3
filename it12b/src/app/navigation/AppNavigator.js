"use client";

import { useState } from "react";
import IssuesIndexPage from "../molecules/IssuesIndexPage";
import ShowIssuePage from "../molecules/ShowIssuePage";
import NewIssuePage from "../molecules/NewIssuePage";
import UserProfilePage from "../molecules/UserProfilePage";

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState("UserProfile");
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
      case "UserProfile":
        return <UserProfilePage userId={1} />;
      default:
        return <IssuesIndexPage navigate={navigate} />;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}
