window.fields.controls = {}

var waaUtils = require('./utils/waa')
  , widgets = require('./utils/widgets')

// Start things when the user presses a button
fields.controls.start = function() {
  fields.controls.audioContext = waaUtils.kickStartWAA()
  fields.controls.clock = new WAAClock(fields.controls.audioContext)
  rhizome.start()

  _.chain(fields.config).pairs().forEach(function(p) {
    var instrumentId = p[0]
      , config = p[1]
      , instrument = fields.instruments[config.instrument]
      , controls = instrument.controls.apply(instrument, [instrumentId].concat(config.args))
      , onOff = widgets.toggle(function(active) {
        rhizome.send('/' + instrumentId + '/' + (active ? 'start' : 'stop'))
      })

    controls.prepend(onOff)
  }).values()
}

// Message scheme :
//  /<instrument id>/<parameter> [args]
rhizome.on('message', function(address, args) {
  fields.log(address + ' ' + args)
})

rhizome.on('connected', function() {})
rhizome.on('server full', function() {})
rhizome.on('connection lost', function() {})
rhizome.on('reconnected', function() {})