var async = require('async')
  , _ = require('underscore')
  , WAAOffset = require('waaoffset')
  , waaUtils = require('../core/waa')
  , math = require('../core/math')
  , Instrument = require('../core/BaseInstrument')
  , ports = require('../core/ports')

module.exports = Instrument.extend({

  portDefinitions: _.extend({}, Instrument.prototype.portDefinitions, {
    
    'carrierFreq': ports.NumberPort.extend({
      defaultValue: 100,
      mapping: function(inVal) { return math.valExp(inVal, 4) * 1000 }
    }),

    'freqModFreq': ports.NumberPort.extend({
      mapping: function(inVal) { return math.valExp(inVal, 4) * 100 }
    }),

    'freqModAmount': ports.NumberPort,

    'ampModFreq': ports.NumberPort.extend({
      mapping: function(inVal) { return math.valExp(inVal, 4) * 100 }
    }),

    'ampModAmount': ports.NumberPort

  }),

  init: function(args) {
    Instrument.prototype.init.apply(this, arguments)
    var self = this

    this.ports['carrierFreq'].on('value', function(carrierFreq) {
      if (self.started)
        self.freqModOffset.offset.linearRampToValueAtTime(
          carrierFreq, fields.sound.audioContext.currentTime + 0.05)
    })

    this.ports['freqModFreq'].on('value', function(freqModFreq) {
      if (self.started)
        self.freqModOsc.frequency.linearRampToValueAtTime(
          freqModFreq, fields.sound.audioContext.currentTime + 0.05)
    })

    this.ports['freqModAmount'].on('value', function(freqModAmount) {
      if (self.started)
        self.freqModAmountGain.gain.value = (self.ports['carrierFreq'] * freqModAmount)
    })

    this.ports['ampModFreq'].on('value', function(ampModFreq) {
      if (self.started)
        self.ampModOsc.frequency.linearRampToValueAtTime(
          ampModFreq, fields.sound.audioContext.currentTime + 0.05)
    })

    this.ports['ampModAmount'].on('value', function(ampModAmount) {
      if (self.started)
        self.ampModAmountGain.gain.value = ampModAmount
    })
  },

  load: function(done) {
    this.restore()
    done()
  },

  onStart: function() {
    this.freqModOffset = new WAAOffset(fields.sound.audioContext)
    this.carrierOsc = fields.sound.audioContext.createOscillator()
    this.carrierOsc.type = 'square'
    this.ampModOsc = fields.sound.audioContext.createOscillator()
    this.freqModOsc = fields.sound.audioContext.createOscillator()
    this.ampModAmountGain = fields.sound.audioContext.createGain()
    this.ampModGain = fields.sound.audioContext.createGain()
    this.freqModGain = fields.sound.audioContext.createGain()
    this.freqModAmountGain = fields.sound.audioContext.createGain()

    this.freqModOsc.connect(this.freqModAmountGain)
    this.freqModAmountGain.connect(this.freqModGain)
    this.freqModOffset.connect(this.freqModGain)
    this.freqModGain.connect(this.carrierOsc.frequency)
    
    this.ampModOsc.connect(this.ampModAmountGain)
    this.ampModAmountGain.connect(this.ampModGain.gain)

    this.carrierOsc.connect(this.ampModGain)
    this.ampModGain.connect(this.mixer)

    this.ampModOsc.start(0)
    this.freqModOsc.start(0)
    this.carrierOsc.start(0)

    this.ports['carrierFreq'].emit('value', this.ports['carrierFreq'].value)
    this.ports['freqModFreq'].emit('value', this.ports['freqModFreq'].value)
    this.ports['freqModAmount'].emit('value', this.ports['freqModAmount'].value)
    this.ports['ampModFreq'].emit('value', this.ports['ampModFreq'].value)
    this.ports['ampModAmount'].emit('value', this.ports['ampModAmount'].value)
  },

  onStop: function() {
    this.ampModOsc.stop(0)
    this.freqModOsc.stop(0)
    this.carrierOsc.stop(0)
    this.ampModGain.disconnect()
  }

})
