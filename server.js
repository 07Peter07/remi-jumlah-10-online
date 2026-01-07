const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ✅ STATIC UI (INI KUNCI)
app.use(express.static("public"));

// ❌ JANGAN ADA app.get("/") LAGI

// API TEST
app.get("/api/start", (req, res) => {
  res.json({ status: "API OK" });
});

// SOCKET.IO (tetap)
io.on("connection", socket => {
  console.log("socket connected", socket.id);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
