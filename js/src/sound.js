var waaUtils = require('./utils/waa')
  , math = require('./utils/math')
  , async = require('async')
  , _ = require('underscore')

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
  fields.sound.audioContext = waaUtils.kickStartWAA()
  fields.sound.clock = new WAAClock(fields.sound.audioContext)
  fields.sound.clockUsers = 0

  waaUtils.formatSupport(function(err, formats) {
    fields.log('formats supported ' + formats)
    fields.sound.supportedFormats = formats
    rhizome.start()
  })
  $('#startButtonContainer').fadeOut(100)
  setStatus('connecting ...')
}

rhizome.on('connected', function() {

  // For each instrument, create the sound engine
  _.chain(fields.config()).pairs().forEach(function(p) {
    var instrumentId = p[0]
      , config = p[1]
      , instrument = fields.instruments[config.instrument]
    instrumentInstances[instrumentId] = new instrument(instrumentId, config.args)
  }).values()

  // For each instrument, load things and assets
  async.forEach(_.values(instrumentInstances), function(instrument, next) {
    instrument.load(next)
  }, function(err) {
    if (err) fields.log(err)
    else fields.log('all instruments loaded')
  })

  subscribeAll()
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

rhizome.on('server full', function() {
  setStatus('waiting ...')
})

var muteTimeout

rhizome.on('connection lost', function() {
  setStatus('waiting ...')
  muteTimeout = setTimeout(function() {
    _.forEach(_.values(instrumentInstances), function(sound) {
      sound.mixer.gain.setTargetAtTime(0.0001, 0, 0.002)
    })
  }, 8000)
})

rhizome.on('reconnected', function() {
  if (muteTimeout) clearTimeout(muteTimeout)
  subscribeAll()
  _.forEach(_.values(instrumentInstances), function(sound) {
    sound.restore()
  })
  setStatus('connected')
})
