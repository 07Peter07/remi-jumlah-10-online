function createPlayers(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    hand: [],
    captured: [],
    score: 0
  }));
}

module.exports = { createPlayers };
