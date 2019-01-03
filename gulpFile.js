var del = require('del'),
    gulp = require('gulp'),
    sass = require('gulp-sass'),
    webserver = require('gulp-webserver'),
    useref = require('gulp-useref');

var sassConfig = {
    inputDir: 'assets/scss/**/*.scss',
    outputDir: 'assets/css',
    options: {
      outputStyle: 'compact'
    }
}

gulp.task('move-assets', ['clean'], function() {
  return gulp.src(['assets/**'])
      .pipe(gulp.dest('dist/assets'))
});

gulp.task('clean', function() {
  return del(['./dist']);
});

gulp.task('build', ['move-assets'], function(){
  return gulp.src('./*.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('sass', function() {
  return gulp
          .src(sassConfig.inputDir)
          .pipe(sass(sassConfig.options).on('error', sass.logError))
          .pipe(gulp.dest(sassConfig.outputDir));
});

gulp.task('webserver', ['watch'], function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
    fallback: 'index.html'
    }));
});

gulp.task('watch', function() {
  gulp.watch(sassConfig.inputDir, ['sass'])
});

gulp.task('default', function() {
  gulp.run('webserver');
});
