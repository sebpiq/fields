var _ = require('underscore')

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
// TODO : HTTPError
exports.loadFile = function(opts, done) {
  var request = new XMLHttpRequest()
  request.open('GET', opts.url, true)
  request.responseType = opts.responseType
  request.onload = function(res) {
    if (request.status === 200) done(null, request.response)
    else done(new HTTPError(request.statusText))
  }
  request.onerror = function(err) {
    done(err || new Error('unexpected request error'), null)
  }
  request.send()
}