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
