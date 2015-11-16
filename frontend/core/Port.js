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
 
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , utils = require('./utils')


var Port = module.exports = function(instrument, subpath) {
  EventEmitter.apply(this)
  this.instrument = instrument
  this.path = '/' + this.instrument.instrumentId + '/' + subpath
  this.value = this.defaultValue
}
Port.extend = utils.chainExtend

_.extend(Port.prototype, EventEmitter.prototype, {

  defaultValue: null,

  restore: function() {
    rhizome.send('/sys/resend', [this.path])
  },

  receive: function(args) {
    this.value = args
    this.emit('value', args)
  }
})