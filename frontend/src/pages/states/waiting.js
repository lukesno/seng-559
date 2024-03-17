import React from "react";
import { useNavigate } from "react-router-dom";

export function WaitingScreen({
  isLeader,
  roomID,
  users,
  sendStartGame,
  username,
}) {
  const navigate = useNavigate();

  // Check if the current user is the leader and there are at least 3 users in the lobby
  const canStartGame = isLeader && users.length >= 3;

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center space-y-5">
      <h1 className="text-4xl font-bold text-purple-300">Waiting Lobby</h1>

      <h2 className="text-2xl text-purple-200">
        Room Code: <span className="text-green-400">{roomID}</span>
      </h2>

      <div className="text-lg w-full max-w-md">
        <h2 className="font-semibold text-center mb-4">Users:</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
          {users.map((user, index) => (
            <div
              key={index}
              className={`flex justify-center items-center p-2 bg-gray-700 rounded-md m-1 hover:bg-gray-600 transition-all duration-300 ease-in-out ${
                user?.username === username ? "border-2 border-green-400" : ""
              }`}
              style={{ minWidth: "140px", maxWidth: "140px" }} // Ensuring same width for all username tiles
            >
              <span className="truncate">{user?.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        {isLeader && (
          <button
            className={`px-6 py-2 rounded-full font-semibold transition duration-300 ease-in-out shadow-lg hover:shadow-xl ${
              canStartGame
                ? "bg-green-500 hover:bg-green-700 "
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={canStartGame ? sendStartGame : null}
            disabled={!canStartGame}
          >
            Start Game
          </button>
        )}
        <button
          className="bg-red-500 px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition duration-300 ease-in-out shadow-lg hover:shadow-xl"
          onClick={() => {
            navigate("/");
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
