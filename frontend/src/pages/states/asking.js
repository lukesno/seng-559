import React from "react";

function AskingScreen({ questions, sendAnswers }) {
  return <div>
    <h1>
      AskingScreen
    </h1>
    <ul>
      {questions && (questions.map((question) => <li>{question}</li>))}
    </ul>
    <button onClick={sendAnswers}>Submit Answers</button>
  </div>;
}

export default AskingScreen;
