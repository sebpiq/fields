var fields = window.fields = {}

fields.isSupported = function() {
  if (typeof rhizome === 'undefined' || rhizome.isSupported()) {
    if (window.AudioContext) return true
    else return false
  } else return false
  return false
}

fields.log = function(msg) {
  $('<div>', { class: 'log' })
    .html(msg)
    .prependTo('#console')
}
//if (typeof rhizome !== 'undefined') rhizome.log = log