import express from "express";
import { games, URL, PORT, addGame, retrieveGame } from "../state.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
const router = express.Router();

router.get("/create", (_, res) => {
  const roomID = nanoid();
  const newGame = {
    url: `${URL}:${PORT}`,
    sockets: [],
    gameState: "waiting",
    round: 0,
    responseCount: 0,
    questions: {},
    questionIndex: 0,
  };

  addGame(roomID, newGame);
  res.status(200).json({ roomID, url: newGame.url });
});

router.get("/health", (_, res) => {
  if (Object.keys(games).length) {
    res.status(200).json({ games: Object.keys(games).length });
  } else {
    res.status(200).json({ games: 0 });
  }
});

router.get("/restart", async (req, res) => {
  const roomID = req.query.roomID;
  const game = games[roomID];
  if (game) {
    res.status(200).send(game);
    return;
  }
  const retrievedGame = await retrieveGame(roomID);
  if (retrievedGame) {
    retrievedGame.url = `${URL}:${PORT}`;
    console.log("retrievedGame: ", retrievedGame);
    games[roomID] = retrievedGame;
    res.status(200).send({ roomID, url: retrievedGame.url });
  }
});
export default router;
