var gulp = require('gulp');
var webpack = require('webpack-stream');
var pegjs = require('./gulp/gulp-pegjs');
var rename = require('gulp-rename');

gulp.task('build-parser', function() {
	return gulp.src('grammar/objc.pegjs')
		.pipe(pegjs({trace:false,cache:true}))
		.pipe(rename("parser.js"))
		.pipe(gulp.dest('src'));
});

gulp.task('build-preprocess-parser', function() {
	return gulp.src('grammar/preprocess.pegjs')
		.pipe(pegjs({trace:false,cache:false}))
		.pipe(rename("preprocess-parser.js"))
		.pipe(gulp.dest('src'));
});

gulp.task('build', ['build-parser','build-preprocess-parser']);

gulp.task('build-trace', function() {
	return gulp.src('grammar/objc.pegjs')
		.pipe(pegjs({trace:true,cache:true}))
		.pipe(rename("parser.js"))
		.pipe(gulp.dest('src'));
});

gulp.task('webpack', ['build'], function(){
	gulp.src('src/browser.js')
		.pipe(webpack({output:{filename:"bundle.js"}}))
		.pipe(gulp.dest('dist'))
});

gulp.task('default', ['webpack']);

