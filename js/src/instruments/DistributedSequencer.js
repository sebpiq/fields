var _ = require('underscore')
  , async = require('async')
  , waaUtils = require('../utils/waa')
  , Instrument = require('../core').BaseInstrument

// args : stepCount, tracks, tempo
var DistributedSequencer = module.exports = function(instrumentId, args) {
  Instrument.call(this, instrumentId)

  this.stepCount = args[0]
  this.tracks = args[1]
  this.buffers = []

  this._setTempo(args[2])
  this.sequence = []
  this.bufferNode = null
}

_.extend(DistributedSequencer.prototype, Instrument.prototype, {

  knownCommands: ['volume', 'sequence', 'state'],

  load: function(done) {
    var self = this
    async.map(this.tracks, waaUtils.loadBuffer, function(err, buffers) {
      if (!err) {
        self.buffers = buffers
        fields.log(self.instrumentId + ' loaded, tempo ' +  self.tempo)
        self.restore()
      }
      done(err)
    })
  },

  command: function(name, args) {
    if (Instrument.prototype.command.call(this, name, args)) return

    if (name === 'sequence') {
      var sequence = []
        , t, s

      // Builds the looped buffer by adding all the active steps in the sequence 
      for (t = 0, s = 1; t < args.length; t+=2, s+=2)
        sequence.push([ args[t], args[s] ])
      
      // array with all active steps [[<track j>, <step i>], [<track k>, <step p>], ...]
      this.sequence = _.sortBy(sequence, function(pair) { return pair[1] })
      if (this.started) this._playSequence()

    } else if (name === 'tempo') {
      this._setTempo(args[0])
      if (this.started) this._playSequence()
    }
  },

  _start: function() {
    this._playSequence()
  },

  _stop: function() {
    this.bufferNode.stop(0)
    this.bufferNode = null
  },

  _setTempo: function(tempo) {
    this.tempo = tempo
    this.beatDurInSec = 60 / tempo
    this.samplesPerBeat = this.beatDurInSec * fields.sound.audioContext.sampleRate
    this.samplesPerLoop = this.samplesPerBeat * this.stepCount
  },

  _playSequence: function() {
    var self = this
      , loopBuffer = fields.sound.audioContext.createBuffer(1,
          this.samplesPerLoop, fields.sound.audioContext.sampleRate)
      , loopArray = loopBuffer.getChannelData(0)
      , t, s

    // Builds the looped buffer by adding all the active steps in the sequence 
    _.forEach(this.sequence, function(beat) {
      var step = beat[1]
        , track = beat[0]
        , offset = self.samplesPerBeat * step
        , soundArray = self.buffers[track].getChannelData(0)
      if ((offset + soundArray.length) >= loopArray.length)
        subarray = soundArray.subarray(0, loopArray.length - offset)
      else subarray = soundArray
      loopArray.set(subarray, offset)
    })

    // Create the buffer node
    if (this.bufferNode) this.bufferNode.stop(0)
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.connect(this.mixer)
    this.bufferNode.loop = true
    this.bufferNode.buffer = loopBuffer
    this.bufferNode.start(0)
  }

})