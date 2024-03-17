import React from "react";

export function ResultsScreen({ voteQuestion, voteAnswers, users, timer }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-5 space-y-4 w-full">
        <h1 className="text-3xl font-bold text-purple-300">Results Screen</h1>
        <h2 className="text-xl font-semibold">Timer: {timer}</h2>
        <h2 className="text-xl font-semibold">Question: {voteQuestion}</h2>
        <div className="w-full max-w-4xl p-4 space-y-4">
          {voteAnswers.map((answer, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg shadow">
              <div className="font-bold text-green-400">
                User: {answer.username}
              </div>
              <div className="text-lg">Answer: {answer.answer}</div>
              <div className="text-lg">Votes: {answer.votes}</div>
              <div className="text-lg">Points Gained: {answer.score}</div>
              <div className="text-lg">
                Total Score:{" "}
                {users.find((user) => user.username === answer.username)?.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
