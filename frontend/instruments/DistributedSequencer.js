var _ = require('underscore')
  , async = require('async')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')


// args : stepCount, tracks, tempo
module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {

    'sequence': ports.BasePort.extend({
      defaultValue: [],
      validate: function(args) {
        var sequence = []
          , t, s

        // Builds the looped buffer by adding all the active steps in the sequence 
        for (t = 0, s = 1; t < args.length; t+=2, s+=2)
          sequence.push([ args[t], args[s] ])
        
        // array with all active steps [[<track j>, <step i>], [<track k>, <step p>], ...]
        return _.sortBy(sequence, function(pair) { return pair[1] })
      }

    })

  }),

  init: function(args) {
    var self = this
    Instrument.prototype.init.apply(this, arguments)

    // Dirty hack to divide the track in several spaces
    this.divideSpace = null
    if(args[3]) {
      if (fields.sound.position.x < 0.5)
        if (fields.sound.position.y < 0.5)
          this.divideSpace = 0
        else 
          this.divideSpace = 1
      else 
        if (fields.sound.position.y < 0.5)
          this.divideSpace = 2
        else
          this.divideSpace = 3
    }

    this.stepCount = args[0]
    this.tracks = args[1]
    this.buffers = []

    this._setTempo(args[2])
    this.bufferNode = null

    this.ports['sequence'].on('value', function() {
      if (self.started) self._playSequence()
    })
  },

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

  onStart: function() {
    this._playSequence()
  },

  onStop: function() {
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
    _.forEach(self.ports['sequence'].value, function(beat) {
      var step = beat[1]
        , track = beat[0]
        , offset = self.samplesPerBeat * step
        , soundArray = self.buffers[track].getChannelData(0)
      if (self.divideSpace !== null && track !== self.divideSpace) return
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