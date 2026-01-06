function canPair(a,b){
  const special = ["K","Q","J","10","5"];
  if(special.includes(a.v)) return a.v===b.v;

  const val = c => c.v==="A"?1:parseInt(c.v);
  return val(a)+val(b)===10;
}

module.exports = { canPair };

