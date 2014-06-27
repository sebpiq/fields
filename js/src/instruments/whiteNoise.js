var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , base = require('./base')

var paramList = ['volume', 'state']

exports.sound = function(instrumentId) {
  var sound = new Sound(instrumentId)
  return sound
}

var Sound = function(instrumentId) {
  base.BaseSound.call(this, instrumentId)
  var sampleCount = 44100
  this.noiseBuffer = fields.sound.audioContext.createBuffer(1, sampleCount, 44100)
  var noiseData = this.noiseBuffer.getChannelData(0)
    , i
  for (i = 0; i < sampleCount; i++) noiseData[i] = Math.random()
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    this.restoreParams(paramList)
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
  },

  restore: function() {
    this.restoreParams(paramList)
  },
  
  setParameter: function(param, args) {}

})

exports.controls = function(instrumentId) {
  return new Controls(instrumentId)
}

var Controls = function(instrumentId) {
  base.BaseControls.call(this, instrumentId)
}

_.extend(Controls.prototype, base.BaseControls.prototype, {

  cssClass: 'whiteNoise',

  load: function(done) {
    this.restoreParams(paramList)
    done()
  }

})