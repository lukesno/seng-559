import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";
import { useAppContext } from "../AppContext";
import logo from "../img/logo.svg";
import kirby from "../img/kirby.gif";

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
    <div className="h-screen grid place-items-center">
      <div className="shadow-[inset_0_2px_4px_0_rgb(0,0,0,0.25)] rounded-lg p-1">
        <div className="p-8 rounded-lg shadow-[0_2px_4px_0_rgb(0,0,0,0.25)] grid grid-cols-3 grid-rows-3 place-items-center">
          <div className="col-span-3 row-span-1 place-self-center">
            <img src={logo} className="place-self-center max-w-80" />
          </div>
          <div className="col-span-2 row-span-1">
            <label className="primary-text">Username: </label>
            <input
              className="primary-input ml-2"
              type="text"
              placeholder="coolguy69"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
          </div>
          <div className="col-span-2 row-span-1 flex justify-between gap-8">
            <div className="flex flex-col">
              <h2 className="primary-text">Create a Room</h2>
              <button
                className="rounded p-1 bg-whiterounded drop-shadow-lg border-primary border-b-2 border bg-white hover:bg-ternary"
                onClick={create}
                disabled={!username}
              >
                <span className="uppercase font-bold text-xs">Create</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="primary-text">Join a Room</h2>
              <div className="rounded overflow-hidden">
                <input
                  className="primary-input inline-block w-28"
                  type="text"
                  placeholder="Room Code"
                  value={roomID}
                  onChange={(event) => {
                    setRoomID(event.target.value);
                  }}
                />
                <button
                  className="inline-block rounded p-1 bg-whiterounded border-primary border-b-2 border bg-white hover:bg-ternary"
                  onClick={join}
                  disabled={!username}
                >
                  <span className="uppercase font-bold text-xs">Join</span>
                </button>
              </div>
              {error && <p>{error}</p>}
            </div>
          </div>
          <div className="col-start-3 col-end-4 row-start-2 row-end-4 place-self-centerp-10">
            <img className="w-48" src={kirby} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
