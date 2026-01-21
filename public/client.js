console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;
let selectedHand = null;

/* === JOIN ROOM === */
function join() {
  roomId = document.getElementById("room").value;
  const players = Number(document.getElementById("players").value);
  socket.emit("join-room", { roomId, players });
}

socket.on("joined", data => {
  playerIndex = data.playerIndex;

  const joinUI = document.getElementById("join");
  const gameUI = document.getElementById("game");
  const takeBtn = document.getElementById("takeBtn");

  if (joinUI) joinUI.style.display = "none";
  if (gameUI) gameUI.style.display = "block";
  if (takeBtn) takeBtn.onclick = takeCardManually;
});

/* === UPDATE GAME STATE === */
socket.on("update", state => {
  gameState = state;
  render();
});

/* === RENDER ROOT === */
function render() {
  if (!gameState) return;

  const turnEl = document.getElementById("turn");
  const deckEl = document.getElementById("deckCount");

  if (turnEl) turnEl.innerText = (gameState.turn === playerIndex ? "KAMU" : "Pemain " + (gameState.turn+1));
  if (deckEl) deckEl.innerText = gameState.deckCount;

  placePlayersUI();
  renderTable();
  renderHand();
  renderScore();
}

/* === RENDER HAND === */
function renderHand() {
  const handDiv = document.getElementById("hand");
  if (!handDiv) return;

  handDiv.innerHTML = "";
  const me = gameState.players[playerIndex];

  me.hand.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = c.v + c.s;
    div.onclick = () => selectHand(i);
    if (selectedHand === i) div.style.boxShadow = "0 0 8px gold";
    handDiv.appendChild(div);
  });
}

/* === PLAYERS POSITION === */
function placePlayersUI() {
  const total = gameState.players.length;

  const slotMap = {
    2: ["player-top","player-bottom"],
    3: ["player-top","player-left","player-right"],
    4: ["player-top","player-right","player-bottom","player-left"]
  };

  const capMap = {
    2: ["captured-top","captured-bottom"],
    3: ["captured-top","captured-left","captured-right"],
    4: ["captured-top","captured-right","captured-bottom","captured-left"]
  };

  [...document.querySelectorAll(".player-slot")].forEach(el=>{
    el.style.display="none";
    el.innerHTML="";
  });

  [...document.querySelectorAll(".captured-slot")].forEach(el=>{
    el.style.display="none";
    el.innerHTML="";
  });

  if (!slotMap[total]) return;

  slotMap[total].forEach((slotId,i)=>{
    drawPlayer(i, slotId);
    renderCaptured(i, capMap[total][i]);
  });
}

/* === RENDER PLAYER SLOT === */
function drawPlayer(i, slotId) {
  const slot = document.getElementById(slotId);
  const p = gameState.players[i];

  slot.style.display = "block";

  let html = `<div style="margin-bottom:4px;">
    ${i===playerIndex ? "Kamu" : "Pemain "+(i+1)}
    ${gameState.turn===i ? " 🔥" : ""}
  </div>`;

  html += `<div class="cards">`;

  if (i === playerIndex) {
    p.hand.forEach((c,idx)=>{
      html += `<div class="card ${selectedHand===idx?"selected":""}"
        onclick="selectHand(${idx})">${c.v}${c.s}</div>`;
    });
  } else {
    p.hand.forEach(()=>{
      html += `<div class="card back">🂠</div>`;
    });
  }

  html += `</div>`;
  slot.innerHTML = html;
}

/* === RENDER CAPTURED SET === */
function renderCaptured(i, slotId) {
  const slot = document.getElementById(slotId);
  const p = gameState.players[i];

  if (!slot || !p.captured || p.captured.length === 0) return;

  slot.style.display = "block";
  slot.innerHTML = `<div style="margin-bottom:4px;font-size:12px;">Menangkap:</div>`;

  const wrap = document.createElement("div");
  wrap.className = "cards";

  p.captured.forEach(c=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerText=`${c.v}${c.s}`;
    wrap.appendChild(div);
  });

  slot.appendChild(wrap);
}

/* === TABLE RENDER === */
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

/* === CLICK TABLE === */
function handleTableClick(i) {
  if (gameState.turn !== playerIndex) return;

  // Jika tidak pilih kartu → ambil kartu
  if (selectedHand === null) {
    socket.emit("take-one", { roomId, playerIndex });
    return;
  }

  // Mode pairing
  socket.emit("play", {
    roomId,
    playerIndex,
    handIndex: selectedHand,
    tableIndex: i
  });

  selectedHand = null;
}


/* === SELECT HAND === */
function selectHand(i) {
  selectedHand = i;
  render();
}

/* === TAKE BUTTON === */
function takeCardManually() {
  if (gameState.turn !== playerIndex) return;
  socket.emit("take-one",{roomId,playerIndex});
}

/* === SCORE === */
function renderScore() {
  const scoreDiv=document.getElementById("score");
  scoreDiv.innerHTML="";
  gameState.players.forEach((p,i)=>{
    const li=document.createElement("li");
    li.innerText=`Pemain ${i+1}: ${p.score}`;
    scoreDiv.appendChild(li);
  });
}
