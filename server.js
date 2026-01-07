const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* =========================
   STATIC FILES
========================= */
app.use(express.static("public"));

/* =========================
   GAME STATE
========================= */
const rooms = {};

const SUITS = ["♥", "♦", "♠", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

/* =========================
   HELPER FUNCTIONS
========================= */
function createDeck() {
  const deck = [];
  SUITS.forEach(s =>
    VALUES.forEach(v => deck.push({ v, s }))
  );
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (["J", "Q", "K"].includes(card.v)) return 10;
  if (card.v === "A") return 1;
  return Number(card.v);
}

function onlySelf(card) {
  return ["K", "Q", "J", "10", "5"].includes(card.v);
}

function canPair(a, b) {
  if (onlySelf(a) || onlySelf(b)) {
    return a.v === b.v;
  }
  return cardValue(a) + cardValue(b) === 10;
}

/* =========================
   SOCKET.IO
========================= */
io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

  function cardValue(card) {
  if (["J", "Q", "K"].includes(card.v)) return 10;
  if (card.v === "A") return 1;
  return Number(card.v);
}

function onlySelf(card) {
  return ["K", "Q", "J", "10", "5"].includes(card.v);
}

function canPair(a, b) {
  if (onlySelf(a) || onlySelf(b)) {
    return a.v === b.v;
  }
  return cardValue(a) + cardValue(b) === 10;
}

  /* ===== JOIN ROOM ===== */
  socket.on("join-room", ({ roomId, players }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
  const deck = createDeck();
  const table = deck.splice(0, 10);

  rooms[roomId] = {
    deck,
    table,
    players: [],
    turn: 0,
    maxPlayers: players   // ⬅️ PENTING
  };
}


    const room = rooms[roomId];
    if (room.players.length >= room.maxPlayers) {
  socket.emit("invalid", "Room sudah penuh");
  return;
}

    const playerIndex = room.players.length;

    const hand = room.deck.splice(0, 7);

    room.players.push({
      id: socket.id,
      hand,
      captured: []
    });

    socket.emit("joined", {
      playerIndex,
      state: room
    });

    io.to(roomId).emit("update", room);
  });

  /* ===== PLAY CARD ===== */
  socket.on("play", ({ roomId, playerIndex, handIndex, tableIndex }) => {
  const room = rooms[roomId];
  if (!room) return;

  // cek giliran
  if (room.turn !== playerIndex) return;

  const player = room.players[playerIndex];
  const handCard = player.hand[handIndex];
  const tableCard = room.table[tableIndex];

  if (!handCard || !tableCard) return;
  if (!canPair(handCard, tableCard)) return;

  // simpan kartu hasil ambil
  player.captured = player.captured || [];
  player.captured.push(handCard, tableCard);

  // hapus kartu
  player.hand.splice(handIndex, 1);
  room.table.splice(tableIndex, 1);

  // ambil 1 kartu dari deck
  if (room.deck.length > 0) {
    const drawn = room.deck.shift();

    // cek bisa langsung pasang
    const matchIndex = room.table.findIndex(t => canPair(drawn, t));
    if (matchIndex >= 0) {
      player.captured.push(drawn, room.table[matchIndex]);
      room.table.splice(matchIndex, 1);
    } else {
      room.table.push(drawn);
    }
  }

  // giliran berikutnya (berlawanan jarum jam)
  room.turn = (room.turn - 1 + room.players.length) % room.players.length;

  io.to(roomId).emit("update", room);
});


/* =========================
   START SERVER
========================= */
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
