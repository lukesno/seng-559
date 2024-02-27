import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import serviceAccount from "./seng559-firebase-adminsdk-tddx2-61de37120d.json" assert { type: "json" };

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

app.post("/add", async (req, res) => {
  const data = req.body;
  console.log(data);
  const docRef = await db.collection("data").add(data);
  res.status(201).send(`Added ${data} to FireStore with ID ${docRef.id}`);
});

app.get("/", (_, res) => {
  res.status(200).send("Hello world!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
