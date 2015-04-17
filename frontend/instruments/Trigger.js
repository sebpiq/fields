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


module.exports = Instrument.extend({

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    this.url = args[0]
  },

  load: function(done) {
    var self = this
    waaUtils.loadBuffer(this.url, function(err, buffer) {  
      if (!err) {
        self.buffer = buffer
        fields.log(self.instrumentId + ' loaded, ' 
          + 'buffer length :' + self.buffer.length)
      }
      done(err)
      self.mixer.gain.value = 1
    })       
  },

  onStart: function() {
    this.bufferNode = fields.sound.audioContext.createBufferSource()
    this.bufferNode.buffer = this.buffer
    this.bufferNode.connect(this.mixer)
    this.bufferNode.start(0)
  },

  onStop: function() {}
  
})