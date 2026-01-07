console.log("CLIENT.JS LOADED");

const socket = io();

let playerIndex = null;
let gameState = null;

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

function join() {
  const roomId = document.getElementById("room").value;
  const players = Number(
    document.getElementById("players").value
  );

  console.log("JOIN:", roomId, players);

  socket.emit("join-room", {
    roomId,
    players
  });
}

socket.on("joined", data => {
  console.log("JOINED:", data);

  playerIndex = data.playerIndex;

  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";
});

socket.on("update", state => {
  console.log("UPDATE");
  gameState = state;
  render();
});

function render() {
  if (!gameState) return;
  if (!gameState.players || !gameState.players[playerIndex]) return;

  const tableDiv = document.getElementById("table");
  const handDiv = document.getElementById("hand");

  // ===== MEJA =====
  tableDiv.innerHTML = "";
  gameState.table.forEach(c => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;
    tableDiv.appendChild(el);
  });

  // ===== TANGAN PEMAIN SENDIRI =====
  handDiv.innerHTML = "";
  gameState.players[playerIndex].hand.forEach(c => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;
    handDiv.appendChild(el);
  });
}
