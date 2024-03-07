const games = {}; // roomID: {roomID, url, sockets}
const users = {}; // socketID: {username, roomID, isLeader}
const URL = "http://localhost";
const PORT = process.env.PORT || 3001;

export { games, users, URL, PORT };
