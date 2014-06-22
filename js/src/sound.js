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
  _.chain(soundInstances).keys().forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  }).values()
}

// Contains all the instances of sound engines for each declared instrument
// `{ <instrument id>: <sound instance> }`
var soundInstances = {}

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
    soundInstances[instrumentId] = instrument.sound.apply(instrument, [instrumentId].concat(config.args))
  }).values()

  // For each instrument, load things and assets
  async.forEach(_.values(soundInstances), function(instrument, next) {
    instrument.load(next)
  }, function(err) {
    if (err) fields.log(err)
    else fields.log('all instruments loaded')
  })

  subscribeAll()
  setStatus('connected')
})

// Message scheme :
//  /<instrument id>/<parameter> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('' + address + ' ' + args)
    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , instrument = soundInstances[parts[1]]
      , parameter = parts[2]

    if (parameter === 'state')
      var state = args[0]
      if (state === 0) instrument.stop()
      else if (state === 1) instrument.start()
    else if (parameter === 'volume')
      instrument.mixer.gain.setTargetAtTime(math.valExp(args[0], 2.5), 0, 0.002)
    else instrument.setParameter(parameter, args)
  }
})

rhizome.on('server full', function() {
  setStatus('waiting ...')
})

var muteTimeout

rhizome.on('connection lost', function() {
  setStatus('waiting ...')
  muteTimeout = setTimeout(function() {
    _.forEach(_.values(soundInstances), function(sound) {
      sound.mixer.gain.setTargetAtTime(0.0001, 0, 0.002)
    })
  }, 8000)
})

rhizome.on('reconnected', function() {
  if (muteTimeout) clearTimeout(muteTimeout)
  subscribeAll()
  _.forEach(_.values(soundInstances), function(sound) {
    sound.restore()
  })
  setStatus('connected')
})
