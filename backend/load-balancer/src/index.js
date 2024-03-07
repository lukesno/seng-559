import express from "express";
import cors from "cors";
import http from "http";

import { PORT } from "./state.js";
import router from "./http/router.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});