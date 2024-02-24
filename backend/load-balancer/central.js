const http = require('http');
const { fork } = require('child_process');
const url = require('url');

// Create an array of worker processes
const workers = [];

for (let i = 0; i < 4; i++) {
    workers.push(fork('./server.js'));
}

// Create a round-robin counter
let counter = 0;

// Create the load balancer
http.createServer((req, res) => {
    // Get the next worker process based on the round-robin counter
    const worker = workers[counter];

    // Increment the round-robin counter
    counter = (counter + 1) % workers.length;

    // Send the request to the worker process
    const parsedUrl = url.parse(req.url, true);
    worker.send({ path: parsedUrl.pathname });

    // Set up a message listener to receive the response from the worker
    worker.on('message', (message) => {
        res.writeHead(200);
        res.end(message);
    });
}).listen(8080);

console.log('Load balancer running on port 8080');