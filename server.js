const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const TURN_TIME = 20;

app.use(express.static("public"));

const rooms = {};

const SUITS = ["♥", "♦", "♠", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

/* ===== RULES ===== */
function getGameRules(players) {
  if (players === 2) return { hand:10, table:12, useFive:true, target:105 };
  if (players === 3) return { hand:7, table:10, useFive:true, target:70 };
  if (players === 4) return { hand:5, table:8, useFive:false, target:50 };
  return { hand:7, table:10, useFive:true, target:70 };
}

/* ===== DECK ===== */
function createDeck(useFive) {
  const deck = [];
  SUITS.forEach(s =>
    VALUES.forEach(v => {
      if (v === "5" && !useFive) return;
      deck.push({ v, s });
    })
  );
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(c) {
  if (["J","Q","K"].includes(c.v)) return 10;
  if (c.v === "A") return 1;
  return Number(c.v);
}

function isSpecial(c) {
  return ["K","Q","J","10","5"].includes(c.v);
}

function canPair(a,b) {
  if (isSpecial(a) && isSpecial(b)) return a.v === b.v;
  if (isSpecial(a) || isSpecial(b)) return false;
  return cardValue(a) + cardValue(b) === 10;
}

/* ===== SCORE ===== */
function scoreCard(c) {
  if (!["♥","♦"].includes(c.s)) return 0;
  if (c.v === "A") return 20;
  if (["K","Q","J","10","9"].includes(c.v)) return 10;
  return Number(c.v);
}

function calculateScore(cards=[]) {
  return cards.reduce((s,c)=>s+scoreCard(c),0);
}

/* ===== TIMER ===== */
function startTurnTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  clearInterval(room.timer);
  room.timeLeft = TURN_TIME;

  room.timer = setInterval(() => {
    room.timeLeft--;

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.turn = (room.turn + 1) % room.players.length;
      startTurnTimer(roomId);
    }

    io.to(roomId).emit("update", room);
  }, 1000);
}

/* =====================
   SOCKET
===================== */
io.on("connection", socket => {

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
        playersCount: players,
        rules,
        timeLeft: TURN_TIME,
        timer: null
      };
    }

    const room = rooms[roomId];
    if (players !== room.playersCount) return;
    if (room.players.length >= room.playersCount) return;

    const idx = room.players.length;
    room.players.push({
      id: socket.id,
      hand: room.deck.splice(0, room.rules.hand),
      captured: [],
      score: 0
    });

    socket.emit("joined", { playerIndex: idx });
    io.to(roomId).emit("update", room);

    if (!room.timer) startTurnTimer(roomId);
  });

  socket.on("play", ({ roomId, playerIndex, handIndex, tableIndex }) => {
    const room = rooms[roomId];
    if (!room || room.turn !== playerIndex) return;

    const p = room.players[playerIndex];
    const h = p.hand[handIndex];
    const t = room.table[tableIndex];
    if (!h || !t || !canPair(h,t)) return;

    p.captured.push(h,t);
    p.hand.splice(handIndex,1);
    room.table.splice(tableIndex,1);

    if (room.deck.length) room.table.push(room.deck.shift());

    room.players.forEach(pl => pl.score = calculateScore(pl.captured));

    room.turn = (room.turn + 1) % room.players.length;
    startTurnTimer(roomId);
    io.to(roomId).emit("update", room);
  });

  socket.on("skip", ({ roomId, playerIndex }) => {
    const room = rooms[roomId];
    if (!room || room.turn !== playerIndex) return;
    room.turn = (room.turn + 1) % room.players.length;
    startTurnTimer(roomId);
    io.to(roomId).emit("update", room);
  });
});

server.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
