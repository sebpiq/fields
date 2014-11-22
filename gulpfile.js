var gulp = require('gulp')
  , gutil = require('gulp-util')
  , browserify = require('browserify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , runSequence = require('run-sequence')
  , source = require('vinyl-source-stream')
  , less = require('gulp-less')
  , path = require('path')

var watcher = gulp.watch(['./src/*.js', './src/*.less'], ['default'])
watcher.on('change', function(event) {
  console.log('File '+event.path+' was '+event.type+', running tasks...')
})

// Browserifies the JS for sound.
// This is the file that kickstarts the sound, makes rhizome connection,
// creates the instruments instances, etc ...
gulp.task('browserify-sound', function() {
  return browserify({ entries: './src/sound/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('sound.browserified.js'))
    .pipe(gulp.dest('./tmp'))
})

// Browserifies the JS for instruments.
// This is the file that contains the instrument classes.
gulp.task('browserify-instruments', function() {
  return browserify({ entries: './src/instruments/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('instruments.browserified.js'))
    .pipe(gulp.dest('./tmp'))
})

// Browserifies the JS for controls.
gulp.task('browserify-controls', function() {
  return browserify({ entries: './src/controls/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('controls.browserified.js'))
    .pipe(gulp.dest('./tmp'))
})

/*// Copies the file containing the common functionalities for controls + sound.
gulp.task('copy-common', function() {
  return gulp.src('./common.js')
    .pipe(rename('fields.js'))
    .pipe(gulp.dest('../../pages/js'))
})*/

// Bundles all the needed files for the sound page into one file.
gulp.task('bundle-sound', function() {
  return gulp.src([
      './deps/AudioContextMonkeyPatch.js',
      './deps/WAAClock-latest.js',
      './deps/jquery-2.1.0.js',
      './src/core/common.js',
      './tmp/sound.browserified.js',
      './tmp/instruments.browserified.js',
      './config-sound.js'
    ])
    .pipe(concat('sound.js', { newLine: ';' }))
    .pipe(gulp.dest('./tmp'))
})

// Bundles all the needed files for the controls page into one file.
gulp.task('bundle-controls', function() {
  return gulp.src([
      './deps/AudioContextMonkeyPatch.js',
      './deps/WAAClock-latest.js',
      './deps/jquery-2.1.0.js',
      './deps/nexusUI.js',
      './src/core/common.js',
      './tmp/controls.browserified.js'
    ])
    .pipe(concat('controls.js', { newLine: ';' }))
    .pipe(gulp.dest('./tmp'))
})

gulp.task('copy-bundle-controls', function() {
  return gulp.src('./tmp/controls.js')
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('copy-bundle-sound', function() {
  return gulp.src('./tmp/sound.js')
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('uglify-sound', function() {
  return gulp.src('./tmp/sound.js')
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('less-controls', function () {
  return gulp.src('./src/controls/controls.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/css'))
})

gulp.task('less-sound', function () {
  return gulp.src('./src/sound/sound.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/css'))
})

gulp.task('common', function(done) {
  runSequence(
    'browserify-controls',
    'browserify-instruments',
    'browserify-sound',
    'bundle-sound',
    'bundle-controls',
    'copy-bundle-controls',
    'less-controls',
    'less-sound',
  done)
})

gulp.task('build', function(done) {
  runSequence('default', 'uglify-sound', done)
})

gulp.task('default', function(done) {
  runSequence('common', 'copy-bundle-sound', done)
})
