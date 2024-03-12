import { addDocument, deleteDocument, getDocuments, updateDocument } from "../database/firestore.js";
import { users, games, PORT } from "../state.js";

const POINTS_PER_ROUND = 1000;
const ASKING_DURATION_S = 10;
const VOTING_DURATION_S = 10;
const RESULT_DURATION_S = 5;
const NUM_ROUNDS = 2;
var timer_ref = {};

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
    console.log(groupedQuestions)
    
    const users = await getDocuments('users', 'roomID', game.roomID)
    
    groupedQuestions.forEach((questions) => {
      users.forEach(async (user, i) => {
        // For each round
        const question_group = {first: questions[i], second: questions[(i + 1) % questions.length]}
        user.questions.push(question_group);
        await updateDocument('users', user.id, user)
      });
    });

    groupedQuestions.forEach(async (questions) => {
      // Create question object, refer to its id in game object
      questions.map(async (question) => {
        const questionID = await addDocument('questions', {
          question: question, answers: []
        })
        game.questions.push(questionID)
        await updateDocument('games', game.id, game)
      })
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

  const updateGameState = async (game, newState) => {
    game.gameState = newState;
    await updateDocument('games', game.id, game)
    io.to(game.roomID).emit("update_roomState", game.gameState);
  };

  const createTimer = (game, duration, callback) => {
    let timer = duration;
    io.to(game.roomID).emit("send_timer", timer--);
    timer_ref.interval = setInterval(() => {
      io.to(game.roomID).emit("send_timer", timer--);
      if (timer < 0) {
        clearInterval(timer_ref.interval);
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

  const transitionToVoting = async (game) => {
    // Get question object
    const questions = []
    console.log("game in transition:")
    console.log(game)

    for (const id of game.questions) {
      console.log("in send_answer getting question..")
      console.log(id)
      const docs = await getDocuments('questions', 'id', id)
      console.log("docs:")
      console.log(docs)
      const question = docs[0]
      
      console.log(question)
      questions.push(question)
    }

    console.log("question list retrieved:", questions)
    io.to(game.roomID).emit(
      "send_voteAnswers",
      questions[game.round * 2 + game.questionIndex]
    );
    game.responseCount = 0;
    updateGameState(game, "voting");
    createTimer(game, VOTING_DURATION_S, null);
  };

  const transitionToResults = async (game) => {
    emitUsers(game);
    const questions = []

    for (const id of game.questions) {
      console.log("in send_answer getting question..")
      console.log(id)
      const docs = await getDocuments('questions', 'id', id)
      console.log("docs:")
      console.log(docs)
      const question = docs[0]
      
      console.log(question)
      questions.push(question)
    }

    console.log("before sending vote results")
    io.to(game.roomID).emit(
      "send_voteResults",
      questions[game.round * 2 + game.questionIndex].answers
    );
    updateGameState(game, "results");

    createTimer(game, RESULT_DURATION_S, async () => {
      game.questionIndex += 1;
      if (game.questionIndex !== 2) {
        console.log("be")
        await transitionToVoting(game);
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
      console.log("in send_answers. received: ", roomID, answer1, answer2)
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]
      const users = await getDocuments('users', 'socketID', socket.id)
      const user = users[0];
      const answers = [answer1, answer2];

      game.responseCount += 1;

      const questions = []
      
      for (const id of game.questions) {
        console.log("in send_answer getting question..")
        console.log(id)
        const docs = await getDocuments('questions', 'id', id)
        console.log("docs:")
        console.log(docs)
        const question = docs[0]
        
        console.log(question)
        questions.push(question)
      }
      
      console.log("questions")
      console.log(questions)
      console.log(game.round * 2 , (game.round+1) * 2)

      const parsed_questions = questions.slice(game.round * 2 , (game.round+1) * 2)
      for (const question of parsed_questions) {
        for (const answer of answers) {
          console.log("---------")
          console.log("in loop")
          console.log(question)
          console.log(answer)
          if (question.question === answer.question) {
            question.answers.push({
              username: user.username,
              answer: answer.answer,
              votes: 0,
              score: 0,
            });
          }
          console.log(question)
          await updateDocument('questions', question.id, question)
        }
      }
      await updateDocument('games', game.id, game)
      console.log(game.responseCount)
      if (game.responseCount === game.sockets.length) {
        clearInterval(timer_ref.interval);
        console.log("Hi")
        console.log(game)
        await transitionToVoting(game);
      }
    },
    send_vote: async(roomID, vote) => {
      const users = await getDocuments('users', 'socketID', socket.id)
      const user = users[0];
      console.log(`${PORT}: ${user.username} voted for ${vote}`);
      const docs = await getDocuments('games', 'roomID', roomID)
      // Assuming no roomID dupe entries
      const game = docs[0]

      const questions = []

      for (const id of game.questions) {
        console.log("in send_vote getting question..")
        console.log(id)
        const docs = await getDocuments('questions', 'id', id)
        const question = docs[0]
        
        console.log(question)
        questions.push(question)
      }

      const answers = questions[game.round * 2 + game.questionIndex].answers;

      game.responseCount += 1;
      answers[vote].votes += 1;
      console.log(game.responseCount)
      console.log(game.sockets.length)
      await updateDocument('games', game.id, game)
      if (game.responseCount === game.sockets.length) {
        clearInterval(timer_ref.interval);
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
      emitUsers(game);
    },
  };

  for (let handle in handlers) {
    socket.on(handle, handlers[handle]);
  }
};
