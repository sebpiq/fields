var waaUtils = require('./utils/waa')
  , async = require('async')

window.fields.sound = {}

var instruments = {}

// Start the whole system, when the user presses a button. 
fields.sound.start = function() {
  fields.sound.audioContext = waaUtils.kickStartWAA()
  rhizome.start()
  $('#instructions').fadeOut(100)
  $('#status').html('status: connecting ...')

  // For each instrument, create the sound engine
  _.chain(fields.config).pairs().forEach(function(p) {
    var instrumentId = p[0]
      , config = p[1]
      , instrument = fields.instruments[config.instrument]
    instruments[instrumentId] = instrument.sound.apply(instrument, [instrumentId].concat(config.args))
  }).values()

  // For each instrument, load things and assets
  async.forEach(_.values(instruments), function(instrument, next) {
    instrument.load(next)
  }, function(err) {
    if (err) fields.log(err)
    else fields.log('all instruments loaded')
  })
}

// For all the instruments, subscribe to messages
rhizome.on('connected', function() {
  _.chain(instruments).keys().forEach(function(instrumentId) {
    rhizome.send('/sys/subscribe', ['/' + instrumentId])
  }).values()
})

// Message scheme :
//  /<instrument id>/<parameter> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('message : ' + address + ' ' + args)
    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , instrument = instruments[parts[1]]
      , parameter = parts[2]

    if (parameter === 'start')
      instrument.start()
    else if (parameter === 'stop')
      instrument.stop()
    else instrument.setParameter(parameter, args)
  }
})

rhizome.on('server full', function() {})
rhizome.on('connection lost', function() {})
rhizome.on('reconnected', function() {})
