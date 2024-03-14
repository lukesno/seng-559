import express from "express";
import { games, URL, PORT, addGame } from "../state.js";
import { customAlphabet } from "nanoid";
import { addDocument } from "../database/firestore.js";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
const router = express.Router();

router.get("/create", async (req, res) => {
  let {roomID} = req.query
  if (!roomID) {
    console.log("Generating new roomID")
    roomID = nanoid();
  }
  const newGame = {
    roomID,
    url: `${URL}:${PORT}`,
    users: [],
    sockets: [],
    gameState: "waiting",
    round: 0,
    responseCount: 0,
    questions: {},
    questionIndex: 0,
  };

  addGame(roomID, newGame);
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
