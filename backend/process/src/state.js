import {
  addDocument,
  deleteDocument,
  updateDocument,
  getDocuments
} from "./database/firestore.js";

/* question = { question, answer = [{user, answer},{user, answer}] }*/
const games = {}; // roomID: {roomID, url, sockets[], responseCount, questions[], questionIndex, }
const users = {}; // socketID: {username, roomID, isLeader, questions[], submitted, score}
const URL = "http://localhost";
const PORT = process.env.PORT || 3001;

async function addGame(roomID, game) {
  games[roomID] = game;
  await addDocument("games", roomID, game);
}
async function retrieveGame(roomID) {
  return await getDocuments("games", "roomID", roomID);
}
async function syncGame(roomID) {
  await updateDocument("games", roomID, games[roomID]);
}

async function deleteGame(roomID) {
  delete games[roomID];
  await deleteDocument("games", roomID);
}

async function addUser(socketID, user) {
  users[socketID] = user;
  await addDocument("users", socketID, user);
}

async function syncUser(socketID) {
  await updateDocument("users", socketID, users[socketID]);
}

async function deleteUser(socketID) {
  delete users[socketID];
  await deleteDocument("users", socketID);
}
async function updateUser(socketID, user) {
  await updateDocument("users", socketID, user);
}
async function getUser(socketID) {
  return await getDocuments("users", "socketID", socketID);
}
export { games, users, URL, PORT };
export { addGame,
        syncGame,
        deleteGame,
        addUser,
        syncUser,
        deleteUser,
        retrieveGame,
        getUser, };
