import { users, games, PORT } from "../state.js";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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'
});


const POINTS_PER_ROUND = 1000;
const ASKING_DURATION_S = 10;
const VOTING_DURATION_S = 10;
const RESULT_DURATION_S = 5;
const NUM_ROUNDS = 2;

const fetchQuestions = async (game) => {
  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant.", 
                  role: "user", content: "Can you please generate 6 prompt similar to the prompts from the game cards against humanity? Just provide the prompts, don't add any additional words to the response and do not ask if we want another prompt"}],
      model: "gpt-3.5-turbo",
    });
    const allQuestions = (response.choices[0].message.content).split("\n");
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
  const emitUsers = (game) => {
    io.to(game.roomID).emit(
      "update_users",
      game.sockets.map((socket) => {
        return {
          username: users[socket].username,
          submitted: users[socket].submitted,
          score: users[socket].score,
        };
      })
    );
  };


  const sendQuestions = (game) => {
    game.sockets.forEach((socket) => {
      io.to(socket).emit("send_questions", users[socket].questions[game.round]);
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
      emitUsers(games[roomID]);
      console.log(`${PORT}: ${username} joined room ${roomID}`);
    },
    start_game: async (roomID) => {
      console.log(`${PORT}: Start game ${roomID}`);
      const game = games[roomID];
      await fetchQuestions(game);
      transitionToAsking(game);
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
        transitionToVoting(game);
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
        transitionToResults(game);
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
      emitUsers(games[roomID]);
    },
  };

  for (let handle in handlers) {
    socket.on(handle, handlers[handle]);
  }
};
