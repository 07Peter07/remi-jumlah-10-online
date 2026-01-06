function totalScore(cards){
  let score=0;
  cards.forEach(c=>{
    if(!["♥","♦"].includes(c.s)) return;
    if(c.v==="A") score+=20;
    else if(c.v==="9") score+=10;
    else if(["J","Q","K"].includes(c.v)) score+=10;
    else score+=parseInt(c.v);
  });
  return score;
}

module.exports = { totalScore };
