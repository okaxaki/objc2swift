/**
  Based on [gulp-pegjs v0.0.1](https://github.com/jonathanbp/gulp-pegjs).
  The original License is as follows.

The MIT License (MIT)

Copyright (c) 2015 Jonathan Bunde-Pedersen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
'use strict';

var gutil     = require('gulp-util');
var through   = require('through2');
var assign    = require('object-assign');

var pegjs     = require('pegjs');

module.exports = function (opts) {
	return through.obj(function (file, enc, cb) {
		
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-pegjs', 'Streaming not supported'));
			return;
		}

	    // always generate source code of parser
	    var options = assign({ output: 'source' }, opts);

	    var filePath = file.path;

	    try {
	    	file.contents = new Buffer("module.exports=" + pegjs.buildParser(file.contents.toString(), options));
	    	file.path = gutil.replaceExtension(file.path, '.js');
	    	this.push(file);
	    } catch (err) {
	    	this.emit('error', new gutil.PluginError('gulp-pegjs', err, {fileName: filePath}));
	    }

	    cb();
	});
};
