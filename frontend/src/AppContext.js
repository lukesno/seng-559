import React, { createContext, useState, useContext } from "react";

const Context = createContext();

export function useAppContext() {
  return useContext(Context);
}

function AppContext({ children }) {
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");
  const [roomURL, setRoomURL] = useState("");
  // userID is the socket ID
  const [userID, setUserID] = useState("")
  return (
    <Context.Provider
      value={{ username, setUsername, roomID, setRoomID, roomURL, setRoomURL, userID, setUserID}}
    >
      {children}
    </Context.Provider>
  );
}

export default AppContext;
