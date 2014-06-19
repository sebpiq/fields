var _ = require('underscore')

var Sound = exports.BaseSound = function() {
  this.mixer = fields.sound.audioContext.createGain()
  this.mixer.gain.value = 0
  this.mixer.connect(fields.sound.audioContext.destination)

  this.started = false
}

_.extend(Sound.prototype, {

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
  _stop: function() {}

})

var Controls = exports.BaseControls = function() {
  this.started = false
}

_.extend(Controls.prototype, {

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
  _stop: function() {}

})