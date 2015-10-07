/*
 *  Fields
 *  Copyright (C) 2015 Sébastien Piquemal <sebpiq@gmail.com>, Tim Shaw <tim@triptikmusic.co.uk>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
var _ = require('underscore')
  , waaUtils = require('../core/waa')
  , math = require('../core/math')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')


module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {
    'position': ports.PointPort,
    'duration': ports.PointPort.extend({ defaultValue: [0.1, 0] }),
    'ratio': ports.PointPort.extend({ defaultValue: [1, 0] }),
    'env': ports.NumberPort,
    'density': ports.NumberPort
  }),

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    this.url = args[0]
  },

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url + '.' + fields.sound.preferredFormat, function(err, buffer) {  
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, ' 
          + 'buffer length :' + self.buffer.length)
        self.restore()
      }
      done(err)
    })       
  },

  onStart: function() {
    if (this.grainEvent) this.grainEvent.clear()
    var self = this

    this.grainEvent = fields.sound.clock.setTimeout(function() {
      var duration = self._getDuration()
      if (self._enjoyTheSilence()) self.grainEvent.repeat(duration / 2 || 0.005)
      else {
        duration = self._playSound(self.url, self.mixer, self._getPosition()
          , duration, self._getRatio(), self.ports['env'].value)
        self.grainEvent.repeat(duration || 0.005)
      }
    }, 0.1).repeat(0.1)
  },

  onStop: function() {
    if (this.grainEvent) this.grainEvent.clear()
  },

  _getPosition: function() {
    var mean = this.ports['position'].value[0]
      * (this.buffer.length / fields.sound.audioContext.sampleRate)
    return math.pickVal(mean, this.ports['position'].value[1])
  },

  _getDuration: function() {
    var mean = this.ports['duration'].value[0]
    return Math.max(0.01, math.pickVal(4 * math.valExp(mean), this.ports['duration'].value[1]))
  },

  _getRatio: function() {
    var ratios = [0.5, 0.75, 1]
    var meanRatio = this.ports['ratio'].value[0]
    return Math.max(0.05, math.pickVal(meanRatio, this.ports['ratio'].value[1]))
  },

  // Returns true for silence, false for grain.
  // There is twice as much chance as expected from the density 
  // to pick up a silence, but silences should be twice shorter.
  _enjoyTheSilence: function() {
    var pick1 = Math.random() > this.ports['density'].value
      , pick2 = Math.random() > this.ports['density'].value
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