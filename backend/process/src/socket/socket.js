import { users, games, PORT } from "../state.js";

const POINTS_PER_ROUND = 1000;
const ASKING_DURATION_S = 10;
const VOTING_DURATION_S = 10;
const RESULT_DURATION_S = 5;
const NUM_ROUNDS = 3;

export const registerHandlers = (io) => {
  const emitUsers = (roomID) => {
    io.to(roomID).emit(
      "update_users",
      games[roomID].sockets.map((socket) => {
        return {
          username: users[socket].username,
          submitted: users[socket].submitted,
          score: users[socket].score,
        };
      })
    );
  };

  const fetchQuestions = async (roomID) => {
    const game = games[roomID];

    try {
      const response = await fetch(
        `https://opentdb.com/api.php?amount=${game.sockets.length * NUM_ROUNDS}`
      );
      const response_json = await response.json();
      const allQuestions = response_json.results.map((item) => item.question);
      const groupedQuestions = [];
      for (let i = 0; i < NUM_ROUNDS; i += game.sockets.length) {
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

  const sendQuestions = (roomID, round) => {
    const game = games[roomID];

    game.sockets.forEach((socket) => {
      io.to(socket).emit("send_questions", users[socket].questions[round]);
    });
  };

  const updateGameState = (roomID, gameState) => {
    const game = games[roomID];
    game.gameState = gameState;
    io.to(roomID).emit("update_roomState", game.gameState);
  };

  const createTimer = (callback, roomID, duration) => {
    const game = games[roomID];
    let timer = duration;
    io.to(roomID).emit("send_timer", timer--);
    game.interval = setInterval(() => {
      io.to(roomID).emit("send_timer", timer--);
      if (timer < 0) {
        clearInterval(game.interval);
        if (callback !== null) {
          callback();
        }
        return;
      }
    }, 1000);
  };

  io.on("connection", (socket) => {
    console.log(`${PORT}: ${socket.id} connected`);

    const handlers = {
      join_game: (roomID, username) => {
        if (!games[roomID]) {
          return;
        }
        const isLeader = games[roomID].sockets.length === 0;
        const user = {
          username: username,
          roomID: roomID,
          isLeader: isLeader,
          questions: [],
          submitted: false,
          score: 0,
        };
        users[socket.id] = user;
        games[roomID].sockets.push(socket.id);
        socket.join(roomID);
        if (isLeader) {
          io.to(socket.id).emit("select_leader");
        }
        emitUsers(roomID);
        console.log(`${PORT}: ${username} joined room ${roomID}`);
      },
      start_game: async (roomID) => {
        const game = games[roomID];

        console.log(`${PORT}: Start game ${roomID}`);
        await fetchQuestions(roomID);
        sendQuestions(roomID, game.round);
        game.responseCount = 0;
        updateGameState(roomID, "asking");
        createTimer(null, roomID, ASKING_DURATION_S);
      },
      send_answers: (roomID, answer1, answer2) => {
        const game = games[roomID];
        const user = users[socket.id];
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
          io.to(roomID).emit(
            "send_voteAnswers",
            game.questions[game.round][game.questionIndex]
          );
          game.responseCount = 0;
          updateGameState(roomID, "voting");
          createTimer(null, roomID, VOTING_DURATION_S);
        }
      },
      send_vote: (roomID, vote) => {
        console.log(`${PORT}: ${users[socket.id].username} voted for ${vote}`);
        const game = games[roomID];
        const answers = game.questions[game.round][game.questionIndex].answers;

        game.responseCount += 1;
        answers[vote].votes += 1;

        if (game.responseCount === game.sockets.length) {
          clearInterval(game.interval);
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
          emitUsers(roomID);
          io.to(roomID).emit(
            "send_voteResults",
            game.questions[game.round][game.questionIndex].answers
          );
          updateGameState(roomID, "results");

          createTimer(
            () => {
              game.questionIndex += 1;
              game.responseCount = 0;
              if (game.questionIndex !== game.questions[game.round].length) {
                createTimer(null, roomID, VOTING_DURATION_S);
                io.to(roomID).emit(
                  "send_voteAnswers",
                  game.questions[game.round][game.questionIndex]
                );
                updateGameState(roomID, "voting");
                return;
              }
              game.round += 1;
              if (game.round !== NUM_ROUNDS) {
                game.questionIndex = 0;
                sendQuestions(roomID, game.round);
                updateGameState(roomID, "asking");
                createTimer(null, roomID, ASKING_DURATION_S);
                return;
              } else {
                updateGameState(roomID, "finalResults");
              }
            },
            roomID,
            RESULT_DURATION_S
          );
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

        delete users[socket.id];
        if (games[roomID].sockets.length === 1) {
          delete games[roomID];
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
  });
};
