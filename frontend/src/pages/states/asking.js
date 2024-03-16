import React, { useEffect, useState } from "react";

export function AskingScreen({ questions, sendAnswers, timer }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [answersSubmitted, setAnswersSubmitted] = useState(false); // State to track whether answers are submitted

  useEffect(() => {
    // Check if the timer hits 0 and answers haven't been submitted yet
    if (timer === 0 && !answersSubmitted) {
      // Check if there are any unanswered questions
      if (answers.some((answer) => answer === "")) {
        // Fill unanswered questions with "failed to respond"
        const updatedAnswers = answers.map((answer) =>
          answer === "" ? "failed to respond" : answer
        );
        sendAnswers(updatedAnswers);
      } else {
        // All questions answered, submit current answers
        sendAnswers(answers);
      }
      // Mark answers as submitted
      setAnswersSubmitted(true);
    }
  }, [timer]);

  // Update the answer for the current question
  const updateAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  // Go to the next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, submit current answers
      sendAnswers(answers);
      // Mark answers as submitted
      setAnswersSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-5 relative">
      {/* Timer */}
      <div
        className={`absolute top-5 right-5 text-3xl font-bold ${
          timer <= 5 ? "animate-ping" : ""
        }`}
      >
        Timer: {timer}
      </div>

      <h1 className="text-3xl font-bold text-purple-300 mb-4">Asking Screen</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-lg font-medium text-green-400 mb-4">
          Question {currentQuestionIndex + 1}
        </h3>
        <p className="text-white text-md mb-4">
          {questions[currentQuestionIndex]}
        </p>
        <input
          type="text"
          placeholder="Type your answer here..."
          className="text-black w-full p-2 rounded-md"
          value={answers[currentQuestionIndex]}
          onChange={(e) => updateAnswer(e.target.value)}
        />
        <button
          className={`mt-4 px-6 py-2 rounded-md font-semibold transition duration-300 ease-in-out ${
            answersSubmitted
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700 text-white hover:shadow-lg"
          }`}
          onClick={nextQuestion}
          disabled={answersSubmitted} // Disable the button if answers are submitted
        >
          {currentQuestionIndex < questions.length - 1
            ? "Next Question"
            : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}
