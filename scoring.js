function scoreCard(card) {
  if (!["♥","♦"].includes(card.suit)) return 0;
  if (card.rank === "A") return 20;
  if (card.rank === "9") return 10;
  if (["K","Q","J","10"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function totalScore(cards) {
  return cards.reduce((sum, c) => sum + scoreCard(c), 0);
}

module.exports = { totalScore };
