const socket = io();
let room="", game={};

function join(){
  room = document.getElementById("room").value;
  socket.emit("join", room);
}

socket.on("update", g=>{
  game=g;
  render();
});

function render(){
  let html="<h3>Meja</h3>";
  game.meja.forEach(c=>{
    html+=`<span class="card">${c.v}${c.s}</span>`;
  });

  game.players.forEach((p,i)=>{
    html+=`<h4>Pemain ${i+1} | Poin ${p.score}</h4>`;
    p.hand.forEach((c,ci)=>{
      html+=`<span class="card" onclick="play(${i},${ci})">${c.v}${c.s}</span>`;
    });
  });

  document.getElementById("game").innerHTML=html;
}

function play(p,c){
  game.meja.forEach((_,m)=>{
    socket.emit("play",{room,p,c,m});
  });
}
