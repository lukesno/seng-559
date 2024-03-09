import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export function WaitingScreen({ isLeader, roomID, users, sendStartGame }) {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <div>
      <h1>Waiting Lobby</h1>
      <h2>Room Code: {roomID}</h2>
      <h2>Users:</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user?.username}</li>
        ))}
      </ul>
      {isLeader && <button onClick={sendStartGame}>Start Game</button>}
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        Go Back
      </button>
    </div>
  );
}

