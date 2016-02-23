module.exports = (function(){
	"use strict";

	var fs = require('fs-extra');
	var glob = require('glob');
	var crypto = require('crypto');
	var path = require('path');

	
	var ImportResolver = function(options) {
		this.verbose = options.verbose;
		this.buildFrameworkHeaderMap(options.frameworkPath||[]);
		this.buildHeaderMap(options.includePath||[]);
	};

	ImportResolver.VERSION = "0.0.1";

	ImportResolver.prototype.loadFile = function(path) {
		try { 			
			return fs.readFileSync(path, 'utf-8');
		} catch(e) {
			return null;
		}
	};

	var _getCacheRoot = function() {
		return (process.env.HOME||process.env.USERPROFILE) + "/.objc2swift/cache";
	};
	ImportResolver.getCacheRoot = _getCacheRoot;

	var _getCacheDir = function() {
		return _getCacheRoot() + '/' + ImportResolver.VERSION + '/';
	};
	ImportResolver.getCacheDir = _getCacheDir;

	function hash_name(name) {
		var sha = crypto.createHash('md5');
		sha.update(name, 'utf8');
		return name.replace(/^.*\//,'') + "_" + sha.digest('hex');
	}

	ImportResolver.prototype.readCache = function(path) {
		try {
			var cacheName = _getCacheDir() + hash_name(path);

			var stat = fs.statSync(path);
			var cstat = fs.statSync(cacheName);			
			if(cstat.mtime.getTime() < stat.mtime.getTime()) {
				if(this.verbose) {
					console.error("Cache expired: " + path.replace(/^.*\//,''));					
				}
				return null;
			}
			var text = fs.readFileSync(cacheName,'utf-8');
			return JSON.parse(text);
		} catch(e) {
			return null;
		}
	}

	ImportResolver.prototype.writeCache = function(path,data) {
		try {
			var cacheName = _getCacheDir() + hash_name(path);
			var json = JSON.stringify(data,function(k,v){
				if(k=="ast") {
					return null;
				}
				return v;
			},'  ')
			fs.writeFileSync(cacheName,json,'utf-8');
		} catch(e) {
		}
	};

	ImportResolver.prototype.buildFrameworkHeaderMap = function(frameworkPathList) {

		this.frameworkHeaderMap = {};
		for(var i=0;i<frameworkPathList.length;i++) {
			var dir = frameworkPathList[i];
			var headers = glob.sync(dir + "/**/*.h");
			if(0<headers.length) {
				for(var j=0;j<headers.length;j++) {
					var header = headers[j], m, name;
					if(m = header.match(/\/([A-Z0-9_]+)\.framework\/Headers(\/.*\.h)$/i)) {
						name = m[1] + m[2];
						if(!this.frameworkHeaderMap[name]) {
							this.frameworkHeaderMap[name] = header;
						}
					} else if(m = header.match(/include\/(.*\.h)$/i)) {
						name = m[1];
						if(!this.frameworkHeaderMap[name]) {
							this.frameworkHeaderMap[name] = header;
						}						
					}
				}
			}
		}

	};

	ImportResolver.prototype.buildHeaderMap = function(pathList) {
		this.headerMap = {};
		for(var i=0;i<pathList.length;i++) {
			var dir = path.resolve(pathList[i]);
			var headers = glob.sync(dir + "/**/*.h");
			if(0<headers.length) {
				for(var j=0;j<headers.length;j++) {
					var header = headers[j];
					var name = header.split('/').pop();
					if(!this.headerMap[name]) {
						this.headerMap[name] = header;
					}
				}
			}
		}
	};

	ImportResolver.prototype.findHeaderPath = function(name, frameworkFirst) {
		if(frameworkFirst) {
			return this.frameworkHeaderMap[name]||this.headerMap[name];
		} else {
			return this.headerMap[name]||this.frameworkHeaderMap[name];
		}
	};

	return ImportResolver;
})();