function getRules(players){
  if(players===4){
    return { hand:5, table:8, target:50, removeFive:true };
  }
  if(players===2){
    return { hand:10, table:12, target:105, removeFive:false };
  }
  return { hand:7, table:10, target:70, removeFive:false };
}

module.exports = { getRules };
