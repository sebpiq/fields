var _ = require('underscore')
  , math = require('./math')
  , utils = require('./utils')
  , ports = require('./ports')

// -------------------- Instruments -------------------- // 
var BaseInstrument = module.exports = function(instrumentId, args) {
  var self = this
  this.mixer = fields.sound.audioContext.createGain()
  this.mixer.gain.value = 0
  this.mixer.connect(fields.sound.audioContext.destination)

  this.started = false
  this.instrumentId = instrumentId

  this.ports = {}
  Object.keys(this.portDefinitions).forEach(function(subpath) {
    var portClass = self.portDefinitions[subpath]
    self.ports[subpath] = new portClass(self, subpath)
  })
  this.init(args)
}
BaseInstrument.extend = utils.chainExtend

_.extend(BaseInstrument.prototype, {

  init: function(args) {},

  portDefinitions: {

    'volume': ports.NumberPort.extend({
      mapping: function(inVal) {
        return math.valExp(inVal, 2.5)
      },
      onValue: function(vol) {
        this.instrument.mixer.gain.setTargetAtTime(vol, 0, 0.3)
      }
    }),

    'state': ports.TogglePort.extend({
      onValue: function(isOn) {
        if (isOn) this.instrument.start()
        else this.instrument.stop()
      }
    })

  },

  start: function() {
    if (this.started === false) {
      this.started = true
      this.onStart()
    }
  },

  stop: function() {
    if (this.started === true) {
      this.started = false
      this.onStop()
    }
  },

  load: function(done) {},

  receive: function(subpath, args) {
    if (!this.ports.hasOwnProperty(subpath))
      return console.error('unknown port "' + subpath + '" for "' + this.instrumentId + '"')
    this.ports[subpath].receive(args)
  },

  restore: function() {
    _.values(this.ports).forEach(function(port) { port.restore() })
  },

  onStart: function() {},
  onStop: function() {}
})