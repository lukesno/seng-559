const games = {}; // roomID: {roomID, url, sockets[], questions[], questionIndex }
/* question = { question, answer = [{user, answer},{user, answer}] }*/
const users = {}; // socketID: {username, roomID, isLeader, questions[]}
const URL = "http://localhost";
const PORT = process.env.PORT || 3001;

export { games, users, URL, PORT };
