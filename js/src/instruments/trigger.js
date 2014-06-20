var _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , math = require('../utils/math')
  , base = require('./base')

exports.sound = function(instrumentId, url) {
  return new Sound(instrumentId, url)
}

var Sound = function(instrumentId, url) {
  base.BaseSound.apply(this)
  this.url = url
  this.instrumentId = instrumentId
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) self.buffer = buffer
      fields.log(self.instrumentId + ' loaded, ' 
        + 'buffer length :' + self.buffer.length)
      done(err)
    })       
  },

  _start: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.buffer
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  _stop: function() {},

  setParameter: function(param, args) {},

})

exports.controls = function(instrumentId, url) {
  return new Controls(instrumentId, url)
}

var Controls = function(instrumentId, url) {
  this.container = $('<div>', { class: 'instrument trigger' })
}

_.extend(Controls.prototype, base.BaseControls.prototype, {})