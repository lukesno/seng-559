import React, { useEffect } from "react";

export function VotingScreen({
  voteQuestion,
  voteAnswers,
  sendVote,
  timer,
  username,
}) {
  const canVote = voteAnswers.every((answer) => answer.username !== username); // Check if the user can vote in this round

  useEffect(() => {
    if (timer === 0) {
      sendVote(-1);
    }
  }, [timer]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-5 relative space-y-6">
      <div
        className={`absolute top-5 right-5 text-3xl font-bold ${
          timer <= 5 ? "animate-ping" : ""
        }`}
      >
        Timer: {timer}
      </div>

      <h1 className="text-4xl font-bold text-purple-300">Voting Screen</h1>
      <div className="text-center">
        <h2 className="text-2xl font-semibold">{voteQuestion}</h2>
      </div>
      <div className="flex justify-center items-center gap-4 w-full max-w-md">
        {voteAnswers.map((answer, index) => (
          <button
            key={index}
            className={`py-2 px-4 md:px-8 rounded shadow-lg transition duration-300 ease-in-out w-full ${
              canVote
                ? "bg-green-500 hover:bg-green-700 text-white font-bold hover:shadow-xl"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
            }`}
            onClick={() => canVote && sendVote(index)} // Only allow click if canVote is true
            disabled={!canVote} // Disable the button if cannot vote
          >
            {answer.answer}
          </button>
        ))}
      </div>
    </div>
  );
}
