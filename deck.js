const SUITS = ["♥","♦","♠","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck(removeFive = false){
  let deck = [];
  SUITS.forEach(s=>{
    VALUES.forEach(v=>{
      if(removeFive && v==="5") return;
      deck.push({ v, s });
    });
  });
  return deck;
}

function shuffle(deck){
  for(let i=deck.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
}

module.exports = { createDeck, shuffle };
