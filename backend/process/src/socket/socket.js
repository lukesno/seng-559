import { users, games } from "../state.js";

const POINTS_PER_ROUND = 1000;
const RESULT_DURATION_MS = 5000;

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
        `https://opentdb.com/api.php?amount=${game.sockets.length}`
      );
      const response_json = await response.json();
      const questions = response_json.results.map((item) => item.question);

      game.sockets.forEach((socket, i) => {
        users[socket].questions = [
          questions[i],
          questions[(i + 1) % questions.length],
        ];
      });
      game.questions = questions.map((question) => {
        return { question: question, answers: [] };
      });
    } catch (error) {
      console.error(error);
    }
  };

  const sendQuestions = (roomID) => {
    const game = games[roomID];

    game.sockets.forEach((socket) => {
      io.to(socket).emit("send_questions", users[socket].questions);
    });
  };

  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

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
        console.log(`${username} joined room ${roomID}`);
      },
      start_game: async (roomID) => {
        const game = games[roomID];

        console.log(`Start game ${roomID}`);
        await fetchQuestions(roomID);
        sendQuestions(roomID);
        game.responseCount = 0;
        io.to(roomID).emit("update_roomState", "asking");
      },
      send_answers: (roomID, answer1, answer2) => {
        const game = games[roomID];
        const user = users[socket.id];
        const answers = [answer1, answer2];

        game.responseCount += 1;
        game.questions.forEach((question) => {
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
          io.to(roomID).emit(
            "send_voteAnswers",
            game.questions[game.questionIndex]
          );
          game.responseCount = 0;
          io.to(roomID).emit("update_roomState", "voting");
        }
      },
      send_vote: (roomID, vote) => {
        console.log(`${users[socket.id].username} voted for ${vote}`);
        const game = games[roomID];
        const answers = game.questions[game.questionIndex].answers;

        game.responseCount += 1;
        answers[vote].votes += 1;

        if (game.responseCount === game.sockets.length) {
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
            game.questions[game.questionIndex].answers
          );
          io.to(roomID).emit("update_roomState", "results");

          // Timeout till next round
          setTimeout(() => {
            game.questionIndex += 1;
            game.responseCount = 0;
            if (game.questionIndex !== game.questions.length) {
              io.to(roomID).emit(
                "send_voteAnswers",
                game.questions[game.questionIndex]
              );
              game.responseCount = 0;
              io.to(roomID).emit("update_roomState", "voting");
            }
          }, RESULT_DURATION_MS);
        }
      },
      message_room: (roomID, username, message) => {
        io.to(roomID).emit("message_client", username, message);

        console.log(`${username} sent ${message} to ${roomID}`);
      },
      disconnect: () => {
        console.log(`${socket.id} disconnected`);
        // handle disconnects of non-user sockets
        if (!(socket.id in users)) {
          return;
        }

        const disconnectUser = users[socket.id];
        const roomID = disconnectUser.roomID;
        console.log(`${disconnectUser.username} left room ${roomID}`);

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
