console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;
let selectedHand = null;

/* --- UTILITY FILE NAME KARTU --- */
function fileName(c) {
  const suitMap = { "♠":"S", "♥":"H", "♦":"D", "♣":"C" };
  return `${c.v}${suitMap[c.s]}.svg`;
}

/* === JOIN ROOM === */
function join() {
  roomId = document.getElementById("room").value.trim();
  const players = Number(document.getElementById("players").value);

  if (!roomId) return alert("Masukkan nama room!");
  socket.emit("join-room", { roomId, players });
}

socket.on("joined", data => {
  playerIndex = data.playerIndex;

  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";

  document.getElementById("takeBtn").onclick = takeCardManually;
});

/* === UPDATE STATE DARI SERVER === */
socket.on("update", state => {
  gameState = state;
  render();
});

/* === RENDER ROOT === */
function render() {
  if (!gameState || !gameState.players) return;
  if (!Array.isArray(gameState.players)) return;
  
  const turnEl = document.getElementById("turn");
  const deckEl = document.getElementById("deckCount");
  if (!turnEl || !deckEl) return;

  turnEl.innerText = (gameState.turn === playerIndex ? "KAMU" : "Pemain "+(gameState.turn+1));
  deckEl.innerText = gameState.deckCount;

  placePlayersUI();
  renderTable();
  renderScore();
}


/* --- RENDER TABLE --- */
function renderTable() {
  const tableDiv = document.getElementById("table");
  tableDiv.innerHTML = "";

  gameState.table.forEach((c,i)=>{
    const img = document.createElement("img");
    img.src = `/cards/${fileName(c)}`;
    img.className = "card-img";
    img.onclick = ()=>handleTableClick(i);
    tableDiv.appendChild(img);
  });
}

/* === LOGIC KLIK MEJA === */
function handleTableClick(i) {
  if (gameState.turn !== playerIndex) return;

  // tidak pilih kartu → ambil
  if (selectedHand === null) {
    socket.emit("take-one",{ roomId, playerIndex });
    return;
  }

  // pairing
  socket.emit("play",{
    roomId,
    playerIndex,
    handIndex: selectedHand,
    tableIndex: i
  });

  selectedHand = null;
}

/* === RENDER PEMAIN (TOP/LEFT/RIGHT/BOTTOM) === */
function renderPlayers() {
  const total = gameState.players.length;

  const map = {
    2:["player-top","player-bottom"],
    3:["player-top","player-left","player-right"],
    4:["player-top","player-right","player-bottom","player-left"]
  };

  ["player-top","player-right","player-bottom","player-left"].forEach(id=>{
    document.getElementById(id).style.display="none";
    document.getElementById(id).innerHTML="";
  });

  map[total].forEach((slotId, idx)=>{
    const slot = document.getElementById(slotId);
    const p = gameState.players[idx];
    slot.style.display = "block";

    let html = `<div style="margin-bottom:3px;">${
      idx===playerIndex?"Kamu":"Pemain "+(idx+1)
    } ${gameState.turn===idx?"🔥":""}</div>`;

    html += `<div class="cards">`;

    p.hand.forEach((c,i)=>{
      html += `<img src="/cards/BACK.svg" class="back-img">`;
    });

    html += `</div>`;
    slot.innerHTML = html;
  });
}

/*seating System*/
function placePlayersUI() {
  if (!gameState || !gameState.players) return;

  const total = gameState.players.length;

  const map = {
    2:["player-top","player-bottom"],
    3:["player-top","player-left","player-right"],
    4:["player-top","player-right","player-bottom","player-left"]
  };

  const capMap = {
  2:["captured-top","captured-bottom"],
  3:["captured-top","captured-left","captured-right"],
  4:["captured-top","captured-right","captured-bottom","captured-left"]
};

if (capMap[total]) {
  capMap[total].forEach((slotId,i)=>{
    renderCaptured(i, slotId);
  });
}



  // hide dulu semua
  ["player-top","player-bottom","player-left","player-right"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) {
      el.style.display="none";
      el.innerHTML="";
    }
  });

  if (!map[total]) return;

  map[total].forEach((slotId, idx)=>{
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const p = gameState.players[idx];

    slot.style.display="block";

    let html = `<div>${idx===playerIndex?"Kamu":"Pemain "+(idx+1)} ${gameState.turn===idx?"🔥":""}</div>`;
    html += `<div class="hand-row">`;  // biar layout horizontal


    p.hand.forEach((c,i)=>{
  if (idx === playerIndex) {
    html += `<img src="/cards/BACK.svg" class="card-img back">`;
  } else {
    html += `<img src="/cards/BACK.svg" class="card-img back">`;
  }

  });


    html += `</div>`;
    slot.innerHTML = html;
  });
}

/* === RENDER KARTU TANGAN UTAMA (PALING BAWAH) === */
function renderHand() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";

  const me = gameState.players[playerIndex];

  me.hand.forEach((c,i)=>{
    const img = document.createElement("img");
    img.src = `/cards/${fileName(c)}`;
    img.className = "card-img";
    img.style.outline = selectedHand===i?"3px solid yellow":"none";
    img.onclick = ()=>selectHand(i);
    handDiv.appendChild(img);
  });
}

function renderCaptured(i, slotId) {
  const slot = document.getElementById(slotId);
  const p = gameState.players[i];

  if (!slot) return;
  slot.innerHTML = "";

  if (!p.captured || p.captured.length === 0) return;

  const title = document.createElement("div");
  title.innerText = "Menangkap:";
  slot.appendChild(title);

  const wrap = document.createElement("div");
  wrap.className = "cards";

  p.captured.forEach(c => {
    const img = document.createElement("img");
    img.src = `/cards/${fileName(c)}`;
    img.className = "card-img small";
    wrap.appendChild(img);
  });

  slot.appendChild(wrap);
}


/* === PILIH KARTU === */
function selectHand(i) {
  selectedHand = i;
  render();
}

/* === AMBIL KARTU MANUAL === */
function takeCardManually() {
  if (gameState.turn !== playerIndex) return;
  socket.emit("take-one",{ roomId, playerIndex });
}

/* === SKOR === */
function renderScore() {
  const list = document.getElementById("score");
  list.innerHTML = "";
  gameState.players.forEach((p,i)=>{
    const li = document.createElement("li");
    li.innerText = `Pemain ${i+1}: ${p.score}`;
    list.appendChild(li);
  });
}
