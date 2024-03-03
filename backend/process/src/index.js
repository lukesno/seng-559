import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import http from "http";
import serviceAccount from "./seng559-firebase-adminsdk-tddx2-cbed457917.json" assert { type: "json" };
import { Server } from "socket.io";
import { nanoid } from "nanoid"

const URL = "http://localhost";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: "*"
  }
});

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const games = {};

app.get("/", (_, res) => {
  res.status(200).send("hello world");
})

app.get("/create", (_, res) => {
  const id = nanoid(4);
  const newGame = {
    url: `${URL}:${PORT}`,
    id: id,
    users: []
  };

  games[id] = newGame;
  res.status(200).json(newGame);
});

// temporary function to facilitate joining room
app.post("/join", (req, res) => {
  const { id } = req.body;
  if(id in games){
    res.status(200).json(games[id]);
  } else {
    res.status(404).send("Cannot find room");
  }
})

io.on("connection", (socket) => {  
  socket.on("joinGame", async (args) => {
    const {id, username} = args;
    games[id].users.push(username);
    console.log(`${username} joined room ${id}`);

    socket.join(id);
    io.to(id).emit("userUpdate", games[id].users);

    const sockets = await io.in(id).allSockets();
    const socketIds = Array.from(sockets);
    console.log(`Sockets in ${id}:`, socketIds);
    return socketIds; // This is an array of socket IDs
  })
  
  socket.on("message", async (args) => {
    const {id, message} = args;
    console.log(args);
    io.to(id).emit("message", message);

    const sockets = await io.in(id).allSockets();
    const socketIds = Array.from(sockets);
    console.log(`Sockets in ${id}:`, socketIds);
    return socketIds; // This is an array of socket IDs
  })
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
