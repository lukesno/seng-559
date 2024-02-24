const http = require('http');
const https = require('https');

// Create the HTTP server
var server = http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
});

server.on('listening', () => {
    console.log('HTTP server listening on port 80');
});

server.listen(80);

// Create the HTTPS server
https.createServer(options, (req, res) => {
    // Handle incoming requests
}).listen(443);