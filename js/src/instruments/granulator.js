var _ = require('underscore')
  , waaUtils = require('../utils/waa')
  , widgets = require('../utils/widgets')
  , math = require('../utils/math')
  , base = require('./base')

var paramList = ['volume', 'position', 'duration', 'ratio', 'env', 'density', 'state']

exports.sound = function(instrumentId, url) {
  return new Sound(instrumentId, url)
}

var Sound = function(instrumentId, url) {
  base.BaseSound.call(this, instrumentId)
  this.params = {
    position: [0, 0],
    duration: [0.1, 0],
    ratio: [1, 0],
    env: 0,
    density: 0
  }
  this.url = url
}

_.extend(Sound.prototype, base.BaseSound.prototype, {

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, ' 
          + 'buffer length :' + self.buffer.length)
        self.restoreParams(paramList)
      }
      done(err)
    })       
  },

  _start: function() {
    if (this.grainEvent) this.grainEvent.clear()
    var self = this

    if (fields.sound.clockUsers === 0) {
      fields.sound.clock.start()
      fields.log('start clock')
    }
    fields.sound.clockUsers++

    this.grainEvent = fields.sound.clock.setTimeout(function() {
      var duration = self._getDuration()
      if (self._enjoyTheSilence()) self.grainEvent.repeat(duration / 2 || 0.005)
      else {
        duration = self._playSound(self.url, self.mixer, self._getPosition()
          , duration, self._getRatio(), self.params.env)
        self.grainEvent.repeat(duration || 0.005)
      }
    }, 0.1).repeat(0.1)

    this.grainEvent.on('expired', function() { fields.log('EXPIRED') })
  },

  _stop: function() {
    if (this.grainEvent) this.grainEvent.clear()
    fields.sound.clockUsers--
    if (fields.sound.clockUsers === 0) {
      fields.sound.clock.stop()
      fields.log('stop clock')
    }
  },

  restore: function() {
    this.restoreParams(paramList)
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
  base.BaseControls.call(this, instrumentId)
  var throttleTime = 200

  // Density
  var _sendDensity = rhizome.utils.throttle(throttleTime, function(args) {
    rhizome.send('/' + instrumentId + '/density', args)
  })
  this.densitySlider = new widgets.Slider({ title: 'density' }, function(val) {
    _sendDensity([ val ])
  })
  this.densitySlider.elem.appendTo(this.container)

  // Env
  var _sendEnv = rhizome.utils.throttle(throttleTime, function(args) {
    rhizome.send('/' + instrumentId + '/env', args)
  })
  this.envSlider = new widgets.Slider({ title: 'enveloppe' }, function(val) {
    _sendEnv([ val ])
  })
  this.envSlider.elem.appendTo(this.container)

  // Duration 
  var _sendDuration = rhizome.utils.throttle(throttleTime, function(args) {
    rhizome.send('/' + instrumentId + '/duration', args)
  })
  this.durationPad = new widgets.XYPad({ title: 'duration', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    _sendDuration([ mean, vari ])
  })
  this.durationPad.elem.appendTo(this.container)

  // Position
  var _sendPosition = rhizome.utils.throttle(throttleTime, function(args) {
    rhizome.send('/' + instrumentId + '/position', args)
  })
  this.positionPad = new widgets.XYPad({ title: 'position', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    _sendPosition([ mean, vari ])
  })
  this.positionPad.elem.appendTo(this.container)

  // Ratio
  var _sendRatio = rhizome.utils.throttle(throttleTime, function(args) {
    rhizome.send('/' + instrumentId + '/ratio', args)
  })
  this.ratioPad = new widgets.XYPad({ title: 'ratio', xLabel: 'mean', yLabel: 'variance' }, function(mean, vari) {
    _sendRatio([ mean, vari ])
  })
  this.ratioPad.elem.appendTo(this.container)
}

_.extend(Controls.prototype, base.BaseControls.prototype, {

  cssClass: 'granulator',

  show: function() {
    this.durationPad.refresh()
    this.positionPad.refresh()
    this.ratioPad.refresh()
    this.densitySlider.refresh()
    this.envSlider.refresh()
  },

  load: function(done) {
    this.restoreParams(paramList)
    done()
  },

  setParameter: function(param, args) {
    if (param === 'duration') this.durationPad.setPosition(args)
    else if (param === 'position') this.positionPad.setPosition(args)
    else if (param === 'ratio') this.ratioPad.setPosition(args)
    else if (param === 'density') this.densitySlider.setVal(args[0])
    else if (param === 'env') this.envSlider.setVal(args[0])
    else fields.log('Unknown parameter ' + param)
  }

})