var HTTPError = exports.HTTPError = function HTTPError(message) {
  this.message = (message || '')
}
HTTPError.prototype = Object.create(Error.prototype)
HTTPError.prototype.name = 'HTTPError'

var DecodeError = exports.DecodeError = function DecodeError(message) {
  this.message = (message || '')
}
DecodeError.prototype = Object.create(Error.prototype)
DecodeError.prototype.name = 'DecodeError'