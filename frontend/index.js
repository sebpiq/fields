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
 
var waaUtils = require('./core/waa')
  , async = require('async')
  , _ = require('underscore')
  , WAAClock = require('waaclock')
  , muteTimeout, connectionSuccessful = false


var fields = window.fields = {
  
  position: null,
  
  sound: {
    clock: null,
    masterMixer: null,
    fftDataHandler: null,
    audioContext: null,
    supportedFormats: null,
    preferredFormat: null,
  },
  
  core: {
    BaseInstrument: require('./core/BaseInstrument'),
    Port: require('./core/Port'),
    waa: require('./core/waa'),
    declareInstrumentClass: function(name, cls) { instrumentClasses[name] = cls }
  }

}


fields.log = function(msg) {}

fields.statusChanged = function(status) {}

fields.isSupported = function() {
  if (typeof rhizome === 'undefined' || rhizome.isSupported()) {
    if (window.AudioContext) return true
    else return false
  } else return false
  return false
}

// Contains all the instances of sound engines for each declared instrument
// `{ <instrument id>: <instrument instance> }`
var instruments = {}

// Contains all the available classes
// `{ <instrument class name>: <instrument class> }`
var instrumentClasses = {}

// For all the instruments, subscribe to messages
var subscribeAll = function() {
  Object.keys(instruments).forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  })
}

fields.load = function(config, done) {
  fields.sound.audioContext = new AudioContext

  // Declare builtin instruments
  fields.core.declareInstrumentClass('Granulator', require('./instruments/Granulator'))
  fields.core.declareInstrumentClass('WebPdInstrument', require('./instruments/WebPdInstrument'))

  async.waterfall([    
      // Get format support infos
    _.bind(waaUtils.formatSupport, waaUtils),

    // Instantiate all instruments
    function(formats, next) {

      // Get the format to use
      fields.log('formats supported ' + formats)
      fields.sound.supportedFormats = formats
      if (fields.sound.supportedFormats.indexOf('ogg') !== -1)
        fields.sound.preferredFormat = 'ogg'
      else if (fields.sound.supportedFormats.indexOf('mp3') !== -1)
        fields.sound.preferredFormat = 'mp3'
      else if (fields.sound.supportedFormats.indexOf('wav') !== -1)
        fields.sound.preferredFormat = 'wav'
      fields.log('format used ' + fields.sound.preferredFormat)

      config = config()
      Object.keys(config).forEach(function(instrumentId) {
        var instrumentConfig = config[instrumentId]
          , instrumentClass = instrumentClasses[instrumentConfig.instrument]
        instruments[instrumentId] = new instrumentClass(instrumentId, instrumentConfig.args)
      })
      next()
    },

    // Load all instruments
    function(next) {
      async.forEach(_.values(instruments), function(instrument, nextInstrument) {
        instrument.load(nextInstrument)
      }, next)
    }

  ], function(err) {
    if (err) return fields.log('ERROR: ' + err)
    fields.log('all loaded')
    if (done) done(err)
  })
}

// Start the whole system, when the user presses a button.
// Evrything must happen synchronously to not freak out web audio on iOS.
fields.start = function() {
  fields.statusChanged('connecting ...')

  // Initialize sound
  fields.sound.audioContext = waaUtils.kickStartWAA()
  fields.sound.masterMixer = fields.sound.audioContext.createGain()
  fields.sound.masterMixer.gain.value = 1
  fields.sound.masterMixer.connect(fields.sound.audioContext.destination)
  fields.sound.clock = new WAAClock(fields.sound.audioContext)
  fields.sound.clock.onexpired = function() { fields.log('expired') }
  fields.sound.clock.start()
  Pd.start({ audioContext: fields.sound.audioContext })

  // Create an analyser for visualizations
  if (fields.sound.fftDataHandler) {
    var fftArray
    fields.sound.analyserNode = fields.sound.audioContext.createAnalyser()
    fields.sound.analyserNode.fftSize = 128
    fields.sound.masterMixer.connect(fields.sound.analyserNode)
    fields.sound.clock.callbackAtTime(function() {
      fftArray = new Float32Array(fields.sound.analyserNode.frequencyBinCount)
      fields.sound.analyserNode.getFloatFrequencyData(fftArray)
      fields.sound.fftDataHandler(fftArray)
    }, 0).repeat(0.05)
  }

  // Initializing instruments
  _.chain(instruments).forEach(function(instrument) {
    instrument.init()
  }).value()

  // Start rhizome
  rhizome.start(function(err) {
    if (err) return fields.log('ERROR: ' + err)
    connectionSuccessful = true
    fields.log('connection established')
  })
}

rhizome.on('connected', function() {
  subscribeAll()
  fields.statusChanged('connected')

  // Execute those only if the connection was successfuly established before 
  if (connectionSuccessful) {
    if (muteTimeout) clearTimeout(muteTimeout)
    Object.keys(instruments).forEach(function(instrumentId) {
      instruments[instrumentId].restore()
    })
  }
})

// Message scheme :
//  /<instrument id>/<name> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('' + address + ' ' + args)
    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , instrument = instruments[parts[1]]
      , portPath = parts[2]
    instrument.receive(portPath, args)
  }
})

rhizome.on('queued', function() {
  fields.statusChanged('waiting ...')
})

rhizome.on('connection lost', function() {
  fields.statusChanged('waiting ...')
  muteTimeout = setTimeout(function() {
    _.forEach(_.values(instruments), function(sound) {
      sound.mixer.gain.setTargetAtTime(0.0001, 0, 0.002)
    })
  }, 8000)
})
