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
 
var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')

module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {
    
    'play': ports.BasePort.extend({
      validate: function(args) { return args }
    }),

    'f0': ports.NumberPort.extend({
      mapping: function(inVal) { return 500 + inVal * 3000 }
    })

  }),

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    var self = this
    
    this.ports['play'].on('value', function(args) {
      if (self.oscillatorNode) {
        var volEnvPoints = [[0, 0.05], [args[0], args[1]], [1, 0.05]]
          , pitchEnvPoints = [[0, 0], [args[2], args[3]], [1, 0]]
          , duration = 1 + args[4] * 10
          , currentTime = fields.sound.audioContext.currentTime
          , latency = 1 + Math.random() * 3
          , f0 = self.ports['f0'].value

        self.envGain.gain.cancelScheduledValues(0)
        self.envGain.gain.setValueAtTime(0, latency + currentTime)
        _.forEach(volEnvPoints, function(point) {
          self.envGain.gain.linearRampToValueAtTime(
            point[1], latency + currentTime + point[0] * duration)
        })
        
        self.oscillatorNode.frequency.cancelScheduledValues(0)
        self.oscillatorNode.frequency.setValueAtTime(f0, latency + currentTime)
        _.forEach(pitchEnvPoints, function(point) {
          self.oscillatorNode.frequency.linearRampToValueAtTime(
            f0 + f0 * point[1], latency + currentTime + point[0] * duration)
        })
      }
    })

    this.ports['f0'].on('value', function(f0) {
      if (self.oscillatorNode) {
        self.oscillatorNode.frequency.setValueAtTime(
          f0, fields.sound.audioContext.currentTime + 1)
      }
    })
  },

  load: function(done) {
    this.restore()
    done()
  },

  onStart: function() {
    this.envGain = fields.sound.audioContext.createGain()
    this.envGain.connect(this.mixer)
    this.envGain.gain.value = 0.05

    this.oscillatorNode = fields.sound.audioContext.createOscillator()
    this.oscillatorNode.type = 'sawtooth'
    this.oscillatorNode.connect(this.envGain)
    this.oscillatorNode.start(0)
  },

  onStop: function() {
    this.envGain.disconnect()
    this.envGain = null
    this.oscillatorNode.stop()
    this.oscillatorNode.disconnect()
    this.oscillatorNode = null
  }


})