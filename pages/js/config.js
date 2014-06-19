fields.config = {

  'wood hits 1': {
    instrument: 'distributedSequencer',
    args: [16, [
      'sounds/wood_hits/4.wav',
      'sounds/wood_hits/3.wav',
      'sounds/wood_hits/2.wav',
      'sounds/wood_hits/1.wav'
    ], 600 + Math.random() * 5]
  },

  'wood hits 2': {
    instrument: 'centralizedSequencer',
    args: [8, [
      'sounds/wood_hits/4.wav',
      'sounds/wood_hits/3.wav',
      'sounds/wood_hits/2.wav',
      'sounds/wood_hits/1.wav'
    ]]
  },

  'radio': {
    instrument: 'granulator',
    args: ['sounds/radio/' + Math.floor(1 + Math.random() * 4.99) + '.wav']
  },

  'noise': {
    instrument: 'whiteNoise',
    args: []
  },

  'seaguls': {
    instrument: 'granulator',
    args: ['sounds/uk_terns.wav']
  },

  'wood': {
    instrument: 'granulator',
    args: ['sounds/wood_cracks.wav']
  },

  'violins': {
    instrument: 'granulator',
    args: ['sounds/violin_fields_boosted.wav']
  },


  'drops': {
    instrument: 'granulator',
    args: ['sounds/fields_drops.wav']
  },

  'waves': {
    instrument: 'granulator',
    args: ['sounds/fields_waves.wav']
  }

}