"use client";

import { useState } from "react";
import IssuesIndexPage from "../components/molecules/IssuesIndexPage";
import ShowIssuePage from "../components/molecules/ShowIssuePage";
import NewIssuePage from "../components/molecules/NewIssuePage";
import AdminSettingsPage from "../components/molecules/AdminSettingsPage";

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState("IndexIssues");
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
      default:
        return <IssuesIndexPage navigate={navigate} />;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}
