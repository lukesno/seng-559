import express from "express";
import { BACKENDS_URL } from "../state.js";

const router = express.Router();

const runningGames = {};

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
  }

  const sortedProcesses = processHealth.sort((a, b) => a.games - b.games);
  const { host, port } = sortedProcesses[0];
  const response = await fetch(`http://${host}:${port}/create`, {
    method: "GET",
  });
  const data = await response.json();
  runningGames[data.roomID] = data;
  res.status(200).send(data);
});

router.post("/join", (req, res) => {
  const { roomID } = req.body;
  const game = runningGames[roomID];
  if (game) {
    res.status(200).send({ roomID, url: game.url });
  } else {
    res.status(404).send("Game not found");
  }
});

router.post("/restart", async (req, res) => {
  const { roomID } = req.query;

  // create a new game with same roomID
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
        console.error("health error: " + error);
      });
  }

  if (processHealth.length === 0) {
    console.error("NO SERVERS ALIVE");
    return;
  }

  const sortedProcesses = processHealth.sort((a, b) => a.games - b.games);
  const { host, port } = sortedProcesses[0];

  const response = await fetch(
    `http://${host}:${port}/restart?roomID=${roomID}`,
    {
      method: "GET",
    }
  );
  const game = await response.json();
  runningGames[game.roomID] = game;
  res.status(200).send({ roomID, url: game.url });
});

export default router;
