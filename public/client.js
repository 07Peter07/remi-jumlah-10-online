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
  if (!gameState.players || !gameState.players[playerIndex]) return;

  const tableDiv = document.getElementById("table");
  const handDiv = document.getElementById("hand");

  tableDiv.innerHTML = "";
  gameState.table.forEach((c, tableIndex) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;
    tableDiv.appendChild(el);
  });

  handDiv.innerHTML = "";
  gameState.players[playerIndex].hand.forEach((c, handIndex) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerText = c.v + c.s;

    // 🔥 INI KUNCI POP UP
    if (selectedHand === handIndex) {
      el.classList.add("selected");
    }

    el.onclick = () => {
      console.log("KLIK KARTU TANGAN:", handIndex);
      selectedHand = handIndex;
      render(); // ⬅️ WAJIB
    };

    handDiv.appendChild(el);
  });
}


console.log("STATE:", gameState.players.map(p => p.score));


  // status menang/kalah
  const status = document.getElementById("status");
  if (gameState.gameOver) {
    status.innerText =
      gameState.players[playerIndex].id === gameState.winner
        ? "🎉 KAMU MENANG!"
        : "😢 KAMU KALAH";
  }




