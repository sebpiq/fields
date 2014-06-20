var _ = require('underscore')

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
  this.started = false
  this.instrumentId = instrumentId
}
_.extend(Controls.prototype, Mixin, {
  show: function() {}
})