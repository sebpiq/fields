var waaUtils = require('../core/waa')
  , async = require('async')
  , _ = require('underscore')
  , muteTimeout, initialized = false

window.fields.sound = {}

var setStatus = function(msg) {
  $('#status').html('status : ' + msg)
}

var subscribeAll = function() {
  // For all the instruments, subscribe to messages
  Object.keys(instrumentInstances).forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  })
}

// Contains all the instances of sound engines for each declared instrument
// `{ <instrument id>: <sound instance> }`
var instrumentInstances = fields.sound.instrumentInstances = {}

// Start the whole system, when the user presses a button. 
fields.sound.start = function() {

  // Initialize sound
  fields.sound.audioContext = waaUtils.kickStartWAA()
  fields.sound.clock = new WAAClock(fields.sound.audioContext)
  fields.sound.clockUsers = 0

  async.waterfall([

    // Get format support infos
    _.bind(waaUtils.formatSupport, waaUtils),

    // Instantiate all instruments
    function(formats, next) {
      fields.log('formats supported ' + formats)
      fields.sound.supportedFormats = formats

      var config = fields.config()
      Object.keys(config).forEach(function(instrumentId) {
        var instrumentConfig = config[instrumentId]
          , instrument = fields.instruments[instrumentConfig.instrument]
        instrumentInstances[instrumentId] = new instrument(instrumentId, instrumentConfig.args)
      })
      next()
    },
    
    // Start rhizome
    _.bind(rhizome.start, rhizome),

    // Load all instruments
    function(next) {
      async.forEach(_.values(instrumentInstances), function(instrument, nextInstrument) {
        instrument.load(nextInstrument)
      }, next)
    }

  ], function(err) {
    if (err)
      return fields.log('ERROR: ' + err)
    initialized = true
    fields.log('all instruments loaded')
  })

  $('#startButtonContainer').fadeOut(100)
  setStatus('connecting ...')
}

rhizome.on('connected', function() {
  subscribeAll()
  setStatus('connected')

  // Execute those only if the connection was successfuly established before 
  if (initialized) {
    if (muteTimeout) clearTimeout(muteTimeout)
    Object.keys(instrumentInstances).forEach(function(instrumentId) {
      instrumentInstances[instrumentId].restore()
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
      , instrument = instrumentInstances[parts[1]]
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
    _.forEach(_.values(instrumentInstances), function(sound) {
      sound.mixer.gain.setTargetAtTime(0.0001, 0, 0.002)
    })
  }, 8000)
})
