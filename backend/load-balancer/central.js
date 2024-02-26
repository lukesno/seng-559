const http = require("http");

// List of backend servers
const backendServers = [
  { host: "localhost", port: 3001 },
  { host: "localhost", port: 3002 },
];

let currentBackendIndex = 0;

const server = http.createServer((req, res) => {
  const { host, port } = backendServers[currentBackendIndex];
  const requestOptions = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  // Proxy the request to the selected backend server
  const proxyReq = http.request(requestOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  req.pipe(proxyReq, { end: true });

  // Cycle through backend servers
  currentBackendIndex = (currentBackendIndex + 1) % backendServers.length;
});

const port = 8080;
server.listen(port, () => {
  console.log(`Load balancer running on port ${port}`);
});
