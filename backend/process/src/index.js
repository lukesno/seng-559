import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { PORT } from "./state.js";
import { registerHandlers } from "./socket/socket.js";
import router from "./http/routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
registerHandlers(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
