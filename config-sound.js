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

    'noise': {
      instrument: 'WhiteNoise',
      args: []
    },

    'bells': {
      index: 7,
      instrument: 'DistributedSequencer',
      args: [8, [
        'sounds/bells/1.' + formatUsed,
        'sounds/bells/2.' + formatUsed,
        'sounds/bells/3.' + formatUsed,
        'sounds/bells/4.' + formatUsed,
      ], (639.5 / 3) + Math.random() * 8]
    },

    'clicks': {
      index: 8,
      instrument: 'DistributedSequencer',
      args: [8, [
        'sounds/clicks/1.' + formatUsed,
        'sounds/clicks/2.' + formatUsed,
        'sounds/clicks/3.' + formatUsed,
        'sounds/clicks/4.' + formatUsed
      ], 640]
    },

    'drops': {
      index: 6,
      instrument: 'Granulator',
      args: ['sounds/drops/drops.' + formatUsed]
    },

    'waves': {
      index: 10,
      instrument: 'Granulator',
      args: ['sounds/waves/waves.' + formatUsed]
    },

    'sparkles': {
      index: 2,
      instrument: 'Trigger',
      args: ['sounds/glass/' + formatUsed + '/' + (1 + rhizome.id % 5) + '.' + formatUsed]
    },

    'sine': {
      index: 9,
      instrument: 'Sine',
      args: []
    }
  }


  /*
  if (rhizome.id % 2 === 0) {
    instrus.minimal = {
      index: 7,
      instrument: 'DistributedSequencer',
      args: [8, [
        'sounds/minimal/guitar/' + formatUsed + '/1.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/2.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/3.' + formatUsed,
        'sounds/minimal/guitar/' + formatUsed + '/4.' + formatUsed,
      ], 396 + Math.random() * 8]
    }
  } else {
    instrus.minimal = {
      index: 8,
      instrument: 'DistributedSequencer',
      args: [8, [
        'sounds/minimal/marimba2/' + formatUsed + '/1.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/2.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/3.' + formatUsed,
        'sounds/minimal/marimba2/' + formatUsed + '/4.' + formatUsed,
      ], 396 + Math.random() * 8]
    }
  }
  */

  return instrus

}
