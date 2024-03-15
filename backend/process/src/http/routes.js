import express from "express";
import { games, URL, PORT, addGame, retrieveGame } from "../state.js";
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
  

router.get("/restart", async (req,res) => {
  const roomID = req.query.roomID
  let game = Object.values(games).find(game => game.roomID === roomID);
  if (game) {
    res.status(200).send(game)
    return
  }
  const retrievedGames = await retrieveGame(roomID)
  if (retrievedGames[0]) {
    retrievedGames[0].url = `${URL}:${PORT}`
    console.log('retrievedGames[0]: ',  retrievedGames[0] )
    games[roomID] = retrievedGames[0]
    res.status(200).send(retrievedGames[0])
  }
})
export default router;
