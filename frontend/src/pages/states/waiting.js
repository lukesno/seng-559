import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";

function WaitingScreen({ roomID, users }) {
  const navigate = useNavigate(); // Initialize useNavigate

  const startGame = async () => {
    try {
      console.log("Starting game...");
      await Axios.post("http://example.com/api/start-game");
    } catch (error) {
      console.error("Error starting game: ", error);
    }
  };

  return (
    <div>
      <h1>Waiting Lobby</h1>
      <h2>Room Code: {roomID}</h2>
      <h2>Users:</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <button onClick={startGame}>Start Game</button>
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

export default WaitingScreen;
