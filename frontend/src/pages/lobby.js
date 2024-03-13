import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAppContext } from "../AppContext";
import Axios from "axios";
// Screens
import { WaitingScreen, AskingScreen, VotingScreen, ResultsScreen, FinalResultsScreen } from "./states";
import { setUserID, getUserID } from "../auth-id"

let socket = io();

function Lobby() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, roomID, roomURL, setRoomID, setRoomURL} = useAppContext();

  const [timer, setTimer] = useState(0);
  const [isLeader, setIsLeader] = useState(false);
  const [lobbyState, setLobbyState] = useState("waiting"); // Initial lobby state
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);
  const [voteQuestion, setVoteQuestion] = useState("");
  const [voteAnswers, setVoteAnswers] = useState([]);

  const handlers = {
    connect: () => {
      console.log(`Connected to socket!`);

      if (!getUserID()) { 
        console.log("Setting user ID")
        setUserID(socket.id)
      }
    },
    update_users: (users) => {
      setUsers(users);
    },
    select_leader: () => {
      setIsLeader(true);
    },
    message_client: (username, message) => {
      console.log(`${username}: ${message}`);
    },
    update_roomState: (state) => {
      setLobbyState(state);
    },
    send_questions: (questions) => {
      console.log(questions)
      setQuestions([questions['first'], questions['second']]);
    },
    send_voteAnswers: (voteAnswers) => {
      setVoteQuestion(voteAnswers.question);
      setVoteAnswers(voteAnswers.answers);
    },
    send_voteResults: (voteResults) => {
      console.log("In send vote results")
      setVoteAnswers(voteResults);
    },
    send_timer: (time) => {
      setTimer(time);
    },
    disconnect: (data) => {
      // Logic for restarting protocol starts here
      restart(roomID)
      console.log(data)
      console.log("Disconnected from socket!");

    }
  };
  const restart = async (oldRoomID) => {
    try {
      const response = await Axios.post("http://localhost:8080/restart", {roomID:  oldRoomID});
      const { roomID, url } = response.data;
      setRoomID(roomID);
      setRoomURL(url);
      navigate(`lobby/${roomID}`);
    } catch (error) {
      console.error("Error restarting / reconnecting to room ", error);
    }
  };
  const registerHandlers = () => {
    for (let handle in handlers) {
      socket.on(handle, handlers[handle]);
    }
  };

  const deregisterHandlers = () => {
    for (let handle in handlers) {
      socket.off(handle);
    }
  };

  useEffect(() => {    
    // Go back to home page if there is no URL (happens on refresh)
    if (roomURL === "") {
      navigate("/");
    }
    
    socket = io.connect(roomURL);
    registerHandlers();
    socket.emit("join_game", roomID, username);

    return () => {
      deregisterHandlers();
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures the effect runs only once when the component mounts

  const sendMessage = () => {
    socket.emit("message_room", roomID, username, message);
  };

  const sendStartGame = () => {
    socket.emit("start_game", roomID);
  };

  const sendAnswers = () => {
    socket.emit(
      "send_answers",
      roomID,
      { question: questions[0], answer: `${username}: answer1` },
      { question: questions[1], answer: `${username}: answer2` }
    );
  };

  const sendVote = (vote) => {
    socket.emit("send_vote", roomID, vote);
  };

  const renderLobbyComponent = () => {
    switch (lobbyState) {
      case "waiting":
        return (
          <WaitingScreen
            isLeader={isLeader}
            roomID={roomID}
            users={users}
            sendStartGame={sendStartGame}
          />
        );
      case "asking":
        return <AskingScreen questions={questions} sendAnswers={sendAnswers} timer={timer}/>;
      case "voting":
        return (
          <VotingScreen
            voteQuestion={voteQuestion}
            voteAnswers={voteAnswers}
            sendVote={sendVote}
            timer={timer}
          />
        );
      case "results":
        return (
          <ResultsScreen
            voteQuestion={voteQuestion}
            voteAnswers={voteAnswers}
            users={users}
            timer={timer}
          />
        );
      case "finalResults":
        return (<FinalResultsScreen users={users}/>)
      default:
        return <p>Error: Lobby unavailable or in unknown state.</p>;
    }
  };

  return (
    <div>
      {/* TEMPORARY */}
      <div>
        <label>Message:</label>
        <input
          placeholder="Message"
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        <button onClick={sendMessage}>Message</button>
      </div>
      {/* END TEMPORARY */}
      {lobbyState ? (
        renderLobbyComponent()
      ) : (
        <p>Error: Lobby unavailable or in unknown state.</p>
      )}
    </div>
  );
}

export default Lobby;
