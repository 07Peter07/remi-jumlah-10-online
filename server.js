const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use("/cards", express.static(__dirname + "/public/cards"));
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

function isSpecial(card) {
  return ["K", "Q", "J", "10", "5"].includes(card.v);
}

function cardValue(card) {
  if (["K", "Q", "J"].includes(card.v)) return 10;
  if (card.v === "A") return 1;
  return Number(card.v);
}

function canPair(a, b) {
  if (isSpecial(a) && isSpecial(b)) return a.v === b.v;
  if (isSpecial(a) || isSpecial(b)) return false;
  return cardValue(a) + cardValue(b) === 10;
}

function scoreCard(card) {
  if (!["♥", "♦"].includes(card.s)) return 0;
  if (card.v === "A") return 20;
  if (["K","Q","J","10","9"].includes(card.v)) return 10;
  return Number(card.v);
}

function calculateScore(cards = []) {
  return cards.reduce((s,c) => s + scoreCard(c), 0);
}

function getGameRules(players) {
  if (players === 2) return { hand:10, table:12, useFive:true, target:105 };
  if (players === 3) return { hand:7,  table:10, useFive:true, target:70 };
  if (players === 4) return { hand:5,  table:8,  useFive:false,target:50 };
  return { hand:7, table:10, useFive:true, target:70 };
}

function createDeck(useFive) {
  const deck = [];
  SUITS.forEach(s => {
    VALUES.forEach(v => {
      if (!useFive && v === "5") return;
      deck.push({ v, s });
    });
  });
  return deck.sort(()=>Math.random()-0.5);
}

function publicRoomState(room) {
  return {
    table: room.table,
    players: room.players.map(p => ({
      hand: p.hand,
      captured: p.captured,
      score: p.score
    })),
    turn: room.turn,
    target: room.target,
    deckCount: room.deck.length
  };
}

// ===========================
// SOCKET MAIN
// ===========================
io.on("connection", socket => {
  console.log("✔ CONNECT:", socket.id);

  socket.on("join-room", ({ roomId, players }) => {
    socket.join(roomId);

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

    if (players !== room.maxPlayers) {
      socket.emit("invalid", `Room ini untuk ${room.maxPlayers} pemain`);
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("invalid", "Room sudah penuh");
      return;
    }

    const playerIndex = room.players.length;

    room.players.push({
      id: socket.id,
      hand: room.deck.splice(0, room.rules.hand),
      captured: [],
      score: 0
    });

    socket.emit("joined", { playerIndex });
    io.to(roomId).emit("update", publicRoomState(room));
  });

  // ===== MAIN PLAY (PAIRING) =====
  socket.on("play", ({ roomId, playerIndex, handIndex, tableIndex }) => {
    const room = rooms[roomId];
    const player = room.playersArr[playerIndex];

    const handCard = player.hand[handIndex];
    const tableCard = room.table[tableIndex];

    if (!handCard || !tableCard) return;

    if (valueOf(handCard) + valueOf(tableCard) === 10) {
      // pair success → move to captured
      player.captured.push(handCard, tableCard);

      player.hand.splice(handIndex, 1);
      room.table.splice(tableIndex, 1);

      player.mustTake = true;
    }
    broadcast(roomId);
  });

  // === BUANG KARTU JIKA TIDAK ADA PAIR ===
  socket.on("discard", ({ roomId, playerIndex, handIndex }) => {
    const room = rooms[roomId];
    const player = room.playersArr[playerIndex];

    const card = player.hand[handIndex];
    if (!card) return;

    room.table.push(card);
    player.hand.splice(handIndex, 1);
    player.mustTake = true;
    broadcast(roomId);
  });

  // ===== TAKE-ONE (AMBIL KARTU DARI MEJA) =====
 socket.on("take-one", ({ roomId, playerIndex }) => {
    const room = rooms[roomId];
    const player = room.playersArr[playerIndex];

    if (!player.mustTake) return;
    if (room.deck.length === 0) shuffleDiscardIntoDeck(room);

    player.hand.push(room.deck.pop());
    player.mustTake = false;

    room.turn = (room.turn + 1) % room.maxPlayers;
    broadcast(roomId);
  });
});


console.log("DEBUG: server.js reached bottom");

// ===========================
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

