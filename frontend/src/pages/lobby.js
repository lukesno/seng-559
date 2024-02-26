import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";

// Screens
import WaitingScreen from "./states/waiting";
import AskingScreen from "./states/asking";
import VotingScreen from "./states/voting";
import ResultsScreen from "./states/results";

function Lobby() {
  const [lobbyState, setLobbyState] = useState("waiting"); // Initial lobby state

  useEffect(() => {
    fetchLobbyState();
  }, []); // Empty dependency array ensures the effect runs only once when the component mounts

  const fetchLobbyState = async () => {
    try {
      const response = await Axios.get("http://example.com/api/lobby-state");
      const data = response.data;
      setLobbyState(data.lobbyState);
    } catch (error) {
      console.error("Error fetching lobby state: ", error);
    }
  };

  const renderLobbyComponent = () => {
    switch (lobbyState) {
      case "waiting":
        return <WaitingScreen />;
      case "asking":
        return <AskingScreen />;
      case "voting":
        return <VotingScreen />;
      case "results":
        return <ResultsScreen />;
      default:
        return <p>Error: Lobby unavailable or in unknown state.</p>;
    }
  };

  return (
    <div>
      {lobbyState ? (
        renderLobbyComponent()
      ) : (
        <p>Error: Lobby unavailable or in unknown state.</p>
      )}
    </div>
  );
}

export default Lobby;
