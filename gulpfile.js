var path = require('path')
  , gulp = require('gulp')
  , gutil = require('gulp-util')
  , browserify = require('browserify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , runSequence = require('run-sequence')
  , source = require('vinyl-source-stream')
  , less = require('gulp-less')
  , rhizome = require('rhizome-server')

var watcher = gulp.watch(['./frontend/**/*.js', './frontend/*.less'], ['default'])
watcher.on('change', function(event) {
  console.log('File '+event.path+' was '+event.type+', running tasks...')
})

// Renders the client file for rhizome
gulp.task('render-rhizome-client', function() {
  return rhizome.websockets.renderClientBrowserGulp('./tmp')
})

// Browserifies the JS for sound.
// This is the file that kickstarts the sound, makes rhizome connection,
// creates the instruments instances, etc ...
gulp.task('browserify-sound', function() {
  return browserify({ entries: './frontend/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('sound.browserified.js'))
    .pipe(gulp.dest('./tmp'))
})

// Bundles all the needed files for the sound page into one file.
gulp.task('bundle-sound', function() {
  return gulp.src([
      './frontend/deps/AudioContextMonkeyPatch.js',
      //'./frontend/deps/webpd-latest.js',
      './frontend/deps/jquery-2.1.0.js',
      './tmp/rhizome.js',
      './frontend/core/common.js',
      './tmp/sound.browserified.js',
    ])
    .pipe(concat('sound.js', { newLine: ';' }))
    .pipe(gulp.dest('./tmp'))
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

gulp.task('less-sound', function () {
  return gulp.src('./frontend/sound.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/css'))
})

gulp.task('sound', function(done) {
  runSequence(
    'render-rhizome-client',
    'browserify-sound',
    'bundle-sound',
    'copy-bundle-sound',
    'less-sound',
  done)
})

gulp.task('build', function(done) {
  runSequence('default', 'uglify-sound', done)
})

gulp.task('default', function(done) {
  runSequence('sound', 'copy-bundle-sound', done)
})
