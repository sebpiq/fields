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
  , math = require('./math')
  , utils = require('./utils')
  , ports = require('./ports')

// -------------------- Instruments -------------------- // 
var BaseInstrument = module.exports = function(instrumentId, args) {
  var self = this
  this.mixer = fields.sound.audioContext.createGain()
  this.mixer.gain.value = 0
  this.mixer.connect(fields.sound.audioContext.destination)

  this.started = false
  this.instrumentId = instrumentId

  this.ports = {}
  Object.keys(this.portDefinitions).forEach(function(subpath) {
    self.addPort(subpath, self.portDefinitions[subpath])
  })

  this.init(args)
}
BaseInstrument.extend = utils.chainExtend

_.extend(BaseInstrument.prototype, {

  init: function(args) {
    var self = this

    // Volume computation taking into account panning
    var computeVolume = function() {
      var panFunc = function(pan, pos) {
        return (1 - Math.abs(pan - 0.5)) + (pos - 0.5) * (pan - 0.5) * 2
      }
      var volRatio = self.ports['volume'].value
        , panning = self.ports['panning'].value
        , position = fields.sound.position
        , panRatio = panFunc(panning[0], position.x) * panFunc(panning[1], position.y)
      self.mixer.gain.setTargetAtTime(panRatio * volRatio, 0, 0.3)
    }
    this.ports['volume'].on('value', computeVolume)
    this.ports['panning'].on('value', computeVolume)

    // State on/off
    this.ports['state'].on('value', function(isOn) {
      if (isOn) self.start()
      else self.stop()
    })
  },

  portDefinitions: {

    'volume': ports.NumberPort.extend({
      mapping: function(inVal) { return math.valExp(inVal, 2.5) * 2 }
    }),
    'panning': ports.PointPort,
    'state': ports.TogglePort

  },

  start: function() {
    if (this.started === false) {
      this.started = true
      this.onStart()
    }
  },

  stop: function() {
    if (this.started === true) {
      this.started = false
      this.onStop()
    }
  },

  receive: function(subpath, args) {
    if (!this.ports.hasOwnProperty(subpath))
      return console.error('unknown port "' + subpath + '" for "' + this.instrumentId + '"')
    this.ports[subpath].receive(args)
  },

  restore: function() {
    _.values(this.ports).forEach(function(port) { port.restore() })
  },

  addPort: function(subpath, portClass) {
    this.ports[subpath] = new portClass(this, subpath)
  },


  load: function(done) {},
  onStart: function() {},
  onStop: function() {},
})