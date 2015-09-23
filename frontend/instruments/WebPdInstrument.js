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
  , utils = require('../core/utils')


// Initialize WebPd to use the same audioContext and clock as fields
Pd.start({ 
  audioContext: fields.sound.audioContext
  //waaClock: fields.sound.clock
})

var WebPdPort = ports.BasePort.extend({
  validate: function(args) { return args }
})

Pd.registerExternal('fields/preferred-format', Pd.core.PdObject.extend({
  inletDefs: [
    Pd.core.portlets.Inlet.extend({
      message: function(args) {
        this.obj.o(0).message([fields.sound.preferredFormat])
      }
    })
  ],
  outletDefs: [Pd.core.portlets.Outlet]
}))

Pd.registerExternal('fields/id', Pd.core.PdObject.extend({
  inletDefs: [
    Pd.core.portlets.Inlet.extend({
      message: function(args) {
        this.obj.o(0).message([rhizome.id])
      }
    })
  ],
  outletDefs: [Pd.core.portlets.Outlet]
}))

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
    this._patchPortsInitialized = false
    this.patch = null
    this._pdReceivePaths = []

    this.ports.debug.on('value', function(args) {
      if (args[0] === 'reload') {
        if (self.patch) {
          Pd.destroyPatch(this.patch)
          this.patch = null
        }
        self._clearPatchPorts()
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
    this.patch = Pd.loadPatch(this.patchStr)
    
    // Create and initialize patch ports.
    // If already created, restore the previous values.
    if (!this._patchPortsInitialized) this._initPatchPorts()
    else this._pdReceivePaths.forEach(function(subpath) {
      var port = self.ports[subpath]
      if (_.isArray(self.ports[subpath].value))
        Pd.send(port.path, port.value)
    })

    // If the patch has a dsp outlet, connect it to the instrument mixer
    if (this.patch.outlets.length && this.patch.o(0) instanceof Pd.core.portlets.DspOutlet)
      this.patch.o(0).obj._gainNode.connect(this.mixer)
    else console.warn('WebPdInstrument "' + this.instrumentId + '" patch has no [outlet~]')
  },

  onStop: function() {
    if (this.patch) {
      Pd.destroyPatch(this.patch)
      this.patch = null
    }
  },

  _clearPatchPorts: function() {
    var self = this
    // Removing all the ports that are not base ports
    var basePorts = Object.keys(this.portDefinitions)
    Object.keys(this.ports).forEach(function(subpath) {
      if (!_.contains(basePorts, subpath)) delete self.ports[subpath]
    })
    this._patchPortsInitialized = false
  },

  _initPatchPorts: function() {
    var self = this
      , pathRoot = '/' + self.instrumentId + '/'
    // Create a port for each object [receive <portName>] that starts with '/<instrumentId>/'
    this.patch.objects.filter(function(obj) { return obj.type === 'receive' })
      .forEach(function(receive) {
        var path = receive.name
          , rootInd = path.indexOf(pathRoot)
          , subpath

        // If we can't find `pathRoot` at the beginning of the name of the [receive] object,
        // we don't create a port for it. 
        if (rootInd !== 0) return
        else subpath = path.slice(pathRoot.length)
        self.addPort(subpath, WebPdPort)
        self._pdReceivePaths.push(subpath)
        self.ports[subpath].on('value', function(args) {
          Pd.send(path, args)
        })
      })
    this.restore() // Once ports are created, we call restore again
    this._patchPortsInitialized = true
  }


})