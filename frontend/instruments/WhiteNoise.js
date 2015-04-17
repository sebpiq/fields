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


module.exports = Instrument.extend({

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    var sampleCount = 44100
    this.noiseBuffer = fields.sound.audioContext.createBuffer(1, sampleCount, 44100)
    var noiseData = this.noiseBuffer.getChannelData(0)
    for (var i = 0; i < sampleCount; i++) noiseData[i] = Math.random()
  },

  load: function(done) {
    this.restore()
    done()
  },

  onStart: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.noiseBuffer
    this.bufferNode.loop = true
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  onStop: function() {
    this.bufferNode.stop(0)
  }

})