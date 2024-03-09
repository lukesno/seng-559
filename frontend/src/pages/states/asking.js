import React from "react";

export function AskingScreen({ questions, sendAnswers }) {
  return (
    <div>
      <h1>AskingScreen</h1>
      <ul>
        {questions &&
          questions.map((question, index) => <li key={index}>{question}</li>)}
      </ul>
      <button onClick={sendAnswers}>Submit Answers</button>
    </div>
  );
}


