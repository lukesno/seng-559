import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import http from "http";
import serviceAccount from "./seng559-firebase-adminsdk-tddx2-cbed457917.json" assert { type: "json" };
import { Server } from "socket.io";
import { customAlphabet } from "nanoid"

const URL = "http://localhost";
const PORT = process.env.PORT || 3001;
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

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
  const id = nanoid();
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
  socket.on("joinGame", (args) => {
    const {id, username} = args;
    games[id].users.push(username);
    socket.join(id);
    io.to(id).emit("userUpdate", games[id].users);
    
    console.log(`${username} joined room ${id}`);
  })
  
  socket.on("leaveGame", (args) => {
    const {id, username} = args;
    games[id].users = games[id].users.filter(user => user != username);
    io.to(id).emit("userUpdate", games[id].users);
    
    console.log(`${username} left room ${id}`);
  })
  
  socket.on("disconnect", ()=> {
    console.log(`${socket.id} disconnected`);
  })
  
  socket.on("message", (args) => {
    const {id, username, message} = args;
    io.to(id).emit("message", {username, message});

    console.log(`${username} sent ${message} to ${id}`);
  })
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
