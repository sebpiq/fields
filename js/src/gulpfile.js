var gulp = require('gulp')
  , gutil = require('gulp-util')
  , browserify = require('gulp-browserify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , runSequence = require('run-sequence')
  , less = require('gulp-less')
  , path = require('path')

var watcher = gulp.watch(['./**/*.js', './*.less'], ['default'])
watcher.on('change', function(event) {
  console.log('File '+event.path+' was '+event.type+', running tasks...')
})


gulp.task('browserify-sound', function() {
  return gulp.src('./sound.js')
    .pipe(browserify())
    .on('error', gutil.log)
    .pipe(rename('fields.sound.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('browserify-controls', function() {
  return gulp.src('./controls.js')
    .pipe(browserify())
    .on('error', gutil.log)
    .pipe(rename('fields.controls.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('browserify-instruments', function() {
  return gulp.src('./instruments/index.js')
    .pipe(browserify())
    .on('error', gutil.log)
    .pipe(rename('fields.instruments.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('copy-common', function() {
  return gulp.src('./common.js')
    .pipe(rename('fields.js'))
    .pipe(gulp.dest('../../pages/js'))
})

/*
gulp.task('bundle-sound', function() {
  return gulp.src([
      '../lib/*.js',
      './common.js', '../build/fields.sound.js', '../build/fields.instruments.js'
    ])
    .pipe(concat('bundle-sound.js', { newLine: ';' }))
    .pipe(gulp.dest('../build'))
})

gulp.task('bundle-controls', function() {
  return gulp.src([
      '../lib/AudioContextMonkeyPatch.js',
      '../lib/jquery-2.1.0.js',
      '../lib/touchmouse.js',
      '../lib/WAAClock-0.3.1.js',
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
*/

/*
gulp.task('uglify', function() {
  return gulp.src('./build/mmapp.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/'))
})
*/

gulp.task('less-controls', function () {
  return gulp.src('./controls.less')
    .pipe(less())
    .pipe(gulp.dest('../../pages/css'))
})

gulp.task('less-sound', function () {
  return gulp.src('./sound.less')
    .pipe(less())
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
    //'bundle-sound',
    //'bundle-controls',
    'less-controls',
    'less-sound',
  done)
})

gulp.task('default', function(done) {
  runSequence('common', done)
})