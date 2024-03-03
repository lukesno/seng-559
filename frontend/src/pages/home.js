import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Axios from "axios";
import io from "socket.io-client"

let socket = null;

function Home() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [username, setUsername] = useState("");
  const [roomID, setroomID] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const registerHandlers = ()=>{
    socket?.on("connect", () => {
      console.log(`Connected to socket!`)
    })
    socket?.on("userUpdate", (users) => {
      console.log(users);
    })

    socket?.on("message", (message)=>{
      console.log(message);
    })
  }
  const create = async () => {
    try {
      const response = await Axios.get("http://localhost:8080/create");
      const {url, id} = response.data;
      console.log(response.data);
      setroomID(id);

      socket = io(url);
      registerHandlers();
      socket.emit('joinGame', {id, username});
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };
  
  const join = async () => {
    try {
      const response = await Axios.post("http://localhost:8080/join", { id:roomID });
      const {url, id} = response.data;
      console.log(response.data);
      setroomID(id);
    
      socket = io(url);
      registerHandlers();
      socket.emit('joinGame', {id, username});
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setError("Room not found");
      } else {
        console.error("Error joining room: ", error);
      }
    }
  };
  
  const sendMessage = async () => {
    socket.emit("message", {id:roomID, message});
  }

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
            setroomID(event.target.value);
          }}
        />
        <button onClick={join}>Join</button>
        {error && <p>{error}</p>}
      </div>
      {/* TEMPORARY */}
      <div>
        <label>Message:</label>
        <input
          type='text'
          placeholder='Message'
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
      <button onClick={sendMessage}>Message</button>
      </div>
      {/* END TEMPORARY */}
    </div>
  );
}

export default Home;
