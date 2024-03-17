import React, { useEffect, useRef } from "react";

export function FinalResultsScreen({ users }) {
  const scrollContainer = useRef(null);

  const sortedUsers = [...users].sort((a, b) => b.score - a.score);

  useEffect(() => {
    const scrollElement = scrollContainer.current;
    if (scrollElement) {
      const scrollHeight = scrollElement.scrollHeight;
      const height = scrollElement.clientHeight;

      if (scrollHeight > height) {
        let scrollPosition = 0;
        const step = () => {
          scrollPosition += 1;
          if (scrollPosition >= scrollHeight - height) scrollPosition = 0;
          scrollElement.scrollTop = scrollPosition;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }
  }, [users]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen text-white p-5">
      <h1 className="text-4xl font-bold text-purple-300 mb-6">Final Results</h1>
      <div
        ref={scrollContainer}
        className="flex flex-col w-full max-w-4xl overflow-auto bg-gray-800 rounded-lg p-4 space-y-4"
      >
        {sortedUsers.map((user, index) => (
          <div
            key={index}
            className="flex justify-between items-center bg-gray-700 p-3 rounded-md shadow text-lg"
          >
            <div className="flex items-center space-x-4">
              <span className="font-bold">{index + 1}.</span>
              <span className="font-bold">{user.username}</span>
            </div>
            <span className="text-green-400 font-bold">
              {user.score} Points
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
