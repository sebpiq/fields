var _ = require('underscore')
  , widgets = require('../utils/widgets')


var Mixin = {

  start: function() {
    if (this.started === false) {
      this.started = true
      this._start()
    }
  },

  stop: function() {
    if (this.started === true) {
      this.started = false
      this._stop()
    }
  },

  _start: function() {},
  _stop: function() {},

  restoreParams: function(params) {
    var self = this
    _.forEach(params, function(param) {
      rhizome.send('/sys/resend', ['/' + self.instrumentId + '/' + param])
    })
  }

}

var Sound = exports.BaseSound = function(instrumentId) {
  this.mixer = fields.sound.audioContext.createGain()
  this.mixer.gain.value = 0
  this.mixer.connect(fields.sound.audioContext.destination)

  this.started = false
  this.instrumentId = instrumentId
}
_.extend(Sound.prototype, Mixin, {})

var Controls = exports.BaseControls = function(instrumentId) {
  var self = this
  this.started = false
  this.instrumentId = instrumentId
  this.container = $('<div>', { class: 'instrument ' + instrumentId })

  // On/off button
  this.onOffToggle = new widgets.Toggle(function(state) {
    var action = state === 1 ? 'start' : 'stop'
    self[action]()
    rhizome.send('/' + instrumentId + '/state', [state])
  })

  // Volume control
  var _sendVolume = rhizome.utils.throttle(200, function(args) {
    rhizome.send('/' + instrumentId + '/volume', args)
  })    
  this.volumeSlider = new widgets.Slider({ title: 'Volume' }, function(val) {
    _sendVolume([ val ])
  })
  this.volumeSlider.elem.addClass('volume')

  this.container.prepend(this.volumeSlider.elem)
  var title = $('<h2>').html(instrumentId).prependTo(this.container)
  this.onOffToggle.elem.appendTo(title)
}

_.extend(Controls.prototype, Mixin, {
  container: null,
  show: function() {}
})