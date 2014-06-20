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

  return {
    elem: grid,

    refresh: function() {},
    
    setSequence: function(sequence) {
      var i, j
      for (i = 0, j = 1; j < sequence.length; i+=2, j+=2)
        $('.track-' + sequence[i] + ' .step-' + sequence[j]).addClass('active')
    },

    getSequence: function() {
      var sequence = []
      grid.find('.track').each(function(i, track) {
        $(track).find('.step').each(function(j, step) {
          if ($(step).hasClass('active')) {
            sequence.push(i)
            sequence.push(j)
          }
        })
      })
      return sequence
    }
  }
}

// `onToggleClick(active)` is called when the toggle is clicked. 
exports.toggle = function(onToggleClick) {
  var toggle = $('<div>', { class: 'toggle' }).click(function() {
    $(this).toggleClass('active')
    onToggleClick.call(this, $(this).hasClass('active') ? 1 : 0)
  })

  return {
    elem: toggle,

    refresh: function() {},

    setState: function(state) {
      if (state === 1) toggle.addClass('active')
    }
  }
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

  var setValueFeedback = function(pos) {
    valueFeedback.find('.x').html(pos[0].toString().slice(0, 4))
    valueFeedback.find('.y').html(pos[1].toString().slice(0, 4))
  }

  xyPad.on(TouchMouseEvent.DOWN, function() {
    xyPad.on(TouchMouseEvent.MOVE, moveOrClick)
  })
  inner.on(TouchMouseEvent.DOWN, moveOrClick)

  $('body').on(TouchMouseEvent.UP, function() {
    xyPad.off(TouchMouseEvent.MOVE)
  })

  return {
    elem: xyPad,

    _position: [0, 0],

    refresh: function() {
      this.setPosition(this._position)
    },

    setPosition: function(pos) {
      this._position = pos
      setValueFeedback(pos)
      cursor.css({
        left: inner.width() * pos[0] - cursorSize / 2,
        top: inner.height() * (1 - pos[1]) - cursorSize / 2
      })
    }
  }
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

  var moveOrClick = function(event) {
    var xPos = Math.max(Math.min(event.pageX - inner.get(0).offsetLeft, inner.width()), 0)
      , val = Math.min(xPos / slider.width(), 1)
    cursor.css({ left: xPos - cursorSize / 2 })
    setValueFeedback(val)
    onMove(val)
  }

  slider.on(TouchMouseEvent.DOWN, function() {
    slider.on(TouchMouseEvent.MOVE, moveOrClick)
  })
  inner.on(TouchMouseEvent.DOWN, moveOrClick)

  $('body').on(TouchMouseEvent.UP, function() {
    slider.off(TouchMouseEvent.MOVE)
  })

  var setValueFeedback = function(val) {
    valueFeedback.find('.val').html(val.toString().slice(0, 4))
  }

  return {
    elem: slider,

    _val: 0,

    refresh: function() {
      this.setVal(this._val)
    },

    setVal: function(val) {
      this._val = val
      setValueFeedback(val)
      cursor.css({ left: val * inner.width() - cursorSize / 2 })
    }
  } 
}