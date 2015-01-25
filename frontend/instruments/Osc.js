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
      mapping: function(inVal) {
        return math.valExp(inVal, 4) * 1000
      },
      onValue: function(carrierFreq) {
        this.instrument.carrierFreq = carrierFreq
        if (this.instrument.started)
          this.instrument.freqModOffset.offset.linearRampToValueAtTime(
            carrierFreq, fields.sound.audioContext.currentTime + 0.05)
      }
    }),

    'freqModFreq': ports.NumberPort.extend({
      mapping: function(inVal) {
        return math.valExp(inVal, 4) * 100
      },
      onValue: function(freqModFreq) {
        this.instrument.freqModFreq = freqModFreq
        if (this.instrument.started)
          this.instrument.freqModOsc.frequency.linearRampToValueAtTime(
            freqModFreq, fields.sound.audioContext.currentTime + 0.05)
      }
    }),

    'freqModAmount': ports.NumberPort.extend({
      onValue: function(freqModAmount) {
        this.instrument.freqModAmount = freqModAmount
        if (this.instrument.started) {
          this.instrument.freqModAmountGain.gain.value = (this.instrument.carrierFreq * freqModAmount)
        }
      }
    }),

    'ampModFreq': ports.NumberPort.extend({
      mapping: function(inVal) {
        return math.valExp(inVal, 4) * 100
      },
      onValue: function(ampModFreq) {
        this.instrument.ampModFreq = ampModFreq
        if (this.instrument.started)
          this.instrument.ampModOsc.frequency.linearRampToValueAtTime(
            ampModFreq, fields.sound.audioContext.currentTime + 0.05)
      }
    }),

    'ampModAmount': ports.NumberPort.extend({
      onValue: function(ampModAmount) {
        this.instrument.ampModAmount = ampModAmount
        if (this.instrument.started) {
          this.instrument.ampModAmountGain.gain.value = ampModAmount
        }
      },
    })

  }),

  init: function(args) {
    this.carrierFreq = 100
    this.ampModFreq = 0
    this.freqModFreq = 0
    this.ampModAmount = 0
    this.freqModAmount = 0
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

    this.ports['carrierFreq'].onValue(this.carrierFreq)
    this.ports['freqModFreq'].onValue(this.freqModFreq)
    this.ports['freqModAmount'].onValue(this.freqModAmount)
    this.ports['ampModFreq'].onValue(this.ampModFreq)
    this.ports['ampModAmount'].onValue(this.ampModAmount)
  },

  onStop: function() {
    this.ampModOsc.stop(0)
    this.freqModOsc.stop(0)
    this.carrierOsc.stop(0)
    this.ampModGain.disconnect()
  }

})
