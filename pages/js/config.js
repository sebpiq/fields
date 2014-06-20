fields.config = {

  'radio': {
    instrument: 'granulator',
    args: ['sounds/radio/' + Math.floor(1 + Math.random() * 4.99) + '.wav']
  },

  'noise': {
    instrument: 'whiteNoise',
    args: []
  },

  'explosion': {
    instrument: 'trigger',
    args: ['sounds/glass/' + (1 + Math.floor(Math.random() * 4.99))  + '.wav']
  },

  'wood hits 1': {
    instrument: 'distributedSequencer',
    args: [16, [
      'sounds/wood_hits/4.wav',
      'sounds/wood_hits/3.wav',
      'sounds/wood_hits/2.wav',
      'sounds/wood_hits/1.wav'
    ], 650]
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

  'violin-grains': {
    instrument: 'granulator',
    args: ['sounds/violin_fields_boosted.wav']
  },

  'violin-seq': {
    instrument: 'distributedSequencer',
    args: [16, [
      'sounds/violin-seq/4.wav',
      'sounds/violin-seq/3.wav',
      'sounds/violin-seq/2.wav',
      'sounds/violin-seq/1.wav'
    ], 600 + Math.random() * 8]
  },

  'wood-blocks': {
    instrument: 'distributedSequencer',
    args: [16, [
      'sounds/wood-blocks/4.wav',
      'sounds/wood-blocks/3.wav',
      'sounds/wood-blocks/2.wav',
      'sounds/wood-blocks/1.wav'
    ], 600 + Math.random() * 8]
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