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
    <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-purple-300">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          RipLash
        </span>
      </h1>

      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Username:</label>
          <input
            className="w-full p-2 text-black rounded-md"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="flex-1 mr-2">
            <label className="block text-sm font-medium mb-2">
              Create a Room:
            </label>
            <button
              className="w-full text-white bg-blue-500 rounded-md p-2 hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"
              onClick={create}
            >
              Create
            </button>
          </div>

          <div className="flex-1 ml-2">
            <label className="block text-sm font-medium mb-2">
              Join a Room:
            </label>
            <div className="flex">
              <input
                className="flex-1 p-2 rounded-l-md text-black"
                type="text"
                placeholder="Room Code"
                value={roomID}
                onChange={(event) => {
                  setRoomID(event.target.value);
                }}
              />
              <button
                className="bg-green-500 rounded-r-md p-2 hover:bg-green-700 transition duration-300 ease-in-out"
                onClick={join}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default Home;
