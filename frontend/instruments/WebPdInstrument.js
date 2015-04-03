var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('../core/waa')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')
  , utils = require('../core/utils')


// Initialize WebPd to use the same audioContext and clock as fields
Pd.start({ 
  audioContext: fields.sound.audioContext, 
  waaClock: fields.sound.clock
})

var WebPdPort = ports.BasePort.extend({
  validate: function(args) { return args }
})


module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {
    
    'debug': ports.BasePort.extend({
      validate: function(args) { return args },
      restore: function() {},
    })

  }),

  init: function(args) {
    var self = this
    Instrument.prototype.init.apply(this, arguments)
    this.patchUrl = args[0]
    this.patch = null

    this.ports.debug.on('value', function(args) {
      if (args[0] === 'reload') {
        if (self.patch) self._clearPatch()
        self.stop()
        self.load(function() {})
      }
    })

  },

  load: function(done) {
    var self = this
    utils.loadFile({ url: this.patchUrl, responseType: 'text' }, function(err, patchStr) {
      fields.log('Patch ' + self.patchUrl + ' loaded')
      self.patchStr = patchStr
      self.restore() // Ports are created dynamically so this will only restore state and volume
      done(err)
    })
  },

  onStart: function() {
    var self = this
    if (!this.patch) this._initPatch()
    else this.patch.start()
    this.patch.o(0).obj._gainNode.connect(this.mixer)
  },

  onStop: function() {
    if (this.patch) this.patch.stop()
  },

  _clearPatch: function() {
    var self = this
    Pd.destroyPatch(this.patch)
    this.patch = null
    
    // Removing all the ports that are not base ports
    var basePorts = Object.keys(this.portDefinitions)
    Object.keys(this.ports).forEach(function(subpath) {
      if (!_.contains(basePorts, subpath)) delete self.ports[subpath]
    })
  },

  _initPatch: function() {
    var self = this
    // Load the patch
    this.patch = Pd.loadPatch(this.patchStr)

    // Create a port for each object [receive <portName>]
    this.patch.objects.filter(function(obj) { return obj.type === 'receive' })
      .forEach(function(receive) {
        var subpath = receive.name
        self.addPort(subpath, WebPdPort)
        self.ports[subpath].on('value', function(args) {
          Pd.send(subpath, args)
        })
      })

    this.restore() // Once ports are created, we call restore again
  }


})