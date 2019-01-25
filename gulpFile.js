'use-strict';

const electron = require('electron-connect').server.create(),
      del = require('del'),
      gulp = require('gulp'),
      sass = require('gulp-sass'),
      compassImporter = require('compass-importer'),
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
  electron.start();
  gulp.watch(['main.js', 'assets/js/**/*', 'assets/css/*'], electron.restart);
  gulp.watch(['assets/views/index.html'], electron.reload);
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
  gulp.run('electron');
});
