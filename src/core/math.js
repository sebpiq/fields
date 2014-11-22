exports.pickVal = function(mean, variance) {
  return mean + mean * variance * (1 - 2 * Math.random())
}

exports.floor = function(val, dec) {
  return Math.floor(val * Math.pow(10, dec)) / Math.pow(10, dec) 
}

exports.valExp = function(val, exp) {
  exp = exp || 2
  return (Math.exp(val * exp) - Math.exp(0)) / (Math.exp(exp) - Math.exp(0))
}
