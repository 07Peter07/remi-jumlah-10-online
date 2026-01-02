const socket = io();
let room = "";
let game = {};

function join(){
  room = document.getElementById("room").value;
  socket.emit("join", room);
}

socket.on("update", g=>{
  game = g;
  render();
});

function render(){
  let html = "<h3>Meja</h3><div class='meja'>";
  game.meja.forEach(c=>{
    html += `<span class="card">${c.v}${c.s}</span>`;
  });
  html += "</div>";

  game.players.forEach((p,i)=>{
    html += `<h4>Pemain ${i+1} | Poin: ${p.score}</h4><div class='hand'>`;
    p.hand.forEach((c,ci)=>{
      html += `<span class="card" onclick="play(${i},${ci})">${c.v}${c.s}</span>`;
    });
    html += "</div>";
  });

  document.getElementById("game").innerHTML = html;
}

function play(p,c){
  game.meja.forEach((_,m)=>{
    socket.emit("play",{room,p,c,m});
  });
}
body {
  background:#0b3d2e;
  color:#fff;
  font-family:Arial;
  text-align:center;
}
.card {
  display:inline-block;
  background:#fff;
  color:#000;
  padding:6px 10px;
  margin:4px;
  border-radius:6px;
  cursor:pointer;
}
.meja, .hand {
  margin:10px;
}
# Remi Jumlah 10 – Online Multiplayer

Game kartu remi online multiplayer (4 pemain) berbasis web.

## Fitur
- Online real-time (Socket.IO)
- 4 pemain per room
- 1 deck 52 kartu (tanpa Joker)
- Bagi 7 kartu per pemain
- 10 kartu terbuka di meja
- Pasangan kartu harus berjumlah 10
- K, Q, J = 10
- Target poin: 70
- Perhitungan akhir:
  - Hanya ♥ & ♦
  - A = 20 poin
  - 9 = 10 poin
- Saldo & top up virtual

## Teknologi
- Node.js
- Express
- Socket.IO
- HTML, CSS, JavaScript

## Cara Menjalankan (Local)
```bash
npm install
node server.js

---

# 📄 .gitignore

```gitignore
node_modules
.env
{
  "name": "remi-jumlah-10-online",
  "version": "1.0.0",
  "description": "Game kartu remi online multiplayer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  }
}
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

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

  socket.on("join", room=>{
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

http.listen(3000, ()=>console.log("Server jalan di http://localhost:3000"));
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Remi Jumlah 10 Online</title>
<link rel="stylesheet" href="style.css">
<script src="/socket.io/socket.io.js"></script>
</head>
<body>

<h2>Remi Jumlah 10 (Online)</h2>

<input id="room" placeholder="Nama Room">
<button onclick="join()">Join</button>

<div id="game"></div>

<script src="game.js"></script>
</body>
</html>
