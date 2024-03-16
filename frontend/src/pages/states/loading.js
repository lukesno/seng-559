import React from "react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center">
      {/* Loading Spinner */}
      <div className="border-t-4 border-b-4 border-white rounded-full w-16 h-16 animate-spin mb-8"></div>

      {/* Loading Text */}
      <h1 className="text-3xl font-bold text-white mb-4 animate-pulse">
        Loading...
      </h1>

      {/* Optional Additional Text */}
      {/* <p className="text-lg text-purple-200">Please wait while the content is being loaded.</p> */}
    </div>
  );
}
