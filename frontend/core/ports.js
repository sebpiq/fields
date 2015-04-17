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


var BasePort = exports.BasePort = function(instrument, subpath) {
  EventEmitter.apply(this)
  this.instrument = instrument
  this.path = '/' + this.instrument.instrumentId + '/' + subpath
  this.value = this.defaultValue
}
BasePort.extend = utils.chainExtend

_.extend(BasePort.prototype, EventEmitter.prototype, {

  defaultValue: null,

  restore: function() {
    rhizome.send('/sys/resend', [this.path])
  },

  receive: function(args) {
    try {
      validated = this.validate(args)
    } catch(err) {
      console.error(err)
      return 
    }
    this.value = validated
    this.emit('value', validated)
  },

  // Validate and extract a list of arguments to apply to `onValue`.
  // If the args are unvalid, returns false
  validate: function(args) { throw new Error('implement me!') }
})


exports.TogglePort = BasePort.extend({

  defaultValue: false,

  validate: function(args) {
    if (args.length !== 1) {
      console.error('unvalid number of args for ' + this.path + ' : ' + args)
      return false
    }
    if (typeof args[0] !== 'number') {
      console.error('unvalid args type for ' + this.path + ' : ' + args)
      return false
    }
    return !!args[0] // to bool
  }

})


exports.NumberPort = BasePort.extend({

  defaultValue: 0,

  validate: function(args) {
    if (args.length !== 1) {
      console.error('unvalid number of args for ' + this.path + ' : ' + args)
      return false
    }
    if (typeof args[0] !== 'number') {
      console.error('unvalid args type for ' + this.path + ' : ' + args)
      return false
    }
    return this.mapping(args[0])
  },

  mapping: function(inVal) {
    return inVal
  }

})


exports.PointPort = BasePort.extend({

  defaultValue: [0, 0],

  validate: function(args) {
    if (args.length !== 2) {
      console.error('unvalid number of args for ' + this.path + ' : ' + args)
      return false
    }
    if (typeof args[0] !== 'number' || typeof args[1] !== 'number') {
      console.error('unvalid args type for ' + this.path + ' : ' + args)
      return false
    }
    return [this.mappingX(args[0]), this.mappingY(args[1])]
  },

  mappingX: function(inVal) {
    return inVal
  },

  mappingY: function(inVal) {
    return inVal
  }

})