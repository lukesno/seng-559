import { addDocument, deleteDocument, getDocuments, updateDocument } from "../database/firestore.js";
import { users, games, PORT } from "../state.js";

const POINTS_PER_ROUND = 1000;
const ASKING_DURATION_S = 10;
const VOTING_DURATION_S = 10;
const RESULT_DURATION_S = 5;
const NUM_ROUNDS = 2;

const fetchQuestions = async (game) => {
  try {
    console.log("fetching questions")
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${game.sockets.length * NUM_ROUNDS}`
    );
    const response_json = await response.json();
    const allQuestions = response_json.results.map((item) => item.question);
    const groupedQuestions = [];
    for (let i = 0; i < allQuestions.length; i += game.sockets.length) {
      groupedQuestions.push(allQuestions.slice(i, i + game.sockets.length));
    }

    groupedQuestions.forEach((questions) => {
      game.sockets.forEach((socket, i) => {
        users[socket].questions.push([
          questions[i],
          questions[(i + 1) % questions.length],
        ]);
      });
    });
    groupedQuestions.forEach((questions) => {
      game.questions.push(
        questions.map((question) => {
          return { question: question, answers: [] };
        })
      );
    });
  } catch (error) {
    console.error(error);
  }
};

export const registerHandlers = (io, socket) => {
  const emitUsers = async (game) => {
    const users = await getDocuments('users', 'roomID', game.roomID)
    console.log("users retrieved", users)
    io.to(game.roomID).emit(
      "update_users",
      users
    );
  };


  const sendQuestions = async (game) => {
    const users = await getDocuments('users', 'roomID', game.roomID)
    users.forEach((user) => {
      io.to(user.socketID).emit("send_questions", user.questions[game.round]);
    });
  };

  const updateGameState = (game, newState) => {
    game.gameState = newState;
    io.to(game.roomID).emit("update_roomState", game.gameState);
  };

  const createTimer = (game, duration, callback) => {
    let timer = duration;
    io.to(game.roomID).emit("send_timer", timer--);
    game.interval = setInterval(() => {
      io.to(game.roomID).emit("send_timer", timer--);
      if (timer < 0) {
        clearInterval(game.interval);
        if (callback !== null) {
          callback();
        }
        return;
      }
    }, 1000);
  };

  const transitionToAsking = (game) => {
    sendQuestions(game);
    game.responseCount = 0;
    game.questionIndex = 0;
    updateGameState(game, "asking");
    createTimer(game, ASKING_DURATION_S, null);
  };

  const transitionToVoting = (game) => {
    io.to(game.roomID).emit(
      "send_voteAnswers",
      game.questions[game.round][game.questionIndex]
    );
    game.responseCount = 0;
    updateGameState(game, "voting");
    createTimer(game, VOTING_DURATION_S, null);
  };

  const transitionToResults = (game) => {
    emitUsers(game);
    io.to(game.roomID).emit(
      "send_voteResults",
      game.questions[game.round][game.questionIndex].answers
    );
    updateGameState(game, "results");

    createTimer(game, RESULT_DURATION_S, () => {
      game.questionIndex += 1;
      if (game.questionIndex !== game.questions[game.round].length) {
        transitionToVoting(game);
        return;
      }
      game.round += 1;
      if (game.round !== NUM_ROUNDS) {
        transitionToAsking(game);
        return;
      } else {
        transitionToFinalResults(game);
      }
    });
  };

  const transitionToFinalResults = (game) => {
    updateGameState(game, "finalResults");
  };

  const handlers = {
    join_game: async (roomID, username) => {
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      console.log("game retrieved:", game)
      if (!game) {
        return;
      }
      const isLeader = game.sockets.length === 0;
      const user = {
        // User identified by socketID
        socketID: socket.id,
        username: username,
        roomID: roomID,
        isLeader: isLeader,
        questions: [],
        submitted: false,
        score: 0,
      };
      await addDocument("users", user);
      game.sockets.push(socket.id);
      await updateDocument("games", game.id, game)
      socket.join(roomID);
      if (isLeader) {
        io.to(socket.id).emit("select_leader");
      }
      emitUsers(game);
      console.log(`${PORT}: ${username} joined room ${roomID}`);
    },
    start_game: async (roomID) => {
      console.log(`${PORT}: Start game ${roomID}`);
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      await fetchQuestions(game);
      transitionToAsking(game);
    },
    send_answers: async (roomID, answer1, answer2) => {
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      const users = await getDocuments('users', 'socketID', socket.id)
      const user = users[0];
      const answers = [answer1, answer2];

      game.responseCount += 1;
      game.questions[game.round].forEach((question) => {
        answers.forEach((answer) => {
          if (question.question === answer.question) {
            question.answers.push({
              username: user.username,
              answer: answer.answer,
              votes: 0,
              score: 0,
            });
          }
        });
      });

      if (game.responseCount === game.sockets.length) {
        clearInterval(game.interval);
        transitionToVoting(game);
      }
    },
    send_vote: async(roomID, vote) => {
      const users = await getDocuments('users', 'socketID', socket.id)
      const user = users[0];
      console.log(`${PORT}: ${user.username} voted for ${vote}`);
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      const answers = game.questions[game.round][game.questionIndex].answers;

      game.responseCount += 1;
      answers[vote].votes += 1;

      if (game.responseCount === game.sockets.length) {
        clearInterval(game.interval);
        const users = await getDocuments('users', 'roomID', roomID)
        users.forEach(async (user) => {
          answers.forEach((answer) => {
            answer.score =
              (POINTS_PER_ROUND * answer.votes) / game.sockets.length;
            if (user.username === answer.username) {
              user.score += answer.score; // can probably improve this
            }
          });
          // Update in db
          await updateDocument('users', user.id, user)
        });
        transitionToResults(game);
      }
    },
    message_room: (roomID, username, message) => {
      io.to(roomID).emit("message_client", username, message);
      console.log(`${PORT}: ${username} sent ${message} to ${roomID}`);
    },
    disconnect: async () => {
      console.log(`${PORT}: ${socket.id} disconnected`);
      const users = await getDocuments('users', 'socketID', socket.id);
      // handle disconnects of non-user sockets
      if (users.length == 0) {
        return;
      }

      // Again assuming that there is a unique socket id for each user
      const disconnectUser = users[0]
      const roomID = disconnectUser.roomID;
      console.log(`${PORT}: ${disconnectUser.username} left room ${roomID}`);

      await deleteDocument('users', disconnectUser.id)
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      if (game.sockets.length === 1) {
        await deleteDocument('games', roomID)
        return;
      }

      game.sockets = game.sockets.filter(
        (gameUserSocketID) => gameUserSocketID != socket.id
      );

      // if disconnecting user is leader, change leader
      if (disconnectUser.isLeader) {
        const newLeaderID = game.sockets[0];
        const users = getDocuments('users', 'socketID', newLeaderID)
        const newLeaderUser = users[0]
        newLeaderUser.isLeader = true;
        await updateDocument('users', newLeaderUser.id, newLeaderUser)
        io.to(newLeaderID).emit("select_leader");
      }
      emitUsers(games[roomID]);
    },
  };

  for (let handle in handlers) {
    socket.on(handle, handlers[handle]);
  }
};
