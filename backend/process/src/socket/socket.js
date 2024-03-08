import { users, games } from "../state.js";

export const registerHandlers = (io) => {
  const emitUsers = (roomID) => {
    io.to(roomID).emit(
      "update_users",
      games[roomID].sockets.map((socket) => users[socket].username)
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

        game.responseCount += 1;
        game.questions.forEach((question) => {
          if (question.question === answer1.question) {
            question.answers.push({
              username: user.username,
              answer: answer1.answer,
              votes: 0,
            });
          }
          if (question.question === answer2.question) {
            question.answers.push({
              username: user.username,
              answer: answer2.answer,
              votes: 0,
            });
          }
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

        game.responseCount += 1;
        game.questions[game.questionIndex].answers[vote].votes += 1;

        if (game.responseCount === game.sockets.length) {
          // TODO: increment player score here
          // TODO: need to figure what to display to player
          // TODO: transition to sending the next question
          io.to(roomID).emit(
            "send_voteResults",
            game.questions[game.questionIndex].answers
          );
          io.to(roomID).emit("update_roomState", "results");
          game.questionIndex += 1;
          game.responseCount = 0;
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
