import React from "react";

function FinalResultsScreen({ users }) {
  return (
    <div>
      <h1>Final Results Screen</h1>
      {users.map((user, index) => <div key={index}>
        <div>Username: ${user.username}</div>
        <div>Score: ${user.score}</div>
        <br/>
      </div>)}
    </div>
  );
}

export default FinalResultsScreen;
