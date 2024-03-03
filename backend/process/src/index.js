import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import http from "http";
import serviceAccount from "./seng559-firebase-adminsdk-tddx2-cbed457917.json" assert { type: "json" };
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";

const URL = "http://localhost";
const PORT = process.env.PORT || 3001;
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const games = {}; // game dictionary roomID: {url, roomID, users}
const users = []; // list of all users {username, socketID, gameID}

app.get("/create", (_, res) => {
  const roomID = nanoid();
  const newGame = {
    url: `${URL}:${PORT}`,
    roomID: roomID,
    users: [],
  };

  games[roomID] = newGame;
  res.status(200).json(newGame);
});

// temporary function to facilitate joining room
app.post("/join", (req, res) => {
  const { roomID } = req.body;
  if (roomID in games) {
    res.status(200).json(games[roomID]);
  } else {
    res.status(404).send("Cannot find room");
  }
});

const emitUsers = (roomID) => {
  io.to(roomID).emit(
    "userUpdate",
    games[roomID].users.map((user) => user.username)
  );
};

io.on("connection", (socket) => {
  console.log(`${socket.roomID} connected`);

  socket.on("joinGame", (args) => {
    const { roomID, username } = args;
    const user = {
      username: username,
      socketID: socket.roomID,
      roomID: roomID,
    };

    users.push(user);
    games[roomID].users.push(user);
    socket.join(roomID);
    emitUsers(roomID);
    console.log(`${username} joined room ${roomID}`);
  });

  socket.on("message", (args) => {
    const { roomID, username, message } = args;
    io.to(roomID).emit("message", { username, message });

    console.log(`${username} sent ${message} to ${roomID}`);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.roomID} disconnected`);

    users.forEach((user) => {
      if (user.socketID == socket.roomID) {
        const roomID = user.roomID;
        games[roomID].users = games[roomID].users.filter(
          (user) => user.socketID != socket.roomID
        );
        emitUsers(roomID);
        console.log(`${user} left room ${roomID}`);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
