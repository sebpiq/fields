var gulp = require('gulp')
  , gutil = require('gulp-util')
  , browserify = require('gulp-browserify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , runSequence = require('run-sequence')
  , less = require('gulp-less')
  , path = require('path')

var watcher = gulp.watch(['./**/*.js'], ['default'])
watcher.on('change', function(event) {
  console.log('File '+event.path+' was '+event.type+', running tasks...')
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

gulp.task('browserify-sound', function() {
  return gulp.src('./sound.js')
    .pipe(browserify())
    .on('error', gutil.log)
    .pipe(rename('fields.sound.js'))
    .pipe(gulp.dest('../../pages/js'))
})

gulp.task('copy', function() {
  return gulp.src('./index.js')
    .pipe(rename('fields.js'))
    .pipe(gulp.dest('../../pages/js'))
})

/*
gulp.task('less', function () {
  return gulp.src('./css/styles.less')
    .pipe(less())
    .pipe(gulp.dest('./build/'))
})*/

/*
gulp.task('bundle', function() {
  return gulp.src(['./js/lib/*.js', './build/mmapp.js'])
    .pipe(concat('mmapp.js', { newLine: ';' }))
    .pipe(gulp.dest('./build/'))
})
*/

/*
gulp.task('uglify', function() {
  return gulp.src('./build/mmapp.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/'))
})
*/

gulp.task('build', function(done) {
  runSequence('less', 'browserify', 'copy', 'bundle', 'uglify', done)
})

gulp.task('default', function(done) {
  runSequence('browserify-controls', 'browserify-instruments', 'browserify-sound', 'copy', done)
})