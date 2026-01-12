const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const { startGame } = require("./game/engine");

// ================= API =================
app.get("/api/start", (req, res) => {
  const players = Number(req.query.players || 3);
  const game = startGame(players);
  res.json(game);
});

app.get("/", (req, res) => {
  res.send("Remi Jumlah 10 Online");
});

// ================= GAME LOGIC =================
const SUITS = ["♥","♦","♠","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const rooms = {};

function value(k){
  if(["J","Q","K"].includes(k.v)) return 10;
  if(k.v==="A") return 1;
  return parseInt(k.v);
}

function newDeck(){
  let d=[];
  SUITS.forEach(s=>VALUES.forEach(v=>d.push({v,s})));
  return d.sort(()=>Math.random()-0.5);
}

io.on("connection", socket => {

  socket.on("join", room => {
    socket.join(room);

    if(!rooms[room]){
      let deck=newDeck();
      rooms[room]={
        deck,
        meja: deck.splice(0,10),
        players:[],
        turn:0
      };
    }

    let game=rooms[room];
    if(game.players.length>=4) return;

    game.players.push({
      id: socket.id,
      hand: game.deck.splice(0,7),
      score:0,
      saldo:50000
    });

    io.to(room).emit("update", game);
  });

  socket.on("play", ({room,p,c,m})=>{
    let g=rooms[room];
    if(!g || g.turn!==p) return;

    let card=g.players[p].hand[c];
    let meja=g.meja[m];

    if(value(card)+value(meja)!==10) return;

    if(["♥","♦"].includes(card.s)){
      if(card.v==="A") g.players[p].score+=20;
      else if(card.v==="9") g.players[p].score+=10;
      else g.players[p].score+=value(card);
    }

    g.players[p].hand.splice(c,1);
    g.meja.splice(m,1);
    g.turn=(g.turn+1)%g.players.length;

    io.to(room).emit("update", g);
  });
});

// ================= START SERVER =================
http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
http.listen(3000, ()=>console.log("Server jalan di http://localhost:3000"));



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
    target: room.target
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
    if (!room) return;
    if (room.turn !== playerIndex) return;

    const player = room.players[playerIndex];
    const handCard = player.hand[handIndex];
    const tableCard = room.table[tableIndex];

    if (!handCard || !tableCard) return;
    if (!canPair(handCard, tableCard)) return;

    player.captured.push(handCard, tableCard);

    player.hand.splice(handIndex, 1);
    room.table.splice(tableIndex, 1);

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

    room.players.forEach(p => {
      p.score = calculateScore(p.captured);
    });

    room.turn = (room.turn + 1) % room.players.length;

    io.to(roomId).emit("update", publicRoomState(room));
  });

  // ===== TAKE-ONE (AMBIL KARTU DARI MEJA) =====
  socket.on("take-one", ({ roomId, playerIndex, tableIndex }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.turn !== playerIndex) return;
    if (!room.table[tableIndex]) return;

    const card = room.table.splice(tableIndex, 1)[0];
    room.players[playerIndex].hand.push(card);

    room.turn = (room.turn + 1) % room.players.length;

    io.to(roomId).emit("update", publicRoomState(room));
  });

});

// ===========================
server.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);
