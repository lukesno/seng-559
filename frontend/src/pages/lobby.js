import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAppContext } from "../AppContext";

// Screens
import WaitingScreen from "./states/waiting";
import AskingScreen from "./states/asking";
import VotingScreen from "./states/voting";
import ResultsScreen from "./states/results";

let socket = io();

function Lobby() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, roomID, roomURL } = useAppContext();

  const [isLeader, setIsLeader] = useState(false);
  const [lobbyState, setLobbyState] = useState("waiting"); // Initial lobby state
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);

  const handlers = {
    "connect": () => { console.log(`Connected to socket!`); },
    "update_users": (users) => { setUsers(users); },
    "select_leader": () => { setIsLeader(true); },
    "message_client": (username, message) => {
      console.log(`${username}: ${message}`);
    },
    "update_roomState": (state) => {
      setLobbyState(state);
    },
    "send_questions": (questions) => {
      setQuestions(questions);
    }
  }

  const registerHandlers = () => {
    for (let handle in handlers) {
      socket.on(handle, handlers[handle]);
    }
  };

  const deregisterHandlers = () => {
    for (let handle in handlers) {
      socket.off(handle);
    }
  }

  useEffect(() => {
    // Go back to home page if there is no URL (happens on refresh)
    if (roomURL === "") {
      navigate("/");
    }

    socket = io.connect(roomURL);
    registerHandlers();
    socket.emit("join_game", roomID, username);

    return () => {
      deregisterHandlers();
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures the effect runs only once when the component mounts

  const sendMessage = async () => {
    socket.emit("message_room", roomID, username, message);
  };

  const sendStartGame = async () => {
    socket.emit("start_game", roomID);
  };

  const renderLobbyComponent = () => {
    switch (lobbyState) {
      case "waiting":
        return (
          <WaitingScreen isLeader={isLeader} roomID={roomID} users={users} sendStartGame={sendStartGame} />
        );
      case "asking":
        return <AskingScreen questions={questions} />;
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
