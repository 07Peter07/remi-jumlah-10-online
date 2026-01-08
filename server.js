const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// ===========================
// GLOBAL ROOM STORAGE
// ===========================
const rooms = {};

const SUITS = ["♥", "♦", "♠", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ===========================
// HELPERS
// ===========================

// Kategori spesial (K,Q,J,10,5)
function isSpecial(card) {
  return ["K", "Q", "J", "10", "5"].includes(card.v);
}

function cardValue(card) {
  if (["K", "Q", "J"].includes(card.v)) return 10;
  if (card.v === "A") return 1;
  return Number(card.v);
}

// Logic pairing final
function canPair(a, b) {
  // dua spesial → harus sama
  if (isSpecial(a) && isSpecial(b)) {
    return a.v === b.v;
  }

  // satu spesial satu biasa → tidak boleh
  if (isSpecial(a) || isSpecial(b)) {
    return false;
  }

  // kartu biasa → jumlah = 10
  return cardValue(a) + cardValue(b) === 10;
}

// jumlah kartu awal berdasarkan jumlah pemain
function getGameRules(players) {
  if (players === 2) return { hand: 10, table: 12, useFive: true, target: 105 };
  if (players === 3) return { hand: 7,  table: 10, useFive: true, target: 70 };
  if (players === 4) return { hand: 5,  table: 8,  useFive: false, target: 50 };
  return { hand: 7, table: 10, useFive: true, target: 70 };
}

// Buat deck dengan filter angka 5 (untuk 4 pemain dibuang)
function createDeck(useFive) {
  const deck = [];
  SUITS.forEach(s => {
    VALUES.forEach(v => {
      if (!useFive && v === "5") return;
      deck.push({ v, s });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
}

// Hilangkan circular reference → aman dikirim ke client
function publicRoomState(room) {
  return {
    table: room.table,
    players: room.players.map(p => ({
      hand: p.hand,
      score: p.score
    })),
    turn: room.turn,
    target: room.target
  };
}

// ===========================
// SOCKET MAIN
// ===========================
io.on("connection", socket => {
  console.log("✔ CONNECT:", socket.id);

  // ===== JOIN ROOM =====
  socket.on("join-room", ({ roomId, players }) => {
    socket.join(roomId);

    // Buat room pertama kali
    if (!rooms[roomId]) {
      const rules = getGameRules(players);
      const deck = createDeck(rules.useFive);

      rooms[roomId] = {
        deck,
        table: deck.splice(0, rules.table),
        players: [],
        turn: 0,
        rules,
        maxPlayers: players,
        target: rules.target
      };

      console.log("🆕 ROOM:", roomId, rules);
    }

    const room = rooms[roomId];

    // Cek jumlah pemain
    if (players !== room.maxPlayers) {
      socket.emit("invalid", `Room ini untuk ${room.maxPlayers} pemain`);
      return;
    }

    // Cek room penuh
    if (room.players.length >= room.maxPlayers) {
      socket.emit("invalid", "Room sudah penuh");
      return;
    }

    const playerIndex = room.players.length;

    // Tambah pemain baru
    room.players.push({
      id: socket.id,
      hand: room.deck.splice(0, room.rules.hand),
      captured: [],
      score: 0
    });

    // Kirim info ke pemain baru
    socket.emit("joined", { playerIndex });

    // Update semua pemain
    io.to(roomId).emit("update", publicRoomState(room));
  });

  // ===== MAIN PLAY (PAIRING) =====
  socket.on("play", ({ roomId, playerIndex, handIndex, tableIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (room.turn !== playerIndex) return;

    const player = room.players[playerIndex];
    const handCard = player.hand[handIndex];
    const tableCard = room.table[tableIndex];

    if (!handCard || !tableCard) return;

    if (!canPair(handCard, tableCard)) return;

    // Pairing berhasil → simpan
    player.captured.push(handCard, tableCard);

    // hapus dari tangan dan meja
    player.hand.splice(handIndex, 1);
    room.table.splice(tableIndex, 1);

    // draw kartu ke meja kalau deck masih ada
    if (room.deck.length > 0) {
      room.table.push(room.deck.shift());
    }

    // next turn
    room.turn = (room.turn + 1) % room.players.length;

    // broadcast update
    io.to(roomId).emit("update", publicRoomState(room));
  });
});

// ===========================
server.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);
