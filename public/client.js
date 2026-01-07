console.log("CLIENT.JS LOADED");

const socket = io();

let roomId = "";
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
  gameState = data.state;

  document.getElementById("join").style.display = "none";
  document.getElementById("game").style.display = "block";

  render();
});

socket.on("update", state => {
  console.log("UPDATE");
  gameState = state;
  render();
});

function render() {
  if (!gameState) return;

  let html = "<h3>Meja</h3>";
  gameState.table.forEach(c => {
    html += `<span class="card">${c.v}${c.s}</span>`;
  });

  html += "<hr>";

  gameState.players.forEach((p, i) => {
    html += `<h4>Pemain ${i + 1}</h4>`;
    p.hand.forEach(c => {
      html += `<span class="card">${c.v}${c.s}</span>`;
    });
  });

  document.getElementById("game").innerHTML = html;
}
