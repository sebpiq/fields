var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , base = require('./base')

exports.sound = function(instrumentId, stepCount, tracks) {
  var sound = new Sound(stepCount, tracks)
  sound.instrumentId = instrumentId
  return sound
}

var Sound = function(stepCount, tracks) {
  base.BaseSound.apply(this)

  // Picks one track randomly
  this.trackId = rhizome.userId % tracks.length
  this.soundUrl = tracks[this.trackId]
  this.buffer = null
  this.bufferNode = null
  this.started = false
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.soundUrl, function(err, buffer) {
      if (!err) self.buffer = buffer
      fields.log(self.instrumentId + ' loaded, track ' +  self.trackId 
        + ' buffer length :' + self.buffer.length)
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
  }

})

exports.controls = function(instrumentId, stepCount, tracks) {
  return new Controls(instrumentId, stepCount, tracks)
}

var Controls = function(instrumentId, stepCount, tracks) {
  this.instrumentId = instrumentId
  this.trackCount = tracks.length
  this.tracks = tracks
  this.stepCount = stepCount
  this.container = $('<div>', { class: 'instrument centralizedSequencer' })
  this.currentStep = -1
  this.tickEvent = null
  this.started = false

  widgets.grid('normal', tracks.length, stepCount).appendTo(this.container)
}

_.extend(Controls.prototype, base.BaseControls.prototype, {

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
  }



})