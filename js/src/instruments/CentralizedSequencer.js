var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , Instrument = require('../core').BaseInstrument

var CentralizedSequencer = module.exports = function(instrumentId, args) {
  Instrument.call(this, instrumentId)

  var tracks = args[1]
  // Picks one track randomly
  this.trackId = rhizome.userId % tracks.length
  this.soundUrl = tracks[this.trackId]
  this.buffer = null
  this.bufferNode = null
}

_.extend(CentralizedSequencer.prototype, Instrument.prototype, {

  knownCommands: ['state', 'volume'],

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.soundUrl, function(err, buffer) {
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, track ' +  self.trackId 
          + ' buffer length :' + self.buffer.length)
        self.restore()
      }
      done(err)
    })
  },

  command: function(name, args) {
    if (Instrument.prototype.command.call(this, name, args)) return
    if (name === 'note') {
      if (args[0] === this.trackId && this.started) {
        this.bufferNode = audioContext.createBufferSource()
        this.bufferNode.connect(this.mixer)
        this.bufferNode.buffer = this.buffer
        this.bufferNode.start(0)
      } 
    }
  }

})