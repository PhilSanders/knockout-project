var gulp = require('gulp'),
    sass = require('gulp-sass'),
    webserver = require('gulp-webserver');

var sassConfig = {
    inputDir: 'assets/scss/**/*.scss',
    outputDir: 'assets/css',
    options: {
      outputStyle: 'compact'
    }
}

gulp.task('build-css', function() {
  return gulp
          .src(sassConfig.inputDir)
          .pipe(sass(sassConfig.options).on('error', sass.logError))
          .pipe(gulp.dest(sassConfig.outputDir));
});

gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
    fallback: 'index.html'
    }));
});

gulp.task('watch', function() {
  gulp.watch(sassConfig.inputDir, ['build-css'])
});

gulp.task('default', function() {
  gulp.run('webserver');
});
