var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')

module.exports = Instrument.extend({

  portDefinitions: _.extend({}, _.pick(Instrument.prototype.portDefinitions, ['volume']), {
    
    'play': ports.BasePort.extend({
      validate: function(args) {
        return [args]
      },
      onValue: function(args) {
        var volEnvPoints = [[0, 0.05], [args[0], args[1]], [1, 0.05]]
          , pitchEnvPoints = [[0, 0], [args[2], args[3]], [1, 0]]
          , duration = 1 + args[4] * 10
          , currentTime = fields.sound.audioContext.currentTime
          , latency = 1 + Math.random() * 3
          , instrument = this.instrument

        instrument.envGain.gain.cancelScheduledValues(0)
        instrument.envGain.gain.setValueAtTime(0, latency + currentTime)
        _.forEach(volEnvPoints, function(point) {
          instrument.envGain.gain.linearRampToValueAtTime(
            point[1], latency + currentTime + point[0] * duration)
        })
        
        instrument.oscillatorNode.frequency.cancelScheduledValues(0)
        instrument.oscillatorNode.frequency.setValueAtTime(instrument.f0, latency + currentTime)
        _.forEach(pitchEnvPoints, function(point) {
          instrument.oscillatorNode.frequency.linearRampToValueAtTime(
            instrument.f0 + instrument.f0 * point[1], latency + currentTime + point[0] * duration)
        })
      }
    }),

    'f0': ports.NumberPort.extend({
      onValue: function(f0) {
        this.instrument.f0 = 500 + f0 * 3000
        this.instrument.oscillatorNode.frequency.setValueAtTime(
          this.instrument.f0, fields.sound.audioContext.currentTime + 1)
      }
    })

  }),

  init: function(args) {
    this.f0 = 500
  },

  load: function(done) {
    this.envGain = fields.sound.audioContext.createGain()
    this.envGain.connect(this.mixer)
    this.envGain.gain.value = 0.05

    this.oscillatorNode = fields.sound.audioContext.createOscillator()
    this.oscillatorNode.type = 'sawtooth'
    this.oscillatorNode.connect(this.envGain)
    this.oscillatorNode.start(0)
    done()
  }

})