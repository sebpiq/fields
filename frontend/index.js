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
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , WAAClock = require('waaclock')
  , muteTimeout, initialized = false

var fields = window.fields = {}

fields.isSupported = function() {
  if (typeof rhizome === 'undefined' || rhizome.isSupported()) {
    if (window.AudioContext) return true
    else return false
  } else return false
  return false
}

fields.log = function(msg) {
  $('<div>', { class: 'log' })
    .html(msg)
    .prependTo('#console')
  $('#console .log').slice(60).remove()
}

fields.sound = {
  clock: null,
  audioContext: null,
  supportedFormats: null,
  preferredFormat: null,
  position: null
}

fields.core = {
  BaseInstrument: require('./core/BaseInstrument'),
  ports: require('./core/ports'),
  waa: require('./core/waa'),
  declareInstrumentClass: function(name, cls) { instrumentClasses[name] = cls }
}

// Contains all the instances of sound engines for each declared instrument
// `{ <instrument id>: <instrument instance> }`
var instruments = {}

// Contains all the available classes
// `{ <instrument class name>: <instrument class> }`
var instrumentClasses = {}

var setStatus = function(msg) {
  $('#status').html('status : ' + msg)
}

// For all the instruments, subscribe to messages
var subscribeAll = function() {
  Object.keys(instruments).forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  })
}

// Load all the instruments and calls done
var loadAllInstruments = function(done) {
  var config = fields.config()
  Object.keys(config).forEach(function(instrumentId) {
    if (instrumentId === 'fields') throw new Error('fields name is reserved')
    var instrumentConfig = config[instrumentId]
      , instrumentClass = instrumentClasses[instrumentConfig.instrument]
    instruments[instrumentId] = new instrumentClass(instrumentId, instrumentConfig.args)
  })
  subscribeAll()
  
  async.forEach(_.values(instruments), function(instrument, nextInstrument) {
    instrument.load(nextInstrument)
  }, function(err) {
    if (err) return done(err)
    fields.log('all instruments loaded')
    done()
  })
}

$(function() {
  var map = $('#map')
  map.click(function(event) {
    fields.sound.position = {}
    var posX = map.offset().left
      , posY = map.offset().top
    
    fields.sound.position.x = (event.pageX - posX) / map.width()
    fields.sound.position.y = 1 - (event.pageY - posY) / map.height()
    fields.sound.start()
  })
})


// Start the whole system, when the user presses a button. 
fields.sound.start = function() {
  $('#status').show()

  // Initialize sound
  fields.sound.audioContext = waaUtils.kickStartWAA()
  fields.sound.clock = new WAAClock(fields.sound.audioContext)
  fields.sound.clock.onexpired = function() { fields.log('expired') }
  fields.sound.clock.start()

  // Declare builtin instruments
  fields.core.declareInstrumentClass('DistributedSequencer', require('./instruments/DistributedSequencer'))
  fields.core.declareInstrumentClass('Granulator', require('./instruments/Granulator'))
  fields.core.declareInstrumentClass('Osc', require('./instruments/Osc'))
  fields.core.declareInstrumentClass('Sine', require('./instruments/Sine'))
  fields.core.declareInstrumentClass('Trigger', require('./instruments/Trigger'))
  fields.core.declareInstrumentClass('WebPdInstrument', require('./instruments/WebPdInstrument'))
  fields.core.declareInstrumentClass('WhiteNoise', require('./instruments/WhiteNoise'))

  // Start
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
      next()
    },
    
    // Start rhizome
    _.bind(rhizome.start, rhizome),

  ], function(err) {
    if (err) return fields.log('ERROR: ' + err)
  })

  $('#mapContainer').fadeOut(100)
  setStatus('connecting ...')
}

rhizome.on('connected', function() {
  setStatus('connected')
  fields.log('connected with id ' + rhizome.id)

  // Execute those only if the connection was successfuly established before 
  if (initialized) {
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

  // Message sent to initialize the device, and calculate its time offset for synchronization
  else if (address === '/fields/roundTrip')
    rhizome.send('/fields/roundTrip', [rhizome.id, Date.now().toString()])
  
  // Message sent when all initialization procedure is complete
  else if (address === '/fields/init') {
    fields.sound.timeOffset = Math.round(args[0])
    fields.log('timeOffset ' + fields.sound.timeOffset)
    loadAllInstruments(function(err) {
      if (err) return fields.log('ERROR ' + err)
      initialized = true
      fields.log('ready')
    })

  } else if (address === '/fields/sequence') {
    fields.sequence.index = args[0]
    fields.sequence.length = args[1]
    fields.log('sequence index : ' + fields.sequence.index 
      + ' / length : ' + fields.sequence.length)
    fields.events.emit('sequence:changed')

  // Normal messages, proxied to instruments
  } else {
    fields.log('' + address + ' ' + args)
    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , instrument = instruments[parts[1]]
      , portPath = parts[2]
    instrument.receive(portPath, args)
  }
})

rhizome.on('queued', function() {
  setStatus('waiting ...')
})

rhizome.on('connection lost', function() {
  setStatus('waiting ...')
  muteTimeout = setTimeout(function() {
    _.forEach(_.values(instruments), function(sound) {
      sound.mixer.gain.setTargetAtTime(0.0001, 0, 0.002)
    })
  }, 8000)
})
