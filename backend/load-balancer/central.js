const http = require('http');
const { fork } = require('child_process');
const url = require('url');

// Create an array of worker processes
const workers = [];

for (let i = 0; i < 1; i++) {
    workers.push(fork('./server.js'));
}

// Create a round-robin counter
let counter = 0;

const options = {

}
// Create the load balancer
http.createServer(options,(req, res) => {
    // Get the next worker process based on the round-robin counter
    const worker = workers[counter];

    // Increment the round-robin counter
    counter = (counter + 1) % workers.length;

    // Send the request to the worker process
    // console.log(req)
    const parsedUrl = url.parse(req.url, true);
    console.log(parsedUrl)

    worker.send({ path: parsedUrl.pathname })

    // Set up a message listener to receive the response from the worker
    worker.on('message', (message) => {
        console.log('received message from worker');
        res.writeHead(200);
        res.end(message);
    });
}).listen(8080);

console.log('Load balancer running on port 8080');