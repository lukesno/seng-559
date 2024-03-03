import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import io from "socket.io-client";
import { useAppContext } from "../AppContext";

// Screens
import WaitingScreen from "./states/waiting";
import AskingScreen from "./states/asking";
import VotingScreen from "./states/voting";
import ResultsScreen from "./states/results";

let socket = null;

function Lobby() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, roomID, roomURL } = useAppContext();
  const [ lobbyState, setLobbyState ] = useState("waiting"); // Initial lobby state
  const [ users, setUsers ] = useState([]);
  const [ message, setMessage ] = useState("");

  const registerHandlers = () => {
    socket?.on("connect", () => {
      console.log(`Connected to socket!`);
    });
    socket?.on("userUpdate", (users) => {
      setUsers(users);
    });
    socket?.on("message", (args) => {
      const {username, message} = args;
      console.log(`${username}: ${message}`)
    });
  };

  useEffect(() => {
    socket = io(roomURL);
    registerHandlers();
    socket.emit("joinGame", { id: roomID, username });
  }, []); // Empty dependency array ensures the effect runs only once when the component mounts

  const sendMessage = async () => {
    socket.emit("message", { id: roomID, username, message });
  };

  const renderLobbyComponent = () => {
    switch (lobbyState) {
      case "waiting":
        return <WaitingScreen roomID={roomID} users={users}/>;
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
      {/* TEMPORARY */}
      <div>
        <label>Message:</label>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        <button onClick={sendMessage}>Message</button>
      </div>
      {/* END TEMPORARY */}
      {lobbyState ? (
        renderLobbyComponent()
      ) : (
        <p>Error: Lobby unavailable or in unknown state.</p>
      )}
    </div>
  );
}

export default Lobby;
