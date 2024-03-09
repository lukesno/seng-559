# Messages

> handle(args): description

handles should be named `{verb}_{noun}`

Client to server:

- `join_game(roomID)`: request to join game
- `start_game(roomID)`: begin game for roomID (only leader sends this)
- `send_answers(roomID, answer1, answer2)`: send response to questions
- `send_vote(roomID, vote)`: send answer which is voted on

- `message_room(roomID, username, message)`: send a message to lobby

Server to client:

- `connect()`: on connection message
- `update_users(users)`: user list is updated
- `select_leader()`: user is set to leader
- `update_roomState(state)`: update room state (waiting, asking, etc)
- `send_questions(questions)`: send questions to be answered clients
- `send_voteAnswers(answer)`: send the answers to be voted on
- `send_voteResults(voteResults)`: send the results of the vote back to client
- `send_timer(time)`: send the timer value to the client
- `message_client(username, message)`: sends message to all clients

## Init phase:

client: `join_game(roomID)` -> server: `update_users(users)` & `select_leader()`

## Waiting screen:

client: `start_game(roomID)` -> server: `update_roomState(state)` & `send_questions(questions)` & `send_timer(time)` <!--  to asking screen -->

## Asking screen:

client: `send_answers(roomID, answer1, answer2)` -> server: `update_roomState(state)` & `send_voteAnswers(answer)` & `send_timer(time)` <!--  to voting screen -->

## Voting screen:

client: `send_vote(roomID, vote)` -> server: `update_roomState(state)` & `send_voteResults(voteResults)` & `send_timer(time)` <!-- to result screen -->

## Result screen:

server: `update_roomState(state)` & `send_voteAnswers(answer)` & `send_timer(time)` <!-- to voting screen -->
