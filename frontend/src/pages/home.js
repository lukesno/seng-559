import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";
import { useAppContext } from "../AppContext";

function Home() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, setUsername, roomID, setRoomID, setRoomURL } =
    useAppContext();
  const [error, setError] = useState("");

  useEffect(() => {
    setRoomURL("");
  }, []);

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
    <div className="h-screen grid place-items-center">
      <div className="shadow-inner rounded-lg p-0.5">
        <div className="py-12 rounded-lg shadow grid grid-cols-2 grid-rows-3 place-items-center gap-4">
          <div className="col-span-2 row-span-1 justify-self-center">
            <h1 className="font-bold text-5xl">RipLash</h1>
          </div>
          <div className="col-span-2 row-span-1">
            <label>Username: </label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
          </div>
          <div className="col-span-1 row-span-1">
            <label>Create a Room: </label>
            <button onClick={create}>Create</button>
          </div>
          <div className="col-span-1 row-span-1">
            <label>Join a Room: </label>
            <input
              type="text"
              placeholder="Room Code"
              value={roomID}
              onChange={(event) => {
                setRoomID(event.target.value);
              }}
            />
            <button onClick={join}>Join</button>
            {error && <p>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
