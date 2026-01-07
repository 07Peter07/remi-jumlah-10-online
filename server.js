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
const SUITS = ["♥", "♦", "♠", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck() {
  const deck = [];
  SUITS.forEach(s =>
    VALUES.forEach(v => deck.push({ v, s }))
  );
  return deck.sort(() => Math.random() - 0.5);
}

io.on("connection", socket => {
  console.log("socket connected:", socket.id);

  socket.on("join-room", ({ roomId, players }) => {
    console.log("JOIN ROOM:", roomId);

    socket.join(roomId);

    if (!rooms[roomId]) {
  const deck = createDeck();

  const table = deck.splice(0, 10);

  rooms[roomId] = {
    deck,
    table,
    players: [],
    turn: 0
  };
}


    const playerIndex = rooms[roomId].players.length;

    const hand = rooms[roomId].deck.splice(0, 7);

rooms[roomId].players.push({
  id: socket.id,
  hand
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
