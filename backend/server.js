// startup sequence
console.log("=".repeat(30))
console.log("[SYSTEM]: Starting Server")

const express = require("express");
const http = require("http");
const {
  Server
} = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rateLimit = new Map();

// Load filter words
const filter = JSON.parse(fs.readFileSync("filter.json", "utf-8"));

// Load chat data safely
let data = [];
try {
  data = JSON.parse(fs.readFileSync("data.json", "utf8") || "[]");
} catch {
  data = [];
}

// Serve static files
app.use(express.static(path.join(__dirname, "../frontend/")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/email", (req, res) => {
  res.send('support@neocode.work')
});

// ---------------
//   Functions   
// ---------------

// Escape regex helper
function escapeRegex(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Censor function
function censorSwears(msg, swearList) {
  let content = msg;
  content = content.replace(/[^a-zA-Z0-9 ]/g, "");
  swearList.forEach(word => {
    const regex = new RegExp(escapeRegex(word), "gi");

    content = content.replace(regex, match =>
      "#".repeat(match.length)
    );
  });
  if (!content.includes('#')) content = msg;
  return content;
}

// Delete XML injections
function hasUnsafeProtocol(text) {
  const unsafe = /\b(javascript:|data:|file:|ftp:|mailto:|tel:)/gi;
  return unsafe.test(text);
}

// Socket.IO
io.on("connection", (socket) => {
  console.log("[SYSTEM]: User connected");

  // Send chat history
  socket.emit("chat data", data);

  socket.on("chat message", (msg) => {
    if (hasUnsafeProtocol(msg)) {
      socket.emit('denied', 'your Message Contains malicious code.')
      return;
    }
    const now = Date.now();
    const last = rateLimit.get(socket.id) || 0;

    // Rate limit (2 seconds)
    if (now - last < 2000) return;

    // Message length limit
    if (typeof msg !== "string" || msg.length > 200) return;

    rateLimit.set(socket.id, now);

    // Censor message
    msg = censorSwears(msg, filter.swear_words);

    console.log("[MESSAGE]:", msg);

    // Save message
    data.push(msg);
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

    // Send to others
    socket.broadcast.emit("chat message", msg);
  });

  socket.on("disconnect",
    () => {
      console.log("[SYSTEM]: User disconnected");
    });
});

function formatUptime(seconds = process.uptime()) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs}h ${mins}m ${secs}s`;
};

// Start server
server.listen(3000, () => {
  console.log("[SYSTEM]: Server running on port 3000");
  console.log("[SYSTEM]: Server Startup time",
    process.uptime());
  console.log("=".repeat(30))

  setInterval(() => {
    console.log("[SYSTEM]: Server Uptime:", formatUptime());
  },
    30000);

  process.on("SIGINT",
    () => {
      console.log("=".repeat(30));
      console.log("[SYSTEM]: Closing Server");
      console.log("[SYSTEM]: Server Uptime:", formatUptime());
      console.log("=".repeat(30));

      // cleanup here
      process.exit(0);
    });
});