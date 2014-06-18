var async = require('async')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')


exports.sound = function(instrumentId, stepCount, tracks, tempo) {
  var sound = new Sound(stepCount, tracks, tempo)
  sound.instrumentId = instrumentId
  return sound
}


var Sound = function(stepCount, tracks, tempo) {
  this.stepCount = stepCount
  this.tracks = tracks
  this.buffers = []

  this._setTempo(tempo)
  this.sequence = []
  this.bufferNode = null
  this.started = false
}

_.extend(Sound.prototype, {

  load: function(done) {
    var self = this
    async.map(this.tracks, waaUtils.loadBuffer, function(err, buffers) {
      if (!err) {
        self.buffers = buffers
        fields.log(self.instrumentId + ' loaded, tempo ' +  self.tempo)
      }
      done(err)
    })
  },

  start: function() {
    this.started = true
    this._playSequence()
  },

  stop: function() {
    this.started = false
    this.bufferNode.stop(0)
    this.bufferNode = null
  },

  setParameter: function(param, args) {
    if (param === 'sequence') {
      var sequence = []
        , t, s

      // Builds the looped buffer by adding all the active steps in the sequence 
      for (t = 0, s = 1; t < args.length; t+=2, s+=2)
        sequence.push([ args[t], args[s] ])
      
      // array with all active steps [[<track j>, <step i>], [<track k>, <step p>], ...]
      this.sequence = _.sortBy(sequence, function(pair) { return pair[1] })
      if (this.started) this._playSequence()

    } else if (param === 'tempo') {
      this._setTempo(args[0])
      if (this.started) this._playSequence()
    }
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
    this.bufferNode.connect(fields.sound.audioContext.destination)
    this.bufferNode.loop = true
    this.bufferNode.buffer = loopBuffer
    this.bufferNode.start(0)
  }

})


exports.controls = function(instrumentId, stepCount, tracks) {
  var trackCount = tracks.length
    , container = $('<div>', { class: 'instrument distributedSequencer' }).appendTo('body')
    , sendButton = $('<button>', { class: 'sendButton' }).appendTo(container).html('Send')
    , grid = widgets.grid(container, 'toggle', tracks.length, stepCount)
  
  sendButton.click(function() {
    var sequence = []
    grid.find('.track').each(function(i, track) {
      $(track).find('.step').each(function(j, step) {
        if ($(step).hasClass('active')) {
          sequence.push(i)
          sequence.push(j)
        }
      })
    })
    rhizome.send('/' + instrumentId + '/sequence', sequence)
  })

  return container
}