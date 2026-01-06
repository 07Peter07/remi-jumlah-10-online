function cardValue(card) {
  if (["K","Q","J","10"].includes(card.rank)) return 10;
  if (card.rank === "A") return 1;
  return parseInt(card.rank);
}

function mustSame(card) {
  return ["K","Q","J","10","5"].includes(card.rank);
}

function canPair(hand, table) {
  if (mustSame(hand) || mustSame(table)) {
    return hand.rank === table.rank;
  }
  return cardValue(hand) + cardValue(table) === 10;
}

module.exports = { canPair };
