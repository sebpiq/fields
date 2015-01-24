var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , math = require('../core/math')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')

module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {
    
    'duration': ports.NumberPort.extend({
      mapping: function(inVal) {
        return Math.max(inVal * 4, 0.1)
      },
      onValue: function(duration) {
        this.instrument.duration = duration
        if (this.instrument.started)
          this.instrument.refreshEnvelope()
      }
    }),

    'width': ports.NumberPort.extend({
      onValue: function(width) {
        this.instrument.width = width
        if (this.instrument.started)
          this.instrument.refreshEnvelope()
      }
    }),

    'Q': ports.NumberPort.extend({
      mapping: function(inVal) {
        return math.valExp(inVal, 2.5) * 30
      },
      onValue: function(Q) {
        if (this.instrument.started)
          this.instrument.filterNode.Q.linearRampToValueAtTime(
            Q, fields.sound.audioContext.currentTime + 0.05)
      }
    }),

    'frequency': ports.NumberPort.extend({
      mapping: function(inVal) {
        return math.valExp(inVal, 2.5) * 5000
      },
      onValue: function(frequency) {
        if (this.instrument.started)
          this.instrument.filterNode.frequency.linearRampToValueAtTime(
            frequency, fields.sound.audioContext.currentTime + 0.05)
      }
    })
  }),

  init: function(args) {
    var frameCount = fields.sound.audioContext.sampleRate * 3
    this.duration = 1
    this.width = 0
    this.noiseBuffer = fields.sound.audioContext.createBuffer(1, frameCount, fields.sound.audioContext.sampleRate)
    var noiseData = this.noiseBuffer.getChannelData(0)
    for (var i = 0; i < frameCount; i++) noiseData[i] = Math.random()
  },

  load: function(done) {
    this.restore()
    done()
  },

  onStart: function() {
    this.noiseNode = fields.sound.audioContext.createBufferSource()
    this.noiseNode.buffer = this.noiseBuffer
    this.noiseNode.loop = true
    this.filterNode = fields.sound.audioContext.createBiquadFilter()
    this.envelopeGainNode = fields.sound.audioContext.createGain()
    this.refreshEnvelope()
    
    this.noiseNode.connect(this.filterNode)
    this.filterNode.connect(this.envelopeGainNode)
    this.envelopeGainNode.gain.value = 0
    this.envelopeGainNode.connect(this.mixer)

    this.noiseNode.start(0)
  },

  onStop: function() {
    this.noiseNode.stop(0)
    this.envelopeNode.stop(0)
  },

  refreshEnvelope: function() {
    if (this.envelopeNode) this.envelopeNode.disconnect()
    this.envelopeNode = fields.sound.audioContext.createBufferSource()
    var frameCount = this.duration * fields.sound.audioContext.sampleRate
      , envelopeBuffer = fields.sound.audioContext.createBuffer(1, frameCount, fields.sound.audioContext.sampleRate)
      , envelopeData = envelopeBuffer.getChannelData(0)
      , widthFrameCount = frameCount * this.width
    for (var i = 0; i < widthFrameCount; i++)
      envelopeData[i] = 1

    this.envelopeNode.loop = true
    this.envelopeNode.buffer = envelopeBuffer
    this.envelopeNode.start(0)
    this.envelopeNode.connect(this.envelopeGainNode.gain)
  }

})