import express from "express";
import http from "http";
import { BACKENDS_URL } from "../state.js";

const router = express.Router();

const runningGames = [];

router.get("/create", async (_, res) => {
  const processHealth = [];
  for (const url of BACKENDS_URL) {
    await fetch(`http://${url.host}:${url.port}/health`, {
      method: "GET",
    })
      .then(async (data) => {
        data = await data.json();
        const numberOfGames = data.games;
        processHealth.push({
          host: url.host,
          port: url.port,
          games: numberOfGames,
        });
      })
      .catch((error) => {
        console.error(error);
      });

    console.log(processHealth);
  }

  const sortedProcesses = processHealth.sort((a, b) => a.games - b.games);
  const { host, port } = sortedProcesses[0];
  const response = await fetch(`http://${host}:${port}/create`, {
    method: "GET",
  });
  const data = await response.json();
  runningGames.push(data);
  res.status(200).send(data);
});

router.post("/join", (req, res) => {
  const { roomID } = req.body;
  const game = runningGames.find((game) => game.roomID === roomID);
  if (game) {
    res.status(200).send(game);
  } else {
    res.status(404).send("Game not found");
  }
});

router.post("/restart", (req, res) => {});

export default router;
