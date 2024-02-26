import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";

function Home() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");
  const [error, setError] = useState("");

  const create = async () => {
    try {
      // const response = await Axios.get("http://localhost:8080/latest-room-id");
      // const latestRoomID = response.data.id;
      // const newRoomID = latestRoomID + 1;
      // await Axios.post("http://localhost:8080/create", {
      //   username: username,
      //   roomID: newRoomID,
      // });
      navigate("/lobby/" + roomID);
      // navigate("/lobby");
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  const join = async () => {
    try {
      await Axios.post("http://localhost:8080", {
        username: username,
        roomID: roomID,
      });
      navigate("/lobby/" + roomID);
      // navigate("/lobby");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setError("Room not found");
      } else {
        console.error("Error joining room: ", error);
      }
    }
  };

  return (
    <div>
      <h1>LashQuip</h1>
      <label>Username: </label>
      <input
        type='text'
        placeholder='Username'
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
        }}
      />
      <div>
        <label>Create a Room: </label>
        <button onClick={create}>Create</button>
      </div>
      <div>
        <label>Join a Room: </label>
        <input
          type='text'
          placeholder='Room Code'
          value={roomID}
          onChange={(event) => {
            setRoomID(event.target.value);
          }}
        />
        <button onClick={join}>Join</button>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default Home;
