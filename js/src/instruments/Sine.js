var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , Instrument = require('../core').BaseInstrument


var Sine = module.exports = function(instrumentId) {
  Instrument.call(this, instrumentId)
}

_.extend(Sine.prototype, Instrument.prototype, {

  knownCommands: ['play'],

  load: function(done) { done() },

  command: function(name, args) {
    if (name === 'play') {
      var volEnvPoints = [[0, 0], [args[0], args[1]], [1, 0]]
        , pitchEnvPoints = [[0, 0], [args[2], args[3]], [1, 0]]
        , duration = 1 + args[4] * 10
        , currentTime = fields.sound.audioContext.currentTime
        , latency = 1 + Math.random()
        , self = this

      this.oscillatorNode = fields.sound.audioContext.createOscillator()
      this.oscillatorNode.type = ['triangle', 'sawtooth', 'sine']
        [Math.floor(Math.random() * 2.99)]
      //if (this.oscillatorNode.type === 'sine')
      this.oscillatorNode.connect(this.mixer)
      this.oscillatorNode.start(0)

      this.mixer.gain.cancelScheduledValues(0)
      this.mixer.gain.setValueAtTime(0, latency + currentTime)
      _.forEach(volEnvPoints, function(point) {
        self.mixer.gain.linearRampToValueAtTime(
          point[1], latency + currentTime + point[0] * duration)
      })
      
      this.oscillatorNode.frequency.cancelScheduledValues(0)
      this.oscillatorNode.frequency.setValueAtTime(440, latency + currentTime)
      _.forEach(pitchEnvPoints, function(point) {
        self.oscillatorNode.frequency.linearRampToValueAtTime(
          440 + 440 * point[1], latency + currentTime + point[0] * duration)
      })

      this.oscillatorNode.stop(latency + currentTime + duration)
    }
  }

})