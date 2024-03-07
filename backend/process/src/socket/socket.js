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
      const response = await fetch(`https://opentdb.com/api.php?amount=${game.sockets.length}`);
      const response_json = await response.json();
      const questions = response_json.results.map((item) => item.question);

      game.sockets.forEach((socket, i) => {
        users[socket].questions = [questions[i], questions[(i + 1) % questions.length]];
      });
      game.questions = questions.map((question) => { return { question: question, answers: [] }; })
    } catch (error) {
      console.error(error);
    }
  }

  const sendQuestions = (roomID) => {
    const game = games[roomID];

    game.sockets.forEach((socket) => {
      io.to(socket).emit("send_questions", users[socket].questions);
    });
  }

  const questionsAnswered = (roomID) => {
    const game = games[roomID];

    for (let question of game.questions) {
      if (question.answers.length !== 2) {
        return false;
      }
    }
    return true;
  }

  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    const handlers = {
      "join_game": (roomID, username) => {
        const isLeader = games[roomID].sockets.length === 0;
        const user = {
          username: username,
          roomID: roomID,
          isLeader: isLeader,
          questions: []
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

      "start_game": async (roomID) => {
        console.log(`Start game ${roomID}`);
        await fetchQuestions(roomID);
        sendQuestions(roomID);
        io.to(roomID).emit("update_roomState", "asking");
      },

      "send_answers": (roomID, answer1, answer2) => {
        const game = games[roomID];
        const user = users[socket.id];

        game.questions.forEach((question) => {
          if (question.question === answer1.question) {
            question.answers.push({ username: user.username, answer: answer1.answer })
          }
          if (question.question === answer2.question) {
            question.answers.push({ username: user.username, answer: answer2.answer })
          }
        })

        if (questionsAnswered(roomID)) {
          io.to(roomID).emit("update_roomState", "voting")
        }
      },

      "message_room": (roomID, username, message) => {
        io.to(roomID).emit("message_client", username, message);

        console.log(`${username} sent ${message} to ${roomID}`);
      },

      "disconnect": () => {
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
      }
    }

    for (let handle in handlers) {
      socket.on(handle, handlers[handle])
    }

  });
};
