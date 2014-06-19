var _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , math = require('../utils/math')
  , base = require('./base')

exports.sound = function(instrumentId, url) {
  return new Sound(instrumentId, url)
}

var Sound = function(instrumentId, url) {
  base.BaseSound.apply(this)
  this.params = {
    position: [0, 0],
    duration: [0.1, 0],
    ratio: [1, 0],
    env: 0,
    density: 0
  }
  this.url = url
  this.instrumentId = instrumentId
  this.started = false
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) self.buffer = buffer
      fields.log(self.instrumentId + ' loaded, ' 
        + 'buffer length :' + self.buffer.length)
      done(err)
    })       
  },

  _start: function() {
    if (this.grainEvent) this.grainEvent.clear()
    
    var self = this
    this.clock = new WAAClock(fields.sound.audioContext)

    this.grainEvent = this.clock.setTimeout(function() {
      var duration = self._getDuration()
      if (self._enjoyTheSilence()) self.grainEvent.repeat(duration / 2 || 0.005)
      else {
        duration = self._playSound(self.url, self.mixer, self._getPosition()
          , duration, self._getRatio(), self.params.env)
        self.grainEvent.repeat(duration || 0.005)
      }
    }, 0.1).repeat(0.1)
  },

  _stop: function() {
    if (this.grainEvent) this.grainEvent.clear()
    this.clock // TODO
  },

  setParameter: function(param, args) {
    this.params[param] = args
  },

  _getPosition: function() {
    var mean = this.params.position[0]
      * (this.buffer.length / fields.sound.audioContext.sampleRate)
    return math.pickVal(mean, this.params.position[1])
  },

  _getDuration: function() {
    var mean = this.params.duration[0]
    return Math.max(0.01, math.pickVal(4 * math.valExp(mean), this.params.duration[1]))
  },

  _getRatio: function() {
    var ratios = [0.5, 0.75, 1]
    var meanRatio = this.params.ratio[0]
    if (this.params.quantize_ratio) {
      return meanRatio * ratios[Math.floor(Math.random() * 0.99 * ratios.length)]
    } else return Math.max(0.05, math.pickVal(meanRatio, this.params.ratio[1]))
  },

  // Returns true for silence, false for grain.
  // There is twice as much chance as expected from the density 
  // to pick up a silence, but silences should be twice shorter.
  _enjoyTheSilence: function() {
    var pick1 = Math.random() > this.params.density
      , pick2 = Math.random() > this.params.density
    return pick1 || pick2
  },


  // TODO: somehow this doesn't work when duration * ratio is bigger than buffer even if recalculating duration.
  _playSound: function(url, sink, start, duration, ratio, env) {
    var bufDuration = this.buffer.length / fields.sound.audioContext.sampleRate
      , availDur = bufDuration - start

    duration = Math.min(availDur / ratio, duration)
    if (duration <= 0) return 0

    var bufferNode = fields.sound.audioContext.createBufferSource()
      , gainNode = fields.sound.audioContext.createGain()

    bufferNode.playbackRate.value = ratio
    bufferNode.buffer = this.buffer

    var rampDur = Math.max(duration * (env / 2), 0.002)
    gainNode.gain.setValueAtTime(0, fields.sound.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(1, fields.sound.audioContext.currentTime + rampDur)
    gainNode.gain.linearRampToValueAtTime(1, fields.sound.audioContext.currentTime + duration - rampDur)
    gainNode.gain.linearRampToValueAtTime(0, fields.sound.audioContext.currentTime + duration)

    bufferNode.connect(gainNode)
    gainNode.connect(sink)
    bufferNode.start(0, start, duration)

    return duration
  }

})

exports.controls = function(instrumentId, url) {
  return new Controls(instrumentId, url)
}

var Controls = function(instrumentId, url) {
  this.container = $('<div>', { class: 'instrument granulator' })

  widgets.xyPad({ title: 'duration', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    rhizome.send('/' + instrumentId + '/duration', [mean, vari])
  }).appendTo(this.container)

  widgets.xyPad({ title: 'position', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    rhizome.send('/' + instrumentId + '/position', [mean, vari])
  }).appendTo(this.container)

  widgets.xyPad({ title: 'ratio', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    rhizome.send('/' + instrumentId + '/ratio', [mean, vari])
  }).appendTo(this.container)

  widgets.slider({ title: 'density' }, function(val) {
    rhizome.send('/' + instrumentId + '/density', [val])
  }).appendTo(this.container)

  widgets.slider({ title: 'enveloppe' }, function(val) {
    rhizome.send('/' + instrumentId + '/env', [val])
  }).appendTo(this.container)
}

_.extend(Controls.prototype, base.BaseControls.prototype, {
})