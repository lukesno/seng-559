import React from "react";

function AskingScreen({ questions }) {
  return <div>
    <h1>
      AskingScreen
    </h1>
    <ul>
      {questions && (questions.map((question) => <li>{question}</li>))}
    </ul>
  </div>;
}

export default AskingScreen;
