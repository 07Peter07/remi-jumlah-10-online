const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// STATIC FILES
app.use(express.static("public"));

// SOCKET LOGIC
const rooms = {};

io.on("connection", socket => {
  console.log("socket connected:", socket.id);

  socket.on("join-room", ({ roomId, players }) => {
    console.log("JOIN ROOM:", roomId);

    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        table: [],
        turn: 0
      };
    }

    const playerIndex = rooms[roomId].players.length;

    rooms[roomId].players.push({
      id: socket.id,
      hand: []
    });

    socket.emit("joined", {
      playerIndex,
      state: rooms[roomId]
    });

    io.to(roomId).emit("update", rooms[roomId]);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
