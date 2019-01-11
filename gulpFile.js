'use-strict';

const electron = require('electron-connect').server.create(),
      del = require('del'),
      gulp = require('gulp'),
      sass = require('gulp-sass'),
      compassImporter = require('compass-importer'),
      webserver = require('gulp-webserver'),
      useref = require('gulp-useref');

const sassConfig = {
        inputDir: 'assets/css/scss/**/*.scss',
        outputDir: 'assets/css',
        options: {
          importer: compassImporter,
          outputStyle: 'expanded'
        }
      };

gulp.task('electron', ['sasswatch'], function () {
  // Start browser process
  electron.start();
  // Restart browser process
  gulp.watch('main.js', electron.restart);
  // Reload renderer process
  gulp.watch(['index.html','assets/*/*'], electron.reload);
});

gulp.task('webserver', ['sasswatch'], function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
    fallback: 'index.html'
    }));
});

gulp.task('sass', function() {
  return gulp
    .src(sassConfig.inputDir)
    .pipe(sass(sassConfig.options).on('error', sass.logError))
    .pipe(gulp.dest(sassConfig.outputDir));
});

gulp.task('sasswatch', function() {
  gulp.watch(sassConfig.inputDir, ['sass'])
});

gulp.task('default', function() {
  gulp.run('webserver');
});

// gulp.task('move-assets', function() {
//   return gulp.src(['assets/*/*.*'])
//     .pipe(gulp.dest('dist/assets'))
// });
//
// gulp.task('move-fonts', function() {
//   return gulp.src(['assets/fonts/**'])
//     .pipe(gulp.dest('dist/assets/fonts/'))
// });
//
// gulp.task('clean', function() {
//   return del(['./dist']);
// });
//
// gulp.task('build', ['clean', 'move-assets', 'move-fonts'], function(){
//   return gulp.src('./*.html')
//     .pipe(useref())
//     .pipe(gulp.dest('dist'));
// });
