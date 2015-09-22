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
 
var _ = require('underscore')
  , errors = require('./errors')

exports.chainExtend = function() {
  var sources = Array.prototype.slice.call(arguments, 0)
    , parent = this
    , child = function() { parent.apply(this, arguments) }

  // Fix instanceof
  //child.prototype = new parent()

  // extend with new properties
  _.extend.apply(this, [child.prototype, parent.prototype].concat(sources))

  child.extend = this.extend
  return child
}

// Loads the file and calls `done(err, blob)` when done.
// `opts` must contain `url` and `responseType`
exports.loadFile = function(opts, done) {
  var request = new XMLHttpRequest()
  request.open('GET', opts.url, true)
  request.responseType = opts.responseType
  request.onload = function(res) {
    if (request.status === 200) done(null, request.response)
    else done(new errors.HTTPError(request.statusText))
  }
  request.onerror = function(err) {
    done(err || new Error('unexpected request error'), null)
  }
  request.send()
}