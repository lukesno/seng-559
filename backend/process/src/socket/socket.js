import {
  users,
  games,
  PORT,
  addUser,
  syncUser,
  deleteUser,
  syncGame,
  deleteGame,
} from "../state.js";

const POINTS_PER_ROUND = 1000;
const ASKING_DURATION_S = 10;
const VOTING_DURATION_S = 10;
const RESULT_DURATION_S = 5;
const NUM_ROUNDS = 2;

// Timer references
const timers = {};

const fetchQuestions = async (roomID) => {
  try {
    const game = games[roomID];
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${game.sockets.length * NUM_ROUNDS}`
    );
    const response_json = await response.json();
    const allQuestions = response_json.results.map((item) => item.question);
    const groupedQuestions = [];

    for (let i = 0; i < allQuestions.length; i += game.sockets.length) {
      groupedQuestions.push(allQuestions.slice(i, i + game.sockets.length));
    }
    groupedQuestions.forEach((questions, round) => {
      game.questions[`round${round}`] = questions.map((question) => {
        return { question: question, answers: [] };
      });
    });
  } catch (error) {
    console.error(error);
  }
};

export const registerHandlers = (io, socket) => {
  const emitUsers = (roomID) => {
    const game = games[roomID];

    io.to(roomID).emit(
      "update_users",
      game.sockets.map((socket) => {
        return {
          username: users[socket].username,
          score: users[socket].score,
        };
      })
    );
  };

  const sendQuestions = (roomID) => {
    const game = games[roomID];

    game.sockets.forEach((socket, i) => {
      const questions = [
        game.questions[`round${game.round}`][i].question,
        game.questions[`round${game.round}`][(i + 1) % game.sockets.length]
          .question,
      ];
      io.to(socket).emit("send_questions", questions);
    });
  };

  const updateGameState = (roomID, newState) => {
    const game = games[roomID];

    game.gameState = newState;
    io.to(roomID).emit("update_roomState", game.gameState);

    // synchronize database
    syncGame(roomID);
    game.sockets.forEach((socketID) => {
      syncUser(socketID);
    });
  };

  const createTimer = (roomID, duration, callback) => {
    const game = games[roomID];
    let timer = duration;

    io.to(game.roomID).emit("send_timer", timer--);
    timers[roomID] = setInterval(() => {
      io.to(game.roomID).emit("send_timer", timer--);
      if (timer < 0) {
        clearInterval(timers[roomID]);
        if (callback !== null) {
          callback();
        }
        return;
      }
    }, 1000);
  };

  const transitionToAsking = (roomID) => {
    const game = games[roomID];

    sendQuestions(roomID);
    game.responseCount = 0;
    game.questionIndex = 0;
    createTimer(roomID, ASKING_DURATION_S, null);
    updateGameState(roomID, "asking");
  };

  const transitionToVoting = (roomID) => {
    const game = games[roomID];
    io.to(game.roomID).emit(
      "send_voteAnswers",
      game.questions[`round${game.round}`][game.questionIndex]
    );
    game.responseCount = 0;
    createTimer(roomID, VOTING_DURATION_S, null);
    updateGameState(roomID, "voting");
  };

  const transitionToResults = (roomID) => {
    const game = games[roomID];
    emitUsers(roomID);
    io.to(game.roomID).emit(
      "send_voteResults",
      game.questions[`round${game.round}`][game.questionIndex].answers
    );
    updateGameState(roomID, "results");

    createTimer(roomID, RESULT_DURATION_S, () => {
      game.questionIndex += 1;
      if (game.questionIndex !== game.questions[`round${game.round}`].length) {
        transitionToVoting(roomID);
        return;
      }
      game.round += 1;
      if (game.round !== NUM_ROUNDS) {
        transitionToAsking(roomID);
        return;
      } else {
        transitionToFinalResults(roomID);
      }
    });
  };

  const transitionToFinalResults = (roomID) => {
    updateGameState(roomID, "finalResults");
  };

  const handlers = {
    join_game: (roomID, username) => {
      if (!games[roomID]) {
        return;
      }
      const game = games[roomID];
      const isLeader = games[roomID].sockets.length === 0;
      const newUser = {
        username: username,
        roomID: roomID,
        isLeader: isLeader,
        score: 0,
      };

      addUser(socket.id, newUser);
      game.sockets.push(socket.id);
      syncGame(roomID);

      socket.join(roomID);
      if (isLeader) {
        io.to(socket.id).emit("select_leader");
      }
      emitUsers(roomID);
      console.log(`${PORT}: ${username} joined room ${roomID}`);
    },
    start_game: async (roomID) => {
      console.log(`${PORT}: Start game ${roomID}`);
      await fetchQuestions(roomID);
      transitionToAsking(roomID);
    },
    send_answers: (roomID, answer1, answer2) => {
      const game = games[roomID];
      const user = users[socket.id];
      const answers = [answer1, answer2];

      game.responseCount += 1;
      game.questions[`round${game.round}`].forEach((question) => {
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
        clearInterval(timers[roomID]);
        transitionToVoting(roomID);
      }
    },
    send_vote: (roomID, vote) => {
      console.log(`${PORT}: ${users[socket.id].username} voted for ${vote}`);
      const game = games[roomID];
      const answers =
        game.questions[`round${game.round}`][game.questionIndex].answers;

      game.responseCount += 1;
      answers[vote].votes += 1;

      if (game.responseCount === game.sockets.length) {
        clearInterval(timers[roomID]);
        game.sockets.forEach((socket) => {
          const user = users[socket];
          answers.forEach((answer) => {
            answer.score =
              (POINTS_PER_ROUND * answer.votes) / game.sockets.length;
            if (user.username === answer.username) {
              user.score += answer.score; // can probably improve this
            }
          });
        });
        transitionToResults(roomID);
      }
    },
    message_room: (roomID, username, message) => {
      io.to(roomID).emit("message_client", username, message);
      console.log(`${PORT}: ${username} sent ${message} to ${roomID}`);
    },
    disconnect: () => {
      console.log(`${PORT}: ${socket.id} disconnected`);
      // handle disconnects of non-user sockets
      if (!(socket.id in users)) {
        return;
      }

      const disconnectUser = users[socket.id];
      const roomID = disconnectUser.roomID;
      console.log(`${PORT}: ${disconnectUser.username} left room ${roomID}`);

      deleteUser(socket.id);
      if (games[roomID].sockets.length === 1) {
        deleteGame(roomID);
        return;
      }

      games[roomID].sockets = games[roomID].sockets.filter(
        (gameUserSocketID) => gameUserSocketID != socket.id
      );

      // if disconnecting user is leader, change leader
      if (disconnectUser.isLeader) {
        const newLeaderID = games[roomID].sockets[0];
        users[newLeaderID].isLeader = true;
        io.to(newLeaderID).emit("select_leader");
      }
      emitUsers(roomID);
    },
  };

  for (let handle in handlers) {
    socket.on(handle, handlers[handle]);
  }
};
