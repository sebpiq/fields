var _ = require('underscore')
  , waaUtils = require('../core/waa')
  , math = require('../core/math')
  , Instrument = require('../core/BaseInstrument')


module.exports = Instrument.extend({

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    this.url = args[0]
  },

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

  onStart: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.buffer
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  onStop: function() {}
  
})