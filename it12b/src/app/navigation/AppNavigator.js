"use client";

import { useState } from "react";
import HomePage from "../molecules/IssuesIndexPage";
import IssueDetailPage from "../molecules/ShowIssuelPage";
import NewIssuePage from "../molecules/NewIssuePage";

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState("Home");
  const [screenParams, setScreenParams] = useState({});

  // Función para navegar entre pantallas
  const navigate = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    setScreenParams(params);
  };

  // Renderiza la pantalla actual basada en currentScreen
  const renderScreen = () => {
    switch (currentScreen) {
      case "Home":
        return <HomePage navigate={navigate} />;
      case "IssueDetail":
        return (
          <IssueDetailPage issueId={screenParams.issueId} navigate={navigate} />
        );
      case "NewIssue":
        return <NewIssuePage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}
