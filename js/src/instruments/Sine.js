var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , Instrument = require('../core').BaseInstrument


var Sine = module.exports = function(instrumentId) {
  Instrument.call(this, instrumentId)
  self.f0 = 500
}

_.extend(Sine.prototype, Instrument.prototype, {

  knownCommands: ['play', 'volume', 'f0'],

  load: function(done) {
    this.envGain = fields.sound.audioContext.createGain()
    this.envGain.connect(this.mixer)
    this.envGain.gain.value = 0.05

    this.oscillatorNode = fields.sound.audioContext.createOscillator()
    this.oscillatorNode.type = 'sawtooth'
    this.oscillatorNode.connect(this.envGain)
    this.oscillatorNode.start(0)
    done()
  },

  command: function(name, args) {
    if (Instrument.prototype.command.call(this, name, args)) return

    if (name === 'play') {
      var volEnvPoints = [[0, 0.05], [args[0], args[1]], [1, 0.05]]
        , pitchEnvPoints = [[0, 0], [args[2], args[3]], [1, 0]]
        , duration = 1 + args[4] * 10
        , currentTime = fields.sound.audioContext.currentTime
        , latency = 1 + Math.random() * 3
        , self = this

      this.envGain.gain.cancelScheduledValues(0)
      this.envGain.gain.setValueAtTime(0, latency + currentTime)
      _.forEach(volEnvPoints, function(point) {
        self.envGain.gain.linearRampToValueAtTime(
          point[1], latency + currentTime + point[0] * duration)
      })
      
      this.oscillatorNode.frequency.cancelScheduledValues(0)
      this.oscillatorNode.frequency.setValueAtTime(self.f0, latency + currentTime)
      _.forEach(pitchEnvPoints, function(point) {
        self.oscillatorNode.frequency.linearRampToValueAtTime(
          self.f0 + self.f0 * point[1], latency + currentTime + point[0] * duration)
      })

      //this.oscillatorNode.stop(latency + currentTime + duration)
    } else if (name === 'f0') {
      this.f0 = 500 + args[0] * 3000
      this.oscillatorNode.frequency.setValueAtTime(this.f0, 
        fields.sound.audioContext.currentTime + 1)
    }
  }

})