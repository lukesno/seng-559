import React from "react";

export function VotingScreen({ voteQuestion, voteAnswers, sendVote }) {
  return (
    <div>
      <h1>VotingScreen</h1>
      <h2>Question: {voteQuestion}</h2>
      <h2>Timer: {timer}</h2>
      {voteAnswers.map((answer, index) => (
        <button key={index} onClick={() => sendVote(index)}>{answer.answer}</button>
      ))}
    </div>
  );
}

