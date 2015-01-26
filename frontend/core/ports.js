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
      args = this.validate(args)
    } catch(err) {
      console.error(err)
      return 
    }
    this.value = args
    this.emit('value', args)
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