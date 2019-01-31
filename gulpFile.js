'use-strict';

const electron = require('electron-connect').server.create(),
      gulp = require('gulp'),
      sass = require('gulp-sass'),
      compassImporter = require('compass-importer');

const sassConfig = {
        inputDir: 'assets/css/scss/**/*.scss',
        outputDir: 'assets/css',
        options: {
          importer: compassImporter,
          outputStyle: 'expanded'
        }
      };

const sassCompile = () => {
  return gulp.src(sassConfig.inputDir)
    .pipe(sass(sassConfig.options)
    .on('error', sass.logError))
    .pipe(gulp.dest(sassConfig.outputDir));
};

const electronStart = () => {
  electron.start();
  gulp.watch(['main.js', 'assets/js/**/*', 'assets/css/*'], gulp.series(electron.restart));
  gulp.watch(['assets/views/index.html'], gulp.series(electron.reload));
};

const sassWatch = gulp.parallel(() => {
  gulp.watch(sassConfig.inputDir, gulp.series(sassCompile));
});

const dev = gulp.series(sassWatch, electronStart);

module.exports = {
  dev: electronStart,
  sass: sassCompile
};
