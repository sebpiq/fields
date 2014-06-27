var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , base = require('./base')

var paramList = ['volume', 'state']

exports.sound = function(instrumentId, stepCount, tracks) {
  var sound = new Sound(instrumentId, stepCount, tracks)
  return sound
}

var Sound = function(instrumentId, stepCount, tracks) {
  base.BaseSound.call(this, instrumentId)

  // Picks one track randomly
  this.trackId = rhizome.userId % tracks.length
  this.soundUrl = tracks[this.trackId]
  this.buffer = null
  this.bufferNode = null
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

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

  setParameter: function(param, args) {
    if (param === 'note') {
      if (args[0] === this.trackId && this.started) {
        this.bufferNode = audioContext.createBufferSource()
        this.bufferNode.connect(this.mixer)
        this.bufferNode.buffer = this.buffer
        this.bufferNode.start(0)
      } 
    }
  },

  restore: function() {
    this.restoreParams(paramList)
  }

})

exports.controls = function(instrumentId, stepCount, tracks) {
  return new Controls(instrumentId, stepCount, tracks)
}

var Controls = function(instrumentId, stepCount, tracks) {
  base.BaseControls.call(this, instrumentId)
  this.trackCount = tracks.length
  this.tracks = tracks
  this.stepCount = stepCount
  this.container = $('<div>', { class: 'instrument centralizedSequencer' })
  this.currentStep = -1
  this.tickEvent = null

  this.grid = new widgets.Grid('normal', tracks.length, stepCount)
  this.grid.elem.appendTo(this.container)
}

_.extend(Controls.prototype, base.BaseControls.prototype, {

  load: function(done) {
    this.restoreParams(paramList)
    done()
  },

  setParameter: function(param, args) {},

  _start: function() {
    var self = this
    this.currentStep = -1

    this.tickEvent = fields.controls.clock.setTimeout(function() {
      self.currentStep = (self.currentStep + 1) % self.stepCount

      // Send message if step is active
      _.forEach(self.tracks, function(track, trackId) {
        if (self.container.find('.track-' + trackId + ' .step-' + self.currentStep).hasClass('active'))
          rhizome.send('/' + self.instrumentId + '/note', [ trackId ])
      })

      // light up the current step
      self.container.find('.step').removeClass('current')
      self.container.find('.step-' + self.currentStep).addClass('current')

    }, 0.2).repeat(0.2)
  },

  _stop: function() {
    this.tickEvent.clear()
  },

  restore: function() {
    self.restoreParams(paramList)
  }

})