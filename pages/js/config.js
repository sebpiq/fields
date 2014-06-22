fields.config = function() {

  var formatUsed
  if (fields.sound) {
    if (fields.sound.supportedFormats.indexOf('ogg') !== -1)
      formatUsed = 'ogg'
    else if (fields.sound.supportedFormats.indexOf('mp3') !== -1)
      formatUsed = 'mp3'
    else if (fields.sound.supportedFormats.indexOf('wav') !== -1)
      formatUsed = 'wav'
    fields.log('format used ' + formatUsed)
  } else formatUsed = ''

  instrus = {

    'radio': {
      index: 0,
      instrument: 'granulator',
      args: ['sounds/radio/' + formatUsed + '/' + (1 + rhizome.userId % 5) + '.' + formatUsed]
    },

    'noise': {
      index: 1,
      instrument: 'whiteNoise',
      args: []
    },

    'sparkles': {
      index: 2,
      instrument: 'trigger',
      args: ['sounds/glass/' + formatUsed + '/' + (1 + rhizome.userId % 5) + '.' + formatUsed]
    },

    'clicks': {
      index: 3,
      instrument: 'distributedSequencer',
      args: [16, [
        'sounds/noise/1.wav',
        'sounds/noise/2.wav',
        'sounds/noise/3.wav',
        'sounds/noise/4.wav',
      ], 639.5 + Math.random()]
    },

    'blocks': {
      index: 4,
      instrument: 'distributedSequencer',
      args: [16, [
        'sounds/wood_block/' + formatUsed + '/1.' + formatUsed,
        'sounds/wood_block/' + formatUsed + '/2.' + formatUsed,
        'sounds/wood_block/' + formatUsed + '/3.' + formatUsed,
        'sounds/wood_block/' + formatUsed + '/4.' + formatUsed,
      ], 640]
    },

    'violins': {
      index: 5,
      instrument: 'granulator',
      args: ['sounds/violins/violin.' + formatUsed]
    },

    'drops': {
      index: 6,
      instrument: 'granulator',
      args: ['sounds/drops/drops.' + formatUsed]
    },

    'minimal': null,

    'waves': {
      index: 8,
      instrument: 'granulator',
      args: ['sounds/waves/waves.' + formatUsed]
    }

  }

  if (rhizome.userId % 2 === 0) {
    instrus.minimal = {
      index: 7,
      instrument: 'distributedSequencer',
      args: [16, [
        'sounds/minimal/guitar/' + formatUsed + '/1.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/2.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/3.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/4.' + formatUsed,
      ], 396 + Math.random() * 8]
    }
  } else {
    instrus.minimal = {
      index: 8,
      instrument: 'distributedSequencer',
      args: [16, [
        'sounds/minimal/marimba2/' + formatUsed + '/1.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/2.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/3.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/4.' + formatUsed,
      ], 396 + Math.random() * 8]
    }
  }

  return instrus

}