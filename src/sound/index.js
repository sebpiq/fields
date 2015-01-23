var waaUtils = require('../core/waa')
  , async = require('async')
  , _ = require('underscore')
  , muteTimeout

window.fields.sound = {}

var setStatus = function(msg) {
  $('#status').html('status : ' + msg)
}

var subscribeAll = function() {
  // For all the instruments, subscribe to messages
  _.chain(instrumentInstances).keys().forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  }).values()
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
    // Start rhizome
    _.bind(rhizome.start, rhizome),
    
    // Get format support infos
    _.bind(waaUtils.formatSupport, waaUtils),
     
    // Instantiate all the instruments and load them
    function(formats, next) {
      fields.log('formats supported ' + formats)
      fields.sound.supportedFormats = formats

      _.chain(fields.config()).pairs().forEach(function(p) {
        var instrumentId = p[0]
          , config = p[1]
          , instrument = fields.instruments[config.instrument]
        instrumentInstances[instrumentId] = new instrument(instrumentId, config.args)
      }).values()
  
      async.forEach(_.values(instrumentInstances), function(instrument, nextInstrument) {
        instrument.load(nextInstrument)
      }, function(err) {
        if (err) fields.log(err)
        else fields.log('all instruments loaded')
      })
    }
  ], function(err) {
    fields.log('ERROR: ' + err)
  })

  $('#startButtonContainer').fadeOut(100)
  setStatus('connecting ...')
}

rhizome.on('connected', function() {
  if (muteTimeout) clearTimeout(muteTimeout)
  subscribeAll()
  _.forEach(_.values(instrumentInstances), function(sound) {
    sound.restore()
  })
  setStatus('connected')
})

// Message scheme :
//  /<instrument id>/<name> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('' + address + ' ' + args)
    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , instrument = instrumentInstances[parts[1]]
      , name = parts[2]
    instrument.command(name, args)
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
