/*
 *  Fields
 *  Copyright (C) 2015 Sébastien Piquemal <sebpiq@gmail.com>, Tim Shaw <tim@triptikmusic.co.uk>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
var utils = require('./utils')

// This must be executed on a user action, and will return a working audio context.
exports.kickStartWAA = function() {
  audioContext = new AudioContext()
  var osc = audioContext.createOscillator()
    , gain = audioContext.createGain()
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(audioContext.destination)
  osc.start(0)
  osc.stop(1)
  return audioContext
}

// Loads an audio buffer from sound file at `url`.  
var loadBuffer = exports.loadBuffer = function(url, done) {
  utils.loadFile({ url: url, responseType: 'arraybuffer' }, function(err, blob) {
    //if (url.indexOf('assets/samples/clicks') === 0) console.log('loaded', url, err)
    if (err) return done(err)
    decodeBlob(blob, function(err, buffer) {
      //if (url.indexOf('assets/samples/clicks') === 0) console.log('decoded', url)
      //if (url.indexOf('assets/samples/clicks') === 0) debugger
      if (err) {
        if (err instanceof DecodeError) err.message += ' ' + url
        return done(err)
      }
      done(null, buffer)
    })
  })
}

// Test for support of sound formats. Returns a list :
// `['format1', 'format2', ...]`. Formats tested are 'ogg', 'mp3' and 'wav'.
var formatSupport = exports.formatSupport = function(done) {
  var results = []
    , formatList = [
      ['wav', 'format-support/sample.wav'],
      ['mp3', 'format-support/sample.mp3'],
      ['ogg', 'format-support/sample.ogg']
    ]
    , format

  var cb = function(fileType, err, buffer) {
    var support

    // catch error only if decoding error
    if (err) {
      if (err instanceof DecodeError) support = false 
      else return done(err)

    // if no error, we test that the buffer is decoded as expected
    } else if (buffer.numberOfChannels === 1 && Math.round(buffer.duration * 1000) === 50)
      support = true

    // if buffer doesn't contain expected data we consider the format not supported
    else support = false

    // Add format to `results` if supported, then move on to next format
    if (support === true) results.push(fileType)
    if (formatList.length > 0) {
      format = formatList.pop()
      loadBuffer(format[1], cb.bind(this, format[0]))
    } else done(null, results)
  }
  format = formatList.pop()
  loadBuffer(format[1], cb.bind(this, format[0]))
}

// Simple helper to plot mono buffers. For debugging purpose only 
var plottedBuffers = []
exports.plotBuffer = function(buffer, svg) {
  var downsampleFactor = 100
    , samples = buffer.getChannelData(0)
    , sampleRate = buffer.sampleRate
    , width = svg.attr('width') || 300
    , height = svg.attr('height') || 300
    , data = []

  for (i = 0, length = buffer.length; i < length; i+=downsampleFactor)
    data.push([i / sampleRate, samples[i]])

  var x = d3.scale.linear()
    .range([ 0, width ])

  var y = d3.scale.linear()
    .range([ height, 0 ])

  var line = d3.svg.line()
    .x(function(d) { return x(d[0]) })
    .y(function(d) { return y(d[1]) })

  x.domain(d3.extent(data, function(d) { return d[0] }))
  y.domain(d3.extent(data, function(d) { return d[1] }))

  svg.append('path')
    .datum(data)
    .attr('class', 'plot plot-' + plottedBuffers.length % 2)
    .attr('d', line)

  plottedBuffers.push(buffer)
}

// Decodes `blob` and calls `done(err, blob)` when done.
var decodeBlob = function(blob, done) {
  fields.sound.audioContext.decodeAudioData(blob, function(buffer) {
    done(null, buffer)
  }, function(err) {
    done(err || new DecodeError('decoding error'), null)
  })
}

var HTTPError = function HTTPError(message) {
  this.message = (message || '')
}
HTTPError.prototype = Object.create(Error.prototype)
HTTPError.prototype.name = 'HTTPError'

var DecodeError = function DecodeError(message) {
  this.message = (message || '')
}
DecodeError.prototype = Object.create(Error.prototype)
DecodeError.prototype.name = 'DecodeError'
