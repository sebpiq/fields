window.fields.controls = {}
fields.log = console.log.bind(console)

var async = require('async')
  , _ = require('underscore')
  , waaUtils = require('./utils/waa')
  , math = require('./utils/math')

fields.controls.start = function() {
  fields.controls.audioContext = waaUtils.kickStartWAA()
  fields.controls.clock = new WAAClock(fields.controls.audioContext)

  // Fix nexusUI objects so that they send the same data
  nx.nxObjects.forEach(function(widget) {
    var address = widget.canvas.getAttribute('address')
      , noautosend = widget.canvas.getAttribute('noautosend')
      , onvalue = widget.canvas.getAttribute('onvalue')
      , _getArgs

    if (address && noautosend === null) {
      if (widget.getName() === 'button')
        _getArgs = function(data) { return [data.press] }
      else if (widget.getName() === 'position')
        _getArgs = function(data) { return [data.x, 1 - data.y] }
      else
        _getArgs = function(data) { return [data] }
      widget.events.on('data', rhizome.utils.throttle(100, function(data) {
        var args = _getArgs(data)
        rhizome.send(address, args)
      }))

    } else if (onvalue) {
      onvalue = eval('onvalue = function(data) { ' + onvalue + ' }')
      widget.events.on('data', onvalue)
    }

    if (widget.getName() === 'matrix') {
      if (widget.canvas.getAttribute('col'))
        widget.col = parseInt(widget.canvas.getAttribute('col'), 10)
      if (widget.canvas.getAttribute('row'))
        widget.row = parseInt(widget.canvas.getAttribute('row'), 10)
      widget.init()
      widget.draw()
      console.log(widget.matrix)
    }

  })

  $('div[panel]').each(function(i, panel) {
    var $panel = $(panel)
      , panelName = panel.getAttribute('panel')
      , title = $('<h2>').html(panelName)
    $panel.addClass('fields-panel')
    $panel.removeClass('active') // HACK allows nexusUI to size widgets properly

    // Managing tabs
    $('<div>', { class: 'fields-panel-button' })
      .appendTo('#fields-panel-buttons')
      .html(panelName)
      .click(function() {
        $panel.toggleClass('active')
        $(this).toggleClass('active')
      })

  })

  rhizome.start()
}

// Message scheme :
//  /<instrument id>/<parameter> [args]
rhizome.on('message', function(address, args) {
  if (address === '/sys/subscribed') fields.log('subscribed ' + args[0])
  else {
    fields.log('MESSAGE : ' + address + ' ' + args)

    var widget = nx.nxObjects.filter(function(widget) {
      return address === widget.canvas.getAttribute('address')
    })[0]

    if (widget.getName() === 'position') widget.set({x: args[0], y: 1 - args[1]})
    else if (widget.getName() === 'matrix') {
      fields.controls.setMatrix(address, args)
    }

    else widget.set(args[0])
  }
})

rhizome.on('connected', function() {
  // Resending previous values
  _.forEach(nx.nxObjects, function(widget) {
    var address = widget.canvas.getAttribute('address')
    if (address)
      rhizome.send('/sys/resend', [ widget.canvas.getAttribute('address') ])
  })
})

rhizome.on('server full', function() {})
rhizome.on('connection lost', function() {})
rhizome.on('reconnected', function() {})


var findWidgetByAddress = function(address) {
  return _.find(nx.nxObjects, function(widget) {
    return widget.canvas.getAttribute('address') === address
  })
}

fields.controls.sendMatrix = function(address) {
  var matrix = findWidgetByAddress(address)
    , sequence = []

  _.forEach(matrix.matrix, function(track, trackInd) {
    _.forEach(track, function(step, stepInd) {
      if (step > 0) {
        sequence.push(trackInd)
        sequence.push(stepInd)
      }
    })
  })

  rhizome.send(address, sequence)
}

fields.controls.setMatrix = function(address, sequence) {
  var matrix = findWidgetByAddress(address)
  _.times(matrix.row, function(row) {
    _.times(matrix.col, function(col) { matrix.matrix = 0 })
  })
  matrix.init()
  for (i = 0, j = 1; j < sequence.length; i+=2, j+=2) {
    var row = sequence[i]
      , col = sequence[j]
    matrix.matrix[row][col] = 1
  }
  matrix.draw()
}

fields.controls.resetMatrix = function(address) {
  fields.controls.setMatrix(address, [])
}

fields.controls.sendSineEnvelope = function() {
  var args = []
  var sineVolEnvWidget = _.find(nx.nxObjects, function(widget) {
    return widget.canvasID === 'sineVolEnvelope'
  })
  var sinePitchEnvWidget = _.find(nx.nxObjects, function(widget) {
    return widget.canvasID === 'sinePitchEnvelope'
  })
  var sineSliderWidget = _.find(nx.nxObjects, function(widget) {
    return widget.canvasID === 'sineSlider'
  })
  args.push(sineVolEnvWidget.val.x)
  args.push(1 - sineVolEnvWidget.val.y)
  args.push(sinePitchEnvWidget.val.x)
  args.push(1 - sinePitchEnvWidget.val.y)
  args.push(sineSliderWidget.val)
  rhizome.send('/sine/play', args)
}