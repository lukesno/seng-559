import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAppContext } from "../AppContext";

// Screens
import {
  WaitingScreen,
  AskingScreen,
  VotingScreen,
  ResultsScreen,
  FinalResultsScreen,
} from "./states";

let socket = io();

function Lobby() {
  const navigate = useNavigate(); // Initialize useNavigate
  const { username, roomID, roomURL } = useAppContext();

  const [isMessagePanelVisible, setIsMessagePanelVisible] = useState(false);
  const [messages, setMessages] = useState([]);

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
    },
    update_users: (users) => {
      setUsers(users);
    },
    select_leader: () => {
      setIsLeader(true);
    },
    message_client: (username, message) => {
      console.log(message);
      setMessages((prevMessages) => [...prevMessages, { username, message }]);
    },
    update_roomState: (state) => {
      setLobbyState(state);
    },
    send_questions: (questions) => {
      setQuestions(questions);
    },
    send_voteAnswers: (voteAnswers) => {
      setVoteQuestion(voteAnswers.question);
      setVoteAnswers(voteAnswers.answers);
    },
    send_voteResults: (voteResults) => {
      setVoteAnswers(voteResults);
    },
    send_timer: (time) => {
      setTimer(time);
    },
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

  const sendAnswers = (answers) => {
    socket.emit(
      "send_answers",
      roomID,
      { question: questions[0], answer: answers[0] },
      { question: questions[1], answer: answers[1] }
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
            username={username}
          />
        );
      case "asking":
        return (
          <AskingScreen
            questions={questions}
            sendAnswers={sendAnswers}
            timer={timer}
          />
        );
      case "voting":
        return (
          <VotingScreen
            voteQuestion={voteQuestion}
            voteAnswers={voteAnswers}
            sendVote={sendVote}
            timer={timer}
            username={username}
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
        return <FinalResultsScreen users={users} />;
      default:
        return <p>Error: Lobby unavailable or in unknown state.</p>;
    }
  };

  return (
    <div className='relative min-h-screen text-white flex items-center justify-center'>
      {/* Expand/Collapse Button */}
      <button
        className='absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-purple-500 px-4 py-2 rounded-r-md font-medium hover:bg-purple-700 transition duration-300 ease-in-out shadow-lg'
        onClick={() => setIsMessagePanelVisible(!isMessagePanelVisible)}
        aria-label='Toggle message panel'
      >
        {isMessagePanelVisible ? "←" : "→"}
      </button>

      {/* Message Panel */}
      <div
        className={`absolute left-0 top-0 h-full w-64 bg-gray-800 p-4 rounded-tr-lg shadow-xl transition-transform duration-300 ease-in-out ${
          isMessagePanelVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ zIndex: 10 }}
      >
        <h2 className='text-lg font-semibold mb-2'>Messages</h2>

        {/* Messages Display */}
        <div
          className='overflow-auto mb-4 h-5/6 custom-scrollbar'
          style={{ maxHeight: "calc(100% - 4rem)" }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-md m-2 ${
                msg.username === username ? "bg-green-500" : "bg-gray-700"
              } overflow-hidden`}
            >
              <strong
                style={{
                  color: msg.username === username ? "#FFF" : "#FDBA74",
                }}
              >
                {msg.username}:
              </strong>
              <p
                className='break-words'
                style={{ textAlign: "left", margin: 0 }}
              >
                {msg.message}
              </p>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className='mb-2'>
          <input
            className='w-full p-2 rounded-md text-black'
            placeholder='Type your message here'
            onChange={(event) => {
              setMessage(event.target.value);
            }}
          />
        </div>
        {/* Send Button */}
        <button
          className='w-full bg-green-500 px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition duration-300 ease-in-out shadow-lg'
          onClick={sendMessage}
        >
          Send
        </button>
      </div>

      {/* Main Content */}
      {lobbyState ? (
        renderLobbyComponent()
      ) : (
        <p>Error: Lobby unavailable or in unknown state.</p>
      )}
    </div>
  );
}

export default Lobby;
