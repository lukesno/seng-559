import React from "react";

function AskingScreen({ questions, sendAnswers, timer }) {
  return (
    <div>
      <h1>AskingScreen</h1>
      <h2>Timer: {timer}</h2>
      <ul>
        {questions &&
          questions.map((question, index) => <li key={index}>{question}</li>)}
      </ul>
      <button onClick={sendAnswers}>Submit Answers</button>
    </div>
  );
}

export default AskingScreen;
