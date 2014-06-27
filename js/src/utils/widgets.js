var _ = require('underscore')


var BaseWidget = function() {
  this.elem = $('<div>', { class: 'widget ' + this.cssClass })
}

_.extend(BaseWidget.prototype, {
  cssClass: '',
  refresh: function() {}
})

// `mode` can be :
//  - 'toggle' only one track per step can be active
//  - 'normal' there is no restriction in active steps
var Grid = exports.Grid = function(mode, trackCount, stepCount) {
  var self = this
    , buttonsContainer = $('<div>', { class: 'buttonsContainer' })
    , resetSequenceButton = $('<button>', { class: 'resetSequenceButton' })
      .html('Reset')
      .appendTo(buttonsContainer)
  BaseWidget.call(this)

  _.forEach(_.range(trackCount), function(trackId) {
    var track = $('<div>', { class: 'track track-' + trackId }).appendTo(self.elem)
    _.forEach(_.range(stepCount), function(stepId) {
      $('<div>', { class: 'step step-' + stepId }).appendTo(track)
        .click(function() {
          var cls = $(this).attr('class')
          if (mode === 'toggle')
            self.elem.find('.step-' + stepId).removeClass('active')
          $(this).attr('class', cls).toggleClass('active')
        })
    })
  })
  self.elem.append(buttonsContainer)

  // Reset sequence on click
  resetSequenceButton.click(function() {
    self.elem.find('.step').removeClass('active')
  })

}

_.extend(Grid.prototype, {

  cssClass: 'grid',

  setSequence: function(sequence) {
    var i, j
    for (i = 0, j = 1; j < sequence.length; i+=2, j+=2)
      this.elem.find('.track-' + sequence[i] + ' .step-' + sequence[j]).addClass('active')
  },

  getSequence: function() {
    var sequence = []
    this.elem.find('.track').each(function(i, track) {
      $(track).find('.step').each(function(j, step) {
        if ($(step).hasClass('active')) {
          sequence.push(i)
          sequence.push(j)
        }
      })
    })
    return sequence
  }

})

// `onToggleClick(active)` is called when the toggle is clicked. 
var Toggle = exports.Toggle = function(onToggleClick) {
  BaseWidget.call(this)
  this.elem.click(function() {
    $(this).toggleClass('active')
    onToggleClick.call(this, $(this).hasClass('active') ? 1 : 0)
  })
}

_.extend(Toggle.prototype, {

  cssClass: 'toggle',
  
  setState: function(state) {
    if (state === 1) this.elem.addClass('active')
  }
})

var XYPad = exports.XYPad = function(opts, onMove) {
  BaseWidget.call(this)
  this._position = [0, 0]
  this.onMove = onMove

  var self = this

  this.inner = $('<div>', { class: 'inner' })
    .appendTo(this.elem)
    .on(TouchMouseEvent.DOWN, _.bind(this._moveOrClick, this))

  this.cursorSize = $(document).width() * 0.04
  this.cursor = $('<div>', { class: 'cursor' })
    .appendTo(this.inner)
    .css({
      width: this.cursorSize, height: this.cursorSize,
      left: -this.cursorSize / 2, top: -this.cursorSize / 2
    })

  this.valueFeedback = $('<div class="feedback"><span class="title">' + (opts.title || '') + '</span> '
      + (opts.xLabel || 'X') + ': <span class="x">0</span> | '
      + (opts.yLabel || 'Y') + ': <span class="y">1</span></div>',
        { class: 'valueFeedback' }).appendTo(this.elem)

  this.elem.css({ padding: this.cursorSize / 2 })
  this.elem.on(TouchMouseEvent.DOWN, function() {
    self.elem.on(TouchMouseEvent.MOVE, _.bind(self._moveOrClick, self))
  })

  $('body').on(TouchMouseEvent.UP, function() {
    self.elem.off(TouchMouseEvent.MOVE)
  })
}

_.extend(XYPad.prototype, {

  cssClass: 'xyPad',

  refresh: function() {
    this._setValueFeedback(this._position)
    this.cursor.css({
      left: this.inner.width() * this._position[0] - this.cursorSize / 2,
      top: this.inner.height() * (1 - this._position[1]) - this.cursorSize / 2
    })
  },

  setPosition: function(pos) {
    this._position = pos
    this.refresh()
  },

  _moveOrClick: function(event) {
    var xPos = Math.max(Math.min(event.pageX - this.inner.get(0).offsetLeft, this.inner.width()), 0)
      , yPos = Math.max(Math.min(event.pageY - this.inner.get(0).offsetTop, this.inner.height()), 0)
      , yVal = Math.min(1 - yPos / this.inner.height(), 1)
      , xVal = Math.min(xPos / this.inner.width(), 1)
    this._setValueFeedback([ xVal, yVal ])
    this.cursor.css({
      left: xPos - this.cursorSize / 2,
      top: yPos - this.cursorSize / 2
    })
    this._position = [xVal, yVal]
    this.onMove(xVal, yVal)
  },

  _setValueFeedback: function(pos) {
    this.valueFeedback.find('.x').html(pos[0].toString().slice(0, 4))
    this.valueFeedback.find('.y').html(pos[1].toString().slice(0, 4))
  }

})


var Slider = exports.Slider = function(opts, onMove) {
  BaseWidget.call(this)
  this._val = 0
  this.onMove = onMove

  var self = this
  
  this.inner = $('<div>', { class: 'inner' })
    .appendTo(this.elem)
    .on(TouchMouseEvent.DOWN, _.bind(this._moveOrClick, this))

  this.cursorSize = $(document).width() * 0.04
  this.cursor = $('<div>', { class: 'cursor' })
    .appendTo(this.inner)
    .css({
      width: this.cursorSize, height: this.cursorSize,
      left: -this.cursorSize / 2
    })
  
  this.valueFeedback = $('<div class="feedback"><span class="title">'
      + (opts.title || '') + '</span>: ' + '<span class="val">0</span>',
        { class: 'valueFeedback' }).appendTo(this.elem)

  this.elem.css({ paddingLeft: this.cursorSize / 2, paddingRight: this.cursorSize / 2 })
  this.elem.on(TouchMouseEvent.DOWN, function() {
    self.elem.on(TouchMouseEvent.MOVE, _.bind(self._moveOrClick, self))
  })

  $('body').on(TouchMouseEvent.UP, function() {
    self.elem.off(TouchMouseEvent.MOVE)
  })
}

_.extend(Slider.prototype, {

  cssClass: 'slider',

  refresh: function() {
    this._setValueFeedback(this._val)
    this.cursor.css({ left: this._val * this.inner.width() - this.cursorSize / 2 })
  },

  setVal: function(val) {
    this._val = val
    this.refresh()
  },

  _setValueFeedback: function(val) {
    this.valueFeedback.find('.val').html(val.toString().slice(0, 4))
  },

  _moveOrClick: function(event) {
    var xPos = Math.max(Math.min(event.pageX - this.inner.get(0).offsetLeft, this.inner.width()), 0)
      , val = Math.min(xPos / this.elem.width(), 1)
    this._setValueFeedback(val)
    this.cursor.css({ left: xPos - this.cursorSize / 2 })
    this._val = val
    this.onMove(val)
  }

})