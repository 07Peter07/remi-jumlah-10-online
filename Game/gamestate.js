function createPlayers(count){
  return Array.from({length:count},(_,i)=>({
    id:i,
    hand:[],
    captured:[],
    score:0
  }));
}

module.exports = { createPlayers };
