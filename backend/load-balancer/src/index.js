import express from "express";
import cors from "cors";
import http from "http";
import cluster from "cluster";

import { PORT, BACKENDS_URL } from "./state.js";
import { v4 } from "uuid";

if (cluster.isPrimary) {
  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  let leader = null;
  let leaderId = -1;
  const pendingRequests = {}; // Store pending requests
  const runningGames = {};

  // Listen for messages from worker processes
  cluster.on("message", (worker, message) => {
    if (message && message.type === "election") {
      const workerId = message.workerId;
      if (leader === null || workerId < leaderId) {
        leaderId = workerId;
        leader = worker;
        console.log(`Worker ${worker.process.pid} elected as the leader`);
        for (const id in cluster.workers) {
          cluster.workers[id].send({
            type: "election-end",
            leaderId: leaderId,
          });
        }
      }
    } else if (message && message.type === "leaderCrash") {
      console.log(`Leader process ${leader.process.pid} has crashed`);
      leader = null;
      leaderId = -1;
      initiateElection();
    }
    else if (message && message.type === 'response') {
      // Send response to client
      const requestId = message.requestId;
      const statusCode = parseInt(message.statusCode);
      const res = pendingRequests[requestId];
      if (res) {
        res.status(statusCode).send(message.body);
        delete pendingRequests[requestId]; // Remove request from pending
      } else {
        console.error('Response object not available');
      }
    }
  });

  // Function to initiate leader election
  function initiateElection() {
    for (const id in cluster.workers) {
      cluster.workers[id].send({
        type: "election"
      });
    }
  }

  const app = express();
  const router = express.Router();
  app.use(cors());
  app.use(express.json());

  //Routes
  router.get('/test', (req, res) => {
    const requestId = v4(); // Generate a unique request ID
    if (leader) {
      pendingRequests[requestId] = res; // Store the response object with request ID
      leader.send({ type: 'test-request', url: req.url, method: req.method, headers: req.headers, requestId: requestId });
    } else {
      console.error('No leader elected yet');
      res.status(500).send('Internal Server Error');
    }
  });

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

  app.use("/", router);

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Listen for exit event to handle leader crash
  cluster.on("exit", (worker, code, signal) => {
    if (worker === leader) {
      console.log(`Leader process ${leader.process.pid} has crashed`);
      leader = null;
      leaderId = -1;
      initiateElection();
    }
  });
} else {
  // Worker processess
  let leaderId = -1; // Initialize leader ID

  // Listen for messages from master
  process.on("message", (msg) => {
    if (msg && msg.type === "election") {
      process.send({ type: "election", workerId: workerId });
    } else if (msg && msg.type === "election-end") {
      leaderId = msg.leaderId; // Update leader ID
    } else if (msg && msg.type === "postRequest" && msg.url && msg.body) {
      console.log(
        `Worker ${process.pid} received POST request: ${msg.method} ${msg.url}`
      );
      // Process the body of the POST request
      process.send({ status: 200, body: msg.body });
    } else if (msg && msg.type === "test-request" && msg.url) {
      console.log(`Worker ${process.pid} received GET request: ${msg.method} ${msg.url}`);
      // Process the body of the GET request
      process.send({ type: 'response', body: `Response from worker ${process.pid} for GET ${msg.url}`, statusCode: 200, requestId: msg.requestId });
    }
  });

  // Inform master process about the worker ID
  process.send({ type: "election", workerId: process.pid });
}
