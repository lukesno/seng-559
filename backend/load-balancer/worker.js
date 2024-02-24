const http = require('http');

// Create an HTTP server that responds with the current process ID
http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from worker ${process.pid}\n`);
}).listen(0, () => {
    console.log(`Worker ${process.pid} listening on port ${server.address().port}`);
});

// Listen for messages from the main process
process.on('message', (msg) => {
    console.log(`Received message from main process: ${msg}`);

    // Send a message back to the main process
    process.send('Hello from the worker process!');
});