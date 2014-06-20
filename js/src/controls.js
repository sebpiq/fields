window.fields.controls = {}
fields.log = console.log.bind(console)

var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('./utils/waa')
  , widgets = require('./utils/widgets')
  , math = require('./utils/math')

var controlsInstances = {}

// Start things when the user presses a button
fields.controls.start = function() {
  fields.controls.audioContext = waaUtils.kickStartWAA()
  fields.controls.clock = new WAAClock(fields.controls.audioContext)
  rhizome.start()

  var tabsHeader = $('<div>', { class: 'tabsHeader' }).appendTo('body')
    , tabsContainer = $('<div>', { class: 'tabsContainer' }).appendTo('body')

  _.chain(fields.config).pairs().forEach(function(p) {
    var instrumentId = p[0]
      , config = p[1]
      , instrument = fields.instruments[config.instrument]
      , controls = instrument.controls.apply(instrument, [instrumentId].concat(config.args))
      , title = $('<h2>').html(instrumentId)
    
    // On/off button
    controls.onOffToggle = widgets.toggle(function(state) {
      var action = state === 1 ? 'start' : 'stop'
      controlsInstances[instrumentId][action]()
      rhizome.send('/' + instrumentId + '/state', [state])
    })

    // Volume control
    var _sendVolume = rhizome.utils.throttle(100, function(args) {
      rhizome.send('/' + instrumentId + '/volume', args)
    })    
    controls.volumeSlider = widgets.slider({ title: 'Volume' }, function(val) {
      _sendVolume([ val ])
    })
    controls.volumeSlider.elem.addClass('volume')

    // Adding default controls to the container
    controlsInstances[instrumentId] = controls
    controls.container.prepend(controls.volumeSlider.elem)
    controls.container.prepend(controls.onOffToggle.elem)
    controls.container.appendTo(tabsContainer)
    controls.container.prepend(title)

    // Managing tabs
    $('<div>', { class: 'tabButton' })
      .appendTo(tabsHeader)
      .html(instrumentId)
      .click(function() {
        controls.container.toggleClass('active')
        controls.volumeSlider.refresh()
        controls.show()
        $(this).toggleClass('active')
      })
  }).values()
}

// Message scheme :
//  /<instrument id>/<parameter> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('MESSAGE : ' + address + ' ' + args)

    var parts = address.split('/') // beware : leading trailing slash cause parts[0] to be ""
      , controls = controlsInstances[parts[1]]
      , parameter = parts[2]

    // This is used only to resend values, and if there was no arg there is presumably no value
    // to restore.
    if (args.length) {
      if (parameter === 'state')
        controls.onOffToggle.setState(args[0])
      else if (parameter === 'volume')
        controls.volumeSlider.setVal(args[0])
      else controls.setParameter(parameter, args)
    }
  }
})

rhizome.on('connected', function() {
  // Loading all the controls
  async.forEach(_.values(controlsInstances), function(controls, next) {
    controls.load(next)
  }, function(err) {
    if (err) fields.log('error loading controls : ' + err)
  })
})

rhizome.on('server full', function() {})
rhizome.on('connection lost', function() {})
rhizome.on('reconnected', function() {})