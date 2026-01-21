console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;
let selectedHand = null;

/* === MAPPING SUIT → FILE === */
function suitLetter(s) {
  if (s === "♠") return "S";
  if (s === "♥") return "H";
  if (s === "♦") return "D";
  if (s === "♣") return "C";
}

/* === FILENAME KARTU === */
function fileName(c) {
  return `${c.v}${suitLetter(c.s)}.svg`;
}

/* === JOIN === */
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

/* === RECEIVE UPDATE === */
socket.on("update", state => {
  gameState = state;
  render();
});

/* === ROOT RENDER === */
function render() {
  if (!gameState) return;

  document.getElementById("turn").innerText =
    (gameState.turn === playerIndex ? "KAMU" : "Pemain " + (gameState.turn + 1));

  document.getElementById("deckCount").innerText = gameState.deckCount;

  placePlayersUI();
  renderCaptured();
  renderTable();
  renderHand();
  renderScore();
}

/* ===========================================
   TABLE AREA
=========================================== */
function renderTable() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  gameState.table.forEach((c, i) => {
    const img = document.createElement("img");
    img.src = `/cards/${fileName(c)}`;
    img.className = "card-img table-card";
    img.onclick = () => handleTable(i);
    table.appendChild(img);
  });
}

function handleTable(i) {
  if (gameState.turn !== playerIndex) return;

  if (selectedHand === null) {
    socket.emit("take-one", { roomId, playerIndex });
    return;
  }

  socket.emit("play", {
    roomId,
    playerIndex,
    handIndex: selectedHand,
    tableIndex: i
  });

  selectedHand = null;
}

/* ===========================================
   PLAYER UI MAPPING (2,3,4 Player)
=========================================== */
function placePlayersUI() {
  const total = gameState.players.length;

  const map = {
    2: ["player-top", "player-bottom"],
    3: ["player-top", "player-left", "player-right"],
    4: ["player-top", "player-right", "player-bottom", "player-left"]
  };

  ["player-top","player-bottom","player-left","player-right"].forEach(id=>{
    const slot = document.getElementById(id);
    slot.innerHTML = "";
    slot.style.display = "none";
  });

  map[total].forEach((slotId, idx) => {
    const slot = document.getElementById(slotId);
    const p = gameState.players[idx];

    slot.style.display = "block";

    let html = `<div class="player-name">
      ${idx === playerIndex ? "Kamu" : ("Pemain "+(idx+1))}
      ${gameState.turn === idx ? "🔥" : ""}
    </div>`;

    html += `<div class="cards">`;

    p.hand.forEach((c, i) => {
      if (idx === playerIndex) {
        html += `<img src="/cards/${fileName(c)}" class="card-img small-card" onclick="selectHand(${i})">`;
      } else {
        html += `<img src="/cards/BACK.svg" class="card-img back-card">`;
      }
    });

    html += `</div>`;
    slot.innerHTML = html;
  });
}

/* ===========================================
   HAND (PLAYER BOTTOM)
=========================================== */
function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  const me = gameState.players[playerIndex];

  me.hand.forEach((c, i) => {
    const img = document.createElement("img");
    img.src = `/cards/${fileName(c)}`;
    img.className = "card-img hand-card";
    img.style.border = (selectedHand === i ? "3px solid yellow" : "2px solid transparent");
    img.onclick = () => selectHand(i);
    hand.appendChild(img);
  });
}

function selectHand(i) {
  selectedHand = i;
  render();
}

/* ===========================================
   CAPTURED AREA PER PLAYER
=========================================== */
function renderCaptured() {
  const total = gameState.players.length;

  const capMap = {
    2: ["captured-top","captured-bottom"],
    3: ["captured-top","captured-left","captured-right"],
    4: ["captured-top","captured-right","captured-bottom","captured-left"]
  };

  ["captured-top","captured-bottom","captured-left","captured-right"].forEach(id=>{
    const slot = document.getElementById(id);
    slot.innerHTML = "";
    slot.style.display = "none";
  });

  capMap[total].forEach((slotId, idx) => {
    const slot = document.getElementById(slotId);
    const p = gameState.players[idx];

    if (p.captured.length === 0) return;

    slot.style.display = "block";
    slot.innerHTML = `<div class="captured-title">Menangkap:</div><div class="cards"></div>`;

    const wrap = slot.querySelector(".cards");

    p.captured.forEach(c => {
      const img = document.createElement("img");
      img.src = `/cards/${fileName(c)}`;
      img.className = "card-img tiny-card";
      wrap.appendChild(img);
    });
  });
}

/* ===========================================
   TAKE BUTTON
=========================================== */
function takeCardManually() {
  if (gameState.turn !== playerIndex) return;
  socket.emit("take-one", { roomId, playerIndex });
}

/* ===========================================
   SCORE BOARD
=========================================== */
function renderScore() {
  const div = document.getElementById("score");
  div.innerHTML = "";

  gameState.players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = `Pemain ${i+1}: ${p.score}`;
    div.appendChild(li);
  });
}
