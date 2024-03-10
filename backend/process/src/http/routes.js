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
    gameState: "waiting",
    interval: null,
    round: 0,
    responseCount: 0,
    questions: [],
    questionIndex: 0,
  };

  games[roomID] = newGame;
  res.status(200).json(newGame);
});

router.get("/health", (_, res) => {
  if (Object.keys(games).length) {
    res.status(200).json({ games: Object.keys(games).length });
  } else {
    res.status(200).json({ games: 0 });
  }
});

export default router;
