const gulp = require('gulp');
const ts = require('gulp-typescript');
const nodemon = require('gulp-nodemon');
const { exec } = require('child_process');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
  return tsProject.src().pipe(tsProject()).pipe(gulp.dest('dist'));
});

gulp.task('move-non-ts', () => {
  return gulp
    .src(['src/**/*', '!src/**/*.ts', '!src/@types/**'])
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
  return gulp.watch('src/**/*.ts', gulp.series('compile'));
});

gulp.task('dev', (done) => {
  nodemon({
    script: 'src/index.ts',
    ext: 'ts',
    exec: 'ts-node',
    env: { NODE_ENV: 'development' },
    done: done,
  });
});

// Clean dist folder
gulp.task('clean', (done) => {
  exec('rm -rf dist', done);
});

gulp.task('build', gulp.series('clean', 'compile', 'move-non-ts'));

// Default task
gulp.task('default', gulp.series('dev'));
