var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')


module.exports = Instrument.extend({

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    var sampleCount = 44100
    this.noiseBuffer = fields.sound.audioContext.createBuffer(1, sampleCount, 44100)
    var noiseData = this.noiseBuffer.getChannelData(0)
    for (var i = 0; i < sampleCount; i++) noiseData[i] = Math.random()
  },

  load: function(done) {
    this.restore()
    done()
  },

  onStart: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.noiseBuffer
    this.bufferNode.loop = true
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  onStop: function() {
    this.bufferNode.stop(0)
  }

})