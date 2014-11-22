var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')


var WhiteNoise = module.exports = function(instrumentId, args) {
  Instrument.call(this, instrumentId)
  var sampleCount = 44100
  this.noiseBuffer = fields.sound.audioContext.createBuffer(1, sampleCount, 44100)
  var noiseData = this.noiseBuffer.getChannelData(0)
    , i
  for (i = 0; i < sampleCount; i++) noiseData[i] = Math.random()
}


_.extend(WhiteNoise.prototype, Instrument.prototype, {

  knownCommands: ['state', 'volume'],

  load: function(done) {
    this.restore()
    done()
  },

  _start: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.noiseBuffer
    this.bufferNode.loop = true
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  _stop: function() {
    this.bufferNode.stop(0)
  }

})