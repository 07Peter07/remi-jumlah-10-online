console.log("CLIENT.JS LOADED");

const socket = io();

let playerIndex = null;
let gameState = null;
let selectedHand = null;

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

  const joinDiv = document.getElementById("join");
  const gameDiv = document.getElementById("game");

  if (!joinDiv || !gameDiv) {
    console.error("JOIN/GAME DIV NOT FOUND");
    return;
  }

  joinDiv.style.display = "none";
  gameDiv.style.display = "block";
});


socket.on("update", state => {
  console.log("UPDATE");
  gameState = state;
  render();
});

function render() {
  if (!gameState) return;
  if (!gameState.players[playerIndex]) return;

  // meja
  const tableDiv = document.getElementById("table");
  tableDiv.innerHTML = "";
  gameState.table.forEach(c => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;
    tableDiv.appendChild(el);
  });

  // tangan kamu
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  gameState.players[playerIndex].hand.forEach(c => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;
    handDiv.appendChild(el);
  });

  // skor
  const scores = document.getElementById("scores");
  scores.innerHTML = "";
  gameState.players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = `Pemain ${i + 1}: ${p.score} poin`;
    scores.appendChild(li);
  });

  // status menang/kalah
  const status = document.getElementById("status");
  if (gameState.gameOver) {
    status.innerText =
      gameState.players[playerIndex].id === gameState.winner
        ? "🎉 KAMU MENANG!"
        : "😢 KAMU KALAH";
  }
}



