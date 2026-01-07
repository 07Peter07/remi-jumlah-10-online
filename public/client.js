console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
let playerIndex = null;
let gameState = null;

function join() {
  roomId = document.getElementById("room").value;

  socket.emit("join-room", {
    roomId,
    players: 3
  });
}

socket.on("joined", ({ playerIndex: p, state }) => {
  playerIndex = p;
  gameState = state;

  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";

  render();
});

socket.on("update", state => {
  gameState = state;
  render();
});

function render() {
  if (!gameState) return;

  let html = "<h3>Meja</h3>";
  gameState.table.forEach(c => {
    html += `<span class="card">${c.v}${c.s}</span>`;
  });

  gameState.players.forEach((p, i) => {
    html += `<h4>Pemain ${i + 1}</h4>`;
    p.hand.forEach(c => {
      html += `<span class="card">${c.v}${c.s}</span>`;
    });
  });

  document.getElementById("game").innerHTML = html;
}
