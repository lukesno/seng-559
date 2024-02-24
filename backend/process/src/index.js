import express from "express";
import cors from "cors";

const PORT1 = 3001;
const app1 = express();
app1.use(cors());
app1.use(express.json());
app1.get("/", (req, res) => {
  res.send(`Hello from server on port ${PORT1}`);
});

const PORT2 = 3002;
const app2 = express();
app2.use(cors());
app2.use(express.json());
app2.get("/", (req, res) => {
  res.send(`Hello from server on port ${PORT2}`);
});

app1.listen(PORT1, () => {
  console.log(`Server is running on port ${PORT1}`);
});
app2.listen(PORT2, () => {
  console.log(`Server is running on port ${PORT2}`);
});
