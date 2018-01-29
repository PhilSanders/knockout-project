var gulp = require('gulp'),
    sass = require('gulp-sass');

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

gulp.task('watch', function() {
  gulp.watch(sassConfig.inputDir, ['build-css'])
});
