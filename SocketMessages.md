# Messages
> handle(args): description

handles should be named `{verb}_{noun}`

Client to server: 
- `join_game(roomID)`: request to join game
- `start_game(roomID)`: begin game for roomID (only leader sends this)
- `message_room(roomID, username, message)`: send a message to lobby
- `send_answers(roomID, answer1, answer2)`: send response to questions

Server to client: 
- `connect()`: on connection message
- `update_users(users)`: user list is updated
- `select_leader()`: user is set to leader
- `update_roomState(state)`: update room state (waiting, asking, etc)
- `message_client(username, message)`: sends message to all clients
- `send_questions(questions)`: send questions to clients

## Init phase:


## Waiting screen:

## Asking screen:

## Voting screen:

## Result screen:

## Final result screen: