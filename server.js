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

function isSpecial(card) {
  return ["K", "Q", "J", "10", "5"].includes(card.v);
}

function canPair(a, b) {
  // jika KEDUANYA kartu khusus → harus sama
  if (isSpecial(a) && isSpecial(b)) {
    return a.v === b.v;
  }

  // jika salah satu kartu khusus → TIDAK BOLEH
  if (isSpecial(a) || isSpecial(b)) {
    return false;
  }

  // kartu biasa → jumlah 10
  return cardValue(a) + cardValue(b) === 10;
}


/* ===== SCORING ===== */
function scoreCard(card) {
  if (!["♥", "♦"].includes(card.s)) return 0;

  if (card.v === "A") return 20;
  if (card.v === "9") return 10;
  if (["K", "Q", "J", "10", "5"].includes(card.v)) return 10;

  return Number(card.v);
}

function calculateScore(cards = []) {
  return cards.reduce((sum, c) => sum + scoreCard(c), 0);
}

function getTarget(players) {
  if (players === 2) return 105;
  if (players === 3) return 70;
  if (players === 4) return 50;
  return 70;
}

/* =========================
   SOCKET.IO
========================= */
io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

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
        maxPlayers: players,
        target: getTarget(players),
        gameOver: false,
        winner: null
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
      captured: [],
      score: 0
    });

    socket.emit("joined", { playerIndex });
    io.to(roomId).emit("update", room);
  });

  /* ===== PLAY CARD ===== */
  socket.on("play", ({ roomId, playerIndex, handIndex, tableIndex }) => {
    const room = rooms[roomId];
    if (!room || room.gameOver) return;
    if (room.turn !== playerIndex) return;

    const player = room.players[playerIndex];
    const handCard = player.hand[handIndex];
    const tableCard = room.table[tableIndex];

    if (!handCard || !tableCard) return;
    if (!canPair(handCard, tableCard)) return;

    // ambil kartu
    player.captured.push(handCard, tableCard);
    player.hand.splice(handIndex, 1);
    room.table.splice(tableIndex, 1);

    // draw kartu
    if (room.deck.length > 0) {
      const drawn = room.deck.shift();
      const matchIndex = room.table.findIndex(t => canPair(drawn, t));

      if (matchIndex >= 0) {
        player.captured.push(drawn, room.table[matchIndex]);
        room.table.splice(matchIndex, 1);
      } else {
        room.table.push(drawn);
      }
    }

    // update score & cek menang
    room.players.forEach(p => {
      p.score = calculateScore(p.captured);
      if (p.score >= room.target && !room.gameOver) {
        room.gameOver = true;
        room.winner = p.id;
      }
    });

    room.turn = (room.turn - 1 + room.players.length) % room.players.length;
    io.to(roomId).emit("update", room);
  });
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
