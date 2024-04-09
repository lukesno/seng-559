const URL = process.env.URL || "http://localhost";
const PORT = process.env.PORT || 8080;

// List of backend servers
const BACKENDS_URL = [
  { host: "localhost", port: 3001 },
  { host: "localhost", port: 3002 },
  // { host: "localhost", port: 3003 }
];

export { URL, PORT, BACKENDS_URL };
