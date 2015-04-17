var path = require('path')

module.exports = {
  server: {
    port: 8000,
    tmpDir: path.join(__dirname, 'tmp'),
    assetsDir: path.join(__dirname, 'assets')
  },

  osc: {
    port: 9000
  },

  instruments: function() {

    return {
      'simple-osc': {
        instrument: 'WebPdInstrument',
        args: ['assets/patches/simple-osc.pd']
      }
    }

  }

}
