## Create Lobby:

- Clients connects to load balancer (http)
- LB do health check on server (http)
- LB send creation request to healthies server (http)
- Server sends LB Socket URL (http)
- LB stores a copy of the URL and link it with a key (room code) (http)
- LB returns Key and URL to client (http)
- Client establish connection with socket url (socket)
- Server save state of the person that created the lobby
- Server send client an event isLeader

## Join Lobby:

- Client request game access with room code (http)
- LB return socket url to client (http)
- Client establish connection with socket url (socket)

`n = number of players`

## Game process:

- Clients establish socket connection with server
- Leader sends start game event
- Server query OpenAI API for n\*number of rounds

### Begin game Loop (3 rounds):

#### Prompt Phase:

- Server sets up timer event
- Server sends 2 prompts to each client
- Server sends current time of the timer (update every seconds)
- Client can send answer for each prompt (attached is client's name and last received timestamp **Synchronization requirements**)
- After timer ends, server sends end request

#### Vote Phase (Repeats n times):

- Server sets up timer
- Server sends current time of the timer (update every seconds)
- Server sends prompt + answers (2) event to all clients
- On Client side, if name == answers.name, no voting buttons
- Clients press button to vote for funnier choice
- After timer ends, server sends end request
- Server sends voting result to each client
- Client display voting result

#### Result Phase:

- Server sends ranking of all clients to all clients
- Clients display ranking
- Server sends new rounds request

### Final Result:

- Server sends ranking of all clients to all clients
- Clients display ranking
- Leader client will have a restart game button (same functionality as start game button)

## Game Server Design:

- 2 static endpoints:
  - `/health`: return 200 & how many games are running on GET
  - `/create`: return a socket URL on GET
  - `/restart`: return a socket URL on POST
- on-demand socket URL

## LB Design:

- `/create`: Return game server URL on Get
- `/join`: Return game server URL on Post
- `/restart`: Return game server URL on POST
  - Post Request will have lobby key (room code)
- LB needs to be replicated, maybe having 2 instances running the same code (**Needed for Election**) (**_But this also forces us to do fault tolerance here_**)

## Firestore DB

- Each game serer will have their own local state
- Local state is update whenver an event happen (timer update, send/receive from client)
- Whenever local state update, update state on Firebase

### DB Schema

| Collection | Document | Data |
| ---------- | -------- | ---- |
| games      | roomID   | game |
| users      | socketID | user |


```TS
user{
	"username": string,
	"roomID": string,
	"isLeader": boolean,
	"score": number
}

game{
    "roomID": string,
    "url": string,
	"gameState": string,
    "sockets": string[], //list of socket ids
	"round": number,
    "responseCount": number,
    "questions": {}, // array of questions keyed by round number (e.g. round1 : [], round2 : []) 
    "questionIndex": number
}

question{
	"question": string
	"answers": answer[]
}

answer{
	"username": string,
	"answer": string,
	"votes": number,
	"score": number,
}
```

## Game Server Crashing Recovery

1. Clients have internal timeout on socket
2. On timeout, client sends request to Load Balancer to restart the game with game key (Key must be stored on client)
3. LB do a health check on all server
4. LB sends POST request with game key to `/restart` to the healthiest game server instance (least amount of game)
5. Process Server query Firebase using game key, create a new socket with details from the queried game, sends URL to LB
6. LB updates the copy of the URL with the existing a key (room code)
7. LB forward URL to client
8. LB will return new URL to subsequent POST requests from the client with the same key
