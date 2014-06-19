var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , base = require('./base')

exports.sound = function(instrumentId) {
  var sound = new Sound()
  sound.instrumentId = instrumentId
  return sound
}

var Sound = function() {
  base.BaseSound.apply(this)
  var sampleCount = 44100
  this.noiseBuffer = fields.sound.audioContext.createBuffer(1, sampleCount, 44100)
  var noiseData = this.noiseBuffer.getChannelData(0)
    , i
  for (i = 0; i < sampleCount; i++) noiseData[i] = Math.random()
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) { done() },

  _start: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.noiseBuffer
    this.bufferNode.loop = true
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  _stop: function() {
    this.bufferNode.stop(0)
  },

  setParameter: function(param, args) {}

})

exports.controls = function(instrumentId) {
  return new Controls()
}

var Controls = function() {
  base.BaseControls.apply(this)
  this.container = $('<div>', { class: 'instrument whiteNoise' })
}

_.extend(Controls.prototype, base.BaseControls.prototype, {})