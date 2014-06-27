var _ = require('underscore')
  , async = require('async')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , base = require('./base')

var paramList = ['volume', 'sequence', 'state']

exports.sound = function(instrumentId, stepCount, tracks, tempo) {
  var sound = new Sound(instrumentId, stepCount, tracks, tempo)
  return sound
}

var Sound = function(instrumentId, stepCount, tracks, tempo) {
  base.BaseSound.call(this, instrumentId)

  this.stepCount = stepCount
  this.tracks = tracks
  this.buffers = []

  this._setTempo(tempo)
  this.sequence = []
  this.bufferNode = null
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    async.map(this.tracks, waaUtils.loadBuffer, function(err, buffers) {
      if (!err) {
        self.buffers = buffers
        fields.log(self.instrumentId + ' loaded, tempo ' +  self.tempo)
        self.restore(paramList)
      }
      done(err)
    })
  },

  _start: function() {
    this._playSequence()
  },

  _stop: function() {
    this.bufferNode.stop(0)
    this.bufferNode = null
  },

  restore: function() {
    this.restoreParams(paramList)
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
    this.bufferNode.connect(this.mixer)
    this.bufferNode.loop = true
    this.bufferNode.buffer = loopBuffer
    this.bufferNode.start(0)
  }

})

exports.controls = function(instrumentId, stepCount, tracks) {
  return new Controls(instrumentId, stepCount, tracks)
}

var Controls = function(instrumentId, stepCount, tracks) {
  base.BaseControls.call(this, instrumentId)
  this.stepCount = stepCount
  this.tracks = tracks

  var self = this
    , trackCount = tracks.length
    , container = $('<div>', { class: 'instrument distributedSequencer' })

  this.grid = new widgets.Grid('toggle', tracks.length, stepCount)
  this.grid.elem.prependTo(container)

  $('<button>', { class: 'sendButton' })
      .appendTo(this.grid.elem.find('.buttonsContainer')).html('Send')
      .click(function() {
        rhizome.send('/' + instrumentId + '/sequence', self.grid.getSequence())
      })

  this.container = container

}

_.extend(Controls.prototype, base.BaseControls.prototype, {

  setParameter: function(param, args) {
    if (param === 'sequence') this.grid.setSequence(args)
    else fields.log('distributedSequencer unknown parameter ' + param)
  },

  load: function(done) {
    this.restoreParams(paramList)
    done()
  }

})