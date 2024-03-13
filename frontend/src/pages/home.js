import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";
import { useAppContext } from "../AppContext";

function Home() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, setUsername, roomID, setRoomID, setRoomURL } =
    useAppContext();
  const [error, setError] = useState("");

  const create = async () => {
    try {
      const response = await Axios.get("http://localhost:8080/create");
      const { roomID, url } = response.data;
      setRoomID(roomID);
      setRoomURL(url);
      navigate(`lobby/${roomID}`);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  const join = async () => {
    try {
      const response = await Axios.post("http://localhost:8080/join", {
        roomID,
      });
      const { url } = response.data;
      console.log("response data")
      console.log(response.data);
      setRoomURL(url);
      navigate(`lobby/${roomID}`);
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
      <h1>RipLash</h1>
      <label>Username: </label>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
        }}
      />
      <div>
        <label>Create a Room: </label>
        <button onClick={create}
         disabled={!username.length}>Create</button>
      </div>
      <div>
        <label>Join a Room: </label>
        <input
          type="text"
          placeholder="Room Code"
          value={roomID}
          onChange={(event) => {
            setRoomID(event.target.value);
          }}
        />
        <button onClick={join}
         disabled={!username.length}>Join</button>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default Home;
