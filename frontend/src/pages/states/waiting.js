import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";

function WaitingScreen() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [roomCode, setRoomCode] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchRoomDetails();
  }, []);

  const fetchRoomDetails = async () => {
    try {
      const response = await Axios.get("http://localhost:8080/room-details");
      const data = response.data;
      setRoomCode(data.roomCode);
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching room details: ", error);
    }
  };

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
      <h2>Room Code: {roomCode}</h2>
      <h2>Users:</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.username}</li>
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
