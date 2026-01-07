console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;
let selectedHand = null;

/* =====================
   SOCKET CONNECT
===================== */
socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

/* =====================
   JOIN ROOM
===================== */
function join() {
  roomId = document.getElementById("room").value;
  const players = Number(document.getElementById("players").value);

  console.log("JOIN:", roomId, players);

  socket.emit("join-room", { roomId, players });
}

socket.on("joined", data => {
  console.log("JOINED:", data);

  playerIndex = data.playerIndex;

  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";
});

/* =====================
   UPDATE STATE
===================== */
socket.on("update", state => {
  console.log("UPDATE");
  gameState = state;
  render();
});

/* =====================
   RENDER UI
===================== */
function render() {
  if (!gameState) return;
  if (!gameState.players || !gameState.players[playerIndex]) return;

  const tableDiv = document.getElementById("table");
  const handDiv = document.getElementById("hand");
  const scoreDiv = document.getElementById("score");

  if (!tableDiv || !handDiv || !scoreDiv) {
    console.error("DOM NOT READY");
    return;
  }

  /* ===== MEJA ===== */
  tableDiv.innerHTML = "";
  gameState.table.forEach((c, tableIndex) => {
    const el = document.createElement("div");
    el.className = "card table";
    el.innerText = c.v + c.s;

    el.onclick = () => {
      console.log("KLIK MEJA:", tableIndex);

      if (selectedHand === null) {
        console.log("❌ PILIH KARTU TANGAN DULU");
        return;
      }

      if (gameState.turn !== playerIndex) {
        console.log("❌ BUKAN GILIRANMU");
        return;
      }

      console.log("✅ PLAY:", selectedHand, tableIndex);

      socket.emit("play", {
        roomId,
        playerIndex,
        handIndex: selectedHand,
        tableIndex
      });

      selectedHand = null;
    };

    tableDiv.appendChild(el);
  });

  /* ===== TANGAN ===== */
  handDiv.innerHTML = "";
  gameState.players[playerIndex].hand.forEach((c, handIndex) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;

    if (selectedHand === handIndex) {
      el.classList.add("selected");
    }

    el.onclick = () => {
      console.log("KLIK TANGAN:", handIndex);
      selectedHand = handIndex;
      render();
    };

    handDiv.appendChild(el);
  });

  /* ===== SKOR ===== */
  scoreDiv.innerHTML = "";
  gameState.players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = `Pemain ${i + 1}: ${p.score || 0} poin`;
    scoreDiv.appendChild(li);
  });
}
