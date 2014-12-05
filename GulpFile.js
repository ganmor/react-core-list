var gulp = require('gulp'),
    given = require('gulp-if'),
    jsx = require('gulp-react'),
    rename = require('gulp-rename'),
    minifyjs = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function() {
  gulp.src('./src/react-infinite-list.jsx')
      .pipe(sourcemaps.init())
      .pipe(jsx())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist'));
});

gulp.task('buildproduction', function() {
  gulp.src("./src/react-infinite-list.jsx")
      .pipe(rename("react-infinite-list.min.jsx"))
      .pipe(jsx())
      .pipe(minifyjs())
      .pipe(gulp.dest('dist'));
})

gulp.task('default', ['build', 'buildproduction']);
