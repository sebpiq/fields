var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , Instrument = require('../core').BaseInstrument


var ChangingNotes = module.exports = function(instrumentId) {
  Instrument.call(this, instrumentId)
}

_.extend(ChangingNotes.prototype, Instrument.prototype, {

  knownCommands: ['volume', 'state'],

  load: function(done) {
    this.restore()
    done()
  },

  command: function(name, args) {
    if (Instrument.prototype.command.call(this, name, args)) return
    if (name === 'curve') {
      var curve = args[0]
            
    }
  },

  _start: function() {
    this.envNode = fields.sound.audioContext.createGain()
    this.envNode.gain.value = 0
    this.envNode.connect(this.mixer)
    this.oscillatorNode = fields.sound.audioContext.createOscillator()
    this.oscillatorNode.connect(this.envNode)
    this.oscillatorNode.start(0)
  },

  _stop: function() {
    this.envNode.disconnect()
    this.oscillatorNode.stop(0)
    this.oscillatorNode.disconnect()
  }

})