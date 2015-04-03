/*module.exports = {
  'Midi Fighter Twister 20:0': {
    176: {
      48: { address: '/noise/volume', mapping: function(value) { return value / 127 } },

      52: { address: '/osc/volume', mapping: function(value) { return value / 127 } },
      53: { address: '/osc/carrierFreq', mapping: function(value) { return value / 127 }},
      54: { address: '/osc/freqModFreq', mapping: function(value) { return value / 127 }},
      55: { address: '/osc/freqModAmount', mapping: function(value) { return value / 127 }},
      56: { address: '/osc/ampModFreq', mapping: function(value) { return value / 127 }},
      57: { address: '/osc/ampModAmount', mapping: function(value) { return value / 127 }}
    },
    177: {
      48: { address: '/noise/state', mapping: function(value) { return 1 } },
      49: { address: '/noise/state', mapping: function(value) { return 0 } },

      52: { address: '/osc/state', mapping: function(value) { return 1 } },
      53: { address: '/osc/state', mapping: function(value) { return 0 } }
    }
  }
}*/

module.exports = {
  'Midi Fighter Twister 20:0': {
    177: {
      0: { address: '/osc/state', mapping: function(value) { return 1 } },
      1: { address: '/osc/state', mapping: function(value) { return 0 } },
      2: { address: '/delays/state', mapping: function(value) { return 1 } },
      3: { address: '/delays/state', mapping: function(value) { return 0 } }
    },
    176: {
      0: { address: '/osc/volume', mapping: function(value) { return value / 127 } },
      1: { address: '/osc/frequency', mapping: function(value) { return 100 + value * 10 } },
      2: { address: '/delays/volume', mapping: function(value) { return value / 127 } },
    }
  }
}


var pickVal = function(mean, variance) {
  return mean + mean * variance * (1 - 2 * Math.random())
}

var floor = function(val, dec) {
  return Math.floor(val * Math.pow(10, dec)) / Math.pow(10, dec) 
}

var valExp = function(val, exp) {
  exp = exp || 2
  return (Math.exp(val * exp) - Math.exp(0)) / (Math.exp(exp) - Math.exp(0))
}
