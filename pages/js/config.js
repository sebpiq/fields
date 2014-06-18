fields.config = {

  'sequencer1': {
    instrument: 'distributedSequencer',
    args: [16, [
      'sounds/sequencer/0/4.wav',
      'sounds/sequencer/0/3.wav',
      'sounds/sequencer/0/2.wav',
      'sounds/sequencer/0/1.wav'
    ], 800]
  },

  'sequencer2': {
    instrument: 'centralizedSequencer',
    args: [8, ['sounds/kick.wav', 'sounds/snare.wav']]
  }

}