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

var watcher = gulp.watch(['./**/*.js', './*.less'], ['default'])
watcher.on('change', function(event) {
  console.log('File '+event.path+' was '+event.type+', running tasks...')
})

// Browserifies the JS for sound.
// This is the file that kickstarts the sound, makes rhizome connection,
// creates the instruments instances, etc ...
gulp.task('browserify-sound', function() {
  return browserify({ entries: './sound.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('fields.sound.js'))
    .pipe(gulp.dest('../../pages/js'))
})

// Browserifies the JS for instruments.
// This is the file that contains the instrument classes.
gulp.task('browserify-instruments', function() {
  return browserify({ entries: './instruments/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('fields.instruments.js'))
    .pipe(gulp.dest('../../pages/js'))
})

// Browserifies the JS for controls.
gulp.task('browserify-controls', function() {
  return browserify({ entries: './controls.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('fields.controls.js'))
    .pipe(gulp.dest('../../pages/js'))
})

// Copies the file containing the common functionalities for controls + sound.
gulp.task('copy-common', function() {
  return gulp.src('./common.js')
    .pipe(rename('fields.js'))
    .pipe(gulp.dest('../../pages/js'))
})

// Bundles all the needed files for the sound page into one file.
gulp.task('bundle-sound', function() {
  return gulp.src([
      '../lib/*.js',
      './common.js', '../build/fields.sound.js', '../build/fields.instruments.js'
    ])
    .pipe(concat('bundle-sound.js', { newLine: ';' }))
    .pipe(gulp.dest('../build'))
})

// Bundles all the needed files for the controls page into one file.
gulp.task('bundle-controls', function() {
  return gulp.src([
      '../lib/AudioContextMonkeyPatch.js',
      '../lib/jquery-2.1.0.js',
      '../lib/touchmouse.js',
      '../lib/WAAClock.js',
      './common.js', '../build/fields.controls.js', '../build/fields.instruments.js'
    ])
    .pipe(concat('bundle-controls.js', { newLine: ';' }))
    .pipe(gulp.dest('../build'))
})

gulp.task('copy-bundle-controls', function() {
  return gulp.src('../build/bundle-controls.js')
    .pipe(rename('controls.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('copy-bundle-sound', function() {
  return gulp.src('../build/bundle-sound.js')
    .pipe(rename('sound.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('uglify', function() {
  return gulp.src('./build/')
    .pipe(uglify())
    .pipe(gulp.dest('./build/'))
})

gulp.task('less-controls', function () {
  return gulp.src('./controls.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('../../pages/css'))
})

gulp.task('less-sound', function () {
  return gulp.src('./sound.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('../../pages/css'))
})

gulp.task('build', function(done) {
  runSequence('default', 'uglify', done)
})


gulp.task('common', function(done) {
  runSequence(
    'browserify-controls',
    'browserify-instruments',
    'browserify-sound',
    'copy-common',
    'bundle-sound',
    'bundle-controls',
    'less-controls',
    'less-sound',
  done)
})

gulp.task('default', function(done) {
  runSequence('common', done)
})
