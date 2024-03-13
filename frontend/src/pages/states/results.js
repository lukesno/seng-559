import React from "react";

export function ResultsScreen({ voteQuestion, voteAnswers, users, timer }) {
  return (
    <div>
      <h1>ResultsScreen</h1>
      <h2>Question: ${voteQuestion}</h2>
      <h2>Timer: {timer}</h2>
      {voteAnswers.map((answer, index) => (
        <div key={index}>
          <div>User: {answer.username} </div>
          <div>Answer: {answer.answer} </div>
          <div>Votes: {answer.votes} </div>
          <div>Points Gained: {answer.score} </div>
          <div>
            Total Score:{" "}
            {users.find((user) => user.username === answer.username)?.score}
          </div>
          <br />
        </div>
      ))}
    </div>
  );
}
