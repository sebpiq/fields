var _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , math = require('../utils/math')
  , base = require('./base')

var paramList = ['volume']

exports.sound = function(instrumentId, url) {
  return new Sound(instrumentId, url)
}

var Sound = function(instrumentId, url) {
  base.BaseSound.call(this, instrumentId)
  this.url = url
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, ' 
          + 'buffer length :' + self.buffer.length)
        self.restoreParams(paramList)
      }
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
  base.BaseControls.call(this, instrumentId)
  this.container = $('<div>', { class: 'instrument trigger' })
}

_.extend(Controls.prototype, base.BaseControls.prototype, {

  load: function(done) {
    this.restoreParams(paramList)
    done()
  }

})