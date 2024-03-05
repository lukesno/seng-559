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

const games = {}; // roomID: {roomID, url, users}
const users = {}; // socketID: {socketID, username, roomID, isLeader}

app.get("/create", (_, res) => {
  const roomID = nanoid();
  const newGame = {
    roomID: roomID,
    url: `${URL}:${PORT}`,
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
  console.log(`${socket.id} connected`);

  socket.on("joinGame", (args) => {
    const { roomID, username } = args;
    const isLeader = games[roomID].users.length === 0;
    const user = {
      socketID: socket.id,
      username: username,
      roomID: roomID,
      isLeader: isLeader,
    };

    users[socket.id] = user;
    games[roomID].users.push(user);
    socket.join(roomID);

    if (isLeader) {
      io.to(socket.id).emit("leader", isLeader);
    }
    emitUsers(roomID);
    console.log(`${username} joined room ${roomID}`);
  });

  socket.on("message", (args) => {
    const { roomID, username, message } = args;
    io.to(roomID).emit("message", { username, message });

    console.log(`${username} sent ${message} to ${roomID}`);
  });

  socket.on("disconnect", () => {
    // handle disconnects of non-user sockets
    if (!(socket.id in users)) {
      return;
    }

    const disconnectUser = users[socket.id];
    const roomID = disconnectUser.roomID;
    console.log(`${disconnectUser.username} left room ${roomID}`);

    delete users[socket.id];
    if (games[roomID].users.length === 1) {
      delete games[roomID];
      return;
    }

    games[roomID].users = games[roomID].users.filter(
      (gameUser) => gameUser.username != disconnectUser.username
    );

    // if disconnecting user is leader, change leader
    if (disconnectUser.isLeader) {
      const newLeaderID = games[roomID].users[0].socketID;
      users[newLeaderID].isLeader = true;
      io.to(newLeaderID).emit("leader", true);
    }
    emitUsers(roomID);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
