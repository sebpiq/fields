var Grains = function(url) {
  this.params = {
    position: [0, 0],
    duration: [0.1, 0],
    ratio: [0.5, 0],
    env: 1,
    volume: 0,
    density: 0,
    mode: 'off'
  }
  this.url = url
  this.mixer = null
  this.grainCount = 0 // grain counter
  this.ready = false // true when the samples are loaded
}

Grains.prototype.getPosition = function() {
  var mean = this.params.position[0]
    * (buffers[this.url].length / audioContext.sampleRate)
  return 0 + pickVal(mean, this.params.position[1])
}

Grains.prototype.getDuration = function() {
  var mean = this.params.duration[0]
  return Math.max(0.01, pickVal(4 * valExp(mean), this.params.duration[1]))
}

Grains.prototype.getVolume = function() {
  return valExp(this.params.volume, 2.5)
}

Grains.prototype.getRatio = function() {
  var meanRatio = this.params.ratio[0]
  if (this.params.quantize_ratio) {
    return meanRatio * ratios[Math.floor(Math.random() * 0.99 * ratios.length)]
  } else return Math.max(0.05, pickVal(meanRatio, this.params.ratio[1]))
}
var ratios = [0.5, 0.75, 1]

// Returns true for silence, false for grain.
// There is twice as much chance as expected from the density 
// to pick up a silence, but silences should be twice shorter.
Grains.prototype.enjoyTheSilence = function() {
  var pick1 = Math.random() > this.params.density
    , pick2 = Math.random() > this.params.density
  return pick1 || pick2
}

Grains.prototype.setMode = function(mode) {
  log('MODE ' + this.url + ' ' + mode)
  if (this.grainEvent) this.grainEvent.clear()
  if (mode === 'off') return
  
  var self = this
    , repeatFunc
  this.mixer = audioContext.createGain()
  this.mixer.connect(audioContext.destination)

  // If grains, the silence is randomized according to density
  if (mode === 'grains') {
    repeatFunc = function() {
      var duration = self.getDuration()
      if (self.enjoyTheSilence()) self.grainEvent.repeat(duration / 2 || 0.005)
      else {
        self.mixer.gain.value = self.getVolume()
        duration = playSound(self.url, self.mixer, self.getPosition()
          , duration, self.getRatio(), self.params.env)
        self.grainEvent.repeat(duration || 0.005)
      }
    }

  // If we are looping, we play 1 grain silence, 1 grain sound
  } else if (mode === 'loop') {
    repeatFunc = function() {
      var duration = self.getDuration()
      self.grainCount++
      if ((self.grainCount % 2) === 0) {
        self.grainEvent.repeat((duration * (1 - self.params.density) * 4) || 0.005)
      } else {
        self.mixer.gain.value = self.getVolume()
        duration = playSound(self.url, self.mixer, self.getPosition()
          , duration, self.getRatio(), self.params.env)
        self.grainEvent.repeat(duration || 0.005)
      }
    }
  }

  this.grainEvent = clock.setTimeout(repeatFunc, 0.1)
  this.grainEvent.repeat(0.1)
}

Grains.prototype.loadBuffer = function(done) {
  var self = this
  loadBuffer(this.url, function(err, buffer, url) {
    if (err) log(err)
    else {
      log('loaded ' + url + ' , samples : ' + buffer.length)
      buffers[self.url] = buffer
      done()
    }
  })        
}