import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";
import { useAppContext } from "../AppContext";
import logo from "../assets/logo.svg";
import kirby from "../assets/kirby.gif";
import { LB_URL, LB_PORT } from "../state";

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
      const response = await Axios.get(`${LB_URL}:${LB_PORT}/create`);
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
      const response = await Axios.post(`${LB_URL}:${LB_PORT}/join`, {
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
    <div className="h-[100vh] md:grid md:place-items-center">
      <div className="max-h-screen md:shadow-[inset_0_2px_4px_0_rgb(0,0,0,0.25)] rounded-lg p-1">
        <div className="max-h-screen p-8 rounded-lg md:shadow-[0_2px_4px_0_rgb(0,0,0,0.25)] grid grid-cols-1 grid-rows-8 md:grid-cols-3 md:grid-rows-3 place-items-center md:bg-primary/30">
          <div className="row-start-3 row-span-1 col-span-1 md:row-start-auto md:col-span-3 place-self-center">
            <img src={logo} className="place-self-center max-w-80" />
          </div>
          <div className="row-start-4 col-span-1 md:row-start-auto md:col-span-2 row-span-1 flex flex-col md:flex-row items-center">
            <label className="primary-text">Username: </label>
            <input
              className="primary-input rounded-xl ml-2"
              type="text"
              placeholder="coolguy69"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
          </div>
          <div className="row-start-5 row-span-1 md:row-start-auto flex flex-col items-center w-48 md:w-auto">
            <h2 className="primary-text">Create a Room</h2>
            <button
              className="text-white px-6 py-2 h-10 w-full rounded-2xl font-semibold transition duration-300 ease-in-out shadow-lg hover:shadow-xl bg-green-500 hover:bg-green-700"
              onClick={create}
            >
              Create
            </button>
          </div>
          <div className="row-start-6 md:row-start-auto row-span-1 flex flex-col w-48 items-center">
            <h2 className="primary-text">Join a Room</h2>
            <div className="rounded-xl overflow-hidden flex items-center h-10">
              <input
                className="primary-input w-28 h-full"
                type="text"
                placeholder="Room Code"
                value={roomID}
                onChange={(event) => {
                  setRoomID(event.target.value);
                }}
                maxLength={4}
              />
              <button
                className="text-white px-6 py-2 font-semibold transition duration-300 ease-in-out shadow-lg hover:shadow-xl bg-green-500 hover:bg-green-700"
                onClick={join}
              >
                Join
              </button>
            </div>
            {error && (
              <p className="text-red-500 uppercase font-bold text-s mt-5">
                {error}
              </p>
            )}
          </div>
          <div className="row-start-7 row-span-2 md:col-start-3 md:col-end-4 md:row-start-2 md:row-end-4 place-self-centerp-10">
            <img className="w-28 md:w-48" src={kirby} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
