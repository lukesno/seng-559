import express from "express";
import { games, URL, PORT } from "../state.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
const router = express.Router();

router.get("/create", (_, res) => {
  const roomID = nanoid();
  const newGame = {
    roomID: roomID,
    url: `${URL}:${PORT}`,
    sockets: [],
  };

  games[roomID] = newGame;
  res.status(200).json(newGame);
});

router.post("/join", (req, res) => {
  const { roomID } = req.body;
  if (roomID in games) {
    res.status(200).json(games[roomID]);
  } else {
    res.status(404).send("Cannot find room");
  }
});

export default router;
