var gulp = require('gulp'),
	mocha = require('gulp-mocha');


gulp.task('test', function() {
  require('should');

  gulp.src('test/**/*')
      .pipe(mocha({
        reporter: 'spec',
      }))
      .on('error', function(error) {
        console.error('\nError:', error.plugin);
        console.error(error.message);
      });
});


gulp.task('watch', function() {
  function onChange(event) {
    console.log('File', event.type +':', event.path);
  }

  gulp.watch('src/**/*', ['test']).on('change', onChange);
  gulp.watch('test/**/*', ['test']).on('change', onChange);
});



gulp.task('default', ['test']);
