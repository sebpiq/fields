var async = require('async')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')

exports.sound = function(instrumentId, stepCount, tracks) {
  var sound = new Sound(stepCount, tracks)
  sound.instrumentId = instrumentId
  return sound
}

var Sound = function(stepCount, tracks) {
  // Picks one track randomly
  this.trackId = rhizome.userId % tracks.length
  this.soundUrl = tracks[this.trackId]
  this.buffer = null
  this.bufferNode = null
  this.started = false
}

_.extend(Sound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.soundUrl, function(err, buffer) {
      if (!err) self.buffer = buffer
      fields.log(self.instrumentId + ' loaded, track ' +  self.trackId 
        + ' buffer length :' + self.buffer.length)
      done(err)
    })
  },

  start: function() { this.started = true },
  stop: function() { this.started = false },

  setParameter: function(param, args) {
    if (param === 'note') {
      if (args[0] === this.trackId && this.started) {
        this.bufferNode = audioContext.createBufferSource()
        this.bufferNode.connect(audioContext.destination)
        this.bufferNode.buffer = this.buffer
        this.bufferNode.start(0)
      } 
    }
  }

})

exports.controls = function(instrumentId, stepCount, tracks) {
  var trackCount = tracks.length
    , container = $('<div>', { class: 'instrument centralizedSequencer' }).appendTo('body')
    , currentStep = -1

  fields.controls.clock.setTimeout(function() {
    currentStep = (currentStep + 1) % stepCount

    // Send message if step is active
    _.forEach(tracks, function(track, trackId) {
      if (container.find('.track-' + trackId + ' .step-' + currentStep).hasClass('active'))
        rhizome.send('/' + instrumentId + '/note', [ trackId ])
    })

    // light up the current step
    container.find('.step').removeClass('current')
    container.find('.step-' + currentStep).addClass('current')

  }, 1).repeat(1)

  widgets.grid(container, 'normal', tracks.length, stepCount)

  return container
}