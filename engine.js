const { createDeck, shuffle } = require("./deck");
const { getRules } = require("./rules");
const { canPair } = require("./pairing");
const { totalScore } = require("./scoring");
const { createPlayers } = require("./gameState");

function startGame(playerCount) {
  const rules = getRules(playerCount);
  const deck = createDeck(rules.removeFive);
  shuffle(deck);

  const players = createPlayers(playerCount);

  // Bagi kartu ke tangan
  for (let i = 0; i < rules.hand; i++) {
    players.forEach(p => p.hand.push(deck.pop()));
  }

  // Buka kartu meja
  const table = [];
  for (let i = 0; i < rules.table; i++) {
    table.push(deck.pop());
  }

  return { players, table, deck, rules, turn: 0 };
}

function endGame(state) {
  state.players.forEach(p => {
    p.score = totalScore(p.captured);
  });
}

module.exports = { startGame, endGame };
