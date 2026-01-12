console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;
let selectedHand = null;

/* JOIN */
function join() {
  roomId = document.getElementById("room").value;
  const players = Number(document.getElementById("players").value);
  socket.emit("join-room", { roomId, players });
}

socket.on("joined", data => {
  playerIndex = data.playerIndex;
  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";

  document.getElementById("takeBtn").onclick = takeCardManually;
});

/* UPDATE */
socket.on("update", state => {
  gameState = state;
  render();
});

/* RENDER UTAMA */
function render() {
  if (!gameState) return;

  document.getElementById("turn").innerText =
    gameState.turn === playerIndex ? "KAMU" : "Pemain " + (gameState.turn + 1);

  document.getElementById("deckCount").innerText = gameState.deckCount;

  placePlayersUI();
  renderTable();
  renderScore();
}

/* POSISI PEMAIN */
function placePlayersUI() {
  const total = gameState.players.length;

  const pos = ["player-top","player-right","player-bottom","player-left"];

  pos.forEach(id => {
    document.getElementById(id).style.display = "none";
    document.getElementById(id).innerHTML = "";
  });

  if (total === 2) {
    renderPlayer(0, "player-top");
    renderPlayer(1, "player-bottom");
  }
  if (total === 3) {
    renderPlayer(0, "player-top");
    renderPlayer(1, "player-left");
    renderPlayer(2, "player-right");
  }
  if (total === 4) {
    renderPlayer(0, "player-top");
    renderPlayer(1, "player-right");
    renderPlayer(2, "player-bottom");
    renderPlayer(3, "player-left");
  }
}

/* RENDER PLAYER INDIVIDU */
function renderPlayer(i, slotId) {
  const slot = document.getElementById(slotId);
  const p = gameState.players[i];
  slot.style.display = "block";

  let html = `<div>${i === playerIndex ? "Kamu" : "Pemain " + (i+1)}</div><div class="cards">`;

  if (i === playerIndex) {
    p.hand.forEach((c,idx)=>{
      html += `<div class="card${selectedHand===idx?" selected":""}"
        onclick="selectHand(${idx})">${c.v}${c.s}</div>`;
    });
  } else {
    p.hand.forEach(()=>{
      html += `<div class="card back">🂠</div>`;
    });
  }

  html += `</div>`;
  slot.innerHTML = html;

  // === RENDER CAPTURED ===
  renderCaptured(i);
}

/* SELECT HAND CARD */
function selectHand(i) {
  selectedHand = i;
  render();
}

/* RENDER MEJA */
function renderTable() {
  const table = document.getElementById("table");
  table.innerHTML = "";
  gameState.table.forEach((c,i)=>{
    const div=document.createElement("div");
    div.className="card table";
    div.innerText=c.v+c.s;
    div.onclick=()=>handleTableClick(i);
    table.appendChild(div);
  });
}

/* KLIK MEJA */
function handleTableClick(i) {
  if (gameState.turn !== playerIndex) return;

  if (selectedHand === null) {
    socket.emit("take-one",{roomId,playerIndex,tableIndex:i});
    return;
  }

  socket.emit("play",{roomId,playerIndex,handIndex:selectedHand,tableIndex:i});
  selectedHand=null;
}

/* TOMBOL AMBIL */
function takeCardManually() {
  if (gameState.turn !== playerIndex) return;
  if (!gameState.table.length) return;
  socket.emit("take-one",{roomId,playerIndex,tableIndex:0});
}

/* RENDER SKOR */
function renderScore() {
  const scoreDiv=document.getElementById("score");
  scoreDiv.innerHTML="";
  gameState.players.forEach((p,i)=>{
    const li=document.createElement("li");
    li.innerText=`Pemain ${i+1}: ${p.score}`;
    scoreDiv.appendChild(li);
  });
}

function renderCaptured(playerIndex) {
  const p = gameState.players[playerIndex];
  const map = [
    "captured-top",
    "captured-right",
    "captured-bottom",
    "captured-left"
  ];

  const slotId = map[playerIndex];
  const slot = document.getElementById(slotId);

  if (!slot) return;

  slot.style.display = "block";
  slot.innerHTML = "";

  p.captured.forEach(c => {
    const div = document.createElement("div");
    div.className = "captured-card";
    div.innerText = `${c.v}${c.s}`;
    slot.appendChild(div);
  });
}
