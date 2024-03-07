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
      for (let i = 0; i < game.sockets.length; i++) {
        game.questions[game.sockets[i]] = [questions[i], questions[(i + 1) % questions.length]];
      }
    } catch (error) {
      console.error(error);
    }
  }

  const sendQuestions = (roomID) => {
    const gameQuestions = games[roomID].questions;
    for (let socket in gameQuestions) {
      io.to(socket).emit("send_questions", gameQuestions[socket]);
    }
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
