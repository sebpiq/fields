var waaUtils = require('./core/waa')
  , async = require('async')
  , _ = require('underscore')
  , WAAClock = require('waaclock')
  , muteTimeout, initialized = false

window.fields.sound = {
  clock: null,
  clockUsers: 0,
  audioContext: null,
  supportedFormats: null,
  position: null
}

// clockUsers is intended to start / stop the clock if no instrument is using it.
// At the moment it is not used though.
/*
if (fields.sound.clockUsers === 0) {
  fields.sound.clock.start()
  fields.log('start clock')
}
fields.sound.clockUsers++

fields.sound.clockUsers--
if (fields.sound.clockUsers === 0) {
  fields.sound.clock.stop()
  fields.log('stop clock')
}
*/

// Contains all the instances of sound engines for each declared instrument
// `{ <instrument id>: <instrument instance> }`
var instruments = {}

// Contains all the available classes
// `{ <instrument class name>: <instrument class> }`
var instrumentClasses = {}

var declareInstrumentClass = function(name, cls) {
  instrumentClasses[name] = cls
}

var setStatus = function(msg) {
  $('#status').html('status : ' + msg)
}

// For all the instruments, subscribe to messages
var subscribeAll = function() {
  Object.keys(instruments).forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
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
  fields.sound.clockUsers = 0

  // Declare builtin instruments
  declareInstrumentClass('DistributedSequencer', require('./instruments/DistributedSequencer'))
  declareInstrumentClass('Granulator', require('./instruments/Granulator'))
  declareInstrumentClass('Osc', require('./instruments/Osc'))
  declareInstrumentClass('Sine', require('./instruments/Sine'))
  declareInstrumentClass('Trigger', require('./instruments/Trigger'))
  declareInstrumentClass('WebPdInstrument', require('./instruments/WebPdInstrument'))
  declareInstrumentClass('WhiteNoise', require('./instruments/WhiteNoise'))

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

      var config = fields.config()
      Object.keys(config).forEach(function(instrumentId) {
        var instrumentConfig = config[instrumentId]
          , instrumentClass = instrumentClasses[instrumentConfig.instrument]
        instruments[instrumentId] = new instrumentClass(instrumentId, instrumentConfig.args)
      })
      next()
    },
    
    // Start rhizome
    _.bind(rhizome.start, rhizome),

    // Load all instruments
    function(next) {
      async.forEach(_.values(instruments), function(instrument, nextInstrument) {
        instrument.load(nextInstrument)
      }, next)
    }

  ], function(err) {
    if (err)
      return fields.log('ERROR: ' + err)
    initialized = true
    fields.log('all instruments loaded')
  })

  $('#mapContainer').fadeOut(100)
  setStatus('connecting ...')
}

rhizome.on('connected', function() {
  subscribeAll()
  setStatus('connected')

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
  else {
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
