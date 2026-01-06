function getRules(playerCount) {
  if (playerCount === 4) {
    return {
      hand: 5,
      table: 8,
      removeFive: true,
      target: 50
    };
  }

  if (playerCount === 3) {
    return {
      hand: 7,
      table: 10,
      removeFive: false,
      target: 70
    };
  }

  if (playerCount === 2) {
    return {
      hand: 10,
      table: 12,
      removeFive: false,
      target: 105
    };
  }

  throw new Error("Jumlah pemain tidak valid");
}

module.exports = { getRules };
