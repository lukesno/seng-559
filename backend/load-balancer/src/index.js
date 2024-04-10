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
    // Starting Leader Election
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
    }
    // Create Response
    else if (message && message.type === "create-response") {
      const requestId = message.requestId;
      const statusCode = parseInt(message.statusCode);
      const res = pendingRequests[requestId];
      const data = message.data;

      if (res && data) {
        runningGames[data.roomID] = data;
        res.status(statusCode).send(data);
        delete pendingRequests[requestId]; // Remove request from pending
        // Update cache of other workers
        for (const id in cluster.workers) {
          if (cluster.workers[id] !== leader) {
            cluster.workers[id].send({ type: "update-cache", data: data });
          }
        }
      } else {
        console.error("Response object not available");
      }
    }
    // Restart Response
    else if (message && message.type === "restart-response") {
      const requestId = message.requestId;
      const statusCode = parseInt(message.statusCode);
      const res = pendingRequests[requestId];
      const data = message.data;

      if (res && data) {
        runningGames[data.roomID] = data;
        const roomID = data.roomID;
        res.status(statusCode).send({ roomID, url: data.url });
        delete pendingRequests[requestId]; // Remove request from pending
        // Update cache of other workers
        for (const id in cluster.workers) {
          if (cluster.workers[id] !== leader) {
            cluster.workers[id].send({ type: "update-cache", data: data });
          }
        }
      } else {
        console.error("Response object not available");
      }
    }
  });

  // Function to initiate leader election
  function initiateElection() {
    for (const id in cluster.workers) {
      cluster.workers[id].send({
        type: "election",
      });
    }
  }

  // Initialize Express App
  const app = express();
  const router = express.Router();
  app.use(cors());
  app.use(express.json());

  // Forward create request to the leader
  router.get("/create", async (_, res) => {
    const requestId = v4(); // Generate a unique request ID
    if (leader) {
      pendingRequests[requestId] = res; // Store the response object with request ID
      leader.send({ type: "create", requestId: requestId });
    } else {
      console.error("No leader elected yet");
      res.status(500).send("Internal Server Error");
    }
  });

  //Return the game URL from primary cache
  router.post("/join", (req, res) => {
    const { roomID } = req.body;
    const game = runningGames[roomID];
    if (game) {
      res.status(200).send({ roomID, url: game.url });
    } else {
      res.status(404).send("Game not found");
    }
  });

  // Forward restart request to the leader
  router.post("/restart", async (req, res) => {
    const { roomID } = req.query;

    const requestId = v4(); // Generate a unique request ID
    if (leader) {
      pendingRequests[requestId] = res; // Store the response object with request ID
      leader.send({ type: "restart", roomID: roomID, requestId: requestId });
    }
    else {
      console.error("No leader elected yet");
      res.status(500).send("Internal Server Error");
    }
  });


  app.use("/", router);
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server is running port ${PORT}`);
  });

  // Listen for exit event to handle leader crash
  cluster.on("exit", (worker, code, signal) => {
    if (worker === leader) {
      console.log(`Leader process ${leader.process.pid} has crashed`);
      cluster.fork();
      leader = null;
      leaderId = -1;
      initiateElection();
    } else {
      cluster.fork();
    }
  });
}

// Worker Process
else {
  let leaderId = -1; // Initialize leader ID
  const runningGames = {};

  // Listen for messages from master
  process.on("message", async (msg) => {
    if (msg) {
      if (msg.type === "election") {
        // Return process ID
        process.send({ type: "election", workerId: process.pid });
      } else if (msg && msg.type === "election-end") {
        // Update leader ID
        leaderId = msg.leaderId;
      }
      // Update Cache of running games
      else if (msg.type === "update-cache") {
        const data = msg.data;
        runningGames[data.roomID] = data;
      }
      // Create Game
      else if (msg.type === "create") {
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
        process.send({
          type: "create-response",
          data: data,
          statusCode: 200,
          requestId: msg.requestId,
        });
      } 
      // Restart Game
      else if (msg.type === "restart") {
        const roomID = msg.roomID;
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
        process.send({
          type: "create-response",
          data: game,
          statusCode: 200,
          requestId: msg.requestId,
        });
      }
    }
  });

  // Inform master process about the worker ID
  process.send({ type: "election", workerId: process.pid });
}
