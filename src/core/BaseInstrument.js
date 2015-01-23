var _ = require('underscore')
  , math = require('./math')

var BaseInstrument = module.exports = function(instrumentId, args) {
  this.mixer = fields.sound.audioContext.createGain()
  this.mixer.gain.value = 0
  this.mixer.connect(fields.sound.audioContext.destination)

  this.started = false
  this.instrumentId = instrumentId
}

_.extend(BaseInstrument.prototype, {

  knownCommands: ['state', 'volume'],

  start: function() {
    if (this.started === false) {
      this.started = true
      this._start()
    }
  },

  stop: function() {
    if (this.started === true) {
      this.started = false
      this._stop()
    }
  },

  load: function(done) {},

  restore: function() {
    var self = this
    _.forEach(this.knownCommands, function(command) {
      rhizome.send('/sys/resend', ['/' + self.instrumentId + '/' + command])
    })
  },

  // This returns `true` if the command has been handled, `false` otherwise
  command: function(name, args) {
    if (name === 'state') {
      var state = args[0]
      if (state === 0) this.stop()
      else if (state === 1) this.start()
      return true
    } else if (name === 'volume') {
      this.mixer.gain.setTargetAtTime(math.valExp(args[0], 2.5), 0, 0.3)
      return true
    }
    return false
  },

  _start: function() {},
  _stop: function() {},

})