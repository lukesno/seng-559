/* question = { question, answer = [{user, answer},{user, answer}] }*/
const games = {}; // roomID: {roomID, url, sockets[], responseCount, questions[], questionIndex, }
const users = {}; // socketID: {username, roomID, isLeader, questions[], submitted, score}
const URL = "http://localhost";
const PORT = process.env.PORT || 3001;

export { games, users, URL, PORT };
