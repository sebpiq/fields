var _ = require('underscore')
  , waaUtils = require('../core/waa')
  , math = require('../core/math')
  , Instrument = require('../core/BaseInstrument')


var Trigger = module.exports = function(instrumentId, args) {
  Instrument.call(this, instrumentId)
  this.url = args[0]
}

_.extend(Trigger.prototype, Instrument.prototype, {

  knownCommands: ['volume'],

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, ' 
          + 'buffer length :' + self.buffer.length)
      }
      done(err)
      self.mixer.gain.value = 1
    })       
  },

  _start: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.buffer
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  _stop: function() {}
  
})