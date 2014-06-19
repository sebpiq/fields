var _ = require('underscore')

var mouseDown = false

$(function() {
  $('body')
    .on(TouchMouseEvent.DOWN, function() { mouseDown = true })
    .on(TouchMouseEvent.UP, function() { mouseDown = false })
})

// `mode` can be :
//  - 'toggle' only one track per step can be active
//  - 'normal' there is no restriction in active steps
exports.grid = function(mode, trackCount, stepCount) {
  var grid = $('<div>', { class: 'grid' })

  _.forEach(_.range(trackCount), function(trackId) {
    var track = $('<div>', { class: 'track track-' + trackId }).appendTo(grid)
    _.forEach(_.range(stepCount), function(stepId) {
      $('<div>', { class: 'step step-' + stepId }).appendTo(track)
        .click(function() {
          var cls = $(this).attr('class')
          if (mode === 'toggle')
            grid.find('.step-' + stepId).removeClass('active')
          $(this).attr('class', cls).toggleClass('active')
        })
    })
  })

  return grid
}

// `onToggleClick(active)` is called when the toggle is clicked. 
exports.toggle = function(onToggleClick) {
  return $('<div>', { class: 'toggle' }).click(function() {
    $(this).toggleClass('active')
    onToggleClick.call(this, $(this).hasClass('active'))
  })
}

exports.xyPad = function(opts, onMove) {
  var xyPad = $('<div>', { class: 'xyPad' })
    , inner = $('<div>', { class: 'inner' }).appendTo(xyPad)
    , cursor = $('<div>', { class: 'cursor' }).appendTo(inner)
    , valueFeedback = $('<div><span class="title">' + (opts.title || '') + '</span> '
      + (opts.xLabel || 'X') + ': <span class="x">0</span> | '
      + (opts.yLabel || 'Y') + ': <span class="y">1</span></div>',
        { class: 'valueFeedback' }).appendTo(xyPad)
    , cursorSize = $(document).width() * 0.07
  xyPad.css({ padding: cursorSize / 2 })
  cursor.css({
    width: cursorSize, height: cursorSize,
    left: -cursorSize / 2, top: -cursorSize / 2
  })

  var moveOrClick = function(event) {
    var xPos = Math.max(Math.min(event.pageX - inner.get(0).offsetLeft, inner.width()), 0)
      , yPos = Math.max(Math.min(event.pageY - inner.get(0).offsetTop, inner.height()), 0)
      , yVal = Math.min(1 - yPos / inner.height(), 1)
      , xVal = Math.min(xPos / inner.width(), 1)
    cursor.css({ left: xPos - cursorSize / 2, top: yPos - cursorSize / 2 })
    valueFeedback.find('.x').html(xVal.toString().slice(0, 4))
    valueFeedback.find('.y').html(yVal.toString().slice(0, 4))
    onMove(xVal, yVal)
  }

  xyPad.on(TouchMouseEvent.DOWN, function() {
    xyPad.on(TouchMouseEvent.MOVE, moveOrClick)
  })

  inner.on(TouchMouseEvent.DOWN, moveOrClick)

  $('body').on(TouchMouseEvent.UP, function() {
    xyPad.off(TouchMouseEvent.MOVE)
  })

  return xyPad
}

exports.slider = function(opts, onMove) {
  var slider = $('<div>', { class: 'slider' })
    , inner = $('<div>', { class: 'inner' }).appendTo(slider)
    , cursor = $('<div>', { class: 'cursor' }).appendTo(inner)
    , valueFeedback = $('<div><span class="title">' + (opts.title || '') + '</span>: '
      + '<span class="val">0</span>',
        { class: 'valueFeedback' }).appendTo(slider)
    , cursorSize = $(document).width() * 0.07
  slider.css({ paddingLeft: cursorSize / 2, paddingRight: cursorSize / 2 })
  cursor.css({
    width: cursorSize, height: cursorSize,
    left: -cursorSize / 2
  })

  slider.on(TouchMouseEvent.DOWN, function() {
    slider.on(TouchMouseEvent.MOVE, function(event) {
      var xPos = Math.max(Math.min(event.pageX - inner.get(0).offsetLeft, inner.width()), 0)
        , val = Math.min(xPos / slider.width(), 1)
      cursor.css({ left: xPos - cursorSize / 2 })
      valueFeedback.find('.val').html(val.toString().slice(0, 4))
      onMove(val)
    })
  })

  $('body').on(TouchMouseEvent.UP, function() {
    slider.off(TouchMouseEvent.MOVE)
  })

  return slider 
}