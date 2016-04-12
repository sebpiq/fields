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

// Browserifies the fields frontend.
gulp.task('browserify', function() {
  return browserify({ entries: './frontend/index.js' })
    .bundle()
    .on('error', gutil.log)
    .pipe(source('fields.browserified.js'))
    .pipe(gulp.dest('./tmp'))
})

// Bundles all the needed files for fields frontend into one file.
gulp.task('bundle', function() {
  return gulp.src([
      './frontend/deps/webpd-latest.js',
      './frontend/deps/jquery-2.1.0.js',
      './tmp/rhizome.js',
      './tmp/fields.browserified.js',
    ])
    .pipe(concat('fields.js', { newLine: ';' }))
    .pipe(gulp.dest('./tmp'))
})

gulp.task('copy-bundle', function() {
  return gulp.src('./tmp/fields.js')
    .pipe(gulp.dest('./dist/baseAssets/js'))
})

gulp.task('uglify', function() {
  return gulp.src('./tmp/fields.js')
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/baseAssets/js'))
})

// Builds the css
gulp.task('less', function () {
  return gulp.src('./frontend/fields.less')
    .pipe(less())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/baseAssets/css'))
})

gulp.task('fields', function(done) {
  runSequence(
    'render-rhizome-client',
    'browserify',
    'bundle',
    'less',
  done)
})

gulp.task('build', function(done) {
  runSequence('fields', 'uglify', done)
})

gulp.task('default', function(done) {
  runSequence('fields', 'copy-bundle', done)
})
