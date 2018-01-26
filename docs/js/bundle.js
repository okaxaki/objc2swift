/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	O2S = __webpack_require__(1);




/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = (function(){
		"use strict"

		var util = __webpack_require__(2);
		var PreProcessor = __webpack_require__(6);
		var parser = __webpack_require__(8);
		var TypeAnalyzer = __webpack_require__(9);
		var Generator = __webpack_require__(14);
		var ParserUtil = __webpack_require__(13);

		var O2S = function() {};

		var _estimateTabSize = function(source) {
			var tabSizeCountMap = {};
			var estimatedTabSize = 4, maxTabSizeCount = -1;
			source = source.replace(/\t/g,'    ');
			source.replace(/\n(\s*).*?\{\n(\s*)/g,function(m,p1,p2){
				var size = p2.length - p1.length;
				if(!tabSizeCountMap[size]) tabSizeCountMap[size]=0;
				var newCount = tabSizeCountMap[size]++;
				if(maxTabSizeCount < newCount) {
					maxTabSizeCount = newCount;
					estimatedTabSize = size;
				}
			});		
			return 2 * Math.ceil(estimatedTabSize/2);
		};

		O2S.prototype.preprocessOnly = function(source) {
			return new PreProcessor().process(source);
		};

		O2S.prototype.buildErrorMessage = function(e, source, file) {
			return ParserUtil.buildErrorMessage(e, source, file);
		};

		O2S.prototype.parse = function(source,options) {

			options = options || {};

			var start = Date.now();
			var pp = new PreProcessor(options);
			this.typeAnalyzer = new TypeAnalyzer(options);
			var p_source = pp.process(source,this.typeAnalyzer);

			if(!options.quiet) {
				console.error("Preprocess : " + (Date.now() - start) + "ms");
			}

			start = Date.now();
			var ast = parser.parse(p_source,options);
			if(!options.quiet) {
				console.error("Parse      : " + (Date.now() - start) + "ms");
			}

			start = Date.now();
			this.typeAnalyzer.analyze(ast);
			if(!options.quiet) {
				console.error("Analyze    : " + (Date.now()-start) + "ms");
			}

			if(options.ast) {
				console.log(JSON.stringify(ast,function(k,v){
					if(k=="ast") {
						return "(...)";
					}
					if(!options.verbose) {
						if(k=="_typeInfo") {
							return v?(v.kind+" "+v.name):"(error)";
						}
						if(k=="_declInfo") {
							return v?(v.kind+" "+v.name):"(error)";
						}
					}
					return v;
				},'  '));
			}

			if(options.query) {
				var qs = options.query.split(',');
				var result = {}
				for(var i=0;i<qs.length;i++) {
					var info = this.typeAnalyzer.findDeclInfoByQuery(qs[i]);
					if(info) {
						result[qs[i]] = info;
					} else {
						result[qs[i]] = null;
					}
				}
				console.log(JSON.stringify(result,function(k,v){if(k=="ast")return"(...)";else return v;},'  '));
			}

			return ast;
		};

		O2S.prototype.generate = function(ast, options) {
			options = options||{};
			var start = Date.now();
			var generator = new Generator(this.typeAnalyzer,options);
			var ret = generator.generate(ast);
			if(!options.quiet) {
				console.error("Generate   : " + (Date.now()-start) + "ms");
			}
			return ret;
		};

		O2S.prototype.convert = function(source, options) {
			var ast = this.parse(source, options);
			return this.generate(ast, options);
		};

		O2S.canUseTracer = function() {
			return parser.DefaultTracer!=null;
		};

		return O2S;

	})();


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(4);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(5);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(3)))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;

	process.listeners = function (name) { return [] }

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {module.exports = (function() {
		"use strict"

		var cpp = __webpack_require__(7);
		var parser = __webpack_require__(8);
		var TypeAnalyzer = __webpack_require__(9);
		var DeclInfo = __webpack_require__(12);
		var ParserUtil = __webpack_require__(13);

		var MACRO_MAP = {
			"CA_EXTERN":"extern",
			"CF_AVAILABLE":"",
			"CF_BRIDGED_MUTABLE_TYPE":"",
			"CF_BRIDGED_TYPE":"",
			"CF_CONSUMED":"",
			"CF_ENUM_AVAILABLE":"",
			"CF_EXPORT":"",
			"CF_EXTERN_C_BEGIN":"",
			"CF_EXTERN_C_END":"",
			"CF_RETURNS_NOT_RETAINED":"",
			"FOUNDATION_EXPORT":"",
			"NS_AUTOMATED_REFCOUNT_UNAVAILABLE":"",
			"NS_AVAILABLE":"",
			"NS_AVAILABLE_IOS":"",
			"NS_AVAILABLE_MAC":"",
			"NS_CALENDAR_DEPRECATED_MAC":"",
			"NS_CLASS_AVAILABLE":"",
			"NS_CLASS_AVAILABLE_IOS":"",
			"NS_CLASS_DEPRECATED":"",
			"NS_CLASS_DEPRECATED_IOS":"",
			"NS_DEPRECATED":"",
			"NS_DEPRECATED_IOS":"",
			"NS_DEPRECATED_MAC":"",
			"NS_DESIGNATED_INITIALIZER":"__attribute__((objc_designated_initializer))",
			"NS_ENUM_AVAILABLE":"",
			"NS_ENUM_AVAILABLE_IOS":"",
			"NS_ENUM_DEPRECATED":"",
			"NS_ENUM_DEPRECATED_IOS":"",
			"NS_EXTENSION_UNAVAILABLE_IOS":"",
			"NS_FORMAT_ARGUMENT":"",
			"NS_FORMAT_FUNCTION":"",
			"NS_INLINE":"",
			"NS_REPLACES_RECEIVER":"",
			"NS_REQUIRES_NIL_TERMINATION":"",
			"NS_REQUIRES_PROPERTY_DEFINITIONS":"", // NSManagedObject.h
			"NS_REQUIRES_SUPER":"",
			"NS_RETURNS_INNER_POINTER":"",
			"NS_SWIFT_UNAVAILABLE":"",
			"NS_UNAVAILABLE":"",
			"OBJC_ARC_UNAVAILABLE":"",
			"OBJC_EXPORT":"",
			"OBJC_ISA_AVAILABILITY":"",
			"OBJC_ROOT_CLASS":"",
			"OBJC_SWIFT_UNAVAILABLE":"",
			"UIKIT_AVAILABLE_TVOS_ONLY":"",
			"UIKIT_CLASS_AVAILABLE_IOS_TVOS":"",
			"UI_APPEARANCE_SELECTOR":"",
			"UNAVAILABLE_ATTRIBUTE":"",
			"_MAC":"",
			"_STRUCT_SIGALTSTACK":"struct __darwin_sigaltstack", //_sigaltstack.h
			"_STRUCT_TIMESPEC":"struct timespec", // _timespec.h
			"_STRUCT_TIMEVAL":"struct timeval", // _timeval.h
			"_STRUCT_UCONTEXT":"struct __darwin_ucontext", // _ucontext.h
			"__BEGIN_DECLS":"",
			"__DARWIN_1050":"",
			"__DARWIN_ALIAS":"",
			"__DARWIN_ALIAS_C":"",
			"__DARWIN_ALIAS_STARTING":"",
			"__DARWIN_EXTSN":"",
			"__END_DECLS":"",
			"__OSX_AVAILABLE_BUT_DEPRECATED":"",
			"__OSX_AVAILABLE_BUT_DEPRECATED_MSG":"",
			"__OSX_AVAILABLE_STARTING":"",
			"__POSIX_C_DEPRECATED":"", // strings.h
			"__TVOS_PROHIBITED":"",
			"__WATCHOS_PROHIBITED":"",
			"__const":"const",
			"__dead":"",
			"__dead2":"",
			"__deprecated":"__attribute__((deprecated))",
			"__deprecated_msg":"", // _stdio.h
			"__printflike":"", // _stdio.h
			"__pure2":"",
			"__restrict":"restrict",
			"__scanflike":"", // _stdio.h
			"__strftimelike":"", // _time.h
			"__unavailable":"__attribute__((unavailable))",
			"__unused":"__attribute__((deprecated))",
			"__used":"__attribute__((used))",
		};

		function expand_NS_ENUM(type,name) {
			if(name) {
				// NS_ENUM(T,N) := enum N:T N;enum N:T
				return "enum " + name + ":" +  type + " " + name + ";enum " + name + ":" + type;
			} else {
				// NS_ENUM(T) := enum : T;
				return "enum : " + type;
			}
		};

		function expand(name, argv) {
			if(name == "NS_ENUM" || name == "NS_OPTIONS" || name == "CF_ENUM" || name == "CF_OPTIONS") {
				return expand_NS_ENUM(argv[0],argv[4]);
			}
			return MACRO_MAP[name];
		};

		function normalizeSource(source) {
			return source.replace(/\r\n/g,'\n');
		}

		var PreProcessor = function(options) {		
			this.options = options||{};
			this.importResolver = this.options.importResolver;
			this.headerInfoMap = {};
		};

		PreProcessor.prototype.enumerateHeaders = function(source, from) {
			var exp = /^ *# *(?:import|include)\s*([<"])(.*?)[>"]/gm, m, result = [];
			while(m = exp.exec(source)) {
				var file = this.importResolver.findHeaderPath(m[2],m[1]=="<");
				if(file) {
					result.push(file)
				} else {
					if(this.options.showMissingHeader) {
						console.log("[debug] " + m[2] + " is not found" + (from?(" from "+from):"."));
					}
				}
			}
			return result;
		};

		var addDeclInfo = function(headerInfo, declInfo) {
			if(declInfo.kind != DeclInfo.KIND_PROTOCOL) {
				headerInfo.declInfoMap[declInfo.name] = declInfo;
			} else {
				headerInfo.declInfoMap["@protocol " + declInfo.name] = declInfo;
			}
		};

		PreProcessor.prototype.printStatus = function(name, value) {
			if(!this.options.quiet) {
				if(this.options.verbose) {
					process.stderr.write("\x1b[K");
					console.log(name + (value?" : " + value:""));
				} else {
					process.stderr.write("\x1b[K" + name + (value?" : " + value:"") + "\x1b[G");
				}
			}
		};

		PreProcessor.prototype.processHeader = function(headerPath) {

			var headerName = headerPath.replace(/^.*\/(.*)$/,'$1');

			var headerInfo = this.headerInfoMap[headerPath];
			if(headerInfo) return headerInfo;

			headerInfo = { 
				path:headerPath,
				name:headerName,
				declInfoMap:{},
				children:[],
			};
			this.headerInfoMap[headerPath] = headerInfo;

			this.printStatus(headerName);

			var source = this.importResolver.loadFile(headerPath);
			source = normalizeSource(source);

			var targets = this.enumerateHeaders(source, headerPath);

			for(var i=0;i<targets.length;i++) {
				this.nestLevel++;
				var childInfo = this.processHeader(targets[i]);
				this.nestLevel--;
				headerInfo.children.push(childInfo);
			}

			if(this.options.cacheHeader) {
				var declInfoMap = this.importResolver.readCache(headerPath);
				if(declInfoMap) {
					headerInfo.declInfoMap = declInfoMap;
					headerInfo.isCached = true;
					this.printStatus(headerName,"OK (Cache Hit)");
					return headerInfo;
				}
			}

			var p_source = cpp.parse(source,{expandMacro:expand});
			var ast;
			try {
				ast = parser.parse(p_source, this.options);
				var decls = new TypeAnalyzer(this.options).analyze(ast);
				for(var i=0;i<decls.length;i++) {
					addDeclInfo(headerInfo, decls[i]);
				}
				this.printStatus(headerName,"OK");
			} catch(e) {
				this.printStatus(headerName,"SKIP");
				if(this.options.verbose) {
					console.log(ParserUtil.buildErrorMessage(e,source,headerPath));
				}
			}

			return headerInfo;
		};

		PreProcessor.prototype.calcClosure = function(headerInfo, visited) {
			if(visited == null) {
				visited = {};
			}
			visited[headerInfo.path] = true;
			for(var i=0; i<headerInfo.children.length;i++) {
				var child = headerInfo.children[i];
				if(!visited[child.path]) {
					this.calcClosure(child, visited);
				}
			}
			return Object.keys(visited);
		};

		PreProcessor.prototype.gatherDeclInfo = function(map, paths) {

			for(var i=0; i<paths.length;i++) {
				var info = this.headerInfoMap[paths[i]];			

				for(var key in info.declInfoMap) {
					var oldInfo = map[key];
					var newInfo = info.declInfoMap[key];

					if(oldInfo) {
						if(oldInfo.kind == DeclInfo.KIND_CLASS && newInfo.kind == DeclInfo.KIND_CLASS) {
							TypeAnalyzer.mergeClassDeclInfo(oldInfo, newInfo);
						}
					} else {
						map[key] = newInfo;
					}
				}
			}
			return map;
		};

		function countMap(map) {
			var count = 0;
			for(var key in map) {
				count++;
			}
			return count;
		}

		PreProcessor.prototype.process = function(source, typeAnalyzer) {

			this.nestLevel = 0;
			this.headerInfoMap = {};

			source = normalizeSource(source);

			if(this.importResolver && !this.options.skipHeader) {

				var targets = this.enumerateHeaders(source);
				for(var i=0;i<targets.length;i++) {
					this.processHeader(targets[i]);
				}
				process.stderr.write("\x1b[K");

				var total = countMap(this.headerInfoMap), progress = 0;

				for(var key in this.headerInfoMap) {
					var info = this.headerInfoMap[key];
					progress++;
					if(!info.isCached) {
						this.printStatus("[" + progress + "/" + total + "]", info.name);
						declInfoMap = info.declInfoMap;
						if(this.options.cacheHeader) {
							this.importResolver.writeCache(info.path, info.declInfoMap);
						}
					} else {
						declInfoMap = info.declInfoMap;
					}
				}

				var map = {};

				for(var i=0;i<targets.length;i++) {	
					var info = this.headerInfoMap[targets[i]];
					var closure = this.calcClosure(info);
					var declInfoMap = this.gatherDeclInfo(map,closure);
					for(var k in declInfoMap) {
						var declInfo = declInfoMap[k];
						typeAnalyzer.addDeclInfo(declInfo.name, declInfo);
					}
				}

				process.stderr.write("\x1b[K");

			}

			return cpp.parse(source,{expandMacro:expand});
		};

		return PreProcessor;

	})();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	module.exports=/*
	 * Generated by PEG.js 0.10.0.
	 *
	 * http://pegjs.org/
	 */
	(function() {
	  "use strict";

	  function peg$subclass(child, parent) {
	    function ctor() { this.constructor = child; }
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();
	  }

	  function peg$SyntaxError(message, expected, found, location) {
	    this.message  = message;
	    this.expected = expected;
	    this.found    = found;
	    this.location = location;
	    this.name     = "SyntaxError";

	    if (typeof Error.captureStackTrace === "function") {
	      Error.captureStackTrace(this, peg$SyntaxError);
	    }
	  }

	  peg$subclass(peg$SyntaxError, Error);

	  peg$SyntaxError.buildMessage = function(expected, found) {
	    var DESCRIBE_EXPECTATION_FNS = {
	          literal: function(expectation) {
	            return "\"" + literalEscape(expectation.text) + "\"";
	          },

	          "class": function(expectation) {
	            var escapedParts = "",
	                i;

	            for (i = 0; i < expectation.parts.length; i++) {
	              escapedParts += expectation.parts[i] instanceof Array
	                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
	                : classEscape(expectation.parts[i]);
	            }

	            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
	          },

	          any: function(expectation) {
	            return "any character";
	          },

	          end: function(expectation) {
	            return "end of input";
	          },

	          other: function(expectation) {
	            return expectation.description;
	          }
	        };

	    function hex(ch) {
	      return ch.charCodeAt(0).toString(16).toUpperCase();
	    }

	    function literalEscape(s) {
	      return s
	        .replace(/\\/g, '\\\\')
	        .replace(/"/g,  '\\"')
	        .replace(/\0/g, '\\0')
	        .replace(/\t/g, '\\t')
	        .replace(/\n/g, '\\n')
	        .replace(/\r/g, '\\r')
	        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
	    }

	    function classEscape(s) {
	      return s
	        .replace(/\\/g, '\\\\')
	        .replace(/\]/g, '\\]')
	        .replace(/\^/g, '\\^')
	        .replace(/-/g,  '\\-')
	        .replace(/\0/g, '\\0')
	        .replace(/\t/g, '\\t')
	        .replace(/\n/g, '\\n')
	        .replace(/\r/g, '\\r')
	        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
	    }

	    function describeExpectation(expectation) {
	      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
	    }

	    function describeExpected(expected) {
	      var descriptions = new Array(expected.length),
	          i, j;

	      for (i = 0; i < expected.length; i++) {
	        descriptions[i] = describeExpectation(expected[i]);
	      }

	      descriptions.sort();

	      if (descriptions.length > 0) {
	        for (i = 1, j = 1; i < descriptions.length; i++) {
	          if (descriptions[i - 1] !== descriptions[i]) {
	            descriptions[j] = descriptions[i];
	            j++;
	          }
	        }
	        descriptions.length = j;
	      }

	      switch (descriptions.length) {
	        case 1:
	          return descriptions[0];

	        case 2:
	          return descriptions[0] + " or " + descriptions[1];

	        default:
	          return descriptions.slice(0, -1).join(", ")
	            + ", or "
	            + descriptions[descriptions.length - 1];
	      }
	    }

	    function describeFound(found) {
	      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
	    }

	    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	  };

	  function peg$parse(input, options) {
	    options = options !== void 0 ? options : {};

	    var peg$FAILED = {},

	        peg$startRuleFunctions = { Start: peg$parseStart },
	        peg$startRuleFunction  = peg$parseStart,

	        peg$c0 = function(m, n) {
	        	var buf = [];
	        	for(var i=0;i<m.length;i++) {
	        		buf.push(m[i][0] + m[i][1]);
	        	}
	        	buf.push(n);
	        	return buf.join('');
	        },
	        peg$c1 = "*",
	        peg$c2 = peg$literalExpectation("*", false),
	        peg$c3 = peg$anyExpectation(),
	        peg$c4 = /^[a-zA-Z_]/,
	        peg$c5 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false),
	        peg$c6 = /^[a-zA-Z0-9_]/,
	        peg$c7 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_"], false, false),
	        peg$c8 = "(",
	        peg$c9 = peg$literalExpectation("(", false),
	        peg$c10 = ")",
	        peg$c11 = peg$literalExpectation(")", false),
	        peg$c12 = function(name, args) {
	        		var list = args?args[3]:null;
	        		var result = options.expandMacro(name, list?list:[]);
	        		if(result!=null) return result;
	        		return text();
	        	},
	        peg$c13 = ",",
	        peg$c14 = peg$literalExpectation(",", false),
	        peg$c15 = function(head, tail) {
	        		var result = [head];
	        		for(var i=0;i<tail.length;i++) {
	        			result = result.concat(tail[i]);
	        		}
	        		return result;
	        	},
	        peg$c16 = /^[^\n,)]/,
	        peg$c17 = peg$classExpectation(["\n", ",", ")"], true, false),
	        peg$c18 = "\"",
	        peg$c19 = peg$literalExpectation("\"", false),
	        peg$c20 = "\\\"",
	        peg$c21 = peg$literalExpectation("\\\"", false),
	        peg$c22 = /^[ \t\n]/,
	        peg$c23 = peg$classExpectation([" ", "\t", "\n"], false, false),
	        peg$c24 = "\\",
	        peg$c25 = peg$literalExpectation("\\", false),
	        peg$c26 = /^[\n]/,
	        peg$c27 = peg$classExpectation(["\n"], false, false),
	        peg$c28 = "/*",
	        peg$c29 = peg$literalExpectation("/*", false),
	        peg$c30 = "*/",
	        peg$c31 = peg$literalExpectation("*/", false),
	        peg$c32 = "//",
	        peg$c33 = peg$literalExpectation("//", false),
	        peg$c34 = "#",
	        peg$c35 = peg$literalExpectation("#", false),
	        peg$c36 = "\\\n",
	        peg$c37 = peg$literalExpectation("\\\n", false),
	        peg$c38 = function() {return text();},

	        peg$currPos          = 0,
	        peg$savedPos         = 0,
	        peg$posDetailsCache  = [{ line: 1, column: 1 }],
	        peg$maxFailPos       = 0,
	        peg$maxFailExpected  = [],
	        peg$silentFails      = 0,

	        peg$result;

	    if ("startRule" in options) {
	      if (!(options.startRule in peg$startRuleFunctions)) {
	        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	      }

	      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }

	    function text() {
	      return input.substring(peg$savedPos, peg$currPos);
	    }

	    function location() {
	      return peg$computeLocation(peg$savedPos, peg$currPos);
	    }

	    function expected(description, location) {
	      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

	      throw peg$buildStructuredError(
	        [peg$otherExpectation(description)],
	        input.substring(peg$savedPos, peg$currPos),
	        location
	      );
	    }

	    function error(message, location) {
	      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

	      throw peg$buildSimpleError(message, location);
	    }

	    function peg$literalExpectation(text, ignoreCase) {
	      return { type: "literal", text: text, ignoreCase: ignoreCase };
	    }

	    function peg$classExpectation(parts, inverted, ignoreCase) {
	      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
	    }

	    function peg$anyExpectation() {
	      return { type: "any" };
	    }

	    function peg$endExpectation() {
	      return { type: "end" };
	    }

	    function peg$otherExpectation(description) {
	      return { type: "other", description: description };
	    }

	    function peg$computePosDetails(pos) {
	      var details = peg$posDetailsCache[pos], p;

	      if (details) {
	        return details;
	      } else {
	        p = pos - 1;
	        while (!peg$posDetailsCache[p]) {
	          p--;
	        }

	        details = peg$posDetailsCache[p];
	        details = {
	          line:   details.line,
	          column: details.column
	        };

	        while (p < pos) {
	          if (input.charCodeAt(p) === 10) {
	            details.line++;
	            details.column = 1;
	          } else {
	            details.column++;
	          }

	          p++;
	        }

	        peg$posDetailsCache[pos] = details;
	        return details;
	      }
	    }

	    function peg$computeLocation(startPos, endPos) {
	      var startPosDetails = peg$computePosDetails(startPos),
	          endPosDetails   = peg$computePosDetails(endPos);

	      return {
	        start: {
	          offset: startPos,
	          line:   startPosDetails.line,
	          column: startPosDetails.column
	        },
	        end: {
	          offset: endPos,
	          line:   endPosDetails.line,
	          column: endPosDetails.column
	        }
	      };
	    }

	    function peg$fail(expected) {
	      if (peg$currPos < peg$maxFailPos) { return; }

	      if (peg$currPos > peg$maxFailPos) {
	        peg$maxFailPos = peg$currPos;
	        peg$maxFailExpected = [];
	      }

	      peg$maxFailExpected.push(expected);
	    }

	    function peg$buildSimpleError(message, location) {
	      return new peg$SyntaxError(message, null, null, location);
	    }

	    function peg$buildStructuredError(expected, found, location) {
	      return new peg$SyntaxError(
	        peg$SyntaxError.buildMessage(expected, found),
	        expected,
	        found,
	        location
	      );
	    }

	    function peg$parseStart() {
	      var s0, s1, s2, s3, s4;

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$currPos;
	      s3 = peg$parse__();
	      if (s3 !== peg$FAILED) {
	        s4 = peg$parseUnit();
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseUnit();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c0(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseUnit() {
	      var s0, s1, s2, s3, s4;

	      s0 = peg$parseMacro();
	      if (s0 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 42) {
	          s0 = peg$c1;
	          peg$currPos++;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c2); }
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = [];
	          s2 = peg$currPos;
	          s3 = peg$currPos;
	          peg$silentFails++;
	          s4 = peg$parseBlanks();
	          peg$silentFails--;
	          if (s4 === peg$FAILED) {
	            s3 = void 0;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c3); }
	            }
	            if (s4 !== peg$FAILED) {
	              s3 = [s3, s4];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	          if (s2 !== peg$FAILED) {
	            while (s2 !== peg$FAILED) {
	              s1.push(s2);
	              s2 = peg$currPos;
	              s3 = peg$currPos;
	              peg$silentFails++;
	              s4 = peg$parseBlanks();
	              peg$silentFails--;
	              if (s4 === peg$FAILED) {
	                s3 = void 0;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	              if (s3 !== peg$FAILED) {
	                if (input.length > peg$currPos) {
	                  s4 = input.charAt(peg$currPos);
	                  peg$currPos++;
	                } else {
	                  s4 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c3); }
	                }
	                if (s4 !== peg$FAILED) {
	                  s3 = [s3, s4];
	                  s2 = s3;
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            }
	          } else {
	            s1 = peg$FAILED;
	          }
	          if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	          } else {
	            s0 = s1;
	          }
	        }
	      }

	      return s0;
	    }

	    function peg$parseMacro() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      if (peg$c4.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c5); }
	      }
	      if (s3 !== peg$FAILED) {
	        s4 = [];
	        if (peg$c6.test(input.charAt(peg$currPos))) {
	          s5 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c7); }
	        }
	        while (s5 !== peg$FAILED) {
	          s4.push(s5);
	          if (peg$c6.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c7); }
	          }
	        }
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        s1 = input.substring(s1, peg$currPos);
	      } else {
	        s1 = s2;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        peg$silentFails++;
	        if (peg$c6.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c7); }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 40) {
	              s5 = peg$c8;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c9); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseArgumentList();
	                if (s7 === peg$FAILED) {
	                  s7 = null;
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 41) {
	                      s9 = peg$c10;
	                      peg$currPos++;
	                    } else {
	                      s9 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c11); }
	                    }
	                    if (s9 !== peg$FAILED) {
	                      s4 = [s4, s5, s6, s7, s8, s9];
	                      s3 = s4;
	                    } else {
	                      peg$currPos = s3;
	                      s3 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c12(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseArgumentList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      s0 = peg$currPos;
	      s1 = peg$parseArgument();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        s5 = peg$parse__();
	        if (s5 !== peg$FAILED) {
	          s4 = input.substring(s4, peg$currPos);
	        } else {
	          s4 = s5;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c13;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c14); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$currPos;
	            s7 = peg$parse__();
	            if (s7 !== peg$FAILED) {
	              s6 = input.substring(s6, peg$currPos);
	            } else {
	              s6 = s7;
	            }
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseArgument();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          s5 = peg$parse__();
	          if (s5 !== peg$FAILED) {
	            s4 = input.substring(s4, peg$currPos);
	          } else {
	            s4 = s5;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c13;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c14); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$currPos;
	              s7 = peg$parse__();
	              if (s7 !== peg$FAILED) {
	                s6 = input.substring(s6, peg$currPos);
	              } else {
	                s6 = s7;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseArgument();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c15(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseArgument() {
	      var s0, s1, s2;

	      s0 = peg$parseMacro();
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseStringLiteral();
	        if (s1 !== peg$FAILED) {
	          s0 = input.substring(s0, peg$currPos);
	        } else {
	          s0 = s1;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = [];
	          if (peg$c16.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c17); }
	          }
	          if (s2 !== peg$FAILED) {
	            while (s2 !== peg$FAILED) {
	              s1.push(s2);
	              if (peg$c16.test(input.charAt(peg$currPos))) {
	                s2 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c17); }
	              }
	            }
	          } else {
	            s1 = peg$FAILED;
	          }
	          if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	          } else {
	            s0 = s1;
	          }
	        }
	      }

	      return s0;
	    }

	    function peg$parseStringLiteral() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s1 = peg$c18;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c19); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        if (input.substr(peg$currPos, 2) === peg$c20) {
	          s3 = peg$c20;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c21); }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s5 = peg$c18;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c19); }
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c3); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (input.substr(peg$currPos, 2) === peg$c20) {
	            s3 = peg$c20;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c21); }
	          }
	          if (s3 === peg$FAILED) {
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            if (input.charCodeAt(peg$currPos) === 34) {
	              s5 = peg$c18;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c19); }
	            }
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	              s4 = void 0;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	              if (input.length > peg$currPos) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c3); }
	              }
	              if (s5 !== peg$FAILED) {
	                s4 = [s4, s5];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s3 = peg$c18;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c19); }
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseWhiteSpaces() {
	      var s0, s1, s2, s3;

	      s0 = [];
	      s1 = [];
	      if (peg$c22.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c23); }
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          if (peg$c22.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c23); }
	          }
	        }
	      } else {
	        s1 = peg$FAILED;
	      }
	      if (s1 === peg$FAILED) {
	        s1 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s2 = peg$c24;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c25); }
	        }
	        if (s2 !== peg$FAILED) {
	          if (peg$c26.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        while (s1 !== peg$FAILED) {
	          s0.push(s1);
	          s1 = [];
	          if (peg$c22.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c23); }
	          }
	          if (s2 !== peg$FAILED) {
	            while (s2 !== peg$FAILED) {
	              s1.push(s2);
	              if (peg$c22.test(input.charAt(peg$currPos))) {
	                s2 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c23); }
	              }
	            }
	          } else {
	            s1 = peg$FAILED;
	          }
	          if (s1 === peg$FAILED) {
	            s1 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	              s2 = peg$c24;
	              peg$currPos++;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c25); }
	            }
	            if (s2 !== peg$FAILED) {
	              if (peg$c26.test(input.charAt(peg$currPos))) {
	                s3 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c27); }
	              }
	              if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          }
	        }
	      } else {
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseMultiLineComment() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c28) {
	        s1 = peg$c28;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c29); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c30) {
	          s5 = peg$c30;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c3); }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (input.substr(peg$currPos, 2) === peg$c30) {
	            s5 = peg$c30;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c3); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c30) {
	            s3 = peg$c30;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseSingleLineComment() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c32) {
	        s1 = peg$c32;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c33); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (peg$c26.test(input.charAt(peg$currPos))) {
	          s5 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c27); }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c3); }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (peg$c26.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c3); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parsePreprocessorDirective() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 35) {
	        s1 = peg$c34;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c35); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        if (input.substr(peg$currPos, 2) === peg$c36) {
	          s3 = peg$c36;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c37); }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (peg$c26.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c3); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (input.substr(peg$currPos, 2) === peg$c36) {
	            s3 = peg$c36;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c37); }
	          }
	          if (s3 === peg$FAILED) {
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            if (peg$c26.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c27); }
	            }
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	              s4 = void 0;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	              if (input.length > peg$currPos) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c3); }
	              }
	              if (s5 !== peg$FAILED) {
	                s4 = [s4, s5];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      return s0;
	    }

	    function peg$parseBlanks() {
	      var s0;

	      s0 = peg$parseWhiteSpaces();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseMultiLineComment();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseSingleLineComment();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parsePreprocessorDirective();
	          }
	        }
	      }

	      return s0;
	    }

	    function peg$parse__() {
	      var s0, s1, s2;

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseBlanks();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseBlanks();
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c38();
	      }
	      s0 = s1;

	      return s0;
	    }

	    peg$result = peg$startRuleFunction();

	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	      return peg$result;
	    } else {
	      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	        peg$fail(peg$endExpectation());
	      }

	      throw peg$buildStructuredError(
	        peg$maxFailExpected,
	        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
	        peg$maxFailPos < input.length
	          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
	          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
	      );
	    }
	  }

	  return {
	    SyntaxError: peg$SyntaxError,
	    parse:       peg$parse
	  };
	})()

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports=/*
	 * Generated by PEG.js 0.10.0.
	 *
	 * http://pegjs.org/
	 */
	(function() {
	  "use strict";

	  function peg$subclass(child, parent) {
	    function ctor() { this.constructor = child; }
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();
	  }

	  function peg$SyntaxError(message, expected, found, location) {
	    this.message  = message;
	    this.expected = expected;
	    this.found    = found;
	    this.location = location;
	    this.name     = "SyntaxError";

	    if (typeof Error.captureStackTrace === "function") {
	      Error.captureStackTrace(this, peg$SyntaxError);
	    }
	  }

	  peg$subclass(peg$SyntaxError, Error);

	  peg$SyntaxError.buildMessage = function(expected, found) {
	    var DESCRIBE_EXPECTATION_FNS = {
	          literal: function(expectation) {
	            return "\"" + literalEscape(expectation.text) + "\"";
	          },

	          "class": function(expectation) {
	            var escapedParts = "",
	                i;

	            for (i = 0; i < expectation.parts.length; i++) {
	              escapedParts += expectation.parts[i] instanceof Array
	                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
	                : classEscape(expectation.parts[i]);
	            }

	            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
	          },

	          any: function(expectation) {
	            return "any character";
	          },

	          end: function(expectation) {
	            return "end of input";
	          },

	          other: function(expectation) {
	            return expectation.description;
	          }
	        };

	    function hex(ch) {
	      return ch.charCodeAt(0).toString(16).toUpperCase();
	    }

	    function literalEscape(s) {
	      return s
	        .replace(/\\/g, '\\\\')
	        .replace(/"/g,  '\\"')
	        .replace(/\0/g, '\\0')
	        .replace(/\t/g, '\\t')
	        .replace(/\n/g, '\\n')
	        .replace(/\r/g, '\\r')
	        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
	    }

	    function classEscape(s) {
	      return s
	        .replace(/\\/g, '\\\\')
	        .replace(/\]/g, '\\]')
	        .replace(/\^/g, '\\^')
	        .replace(/-/g,  '\\-')
	        .replace(/\0/g, '\\0')
	        .replace(/\t/g, '\\t')
	        .replace(/\n/g, '\\n')
	        .replace(/\r/g, '\\r')
	        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
	    }

	    function describeExpectation(expectation) {
	      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
	    }

	    function describeExpected(expected) {
	      var descriptions = new Array(expected.length),
	          i, j;

	      for (i = 0; i < expected.length; i++) {
	        descriptions[i] = describeExpectation(expected[i]);
	      }

	      descriptions.sort();

	      if (descriptions.length > 0) {
	        for (i = 1, j = 1; i < descriptions.length; i++) {
	          if (descriptions[i - 1] !== descriptions[i]) {
	            descriptions[j] = descriptions[i];
	            j++;
	          }
	        }
	        descriptions.length = j;
	      }

	      switch (descriptions.length) {
	        case 1:
	          return descriptions[0];

	        case 2:
	          return descriptions[0] + " or " + descriptions[1];

	        default:
	          return descriptions.slice(0, -1).join(", ")
	            + ", or "
	            + descriptions[descriptions.length - 1];
	      }
	    }

	    function describeFound(found) {
	      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
	    }

	    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	  };

	  function peg$parse(input, options) {
	    options = options !== void 0 ? options : {};

	    var peg$FAILED = {},

	        peg$startRuleFunctions = { Start: peg$parseStart },
	        peg$startRuleFunction  = peg$parseStart,

	        peg$c0 = peg$anyExpectation(),
	        peg$c1 = function(decl) {
	        		return { 
	        			type:"TranslationUnit", 
	        			externalDeclarations: extractList(decl,[0,1]),
	        		};
	        	},
	        peg$c2 = function() {
	        		return {
	        			type:"NSAssumeNonnullBegin",
	        			context:"ExternalDeclaration",
	        			_hidden:true,
	        		};
	        	},
	        peg$c3 = function() {
	        		return{
	        			type:"NSAssumeNonnullEnd",
	        			context:"ExternalDeclaration",
	        			_hidden:true,
	        		};
	        	},
	        peg$c4 = "\"C\"",
	        peg$c5 = peg$literalExpectation("\"C\"", false),
	        peg$c6 = "{",
	        peg$c7 = peg$literalExpectation("{", false),
	        peg$c8 = "}",
	        peg$c9 = peg$literalExpectation("}", false),
	        peg$c10 = function(m) { return extractList(m,[0,1]); },
	        peg$c11 = ";",
	        peg$c12 = peg$literalExpectation(";", false),
	        peg$c13 = "#",
	        peg$c14 = peg$literalExpectation("#", false),
	        peg$c15 = "import",
	        peg$c16 = peg$literalExpectation("import", false),
	        peg$c17 = function(arg) {
	        		return {
	        			type:"ImportDirective",
	        			argument:arg
	        		};
	        	},
	        peg$c18 = function(arg) {
	        		return {
	        			type:"ModuleImportDirective",
	        			argument:arg
	        		};
	        	},
	        peg$c19 = "include",
	        peg$c20 = peg$literalExpectation("include", false),
	        peg$c21 = function(arg) {
	        		return {
	        			type:"IncludeDirective",
	        			argument:arg,
	        		};
	        	},
	        peg$c22 = function(spec, c1, decl, c2, comp) {
	        		return {
	        			type:"FunctionDefinition",
	        			specifiers:spec,
	        			c1:c1,
	        			declarator:decl,
	        			c2:c2,
	        			statement:comp,
	        		};
	        	},
	        peg$c23 = function(prefix, block, suffix) {
	        		return {
	        			type:"CompoundStatement",
	        			prefix:prefix,
	        			blockItems:block,
	        			suffix:suffix,
	        		};
	        	},
	        peg$c24 = function(m) {
	        		return {
	        			type:"StatementList",
	        			prefixes:extractList(m,0),
	        			statements:extractList(m,1),
	        		};
	        	},
	        peg$c25 = function(m) { return m; },
	        peg$c26 = ":",
	        peg$c27 = peg$literalExpectation(":", false),
	        peg$c28 = function(id, stmt) {
	          	return {
	          		type:"LabeledStatement",
	          		identifier:id,
	          		statement:stmt,
	          	};
	          },
	        peg$c29 = function(c1, expr, c2, c3, stmt) {
	          	return {
	          		c1:c1,
	          		type:"CaseStatement",
	          		c2:c2,
	          		expression:expr,
	          		c3:c3,
	          		statement:stmt
	          	};
	          },
	        peg$c30 = "(",
	        peg$c31 = peg$literalExpectation("(", false),
	        peg$c32 = ")",
	        peg$c33 = peg$literalExpectation(")", false),
	        peg$c34 = function(c1, c2, expression, c3, thenBlock, elseBlock) {
	          	return {
	          		type:"IfStatement",
	          		c1:c1,
	          		c2:c2,
	          		expression:expression, 
	          		c3:c3,
	          		thenBlock:{
	          			prefix:thenBlock[0],
	          			statement:thenBlock[1],
	          			suffix:thenBlock[2],
	          		},
	          		elseBlock:elseBlock?{
	          			prefix:elseBlock[1],
	          			statement:elseBlock[2]
	          		}:null,
	          	};
	          },
	        peg$c35 = function(c1, c2, e, c3, c4, s) {
	          	return {
	          		type:"SwitchStatement",
	          		c1:c1,
	          		c2:c2,
	          		expression:e,
	          		c3:c3,
	          		c4:c4,
	          		statement:s,
	          	};
	          },
	        peg$c36 = function(c1, c2, t, c3, c4, e, c5, c6, statement) {
	        		return {
	        			type:"ForInStatement",
	        			c1:c1,
	        			c2:c2,
	        			declarator:t,
	        			c3:c3,
	        			c4:c4,
	        			expression:e,
	        			c5:c5,
	        			c6:c6,
	        			statement:statement,
	        		};
	        	},
	        peg$c37 = function(init, cond, loop, prefix, statement) {
	        		var specifiers, declarators, expression;

	        		if(init) {
	        			if(init.length==1) {
	        				expression = init[0];
	        			} else {
	        				specifiers = init[0];
	        				declarators = init[2];
	        			}
	        		}

	        		return {
	        			type:"ForStatement",
	        			initSpecifiers: specifiers,
	        			initDeclarators: declarators,
	        			initExpression: expression,
	        			condExpression:cond?cond[1]:null,
	        			loopExpression:loop?loop[1]:null,
	        			prefix:prefix,
	        			statement:statement,
	        		};
	        	},
	        peg$c38 = function(c1, c2, cond, c3, c4, statement) {
	        		return {
	        			type:"WhileStatement",
	        			c1:c1,
	        			c2:c2,
	        			condExpression:cond,
	        			c3:c3,
	        			c4:c4,
	        			statement:statement,
	        		};
	        	},
	        peg$c39 = function(prefix, statement, suffix, cond) {
	        		return {
	        			type:"DoStatement",
	        			prefix:prefix,
	        			statement:statement,
	        			suffix:suffix,
	        			condExpression:cond,			
	        		}
	        	},
	        peg$c40 = function(label, suffix) { 
	          		return {
	          			type:"GotoStatement",
	          			label:identifier,
	          			suffix:suffix,
	          		};
	          	},
	        peg$c41 = function(c1) { 
	          		return {
	          			type:"BreakStatement",
	          			c1:c1,
	          		};
	          	},
	        peg$c42 = function(c1, e, c2) { 
	          		return {
	          			type:"ReturnStatement",
	          			c1:c1,
	          			expression:e,
	          			c2:c2
	          	 	};
	          	},
	        peg$c43 = function(s, c1, d) {
	        		return {
	        			type:"TypeVariableDeclarator",
	        			specifiers:s,
	        			c1:c1,
	        			declarator:d
	        		};
	        	},
	        peg$c44 = function(c1, statement) {
	        		return {
	        			type:"TryStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c45 = function(c1, c2, declarator, c3, c4, statement) {
	        		return {
	        			type:"CatchStatement",
	        			c1:c1,
	        			c2:c2,
	        			declarator:declarator,
	        			c3:c3,
	        			c4:c4,
	        			statement:statement,
	        		};
	        	},
	        peg$c46 = function(c1, statement) {
	        		return {
	        			type:"FinallyStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c47 = function(c1, expression, c2) {
	        		return {
	        			type:"ThrowStatement",
	        			c1:c1,
	        			expression:expression,
	        			c2:c2,
	        		};
	        	},
	        peg$c48 = function(ts, cs, c1, fs) {
	        		return {
	        			type:"TryBlock",
	        			tryStatement:ts,
	        			catchStatements:cs,
	        			c1:c1,
	        			finallyStatement:fs,
	        		};
	        	},
	        peg$c49 = function(expression, statement) {
	        		return {
	        			type:"SynchronizedStatement",
	        			expression:expression,
	        			statement:statement,
	        		};
	        	},
	        peg$c50 = function(c1, statement) {
	        		return {
	        			type:"AutoreleaseStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c51 = ",",
	        peg$c52 = peg$literalExpectation(",", false),
	        peg$c53 = function(head, tail) {
	        		if(0<tail.length) {
	        			return {
	        				type:"Expression",
	        				children:[head].concat(tail)
	        			};
	        		} else {
	        			return head;
	        		}
	        	},
	        peg$c54 = function(lhs, c1, op, c2, rhs) {
	            	return {
	            		type:"AssignmentExpression",
	            		lhs:lhs,
	            		c1:c1,
	            		operator:op,
	            		c2:c2,
	            		rhs:rhs
	            	};
	            },
	        peg$c55 = "=",
	        peg$c56 = peg$literalExpectation("=", false),
	        peg$c57 = "*=",
	        peg$c58 = peg$literalExpectation("*=", false),
	        peg$c59 = "/=",
	        peg$c60 = peg$literalExpectation("/=", false),
	        peg$c61 = "%=",
	        peg$c62 = peg$literalExpectation("%=", false),
	        peg$c63 = "+=",
	        peg$c64 = peg$literalExpectation("+=", false),
	        peg$c65 = "-=",
	        peg$c66 = peg$literalExpectation("-=", false),
	        peg$c67 = "<<=",
	        peg$c68 = peg$literalExpectation("<<=", false),
	        peg$c69 = ">>=",
	        peg$c70 = peg$literalExpectation(">>=", false),
	        peg$c71 = "&=",
	        peg$c72 = peg$literalExpectation("&=", false),
	        peg$c73 = "^=",
	        peg$c74 = peg$literalExpectation("^=", false),
	        peg$c75 = "|=",
	        peg$c76 = peg$literalExpectation("|=", false),
	        peg$c77 = "?",
	        peg$c78 = peg$literalExpectation("?", false),
	        peg$c79 = function(m) {
	        		if(!m[4]) {
	        			m[4] = m[0];
	        		}
	        		return {
	        			type:"ConditionalExpression", children:m
	        		};
	        	},
	        peg$c80 = "||",
	        peg$c81 = peg$literalExpectation("||", false),
	        peg$c82 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"LogicalOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c83 = "&&",
	        peg$c84 = peg$literalExpectation("&&", false),
	        peg$c85 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"LogicalAndExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c86 = "|",
	        peg$c87 = peg$literalExpectation("|", false),
	        peg$c88 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"InclusiveOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c89 = "^",
	        peg$c90 = peg$literalExpectation("^", false),
	        peg$c91 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"ExclusiveOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c92 = "&",
	        peg$c93 = peg$literalExpectation("&", false),
	        peg$c94 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"AndExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c95 = "!=",
	        peg$c96 = peg$literalExpectation("!=", false),
	        peg$c97 = "==",
	        peg$c98 = peg$literalExpectation("==", false),
	        peg$c99 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"EqualityExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c100 = "<=",
	        peg$c101 = peg$literalExpectation("<=", false),
	        peg$c102 = ">=",
	        peg$c103 = peg$literalExpectation(">=", false),
	        peg$c104 = "<",
	        peg$c105 = peg$literalExpectation("<", false),
	        peg$c106 = ">",
	        peg$c107 = peg$literalExpectation(">", false),
	        peg$c108 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"RelationalExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c109 = "<<",
	        peg$c110 = peg$literalExpectation("<<", false),
	        peg$c111 = ">>",
	        peg$c112 = peg$literalExpectation(">>", false),
	        peg$c113 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"ShiftExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c114 = /^[+\-]/,
	        peg$c115 = peg$classExpectation(["+", "-"], false, false),
	        peg$c116 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"AdditiveExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c117 = /^[*\/%]/,
	        peg$c118 = peg$classExpectation(["*", "/", "%"], false, false),
	        peg$c119 = function(head, tail) { 
	        		if(0<tail.length) {
	        			var result = head;
	        			for(var i=0;i<tail.length;i++) {
	        				result = {
	        					type:"MultiplicativeExpression",
	        					lhs:result,
	        					c1:tail[i][0],
	        					operator:tail[i][1],
	        					c2:tail[i][2],
	        					rhs:tail[i][3],
	        				};
	        			}
	        			return result;
	        		}
	        		return head;
	        	},
	        peg$c120 = function(t, e) {
	        		return {
	        			type:"CastExpression",
	        			castTo:t,
	        			expression:e
	        		};
	        	},
	        peg$c121 = "++",
	        peg$c122 = peg$literalExpectation("++", false),
	        peg$c123 = "--",
	        peg$c124 = peg$literalExpectation("--", false),
	        peg$c125 = function(m) {
	          		return {
	          			type:(m[0]=='++'?"UnaryIncExpression":"UnaryDecExpression"),
	          			children:m,
	          		};
	          	},
	        peg$c126 = function(m) {
	          		if(m[0] == '!') {
	          			return {
	          				type:"NotExpression",
	          				c1:m[1],
	          				child:m[2],
	          			};
	          		} else {
	          			return m;
	          		}
	          	},
	        peg$c127 = "*",
	        peg$c128 = peg$literalExpectation("*", false),
	        peg$c129 = "+",
	        peg$c130 = peg$literalExpectation("+", false),
	        peg$c131 = "-",
	        peg$c132 = peg$literalExpectation("-", false),
	        peg$c133 = "~",
	        peg$c134 = peg$literalExpectation("~", false),
	        peg$c135 = "!",
	        peg$c136 = peg$literalExpectation("!", false),
	        peg$c137 = function() { return text(); },
	        peg$c138 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return buildLeftAssocList(head,tail,1, function(a,b) {

	        				if(b.type == "PostfixApplyOperation") {

	        					return {type:"PostfixApplyExpression", context:a, parameters:b.parameters};

	        				} else if(b.type == "PostfixDotOperation") {

	        					return {type:"PostfixDotExpression", context:a, identifier:b.identifier};

	        				} else {

	        					return {type:"PostfixExpression", children:[a].concat(b)};

	        				}

	        			});

	        		}
	        		return head;
	        	},
	        peg$c139 = "[",
	        peg$c140 = peg$literalExpectation("[", false),
	        peg$c141 = "]",
	        peg$c142 = peg$literalExpectation("]", false),
	        peg$c143 = function(p) {
	        		return {
	        			type:"PostfixApplyOperation",
	        			parameters:p,
	        		};
	        	},
	        peg$c144 = ".",
	        peg$c145 = peg$literalExpectation(".", false),
	        peg$c146 = function(id) {
	        		return {
	        			type:"PostfixDotOperation",
	        			identifier:id
	        		};
	        	},
	        peg$c147 = "->",
	        peg$c148 = peg$literalExpectation("->", false),
	        peg$c149 = function(e) {
	        		return {
	        			type:"NestedExpression",
	        			expression:e
	        		};
	        	},
	        peg$c150 = function(m) {
	            	return{
	            		type:"Constant", 
	            		child:m
	            	};
	            },
	        peg$c151 = function() {
	            	return {
	            		type:"PrimaryIdentifier",
	            		name:text()
	            	};
	            },
	        peg$c152 = function() {
	            	return {
	            		type:"PrimaryIdentifier",
	            		name:text(),
	            	}
	            },
	        peg$c153 = "va_arg",
	        peg$c154 = peg$literalExpectation("va_arg", false),
	        peg$c155 = function(m) {return {type:"HexLiteral",token:m};},
	        peg$c156 = function(m) {return {type:"BinaryLiteral",token:m};},
	        peg$c157 = function(m) {return {type:"OctalLiteral",token:m};},
	        peg$c158 = function(m) {return {type:"CharacterLiteral",token:m};},
	        peg$c159 = function(m) {return {type:"BooleanLiteral",token:m};},
	        peg$c160 = function(m) {return {type:"FloatingPointLiteral",token:m};},
	        peg$c161 = function(m) {return {type:"DecimalLiteral",token:m};},
	        peg$c162 = function(m) { return {type:"StringLiteral",token:m};},
	        peg$c163 = "@{",
	        peg$c164 = peg$literalExpectation("@{", false),
	        peg$c165 = function(m) {
	        		return {
	        			type:"DictionaryExpression",
	        			body:m
	        		};
	        	},
	        peg$c166 = "@[",
	        peg$c167 = peg$literalExpectation("@[", false),
	        peg$c168 = function(m) {
	        		return {
	        			type:"ArrayExpression",
	        			body:m
	        		};
	        	},
	        peg$c169 = "@(",
	        peg$c170 = peg$literalExpectation("@(", false),
	        peg$c171 = function(e) {return e;},
	        peg$c172 = "@",
	        peg$c173 = peg$literalExpectation("@", false),
	        peg$c174 = function(head, tail) {
	        		return buildList(head,tail,3);
	        	},
	        peg$c175 = function() {
	        		return [];
	        	},
	        peg$c176 = function(t, c1, p, c2, s) {
	        		return {
	        			type:"BlockExpression",
	        			specifier:t,
	        			c1:c1,
	        			parameters:p,
	        			c2:c2,
	        			statement:s,
	        		};
	        	},
	        peg$c177 = function(r, s) {

	        		return {
	        			type:"MessageExpression",
	        			receiver:r,
	        			selector:s
	        		};
	        	},
	        peg$c178 = function(h, t) {
	        		return buildList(h,t,[0,1]);
	        	},
	        peg$c179 = function(s, c1, e) {
	            	return {
	            		type:"KeywordArgument",
	            		name:s?s.name:null,
	            		separator:c1,
	            		expression:e,
	            	};
	            },
	        peg$c180 = function(name) {
	        		return {
	        			type:"SelectorExpression",
	        			name:name
	        		};
	        	},
	        peg$c181 = function(name) {
	        		return {
	        			type:"ProtocolExpression",
	        			name:name
	        		};
	        	},
	        peg$c182 = function(name) {
	        		return {
	        			type:"EncodeExpression",
	        			arg:name,
	        			text:text()
	        		};
	        	},
	        peg$c183 = function(args) {
	        		return {
	        			type:"AvailableExpression",
	        			args:args
	        		};
	        	},
	        peg$c184 = function(spec, inhr, c1, p, c2, v, c3, d, c4) {
	        		var sup = extractOptional(inhr,3);
	        		var node = {
	        			type:"ClassInterface",
	        			classSpecifier:spec,
	        			superClass:sup?sup.name:null,
	        			c1:c1,
	        			protocols:p,
	        			c2:c2,
	        			variables:v,
	        			c3:c3,
	        			declarations:d,
	        			c4:c4,
	        		};
	        		return node;
	        	},
	        peg$c185 = function(spec, id, c1, p, c2, v, c3, d, c4) {
	        		var node = {
	        			type:"CategoryInterface",
	        			classSpecifier:spec,
	        			categoryName:id?id.name:'',
	        			c1:c1,
	        			protocols:p,
	        			c2:c2,
	        			variables:v,
	        			c3:c3,
	        			declarations:d,
	        			c4:c4,
	        		};
	        		return node;

	        	},
	        peg$c186 = function(spec, inhr, c2, v, c3, d, c4) {
	        		var sup = extractOptional(inhr,3);
	        		return {
	        			type:"ClassImplementation",
	        			classSpecifier:spec,
	        			c1:"",
	        			superClass:sup?sup.name:null,
	        			c2:c2,
	        			variables:v,
	        			c3:c3,
	        			definitions:d,
	        			c4:c4,
	        		};
	        	},
	        peg$c187 = function(spec, c1, id, c3, d, c4) {
	        		return {
	        			type:"CategoryImplementation",
	        			classSpecifier:spec,
	        			c1:c1,
	        			categoryName:id.name,
	        			c2:"",
	        			variables:null,
	        			c3:c3,
	        			definitions:d,
	        			c4:c4,
	        		};
	        	},
	        peg$c188 = function() {
	        		return {
	        			type:"ClassDeclarationList",
	        			_hidden:true,
	        		};
	        	},
	        peg$c189 = function() {
	        		return {
	        			type:"InstanceVariables",
	        			declarations:[],
	        		};
	        	},
	        peg$c190 = function(prefix, d, suffix) {
	        		return {
	        			type:"InstanceVariables",
	        			prefix:prefix,
	        			visibilityPrefixes:extractList(d,0),
	        			visibilitySpecification:extractList(d,1),
	        			declarationPrefixes:extractList(d,2),
	        			declarations:extractList(d,3),
	        			suffix:suffix,
	        		};
	        	},
	        peg$c191 = function(c1, name, c2, p, decl, c3) {
	        		return {
	        			type:"ProtocolDeclaration",
	        			c1:c1,
	        			name:name,
	        			c2:c2,			
	        			protocols:p,
	        			declarations:extractList(decl,[0,1]),
	        			c3:c3
	        		};
	        	},
	        peg$c192 = function() {
	        		return {
	        			type:"ProtocolDeclarationList",
	        			_hidden:true
	        		};
	        	},
	        peg$c193 = function(p) {
	        		return p;
	        	},
	        peg$c194 = function(head, tail) {
	        	return buildList(head,tail,3);
	        },
	        peg$c195 = function(head, tail) {
	            	return buildList(head,tail,[0,1]);
	            },
	        peg$c196 = function(m) { 
	            	return {
	            		type:"ClassMethodDefinition",
	            		returnType:m.returnType,
	            		selector:m.selector,
	            		initDeclarators:m.initDeclarators,
	            		attributes:m.attributes,
	            		c1:m.c1,
	            		statement:m.statement,
	            	}; 
	           	},
	        peg$c197 = function(m) {
	            	return {
	            		type:"InstanceMethodDefinition",
	            		returnType:m.returnType,
	            		selector:m.selector,
	            		initDeclarators:m.initDeclarators,
	            		attributes:m.attributes,    		
	            		c1:m.c1,
	            		statement:m.statement,
	            	}; 
	           	},
	        peg$c198 = function(t, s, i, a, c1, statement) {
	        		return {
	        			type:"MethodDefinition",
	        			returnType:t,
	        			selector:s,
	        			initDeclarators:i,
	        			attributes:extractOptional(a,1),
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c199 = function(p) {
	            	return {
	            		type:"PropertyImplementation",
	            		properties:p,
	            	};
	            },
	        peg$c200 = function(p) {
	            	return {
	            		type:"PropertyDynamicImplementation",
	            		properties:p,
	            	};    	
	            },
	        peg$c201 = function(head, tail) {
	            	return buildList(head,tail,3);
	            },
	        peg$c202 = function(id, sub) {
	            	var s = extractOptional(sub,3);
	            	return {
	            		type:"PropertySynthesizeItem",
	            		name:id.name,
	            		syntheName:s?s.name:null,
	            	};
	            },
	        peg$c203 = function(h, e) {
	        		return {
	        			type:"StructOrUnionSpecifier",
	        			isUnion:h.token=="union",
	        			name:e.name,
	        			c1:e.c1,
	        			declarations:e.declarations,
	        			c2:e.c2,
	        		};
	        	},
	        peg$c204 = function(id, c1, d, c2) {
	        		return {
	        			tagName:id?id.name:null,
	        			c1:c1,
	        			declarations:d,
	        			c2:c2
	        		};
	        	},
	        peg$c205 = function(id) {
	        		return {tagName:id.name};
	        	},
	        peg$c206 = function(q, d, a) {
	        		return {
	        			type:"StructDeclaration",
	        			specifiers:q,
	        			declarators:d,
	        		};
	        	},
	        peg$c207 = function(head, tail) {
	        		return buildList(head,tail,2);
	        	},
	        peg$c208 = function(d, c) {
	        		return { type:"UnionDeclarator", declarator:d, width:c };
	        	},
	        peg$c209 = function(c1, id, type, c2, c3, enums, c4) {
	        		return {
	        			type:"EnumSpecifier", 
	        			c1:c1,
	        			tagName:id?id.name:null,
	        			baseTypeSpecifiers:extractOptional(type,3), 
	        			c2:c2,
	        			c3:c3,
	        			enumerators:enums,
	        			c4:c4
	        		};
	        	},
	        peg$c210 = function(c1, id, type) {
	        		return {
	        			type:"EnumSpecifier", 
	        			c1:c1,
	        			tagName:id?id.name:null,
	        			c2:'',
	        			c3:'',
	        			baseTypeSpecifiers:extractOptional(type,3),
	        		};
	        	},
	        peg$c211 = function(head, tail, rest) {
	        		var result = buildList(head,tail,[0,2,3]);
	        		if(rest) {
	        			result.push(rest[0]);
	        		}
	        		return result;
	        	},
	        peg$c212 = function(name, expr) {
	        		return {
	        			type:"Enumerator",
	        			name:name.name,
	        			expression:extractOptional(expr,3)
	        		};
	        	},
	        peg$c213 = function(p, d, a) {
	        		return {
	        			type:"Declarator",
	        			pointer:p, 
	        			name:d.name,
	        			directDeclarator:d,
	        			attributes:extractOptional(a,1),
	        		};
	        	},
	        peg$c214 = function(q, p) {
	             	return {
	             		type:"Pointer",
	             		qualifiers:extractList(q,1),
	             		child:p,
	             	};
	             },
	        peg$c215 = "(^",
	        peg$c216 = peg$literalExpectation("(^", false),
	        peg$c217 = function(s, i, p) {
	            	return {
	            		type:"BlockDirectDeclarator", // compatible with BlockTypeSpecifier
	            		specifiers:extractOptional(s,1),
	            		name:i.name,
	            		parameters:p,
	            	};
	            },
	        peg$c218 = function(q, d, s) {
	            	return {
	            		type:"FunctionDirectDeclarator",
	            		qualifiers:extractList(q,1),
	            		name:d.name,
	            		declarator:d,
	            		suffixes:extractList(s,1),
	            	};
	            },
	        peg$c219 = function(q, i, s) {
	        		return {
	        			type:"DirectDeclarator",
	        			qualifiers:extractList(q,0),
	        			name:i.name,
	        			suffixes:extractList(s,1),
	        		};
	        	},
	        peg$c220 = function(m) {
	        		return {
	        			type:"DeclaratorLookupSuffix",
	        			children:m,
	        			expression:m[2],
	        		};
	        		
	        	},
	        peg$c221 = function(m) {
	         		return {
	         			type:"DeclaratorApplySuffix",
	         			children:m,
	         			parameters:m[2]?m[2].parameters:null,
	         			isVariadic:m[2]?m[2].v:null,
	         		};
	         	},
	        peg$c222 = "...",
	        peg$c223 = peg$literalExpectation("...", false),
	        peg$c224 = function(p, v) {
	        		return {
	        			type:"ParameterList",
	        			parameters:p,
	        			isVariadic:v?true:false,
	        		};
	        	},
	        peg$c225 = function(head, tail) {
	        		return buildList(head,tail,1);
	        	},
	        peg$c226 = function(spec, c1, decl, c2) {
	        		return {
	        			type:"Declaration",
	        			specifiers:spec,
	        			c1:c1,
	        			initDeclarators:decl,
	        			c2:c2,
	        		};
	        	},
	        peg$c227 = /^[{:;)=,]/,
	        peg$c228 = peg$classExpectation(["{", ":", ";", ")", "=", ","], false, false),
	        peg$c229 = function(m) {
	        		return {
	        			type:"StorageClassSpecifier",
	        			token:text()
	        		};
	        	},
	        peg$c230 = function(e) {
	        		return {
	        			type:"TypeofSpecifier",
	        			expression:e,
	        			text:text(),
	        		};
	        	},
	        peg$c231 = function(s, id, p) {
	        		return {
	        			type:"BlockTypeSpecifier",
	        			specifiers:extractOptional(s,1),
	        			name:id?id.name:null,
	        			parameters:extractOptional(p,1),
	        		};
	        	},
	        peg$c232 = function(p) {
	        		return {
	        			type:"ProtocolTypeSpecifier",
	        			protocols:p,
	        		};
	        	},
	        peg$c233 = function(i, g) { 
	        		return {
	        			type:"TypeNameSpecifier",
	        			name:i.name,
	        			generics:extractOptional(g,1),
	        		};
	        	},
	        peg$c234 = function(i) {return isTypeName(i.name);},
	        peg$c235 = function(i) {
	        		return i;
	        	},
	        peg$c236 = function(head, tail) {
	        		return {
	        			type:"TypeParameterList",
	        			parameters:buildList(head,tail,3),
	        		};
	        	},
	        peg$c237 = function() {
	        		return {
	        			type:"TypeParameterList",
	        			parameters:null,
	        		};
	        	},
	        peg$c238 = function(m) { 
	        		return {
	        			type:"BasicTypeSpecifier",
	        			token:text()
	        		}; 
	        	},
	        peg$c239 = function(m) {
	        		return {type:"TypeQualifier",token:text()};
	        	},
	        peg$c240 = "((",
	        peg$c241 = peg$literalExpectation("((", false),
	        peg$c242 = "))",
	        peg$c243 = peg$literalExpectation("))", false),
	        peg$c244 = function() {
	        		return {
	        			type:"AttributeQualifier",token:text()
	        		};
	        	},
	        peg$c245 = function() {
	        		return {type:"ProtocolQualifier",token:text()};
	        	},
	        peg$c246 = function(m) {
	        		return {type:"ArcBehaviourQualifier",token:text()};
	        	},
	        peg$c247 = function() {
	        		return {type:"NullabilityQualifier",token:"nullable"};
	        	},
	        peg$c248 = function() {
	        		return {type:"NullabilityQualifier",token:"nonnull"};
	        	},
	        peg$c249 = function() {
	        		return {type:"NuulabilityQualifier",token:"null_unspecified"};
	        	},
	        peg$c250 = function(decl, init) {
	        		return {
	        			type:"InitDeclarator",
	        			declarator:decl,
	        			cast:extractOptional(init,3),
	        			initializer:extractOptional(init,5),
	        		};
	        	},
	        peg$c251 = function(m) {
	        	return {
	        		type:"ClassMethodDeclaration",
	        		returnType:m.returnType,
	        		selector:m.selector,
	        		attributes:m.attributes,
	        	};
	        },
	        peg$c252 = function(m) {
	        	return {
	        		type:"InstanceMethodDeclaration",
	        		returnType:m.returnType,
	        		selector:m.selector,
	        		attributes:m.attributes,
	        	};
	        },
	        peg$c253 = function(t, s, a) {
	        	return {
	        		type:"MethodDeclaration",
	        		returnType:t,
	        		selector:s,
	        		attributes:a,
	        	};
	        },
	        peg$c254 = function(t) {
	        	return t;
	        },
	        peg$c255 = function(head, tail, va) {

	        		var name = (head.label?head.label:head.name) + ":";
	        		for(var i=0;i<tail.length;i++) {
	        			name += (tail[i][1].label?tail[i][1].label:tail[i][1].name) + ":";
	        		}

	        		var result = {
	        			type:"MethodSelector",
	        			name:name,
	        			head:head,
	        			tail:extractList(tail,1),
	        			variableArgument:va?true:false,
	        		};		
	        		return result;
	        	},
	        peg$c256 = function(s) {
	        		return {
	        			type:"MethodSelector",
	        			name:s.name,
	        			selector:s,
	        		};
	        	},
	        peg$c257 = function(s, t, u, i) {
	        		return {
	        			type:"KeywordDeclarator",
	        			label:s?s.name:null,
	        			methodType:extractOptional(t,1),
	        			unused:extractOptional(u,1),
	        			name:i.name,
	        		};
	        	},
	        peg$c258 = function(s, d) {
	        		return {
	        			type:"TypeName",
	        			specifiers:s,
	        			abstractDeclarator:extractOptional(d,1),
	        		};
	        	},
	        peg$c259 = function(p, tail) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Pointer",
	        			pointer:p,
	        			child:extractOptional(tail,1),
	        		};
	        	},
	        peg$c260 = function(spec, a) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Specifier",
	        			specifier:spec,
	        			child:extractOptional(a,1),
	        		};		
	        	},
	        peg$c261 = function(a, s) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Apply",
	        			child:extractOptional(a,1),
	        			suffixes:extractList(s,1),
	        		};
	        	},
	        peg$c262 = function(m) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Subscript",
	        			child:extractList(m,3),
	        		};
	        	},
	        peg$c263 = function(s, d) {
	        	return {
	        		type:"ParameterDeclaration",
	        		specifiers:s,
	        		declarator:extractOptional(d,1),
	        	};
	        },
	        peg$c264 = function(attr, decl) {
	        	return {
	        		type:"PropertyDeclaration",
	        		attributes:attr,
	        		declaration:decl,
	        	};
	        },
	        peg$c265 = function(m) {
	        		return extractOptional(m,1);
	        	},
	        peg$c266 = function(name) { 
	        		return {type:"Identifier", name:name};
	        	},
	        peg$c267 = /^[A-Za-z_]/,
	        peg$c268 = peg$classExpectation([["A", "Z"], ["a", "z"], "_"], false, false),
	        peg$c269 = /^[A-Za-z_0-9]/,
	        peg$c270 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false),
	        peg$c271 = "@YES",
	        peg$c272 = peg$literalExpectation("@YES", false),
	        peg$c273 = "@NO",
	        peg$c274 = peg$literalExpectation("@NO", false),
	        peg$c275 = "\"",
	        peg$c276 = peg$literalExpectation("\"", false),
	        peg$c277 = /^[^\\"]/,
	        peg$c278 = peg$classExpectation(["\\", "\""], true, false),
	        peg$c279 = /^[^\\>]/,
	        peg$c280 = peg$classExpectation(["\\", ">"], true, false),
	        peg$c281 = "\\",
	        peg$c282 = peg$literalExpectation("\\", false),
	        peg$c283 = /^[btnfr?"'\\]/,
	        peg$c284 = peg$classExpectation(["b", "t", "n", "f", "r", "?", "\"", "'", "\\"], false, false),
	        peg$c285 = /^[0-3]/,
	        peg$c286 = peg$classExpectation([["0", "3"]], false, false),
	        peg$c287 = /^[0-7]/,
	        peg$c288 = peg$classExpectation([["0", "7"]], false, false),
	        peg$c289 = "x",
	        peg$c290 = peg$literalExpectation("x", false),
	        peg$c291 = /^[0-9a-fA-F]/,
	        peg$c292 = peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false),
	        peg$c293 = function() {1,2},
	        peg$c294 = "u",
	        peg$c295 = peg$literalExpectation("u", false),
	        peg$c296 = function() {4},
	        peg$c297 = "0",
	        peg$c298 = peg$literalExpectation("0", false),
	        peg$c299 = "b",
	        peg$c300 = peg$literalExpectation("b", false),
	        peg$c301 = "B",
	        peg$c302 = peg$literalExpectation("B", false),
	        peg$c303 = /^[0-1]/,
	        peg$c304 = peg$classExpectation([["0", "1"]], false, false),
	        peg$c305 = "X",
	        peg$c306 = peg$literalExpectation("X", false),
	        peg$c307 = /^[1-9]/,
	        peg$c308 = peg$classExpectation([["1", "9"]], false, false),
	        peg$c309 = /^[0-9]/,
	        peg$c310 = peg$classExpectation([["0", "9"]], false, false),
	        peg$c311 = "'",
	        peg$c312 = peg$literalExpectation("'", false),
	        peg$c313 = /^[^'\\]/,
	        peg$c314 = peg$classExpectation(["'", "\\"], true, false),
	        peg$c315 = /^[uUlL]/,
	        peg$c316 = peg$classExpectation(["u", "U", "l", "L"], false, false),
	        peg$c317 = /^[eE]/,
	        peg$c318 = peg$classExpectation(["e", "E"], false, false),
	        peg$c319 = /^[fFdD]/,
	        peg$c320 = peg$classExpectation(["f", "F", "d", "D"], false, false),
	        peg$c321 = "case",
	        peg$c322 = peg$literalExpectation("case", false),
	        peg$c323 = "default",
	        peg$c324 = peg$literalExpectation("default", false),
	        peg$c325 = "if",
	        peg$c326 = peg$literalExpectation("if", false),
	        peg$c327 = "else",
	        peg$c328 = peg$literalExpectation("else", false),
	        peg$c329 = "switch",
	        peg$c330 = peg$literalExpectation("switch", false),
	        peg$c331 = "sizeof",
	        peg$c332 = peg$literalExpectation("sizeof", false),
	        peg$c333 = "typeof",
	        peg$c334 = peg$literalExpectation("typeof", false),
	        peg$c335 = "typedef",
	        peg$c336 = peg$literalExpectation("typedef", false),
	        peg$c337 = "struct",
	        peg$c338 = peg$literalExpectation("struct", false),
	        peg$c339 = "union",
	        peg$c340 = peg$literalExpectation("union", false),
	        peg$c341 = "enum",
	        peg$c342 = peg$literalExpectation("enum", false),
	        peg$c343 = "self",
	        peg$c344 = peg$literalExpectation("self", false),
	        peg$c345 = "super",
	        peg$c346 = peg$literalExpectation("super", false),
	        peg$c347 = "for",
	        peg$c348 = peg$literalExpectation("for", false),
	        peg$c349 = "do",
	        peg$c350 = peg$literalExpectation("do", false),
	        peg$c351 = "while",
	        peg$c352 = peg$literalExpectation("while", false),
	        peg$c353 = "goto",
	        peg$c354 = peg$literalExpectation("goto", false),
	        peg$c355 = "continue",
	        peg$c356 = peg$literalExpectation("continue", false),
	        peg$c357 = "break",
	        peg$c358 = peg$literalExpectation("break", false),
	        peg$c359 = "return",
	        peg$c360 = peg$literalExpectation("return", false),
	        peg$c361 = "@interface",
	        peg$c362 = peg$literalExpectation("@interface", false),
	        peg$c363 = "@implementation",
	        peg$c364 = peg$literalExpectation("@implementation", false),
	        peg$c365 = "@end",
	        peg$c366 = peg$literalExpectation("@end", false),
	        peg$c367 = "@private",
	        peg$c368 = peg$literalExpectation("@private", false),
	        peg$c369 = "@public",
	        peg$c370 = peg$literalExpectation("@public", false),
	        peg$c371 = "@package",
	        peg$c372 = peg$literalExpectation("@package", false),
	        peg$c373 = "@protected",
	        peg$c374 = peg$literalExpectation("@protected", false),
	        peg$c375 = "@property",
	        peg$c376 = peg$literalExpectation("@property", false),
	        peg$c377 = "@synthesize",
	        peg$c378 = peg$literalExpectation("@synthesize", false),
	        peg$c379 = "@dynamic",
	        peg$c380 = peg$literalExpectation("@dynamic", false),
	        peg$c381 = "@required",
	        peg$c382 = peg$literalExpectation("@required", false),
	        peg$c383 = "@import",
	        peg$c384 = peg$literalExpectation("@import", false),
	        peg$c385 = "@selector",
	        peg$c386 = peg$literalExpectation("@selector", false),
	        peg$c387 = "@class",
	        peg$c388 = peg$literalExpectation("@class", false),
	        peg$c389 = "@protocol",
	        peg$c390 = peg$literalExpectation("@protocol", false),
	        peg$c391 = "@encode",
	        peg$c392 = peg$literalExpectation("@encode", false),
	        peg$c393 = "@available",
	        peg$c394 = peg$literalExpectation("@available", false),
	        peg$c395 = "@optional",
	        peg$c396 = peg$literalExpectation("@optional", false),
	        peg$c397 = "@try",
	        peg$c398 = peg$literalExpectation("@try", false),
	        peg$c399 = "@catch",
	        peg$c400 = peg$literalExpectation("@catch", false),
	        peg$c401 = "@finally",
	        peg$c402 = peg$literalExpectation("@finally", false),
	        peg$c403 = "@throw",
	        peg$c404 = peg$literalExpectation("@throw", false),
	        peg$c405 = "@synchronized",
	        peg$c406 = peg$literalExpectation("@synchronized", false),
	        peg$c407 = "@autoreleasepool",
	        peg$c408 = peg$literalExpectation("@autoreleasepool", false),
	        peg$c409 = "void",
	        peg$c410 = peg$literalExpectation("void", false),
	        peg$c411 = "char",
	        peg$c412 = peg$literalExpectation("char", false),
	        peg$c413 = "short",
	        peg$c414 = peg$literalExpectation("short", false),
	        peg$c415 = "int",
	        peg$c416 = peg$literalExpectation("int", false),
	        peg$c417 = "long",
	        peg$c418 = peg$literalExpectation("long", false),
	        peg$c419 = "float",
	        peg$c420 = peg$literalExpectation("float", false),
	        peg$c421 = "double",
	        peg$c422 = peg$literalExpectation("double", false),
	        peg$c423 = "signed",
	        peg$c424 = peg$literalExpectation("signed", false),
	        peg$c425 = "unsigned",
	        peg$c426 = peg$literalExpectation("unsigned", false),
	        peg$c427 = "instancetype",
	        peg$c428 = peg$literalExpectation("instancetype", false),
	        peg$c429 = "id",
	        peg$c430 = peg$literalExpectation("id", false),
	        peg$c431 = "__unsafe_unretained",
	        peg$c432 = peg$literalExpectation("__unsafe_unretained", false),
	        peg$c433 = "__weak",
	        peg$c434 = peg$literalExpectation("__weak", false),
	        peg$c435 = "__autoreleasing",
	        peg$c436 = peg$literalExpectation("__autoreleasing", false),
	        peg$c437 = "__strong",
	        peg$c438 = peg$literalExpectation("__strong", false),
	        peg$c439 = "__typeof",
	        peg$c440 = peg$literalExpectation("__typeof", false),
	        peg$c441 = "__typeof__",
	        peg$c442 = peg$literalExpectation("__typeof__", false),
	        peg$c443 = "__covariant",
	        peg$c444 = peg$literalExpectation("__covariant", false),
	        peg$c445 = "__kindof",
	        peg$c446 = peg$literalExpectation("__kindof", false),
	        peg$c447 = "__nonnull",
	        peg$c448 = peg$literalExpectation("__nonnull", false),
	        peg$c449 = "__nullable",
	        peg$c450 = peg$literalExpectation("__nullable", false),
	        peg$c451 = "__null_unspecified",
	        peg$c452 = peg$literalExpectation("__null_unspecified", false),
	        peg$c453 = "_Nonnull",
	        peg$c454 = peg$literalExpectation("_Nonnull", false),
	        peg$c455 = "_Nullable",
	        peg$c456 = peg$literalExpectation("_Nullable", false),
	        peg$c457 = "_Null_unspecified",
	        peg$c458 = peg$literalExpectation("_Null_unspecified", false),
	        peg$c459 = "__attribute__",
	        peg$c460 = peg$literalExpectation("__attribute__", false),
	        peg$c461 = "__deprecated",
	        peg$c462 = peg$literalExpectation("__deprecated", false),
	        peg$c463 = "__unused",
	        peg$c464 = peg$literalExpectation("__unused", false),
	        peg$c465 = "__block",
	        peg$c466 = peg$literalExpectation("__block", false),
	        peg$c467 = "auto",
	        peg$c468 = peg$literalExpectation("auto", false),
	        peg$c469 = "register",
	        peg$c470 = peg$literalExpectation("register", false),
	        peg$c471 = "static",
	        peg$c472 = peg$literalExpectation("static", false),
	        peg$c473 = "extern",
	        peg$c474 = peg$literalExpectation("extern", false),
	        peg$c475 = "const",
	        peg$c476 = peg$literalExpectation("const", false),
	        peg$c477 = "volatile",
	        peg$c478 = peg$literalExpectation("volatile", false),
	        peg$c479 = "inline",
	        peg$c480 = peg$literalExpectation("inline", false),
	        peg$c481 = "restrict",
	        peg$c482 = peg$literalExpectation("restrict", false),
	        peg$c483 = "in",
	        peg$c484 = peg$literalExpectation("in", false),
	        peg$c485 = "out",
	        peg$c486 = peg$literalExpectation("out", false),
	        peg$c487 = "inout",
	        peg$c488 = peg$literalExpectation("inout", false),
	        peg$c489 = "bycopy",
	        peg$c490 = peg$literalExpectation("bycopy", false),
	        peg$c491 = "byref",
	        peg$c492 = peg$literalExpectation("byref", false),
	        peg$c493 = "oneway",
	        peg$c494 = peg$literalExpectation("oneway", false),
	        peg$c495 = "nonatomic",
	        peg$c496 = peg$literalExpectation("nonatomic", false),
	        peg$c497 = "copy",
	        peg$c498 = peg$literalExpectation("copy", false),
	        peg$c499 = "assign",
	        peg$c500 = peg$literalExpectation("assign", false),
	        peg$c501 = "weak",
	        peg$c502 = peg$literalExpectation("weak", false),
	        peg$c503 = "strong",
	        peg$c504 = peg$literalExpectation("strong", false),
	        peg$c505 = "retain",
	        peg$c506 = peg$literalExpectation("retain", false),
	        peg$c507 = "readonly",
	        peg$c508 = peg$literalExpectation("readonly", false),
	        peg$c509 = "readwrite",
	        peg$c510 = peg$literalExpectation("readwrite", false),
	        peg$c511 = "getter",
	        peg$c512 = peg$literalExpectation("getter", false),
	        peg$c513 = "setter",
	        peg$c514 = peg$literalExpectation("setter", false),
	        peg$c515 = "nonnull",
	        peg$c516 = peg$literalExpectation("nonnull", false),
	        peg$c517 = "nullable",
	        peg$c518 = peg$literalExpectation("nullable", false),
	        peg$c519 = "null_unspecified",
	        peg$c520 = peg$literalExpectation("null_unspecified", false),
	        peg$c521 = "NS_ASSUME_NONNULL_BEGIN",
	        peg$c522 = peg$literalExpectation("NS_ASSUME_NONNULL_BEGIN", false),
	        peg$c523 = "NS_ASSUME_NONNULL_END",
	        peg$c524 = peg$literalExpectation("NS_ASSUME_NONNULL_END", false),
	        peg$c525 = "_Bool",
	        peg$c526 = peg$literalExpectation("_Bool", false),
	        peg$c527 = "_Complex",
	        peg$c528 = peg$literalExpectation("_Complex", false),
	        peg$c529 = "_Imaginary",
	        peg$c530 = peg$literalExpectation("_Imaginary", false),
	        peg$c531 = /^[ \t\x0B\f\xA0\uFEFF \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
	        peg$c532 = peg$classExpectation([" ", "\t", "\x0B", "\f", "\xA0", "\uFEFF", " ", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u202F", "\u205F", "\u3000"], false, false),
	        peg$c533 = /^[\r\n\u2028\u2029]/,
	        peg$c534 = peg$classExpectation(["\r", "\n", "\u2028", "\u2029"], false, false),
	        peg$c535 = "/*",
	        peg$c536 = peg$literalExpectation("/*", false),
	        peg$c537 = "*/",
	        peg$c538 = peg$literalExpectation("*/", false),
	        peg$c539 = "//",
	        peg$c540 = peg$literalExpectation("//", false),
	        peg$c541 = "define",
	        peg$c542 = peg$literalExpectation("define", false),
	        peg$c543 = "undef",
	        peg$c544 = peg$literalExpectation("undef", false),
	        peg$c545 = "warning",
	        peg$c546 = peg$literalExpectation("warning", false),
	        peg$c547 = "error",
	        peg$c548 = peg$literalExpectation("error", false),
	        peg$c549 = "line",
	        peg$c550 = peg$literalExpectation("line", false),
	        peg$c551 = "ifdef",
	        peg$c552 = peg$literalExpectation("ifdef", false),
	        peg$c553 = "ifndef",
	        peg$c554 = peg$literalExpectation("ifndef", false),
	        peg$c555 = "endif",
	        peg$c556 = peg$literalExpectation("endif", false),
	        peg$c557 = "elif",
	        peg$c558 = peg$literalExpectation("elif", false),
	        peg$c559 = "pragma",
	        peg$c560 = peg$literalExpectation("pragma", false),
	        peg$c561 = "end",
	        peg$c562 = peg$literalExpectation("end", false),

	        peg$currPos          = 0,
	        peg$savedPos         = 0,
	        peg$posDetailsCache  = [{ line: 1, column: 1 }],
	        peg$maxFailPos       = 0,
	        peg$maxFailExpected  = [],
	        peg$silentFails      = 0,

	        peg$resultsCache = {},

	        peg$result;

	    if ("startRule" in options) {
	      if (!(options.startRule in peg$startRuleFunctions)) {
	        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	      }

	      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }

	    function text() {
	      return input.substring(peg$savedPos, peg$currPos);
	    }

	    function location() {
	      return peg$computeLocation(peg$savedPos, peg$currPos);
	    }

	    function expected(description, location) {
	      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

	      throw peg$buildStructuredError(
	        [peg$otherExpectation(description)],
	        input.substring(peg$savedPos, peg$currPos),
	        location
	      );
	    }

	    function error(message, location) {
	      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

	      throw peg$buildSimpleError(message, location);
	    }

	    function peg$literalExpectation(text, ignoreCase) {
	      return { type: "literal", text: text, ignoreCase: ignoreCase };
	    }

	    function peg$classExpectation(parts, inverted, ignoreCase) {
	      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
	    }

	    function peg$anyExpectation() {
	      return { type: "any" };
	    }

	    function peg$endExpectation() {
	      return { type: "end" };
	    }

	    function peg$otherExpectation(description) {
	      return { type: "other", description: description };
	    }

	    function peg$computePosDetails(pos) {
	      var details = peg$posDetailsCache[pos], p;

	      if (details) {
	        return details;
	      } else {
	        p = pos - 1;
	        while (!peg$posDetailsCache[p]) {
	          p--;
	        }

	        details = peg$posDetailsCache[p];
	        details = {
	          line:   details.line,
	          column: details.column
	        };

	        while (p < pos) {
	          if (input.charCodeAt(p) === 10) {
	            details.line++;
	            details.column = 1;
	          } else {
	            details.column++;
	          }

	          p++;
	        }

	        peg$posDetailsCache[pos] = details;
	        return details;
	      }
	    }

	    function peg$computeLocation(startPos, endPos) {
	      var startPosDetails = peg$computePosDetails(startPos),
	          endPosDetails   = peg$computePosDetails(endPos);

	      return {
	        start: {
	          offset: startPos,
	          line:   startPosDetails.line,
	          column: startPosDetails.column
	        },
	        end: {
	          offset: endPos,
	          line:   endPosDetails.line,
	          column: endPosDetails.column
	        }
	      };
	    }

	    function peg$fail(expected) {
	      if (peg$currPos < peg$maxFailPos) { return; }

	      if (peg$currPos > peg$maxFailPos) {
	        peg$maxFailPos = peg$currPos;
	        peg$maxFailExpected = [];
	      }

	      peg$maxFailExpected.push(expected);
	    }

	    function peg$buildSimpleError(message, location) {
	      return new peg$SyntaxError(message, null, null, location);
	    }

	    function peg$buildStructuredError(expected, found, location) {
	      return new peg$SyntaxError(
	        peg$SyntaxError.buildMessage(expected, found),
	        expected,
	        found,
	        location
	      );
	    }

	    function peg$parseStart() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 0,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTranslationUnit();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseEOF();
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEOF() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 1,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      peg$silentFails++;
	      if (input.length > peg$currPos) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c0); }
	      }
	      peg$silentFails--;
	      if (s1 === peg$FAILED) {
	        s0 = void 0;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTranslationUnit() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 2,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$currPos;
	      s3 = peg$parse__();
	      if (s3 !== peg$FAILED) {
	        s4 = peg$parseExternalDeclaration();
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseExternalDeclaration();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c1(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExternalDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 3,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseImportDirective();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseModuleImportDirective();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseIncludeDirective();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseDeclaration();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseFunctionDefinition();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseClassInterface();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseClassImplementation();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseCategoryInterface();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseCategoryImplementation();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseProtocolDeclaration();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parseProtocolDeclarationList();
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$parseClassDeclarationList();
	                            if (s0 === peg$FAILED) {
	                              s0 = peg$currPos;
	                              s1 = peg$parseNS_ASSUME_NONNULL_BEGIN();
	                              if (s1 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c2();
	                              }
	                              s0 = s1;
	                              if (s0 === peg$FAILED) {
	                                s0 = peg$currPos;
	                                s1 = peg$parseNS_ASSUME_NONNULL_END();
	                                if (s1 !== peg$FAILED) {
	                                  peg$savedPos = s0;
	                                  s1 = peg$c3();
	                                }
	                                s0 = s1;
	                                if (s0 === peg$FAILED) {
	                                  s0 = peg$currPos;
	                                  s1 = peg$parseExternToken();
	                                  if (s1 !== peg$FAILED) {
	                                    s2 = peg$parse__();
	                                    if (s2 !== peg$FAILED) {
	                                      if (input.substr(peg$currPos, 3) === peg$c4) {
	                                        s3 = peg$c4;
	                                        peg$currPos += 3;
	                                      } else {
	                                        s3 = peg$FAILED;
	                                        if (peg$silentFails === 0) { peg$fail(peg$c5); }
	                                      }
	                                      if (s3 !== peg$FAILED) {
	                                        s4 = peg$parse__();
	                                        if (s4 !== peg$FAILED) {
	                                          if (input.charCodeAt(peg$currPos) === 123) {
	                                            s5 = peg$c6;
	                                            peg$currPos++;
	                                          } else {
	                                            s5 = peg$FAILED;
	                                            if (peg$silentFails === 0) { peg$fail(peg$c7); }
	                                          }
	                                          if (s5 !== peg$FAILED) {
	                                            s6 = [];
	                                            s7 = peg$currPos;
	                                            s8 = peg$parse__();
	                                            if (s8 !== peg$FAILED) {
	                                              s9 = peg$parseExternalDeclaration();
	                                              if (s9 !== peg$FAILED) {
	                                                s8 = [s8, s9];
	                                                s7 = s8;
	                                              } else {
	                                                peg$currPos = s7;
	                                                s7 = peg$FAILED;
	                                              }
	                                            } else {
	                                              peg$currPos = s7;
	                                              s7 = peg$FAILED;
	                                            }
	                                            while (s7 !== peg$FAILED) {
	                                              s6.push(s7);
	                                              s7 = peg$currPos;
	                                              s8 = peg$parse__();
	                                              if (s8 !== peg$FAILED) {
	                                                s9 = peg$parseExternalDeclaration();
	                                                if (s9 !== peg$FAILED) {
	                                                  s8 = [s8, s9];
	                                                  s7 = s8;
	                                                } else {
	                                                  peg$currPos = s7;
	                                                  s7 = peg$FAILED;
	                                                }
	                                              } else {
	                                                peg$currPos = s7;
	                                                s7 = peg$FAILED;
	                                              }
	                                            }
	                                            if (s6 !== peg$FAILED) {
	                                              s7 = peg$parse__();
	                                              if (s7 !== peg$FAILED) {
	                                                if (input.charCodeAt(peg$currPos) === 125) {
	                                                  s8 = peg$c8;
	                                                  peg$currPos++;
	                                                } else {
	                                                  s8 = peg$FAILED;
	                                                  if (peg$silentFails === 0) { peg$fail(peg$c9); }
	                                                }
	                                                if (s8 !== peg$FAILED) {
	                                                  peg$savedPos = s0;
	                                                  s1 = peg$c10(s6);
	                                                  s0 = s1;
	                                                } else {
	                                                  peg$currPos = s0;
	                                                  s0 = peg$FAILED;
	                                                }
	                                              } else {
	                                                peg$currPos = s0;
	                                                s0 = peg$FAILED;
	                                              }
	                                            } else {
	                                              peg$currPos = s0;
	                                              s0 = peg$FAILED;
	                                            }
	                                          } else {
	                                            peg$currPos = s0;
	                                            s0 = peg$FAILED;
	                                          }
	                                        } else {
	                                          peg$currPos = s0;
	                                          s0 = peg$FAILED;
	                                        }
	                                      } else {
	                                        peg$currPos = s0;
	                                        s0 = peg$FAILED;
	                                      }
	                                    } else {
	                                      peg$currPos = s0;
	                                      s0 = peg$FAILED;
	                                    }
	                                  } else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                  }
	                                  if (s0 === peg$FAILED) {
	                                    if (input.charCodeAt(peg$currPos) === 59) {
	                                      s0 = peg$c11;
	                                      peg$currPos++;
	                                    } else {
	                                      s0 = peg$FAILED;
	                                      if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                                    }
	                                  }
	                                }
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImportDirective() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 4,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 35) {
	        s1 = peg$c13;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c14); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 6) === peg$c15) {
	            s3 = peg$c15;
	            peg$currPos += 6;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c16); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseString();
	              if (s5 === peg$FAILED) {
	                s5 = peg$parseAngleString();
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c17(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseModuleImportDirective() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 5,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseImportToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseIdentifier();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c18(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIncludeDirective() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 6,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 35) {
	        s1 = peg$c13;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c14); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 7) === peg$c19) {
	            s3 = peg$c19;
	            peg$currPos += 7;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c20); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseString();
	              if (s5 === peg$FAILED) {
	                s5 = peg$parseAngleString();
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c21(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFunctionDefinition() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 7,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarationSpecifiers();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseDeclarator();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseCompoundStatement();
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c22(s1, s2, s3, s4, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCompoundStatement() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 8,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 123) {
	        s1 = peg$c6;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c7); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseBlockItemList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 125) {
	                s5 = peg$c8;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c9); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c23(s2, s3, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBlockItemList() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 9,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$currPos;
	      s3 = peg$parse__();
	      if (s3 !== peg$FAILED) {
	        s4 = peg$currPos;
	        s5 = peg$parseCastExpression();
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parse__();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 59) {
	            s5 = peg$c11;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c12); }
	          }
	          if (s5 !== peg$FAILED) {
	            s3 = [s3, s4, s5];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseDeclaration();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$currPos;
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseStatement();
	            if (s4 !== peg$FAILED) {
	              s3 = [s3, s4];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        }
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$currPos;
	          s5 = peg$parseCastExpression();
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 59) {
	              s5 = peg$c11;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c12); }
	            }
	            if (s5 !== peg$FAILED) {
	              s3 = [s3, s4, s5];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$currPos;
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseDeclaration();
	            if (s4 !== peg$FAILED) {
	              s3 = [s3, s4];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	          if (s2 === peg$FAILED) {
	            s2 = peg$currPos;
	            s3 = peg$parse__();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parseStatement();
	              if (s4 !== peg$FAILED) {
	                s3 = [s3, s4];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c24(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStatement() {
	      var s0;

	      var key    = peg$currPos * 278 + 10,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseLabeledStatement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseExpressionStatement();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseCompoundStatement();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseSelectionStatement();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseIterationStatement();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseJumpStatement();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseSynchronizedStatement();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseAutoreleaseStatement();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseTryBlock();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseThrowStatement();
	                        if (s0 === peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 59) {
	                            s0 = peg$c11;
	                            peg$currPos++;
	                          } else {
	                            s0 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExpressionStatement() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 11,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$parseExpression();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 59) {
	          s2 = peg$c11;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c12); }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c25(s1);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLabeledStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 12,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 58) {
	            s3 = peg$c26;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseStatement();
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c28(s1, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseCaseToken();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseExpression();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 58) {
	                  s5 = peg$c26;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c27); }
	                }
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parse__();
	                  if (s6 !== peg$FAILED) {
	                    s7 = peg$parseStatement();
	                    if (s7 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c29(s2, s3, s4, s6, s7);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseDefaultToken();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 58) {
	                s3 = peg$c26;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c27); }
	              }
	              if (s3 !== peg$FAILED) {
	                s4 = peg$parse__();
	                if (s4 !== peg$FAILED) {
	                  s5 = peg$parseStatement();
	                  if (s5 !== peg$FAILED) {
	                    s1 = [s1, s2, s3, s4, s5];
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSelectionStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

	      var key    = peg$currPos * 278 + 13,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIfToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseStatement();
	                      if (s10 !== peg$FAILED) {
	                        s11 = peg$parse__();
	                        if (s11 !== peg$FAILED) {
	                          s9 = [s9, s10, s11];
	                          s8 = s9;
	                        } else {
	                          peg$currPos = s8;
	                          s8 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$currPos;
	                      s10 = peg$parseElseToken();
	                      if (s10 !== peg$FAILED) {
	                        s11 = peg$parse__();
	                        if (s11 !== peg$FAILED) {
	                          s12 = peg$parseStatement();
	                          if (s12 !== peg$FAILED) {
	                            s10 = [s10, s11, s12];
	                            s9 = s10;
	                          } else {
	                            peg$currPos = s9;
	                            s9 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s9;
	                          s9 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s9;
	                        s9 = peg$FAILED;
	                      }
	                      if (s9 === peg$FAILED) {
	                        s9 = null;
	                      }
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c34(s2, s4, s5, s6, s8, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseSwitchToken();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 40) {
	              s3 = peg$c30;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c31); }
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                s5 = peg$parseExpression();
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parse__();
	                  if (s6 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 41) {
	                      s7 = peg$c32;
	                      peg$currPos++;
	                    } else {
	                      s7 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                    }
	                    if (s7 !== peg$FAILED) {
	                      s8 = peg$parse__();
	                      if (s8 !== peg$FAILED) {
	                        s9 = peg$parseStatement();
	                        if (s9 !== peg$FAILED) {
	                          peg$savedPos = s0;
	                          s1 = peg$c35(s2, s4, s5, s6, s8, s9);
	                          s0 = s1;
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseForInStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

	      var key    = peg$currPos * 278 + 14,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseForToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeVariableDeclarator();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseInToken();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseExpression();
	                      if (s9 === peg$FAILED) {
	                        s9 = null;
	                      }
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s11 = peg$c32;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              s13 = peg$parseStatement();
	                              if (s13 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c36(s2, s4, s5, s6, s8, s9, s10, s12, s13);
	                                s0 = s1;
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseForStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15;

	      var key    = peg$currPos * 278 + 15,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseForToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$currPos;
	              s6 = peg$parseDeclarationSpecifiers();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseInitDeclaratorList();
	                  if (s8 !== peg$FAILED) {
	                    s6 = [s6, s7, s8];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	              if (s5 === peg$FAILED) {
	                s5 = peg$parseExpression();
	              }
	              if (s5 === peg$FAILED) {
	                s5 = null;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 59) {
	                    s7 = peg$c11;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseExpression();
	                      if (s10 !== peg$FAILED) {
	                        s9 = [s9, s10];
	                        s8 = s9;
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    if (s8 === peg$FAILED) {
	                      s8 = null;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parse__();
	                      if (s9 !== peg$FAILED) {
	                        if (input.charCodeAt(peg$currPos) === 59) {
	                          s10 = peg$c11;
	                          peg$currPos++;
	                        } else {
	                          s10 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                        }
	                        if (s10 !== peg$FAILED) {
	                          s11 = peg$currPos;
	                          s12 = peg$parse__();
	                          if (s12 !== peg$FAILED) {
	                            s13 = peg$parseExpression();
	                            if (s13 !== peg$FAILED) {
	                              s12 = [s12, s13];
	                              s11 = s12;
	                            } else {
	                              peg$currPos = s11;
	                              s11 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s11;
	                            s11 = peg$FAILED;
	                          }
	                          if (s11 === peg$FAILED) {
	                            s11 = null;
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              if (input.charCodeAt(peg$currPos) === 41) {
	                                s13 = peg$c32;
	                                peg$currPos++;
	                              } else {
	                                s13 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                              }
	                              if (s13 !== peg$FAILED) {
	                                s14 = peg$parse__();
	                                if (s14 !== peg$FAILED) {
	                                  s15 = peg$parseStatement();
	                                  if (s15 !== peg$FAILED) {
	                                    peg$savedPos = s0;
	                                    s1 = peg$c37(s5, s8, s11, s14, s15);
	                                    s0 = s1;
	                                  } else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                  }
	                                } else {
	                                  peg$currPos = s0;
	                                  s0 = peg$FAILED;
	                                }
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseWhileStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 16,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseWhileToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c38(s2, s4, s5, s6, s8, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDoStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

	      var key    = peg$currPos * 278 + 17,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDoToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseStatement();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseWhileToken();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 40) {
	                    s7 = peg$c30;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c31); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseExpression();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s11 = peg$c32;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              if (input.charCodeAt(peg$currPos) === 59) {
	                                s13 = peg$c11;
	                                peg$currPos++;
	                              } else {
	                                s13 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                              }
	                              if (s13 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c39(s2, s3, s4, s9);
	                                s0 = s1;
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIterationStatement() {
	      var s0;

	      var key    = peg$currPos * 278 + 18,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseWhileStatement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseDoStatement();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseForStatement();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseForInStatement();
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseJumpStatement() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 19,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseGotoToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseIdentifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c40(s3, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$parseContinueToken();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 59) {
	            s2 = peg$c11;
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c12); }
	          }
	          if (s2 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c25(s1);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseBreakToken();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s3 = peg$c11;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c41(s2);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseReturnToken();
	            if (s1 !== peg$FAILED) {
	              s2 = peg$parse__();
	              if (s2 !== peg$FAILED) {
	                s3 = peg$parseExpression();
	                if (s3 === peg$FAILED) {
	                  s3 = null;
	                }
	                if (s3 !== peg$FAILED) {
	                  s4 = peg$parse__();
	                  if (s4 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 59) {
	                      s5 = peg$c11;
	                      peg$currPos++;
	                    } else {
	                      s5 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                    }
	                    if (s5 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c42(s2, s3, s4);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeVariableDeclarator() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 20,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarationSpecifiers();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseDeclarator();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c43(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTryStatement() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 21,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTryToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseCompoundStatement();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c44(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCatchStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 22,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseCatchToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeVariableDeclarator();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseCompoundStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c45(s2, s4, s5, s6, s8, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFinallyStatement() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 23,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseFinallyToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseCompoundStatement();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c46(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseThrowStatement() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 24,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseThrowToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c47(s2, s3, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTryBlock() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 25,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTryStatement();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseCatchStatement();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseCatchStatement();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseFinallyStatement();
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c48(s1, s2, s3, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSynchronizedStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 26,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSynchronizedToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseUnaryExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseCompoundStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c49(s5, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAutoreleaseStatement() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 27,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAutoreleasepoolToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseCompoundStatement();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c50(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 28,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAssignmentExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAssignmentExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAssignmentExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c53(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAssignmentExpression() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 29,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseUnaryExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseAssignmentOperator();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseAssignmentExpression();
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c54(s1, s2, s3, s4, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseConditionalExpression();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAssignmentOperator() {
	      var s0;

	      var key    = peg$currPos * 278 + 30,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (input.charCodeAt(peg$currPos) === 61) {
	        s0 = peg$c55;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c56); }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c57) {
	          s0 = peg$c57;
	          peg$currPos += 2;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c58); }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c59) {
	            s0 = peg$c59;
	            peg$currPos += 2;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c60); }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c61) {
	              s0 = peg$c61;
	              peg$currPos += 2;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c62); }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c63) {
	                s0 = peg$c63;
	                peg$currPos += 2;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c64); }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.substr(peg$currPos, 2) === peg$c65) {
	                  s0 = peg$c65;
	                  peg$currPos += 2;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c66); }
	                }
	                if (s0 === peg$FAILED) {
	                  if (input.substr(peg$currPos, 3) === peg$c67) {
	                    s0 = peg$c67;
	                    peg$currPos += 3;
	                  } else {
	                    s0 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c68); }
	                  }
	                  if (s0 === peg$FAILED) {
	                    if (input.substr(peg$currPos, 3) === peg$c69) {
	                      s0 = peg$c69;
	                      peg$currPos += 3;
	                    } else {
	                      s0 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c70); }
	                    }
	                    if (s0 === peg$FAILED) {
	                      if (input.substr(peg$currPos, 2) === peg$c71) {
	                        s0 = peg$c71;
	                        peg$currPos += 2;
	                      } else {
	                        s0 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c72); }
	                      }
	                      if (s0 === peg$FAILED) {
	                        if (input.substr(peg$currPos, 2) === peg$c73) {
	                          s0 = peg$c73;
	                          peg$currPos += 2;
	                        } else {
	                          s0 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c74); }
	                        }
	                        if (s0 === peg$FAILED) {
	                          if (input.substr(peg$currPos, 2) === peg$c75) {
	                            s0 = peg$c75;
	                            peg$currPos += 2;
	                          } else {
	                            s0 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c76); }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseConditionalExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 31,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$parseLogicalOrExpression();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 63) {
	            s4 = peg$c77;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c78); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseConditionalExpression();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 58) {
	                    s8 = peg$c26;
	                    peg$currPos++;
	                  } else {
	                    s8 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c27); }
	                  }
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseConditionalExpression();
	                      if (s10 !== peg$FAILED) {
	                        s2 = [s2, s3, s4, s5, s6, s7, s8, s9, s10];
	                        s1 = s2;
	                      } else {
	                        peg$currPos = s1;
	                        s1 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s1;
	                      s1 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s1;
	                    s1 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s1;
	                  s1 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c79(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseLogicalOrExpression();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLogicalOrExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 32,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseLogicalAndExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c80) {
	            s5 = peg$c80;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c81); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseLogicalAndExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c80) {
	              s5 = peg$c80;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c81); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseLogicalAndExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c82(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLogicalAndExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 33,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseInclusiveOrExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c83) {
	            s5 = peg$c83;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c84); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseInclusiveOrExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c83) {
	              s5 = peg$c83;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c84); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseInclusiveOrExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c85(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInclusiveOrExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 34,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseExclusiveOrExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          s6 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 124) {
	            s7 = peg$c86;
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c87); }
	          }
	          if (s7 !== peg$FAILED) {
	            s8 = peg$currPos;
	            peg$silentFails++;
	            if (input.charCodeAt(peg$currPos) === 124) {
	              s9 = peg$c86;
	              peg$currPos++;
	            } else {
	              s9 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c87); }
	            }
	            peg$silentFails--;
	            if (s9 === peg$FAILED) {
	              s8 = void 0;
	            } else {
	              peg$currPos = s8;
	              s8 = peg$FAILED;
	            }
	            if (s8 !== peg$FAILED) {
	              s7 = [s7, s8];
	              s6 = s7;
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s6;
	            s6 = peg$FAILED;
	          }
	          if (s6 !== peg$FAILED) {
	            s5 = input.substring(s5, peg$currPos);
	          } else {
	            s5 = s6;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseExclusiveOrExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            s6 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 124) {
	              s7 = peg$c86;
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c87); }
	            }
	            if (s7 !== peg$FAILED) {
	              s8 = peg$currPos;
	              peg$silentFails++;
	              if (input.charCodeAt(peg$currPos) === 124) {
	                s9 = peg$c86;
	                peg$currPos++;
	              } else {
	                s9 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c87); }
	              }
	              peg$silentFails--;
	              if (s9 === peg$FAILED) {
	                s8 = void 0;
	              } else {
	                peg$currPos = s8;
	                s8 = peg$FAILED;
	              }
	              if (s8 !== peg$FAILED) {
	                s7 = [s7, s8];
	                s6 = s7;
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	            if (s6 !== peg$FAILED) {
	              s5 = input.substring(s5, peg$currPos);
	            } else {
	              s5 = s6;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseExclusiveOrExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c88(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExclusiveOrExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 35,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAndExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 94) {
	            s5 = peg$c89;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c90); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAndExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 94) {
	              s5 = peg$c89;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c90); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAndExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c91(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAndExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 36,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseEqualityExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          s6 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 38) {
	            s7 = peg$c92;
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c93); }
	          }
	          if (s7 !== peg$FAILED) {
	            s8 = peg$currPos;
	            peg$silentFails++;
	            if (input.charCodeAt(peg$currPos) === 38) {
	              s9 = peg$c92;
	              peg$currPos++;
	            } else {
	              s9 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c93); }
	            }
	            peg$silentFails--;
	            if (s9 === peg$FAILED) {
	              s8 = void 0;
	            } else {
	              peg$currPos = s8;
	              s8 = peg$FAILED;
	            }
	            if (s8 !== peg$FAILED) {
	              s7 = [s7, s8];
	              s6 = s7;
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s6;
	            s6 = peg$FAILED;
	          }
	          if (s6 !== peg$FAILED) {
	            s5 = input.substring(s5, peg$currPos);
	          } else {
	            s5 = s6;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseEqualityExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            s6 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 38) {
	              s7 = peg$c92;
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c93); }
	            }
	            if (s7 !== peg$FAILED) {
	              s8 = peg$currPos;
	              peg$silentFails++;
	              if (input.charCodeAt(peg$currPos) === 38) {
	                s9 = peg$c92;
	                peg$currPos++;
	              } else {
	                s9 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c93); }
	              }
	              peg$silentFails--;
	              if (s9 === peg$FAILED) {
	                s8 = void 0;
	              } else {
	                peg$currPos = s8;
	                s8 = peg$FAILED;
	              }
	              if (s8 !== peg$FAILED) {
	                s7 = [s7, s8];
	                s6 = s7;
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	            if (s6 !== peg$FAILED) {
	              s5 = input.substring(s5, peg$currPos);
	            } else {
	              s5 = s6;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseEqualityExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c94(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEqualityExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 37,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseRelationalExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c95) {
	            s5 = peg$c95;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c96); }
	          }
	          if (s5 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c97) {
	              s5 = peg$c97;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c98); }
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseRelationalExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c95) {
	              s5 = peg$c95;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c96); }
	            }
	            if (s5 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c97) {
	                s5 = peg$c97;
	                peg$currPos += 2;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c98); }
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseRelationalExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c99(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseRelationalExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 38,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseShiftExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          if (input.substr(peg$currPos, 2) === peg$c100) {
	            s6 = peg$c100;
	            peg$currPos += 2;
	          } else {
	            s6 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c101); }
	          }
	          if (s6 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c102) {
	              s6 = peg$c102;
	              peg$currPos += 2;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c103); }
	            }
	            if (s6 === peg$FAILED) {
	              s6 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 60) {
	                s7 = peg$c104;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c105); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$currPos;
	                peg$silentFails++;
	                if (input.charCodeAt(peg$currPos) === 60) {
	                  s9 = peg$c104;
	                  peg$currPos++;
	                } else {
	                  s9 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c105); }
	                }
	                peg$silentFails--;
	                if (s9 === peg$FAILED) {
	                  s8 = void 0;
	                } else {
	                  peg$currPos = s8;
	                  s8 = peg$FAILED;
	                }
	                if (s8 !== peg$FAILED) {
	                  s7 = [s7, s8];
	                  s6 = s7;
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	              if (s6 === peg$FAILED) {
	                s6 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 62) {
	                  s7 = peg$c106;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c107); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$currPos;
	                  peg$silentFails++;
	                  if (input.charCodeAt(peg$currPos) === 62) {
	                    s9 = peg$c106;
	                    peg$currPos++;
	                  } else {
	                    s9 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c107); }
	                  }
	                  peg$silentFails--;
	                  if (s9 === peg$FAILED) {
	                    s8 = void 0;
	                  } else {
	                    peg$currPos = s8;
	                    s8 = peg$FAILED;
	                  }
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              }
	            }
	          }
	          if (s6 !== peg$FAILED) {
	            s5 = input.substring(s5, peg$currPos);
	          } else {
	            s5 = s6;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseShiftExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            if (input.substr(peg$currPos, 2) === peg$c100) {
	              s6 = peg$c100;
	              peg$currPos += 2;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c101); }
	            }
	            if (s6 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c102) {
	                s6 = peg$c102;
	                peg$currPos += 2;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c103); }
	              }
	              if (s6 === peg$FAILED) {
	                s6 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 60) {
	                  s7 = peg$c104;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c105); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$currPos;
	                  peg$silentFails++;
	                  if (input.charCodeAt(peg$currPos) === 60) {
	                    s9 = peg$c104;
	                    peg$currPos++;
	                  } else {
	                    s9 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c105); }
	                  }
	                  peg$silentFails--;
	                  if (s9 === peg$FAILED) {
	                    s8 = void 0;
	                  } else {
	                    peg$currPos = s8;
	                    s8 = peg$FAILED;
	                  }
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	                if (s6 === peg$FAILED) {
	                  s6 = peg$currPos;
	                  if (input.charCodeAt(peg$currPos) === 62) {
	                    s7 = peg$c106;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c107); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    peg$silentFails++;
	                    if (input.charCodeAt(peg$currPos) === 62) {
	                      s9 = peg$c106;
	                      peg$currPos++;
	                    } else {
	                      s9 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c107); }
	                    }
	                    peg$silentFails--;
	                    if (s9 === peg$FAILED) {
	                      s8 = void 0;
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s7 = [s7, s8];
	                      s6 = s7;
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                }
	              }
	            }
	            if (s6 !== peg$FAILED) {
	              s5 = input.substring(s5, peg$currPos);
	            } else {
	              s5 = s6;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseShiftExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c108(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseShiftExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 39,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAdditiveExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c109) {
	            s5 = peg$c109;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c110); }
	          }
	          if (s5 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c111) {
	              s5 = peg$c111;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c112); }
	            }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAdditiveExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c109) {
	              s5 = peg$c109;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c110); }
	            }
	            if (s5 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c111) {
	                s5 = peg$c111;
	                peg$currPos += 2;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c112); }
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAdditiveExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c113(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAdditiveExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 40,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseMultiplicativeExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (peg$c114.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c115); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseMultiplicativeExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (peg$c114.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c115); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseMultiplicativeExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c116(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMultiplicativeExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 41,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseCastExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (peg$c117.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c118); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseCastExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (peg$c117.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c118); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseCastExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c119(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCastExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 42,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c32;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseCastExpression();
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c120(s3, s7);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseUnaryExpression();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseUnaryExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 43,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c121) {
	        s2 = peg$c121;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c122); }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c123) {
	          s2 = peg$c123;
	          peg$currPos += 2;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c124); }
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseUnaryExpression();
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c125(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$parseUnaryOperator();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseCastExpression();
	            if (s4 !== peg$FAILED) {
	              s2 = [s2, s3, s4];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c126(s1);
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseSizeofToken();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 40) {
	                s3 = peg$c30;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c31); }
	              }
	              if (s3 !== peg$FAILED) {
	                s4 = peg$parse__();
	                if (s4 !== peg$FAILED) {
	                  s5 = peg$parseTypeName();
	                  if (s5 !== peg$FAILED) {
	                    s6 = peg$parse__();
	                    if (s6 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 41) {
	                        s7 = peg$c32;
	                        peg$currPos++;
	                      } else {
	                        s7 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                      }
	                      if (s7 !== peg$FAILED) {
	                        s1 = [s1, s2, s3, s4, s5, s6, s7];
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseSizeofToken();
	            if (s1 !== peg$FAILED) {
	              s2 = peg$parse__();
	              if (s2 !== peg$FAILED) {
	                s3 = peg$parseUnaryExpression();
	                if (s3 !== peg$FAILED) {
	                  s1 = [s1, s2, s3];
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	              s0 = peg$parsePostfixExpression();
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseUnaryOperator() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 44,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (input.charCodeAt(peg$currPos) === 38) {
	        s0 = peg$c92;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c93); }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 42) {
	          s0 = peg$c127;
	          peg$currPos++;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c128); }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 43) {
	            s0 = peg$c129;
	            peg$currPos++;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c130); }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 45) {
	              s0 = peg$c131;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c132); }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 126) {
	                s0 = peg$c133;
	                peg$currPos++;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c134); }
	              }
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 33) {
	                  s1 = peg$c135;
	                  peg$currPos++;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c136); }
	                }
	                if (s1 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c137();
	                }
	                s0 = s1;
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePostfixExpression() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 45,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePrimaryExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parsePostfixOperation();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsePostfixOperation();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c138(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePostfixOperation() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 46,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c139;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c140); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 93) {
	                s5 = peg$c141;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c142); }
	              }
	              if (s5 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s1 = peg$c30;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseArgumentExpressionList();
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 41) {
	                  s5 = peg$c32;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c143(s3);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 46) {
	            s1 = peg$c144;
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c145); }
	          }
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              s3 = peg$currPos;
	              s4 = peg$parseIdentifier();
	              if (s4 === peg$FAILED) {
	                s4 = peg$parseSelfToken();
	              }
	              if (s4 !== peg$FAILED) {
	                s3 = input.substring(s3, peg$currPos);
	              } else {
	                s3 = s4;
	              }
	              if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c146(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.substr(peg$currPos, 2) === peg$c147) {
	              s1 = peg$c147;
	              peg$currPos += 2;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c148); }
	            }
	            if (s1 !== peg$FAILED) {
	              s2 = peg$parse__();
	              if (s2 !== peg$FAILED) {
	                s3 = peg$currPos;
	                s4 = peg$parseIdentifier();
	                if (s4 !== peg$FAILED) {
	                  s3 = input.substring(s3, peg$currPos);
	                } else {
	                  s3 = s4;
	                }
	                if (s3 !== peg$FAILED) {
	                  s1 = [s1, s2, s3];
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c121) {
	                s0 = peg$c121;
	                peg$currPos += 2;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c122); }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.substr(peg$currPos, 2) === peg$c123) {
	                  s0 = peg$c123;
	                  peg$currPos += 2;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c124); }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseArgumentExpressionList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 47,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAssignmentExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAssignmentExpression();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAssignmentExpression();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePrimaryExpression() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 48,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c32;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c149(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseMacroExpression();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseMessageExpression();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseSelectorExpression();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseProtocolExpression();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseEncodeExpression();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseAvailableExpression();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseDictionaryExpression();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseArrayExpression();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseBoxExpression();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parseBlockExpression();
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$parseCompoundStatement();
	                            if (s0 === peg$FAILED) {
	                              s0 = peg$currPos;
	                              s1 = peg$parseConstant();
	                              if (s1 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c150(s1);
	                              }
	                              s0 = s1;
	                              if (s0 === peg$FAILED) {
	                                s0 = peg$currPos;
	                                s1 = peg$parseSelfToken();
	                                if (s1 !== peg$FAILED) {
	                                  peg$savedPos = s0;
	                                  s1 = peg$c151();
	                                }
	                                s0 = s1;
	                                if (s0 === peg$FAILED) {
	                                  s0 = peg$currPos;
	                                  s1 = peg$parseSuperToken();
	                                  if (s1 !== peg$FAILED) {
	                                    peg$savedPos = s0;
	                                    s1 = peg$c152();
	                                  }
	                                  s0 = s1;
	                                  if (s0 === peg$FAILED) {
	                                    s0 = peg$currPos;
	                                    s1 = peg$parseIdentifier();
	                                    if (s1 !== peg$FAILED) {
	                                      peg$savedPos = s0;
	                                      s1 = peg$c151();
	                                    }
	                                    s0 = s1;
	                                  }
	                                }
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMacroExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;

	      var key    = peg$currPos * 278 + 49,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c153) {
	        s1 = peg$c153;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c154); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseIdentifier();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 44) {
	                    s7 = peg$c51;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseTypeName();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s11 = peg$c32;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];
	                            s0 = s1;
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseConstant() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 50,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseHexLiteral();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c155(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseBinaryLiteral();
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c156(s1);
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseOctalLiteral();
	          if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c157(s1);
	          }
	          s0 = s1;
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseCharacterLiteral();
	            if (s1 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c158(s1);
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              s1 = peg$parseBooleanLiteral();
	              if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c159(s1);
	              }
	              s0 = s1;
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parseFloatingPointLiteral();
	                if (s1 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c160(s1);
	                }
	                s0 = s1;
	                if (s0 === peg$FAILED) {
	                  s0 = peg$currPos;
	                  s1 = peg$parseDecimalLiteral();
	                  if (s1 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c161(s1);
	                  }
	                  s0 = s1;
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$currPos;
	                    s1 = peg$parseStringLiteral();
	                    if (s1 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c162(s1);
	                    }
	                    s0 = s1;
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDictionaryPair() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 51,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePostfixExpression();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 58) {
	            s3 = peg$c26;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parsePostfixExpression();
	              if (s5 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDictionaryExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 52,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c163) {
	        s1 = peg$c163;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c164); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseDictionaryPair();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = [];
	            s6 = peg$currPos;
	            s7 = peg$parse__();
	            if (s7 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s8 = peg$c51;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c52); }
	              }
	              if (s8 !== peg$FAILED) {
	                s9 = peg$parse__();
	                if (s9 !== peg$FAILED) {
	                  s10 = peg$parseDictionaryPair();
	                  if (s10 !== peg$FAILED) {
	                    s7 = [s7, s8, s9, s10];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	            while (s6 !== peg$FAILED) {
	              s5.push(s6);
	              s6 = peg$currPos;
	              s7 = peg$parse__();
	              if (s7 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s8 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parse__();
	                  if (s9 !== peg$FAILED) {
	                    s10 = peg$parseDictionaryPair();
	                    if (s10 !== peg$FAILED) {
	                      s7 = [s7, s8, s9, s10];
	                      s6 = s7;
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$currPos;
	              s7 = peg$parse__();
	              if (s7 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s8 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s8 !== peg$FAILED) {
	                  s7 = [s7, s8];
	                  s6 = s7;
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s3 = [s3, s4, s5, s6, s7];
	                  s2 = s3;
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 125) {
	            s3 = peg$c8;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c9); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c165(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseArrayExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 53,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c166) {
	        s1 = peg$c166;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c167); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseExpression();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = [];
	            s6 = peg$currPos;
	            s7 = peg$parse__();
	            if (s7 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s8 = peg$c51;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c52); }
	              }
	              if (s8 !== peg$FAILED) {
	                s9 = peg$parse__();
	                if (s9 !== peg$FAILED) {
	                  s10 = peg$parseExpression();
	                  if (s10 !== peg$FAILED) {
	                    s7 = [s7, s8, s9, s10];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s6;
	              s6 = peg$FAILED;
	            }
	            while (s6 !== peg$FAILED) {
	              s5.push(s6);
	              s6 = peg$currPos;
	              s7 = peg$parse__();
	              if (s7 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s8 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parse__();
	                  if (s9 !== peg$FAILED) {
	                    s10 = peg$parseExpression();
	                    if (s10 !== peg$FAILED) {
	                      s7 = [s7, s8, s9, s10];
	                      s6 = s7;
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$currPos;
	              s7 = peg$parse__();
	              if (s7 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s8 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s8 !== peg$FAILED) {
	                  s7 = [s7, s8];
	                  s6 = s7;
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s3 = [s3, s4, s5, s6, s7];
	                  s2 = s3;
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 93) {
	            s3 = peg$c141;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c142); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c168(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBoxExpression() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 54,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c169) {
	        s1 = peg$c169;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c170); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseConditionalExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c32;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c171(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 64) {
	          s1 = peg$c172;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c173); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseConditionalExpression();
	            if (s3 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c171(s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBlockParameters() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 55,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeVariableDeclarator();
	          if (s3 === peg$FAILED) {
	            s3 = peg$parseTypeName();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s7 = peg$c51;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c52); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parse__();
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parseTypeVariableDeclarator();
	                  if (s9 === peg$FAILED) {
	                    s9 = peg$parseTypeName();
	                  }
	                  if (s9 !== peg$FAILED) {
	                    s6 = [s6, s7, s8, s9];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s7 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parseTypeVariableDeclarator();
	                    if (s9 === peg$FAILED) {
	                      s9 = peg$parseTypeName();
	                    }
	                    if (s9 !== peg$FAILED) {
	                      s6 = [s6, s7, s8, s9];
	                      s5 = s6;
	                    } else {
	                      peg$currPos = s5;
	                      s5 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 41) {
	                  s6 = peg$c32;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c174(s3, s4);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s1 = peg$c30;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseVoidToken();
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 41) {
	                  s5 = peg$c32;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c175();
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBlockExpression() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 56,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 94) {
	        s1 = peg$c89;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c90); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseTypeName();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseBlockParameters();
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parseCompoundStatement();
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c176(s2, s3, s4, s5, s6);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMessageExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 57,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c139;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c140); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseMessageSelector();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 93) {
	                    s7 = peg$c141;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c142); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c177(s3, s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMessageSelector() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 58,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseKeywordArgument();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseKeywordArgument();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseKeywordArgument();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c178(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseIdentifier();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseKeywordArgument() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 59,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 58) {
	            s5 = peg$c26;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s4 = [s4, s5, s6];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = input.substring(s2, peg$currPos);
	        } else {
	          s2 = s3;
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c179(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSelectorExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 60,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSelectorToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$currPos;
	              s6 = peg$parseSelectorName();
	              if (s6 !== peg$FAILED) {
	                s5 = input.substring(s5, peg$currPos);
	              } else {
	                s5 = s6;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c180(s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSelectorName() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 61,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = [];
	      s1 = peg$currPos;
	      s2 = peg$parse__();
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseIdentifier();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 58) {
	              s5 = peg$c26;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c27); }
	            }
	            if (s5 !== peg$FAILED) {
	              s2 = [s2, s3, s4, s5];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        while (s1 !== peg$FAILED) {
	          s0.push(s1);
	          s1 = peg$currPos;
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseIdentifier();
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 58) {
	                  s5 = peg$c26;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c27); }
	                }
	                if (s5 !== peg$FAILED) {
	                  s2 = [s2, s3, s4, s5];
	                  s1 = s2;
	                } else {
	                  peg$currPos = s1;
	                  s1 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        }
	      } else {
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseIdentifier();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 62,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseProtocolToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseProtocolName();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c181(s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEncodeExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 63,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseEncodeToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeName();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c182(s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAvailableExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 64,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseAvailableToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c30;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c31); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseAttributeExpressionArgument();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c183(s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAttributeExpressionArgument() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 65,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = [];
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 41) {
	        s3 = peg$c32;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c33); }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.length > peg$currPos) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c0); }
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      while (s1 !== peg$FAILED) {
	        s0.push(s1);
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 41) {
	          s3 = peg$c32;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c33); }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c0); }
	          }
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassInterface() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

	      var key    = peg$currPos * 278 + 66,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseInterfaceToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeNameSpecifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$currPos;
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 58) {
	                s6 = peg$c26;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c27); }
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseIdentifier();
	                  if (s8 !== peg$FAILED) {
	                    s5 = [s5, s6, s7, s8];
	                    s4 = s5;
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parseProtocolReferenceList();
	                if (s6 === peg$FAILED) {
	                  s6 = null;
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseInstanceVariables();
	                    if (s8 === peg$FAILED) {
	                      s8 = null;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parse__();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parseInterfaceDeclarationList();
	                        if (s10 === peg$FAILED) {
	                          s10 = null;
	                        }
	                        if (s10 !== peg$FAILED) {
	                          s11 = peg$parse__();
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parseEndToken();
	                            if (s12 !== peg$FAILED) {
	                              peg$savedPos = s0;
	                              s1 = peg$c184(s3, s4, s5, s6, s7, s8, s9, s10, s11);
	                              s0 = s1;
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCategoryInterface() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17;

	      var key    = peg$currPos * 278 + 67,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseInterfaceToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeNameSpecifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 40) {
	                s5 = peg$c30;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c31); }
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseIdentifier();
	                  if (s7 === peg$FAILED) {
	                    s7 = null;
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 41) {
	                        s9 = peg$c32;
	                        peg$currPos++;
	                      } else {
	                        s9 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                      }
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          s11 = peg$parseProtocolReferenceList();
	                          if (s11 === peg$FAILED) {
	                            s11 = null;
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              s13 = peg$parseInstanceVariables();
	                              if (s13 === peg$FAILED) {
	                                s13 = null;
	                              }
	                              if (s13 !== peg$FAILED) {
	                                s14 = peg$parse__();
	                                if (s14 !== peg$FAILED) {
	                                  s15 = peg$parseInterfaceDeclarationList();
	                                  if (s15 === peg$FAILED) {
	                                    s15 = null;
	                                  }
	                                  if (s15 !== peg$FAILED) {
	                                    s16 = peg$parse__();
	                                    if (s16 !== peg$FAILED) {
	                                      s17 = peg$parseEndToken();
	                                      if (s17 !== peg$FAILED) {
	                                        peg$savedPos = s0;
	                                        s1 = peg$c185(s3, s7, s10, s11, s12, s13, s14, s15, s16);
	                                        s0 = s1;
	                                      } else {
	                                        peg$currPos = s0;
	                                        s0 = peg$FAILED;
	                                      }
	                                    } else {
	                                      peg$currPos = s0;
	                                      s0 = peg$FAILED;
	                                    }
	                                  } else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                  }
	                                } else {
	                                  peg$currPos = s0;
	                                  s0 = peg$FAILED;
	                                }
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassImplementation() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 68,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseImplementationToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeNameSpecifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$currPos;
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 58) {
	                s6 = peg$c26;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c27); }
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseIdentifier();
	                  if (s8 !== peg$FAILED) {
	                    s5 = [s5, s6, s7, s8];
	                    s4 = s5;
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parseInstanceVariables();
	                if (s6 === peg$FAILED) {
	                  s6 = null;
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseImplementationDefinitionList();
	                    if (s8 === peg$FAILED) {
	                      s8 = null;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parse__();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parseEndToken();
	                        if (s10 !== peg$FAILED) {
	                          peg$savedPos = s0;
	                          s1 = peg$c186(s3, s4, s5, s6, s7, s8, s9);
	                          s0 = s1;
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCategoryImplementation() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

	      var key    = peg$currPos * 278 + 69,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseImplementationToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeNameSpecifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 40) {
	                s5 = peg$c30;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c31); }
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseIdentifier();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 41) {
	                        s9 = peg$c32;
	                        peg$currPos++;
	                      } else {
	                        s9 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                      }
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          s11 = peg$parseImplementationDefinitionList();
	                          if (s11 === peg$FAILED) {
	                            s11 = null;
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              s13 = peg$parseEndToken();
	                              if (s13 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c187(s3, s4, s7, s10, s11, s12);
	                                s0 = s1;
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassDeclarationList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 70,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseClassToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseClassList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c188();
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 71,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTypeNameSpecifier();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseTypeNameSpecifier();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseTypeNameSpecifier();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInstanceVariables() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      var key    = peg$currPos * 278 + 72,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 123) {
	        s1 = peg$c6;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c7); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 125) {
	            s3 = peg$c8;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c9); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c189();
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 123) {
	          s1 = peg$c6;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c7); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = [];
	            s4 = peg$currPos;
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseVisibilitySpecification();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseStructDeclaration();
	                  if (s8 !== peg$FAILED) {
	                    s5 = [s5, s6, s7, s8];
	                    s4 = s5;
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	              while (s4 !== peg$FAILED) {
	                s3.push(s4);
	                s4 = peg$currPos;
	                s5 = peg$parse__();
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parseVisibilitySpecification();
	                  if (s6 === peg$FAILED) {
	                    s6 = null;
	                  }
	                  if (s6 !== peg$FAILED) {
	                    s7 = peg$parse__();
	                    if (s7 !== peg$FAILED) {
	                      s8 = peg$parseStructDeclaration();
	                      if (s8 !== peg$FAILED) {
	                        s5 = [s5, s6, s7, s8];
	                        s4 = s5;
	                      } else {
	                        peg$currPos = s4;
	                        s4 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s4;
	                      s4 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              }
	            } else {
	              s3 = peg$FAILED;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 125) {
	                  s5 = peg$c8;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c9); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c190(s2, s3, s4);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseVisibilitySpecification() {
	      var s0;

	      var key    = peg$currPos * 278 + 73,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parsePrivateToken();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseProtectedToken();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parsePackageToken();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parsePublicToken();
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 74,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseProtocolToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseProtocolName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseProtocolReferenceList();
	              if (s5 === peg$FAILED) {
	                s5 = null;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = [];
	                s7 = peg$currPos;
	                s8 = peg$parse__();
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parseRequiredToken();
	                  if (s9 !== peg$FAILED) {
	                    s8 = [s8, s9];
	                    s7 = s8;
	                  } else {
	                    peg$currPos = s7;
	                    s7 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s7;
	                  s7 = peg$FAILED;
	                }
	                if (s7 === peg$FAILED) {
	                  s7 = peg$currPos;
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parseOptionalToken();
	                    if (s9 !== peg$FAILED) {
	                      s8 = [s8, s9];
	                      s7 = s8;
	                    } else {
	                      peg$currPos = s7;
	                      s7 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s7;
	                    s7 = peg$FAILED;
	                  }
	                  if (s7 === peg$FAILED) {
	                    s7 = peg$currPos;
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseInterfaceDeclaration();
	                      if (s9 !== peg$FAILED) {
	                        s8 = [s8, s9];
	                        s7 = s8;
	                      } else {
	                        peg$currPos = s7;
	                        s7 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s7;
	                      s7 = peg$FAILED;
	                    }
	                  }
	                }
	                while (s7 !== peg$FAILED) {
	                  s6.push(s7);
	                  s7 = peg$currPos;
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parseRequiredToken();
	                    if (s9 !== peg$FAILED) {
	                      s8 = [s8, s9];
	                      s7 = s8;
	                    } else {
	                      peg$currPos = s7;
	                      s7 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s7;
	                    s7 = peg$FAILED;
	                  }
	                  if (s7 === peg$FAILED) {
	                    s7 = peg$currPos;
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseOptionalToken();
	                      if (s9 !== peg$FAILED) {
	                        s8 = [s8, s9];
	                        s7 = s8;
	                      } else {
	                        peg$currPos = s7;
	                        s7 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s7;
	                      s7 = peg$FAILED;
	                    }
	                    if (s7 === peg$FAILED) {
	                      s7 = peg$currPos;
	                      s8 = peg$parse__();
	                      if (s8 !== peg$FAILED) {
	                        s9 = peg$parseInterfaceDeclaration();
	                        if (s9 !== peg$FAILED) {
	                          s8 = [s8, s9];
	                          s7 = s8;
	                        } else {
	                          peg$currPos = s7;
	                          s7 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s7;
	                        s7 = peg$FAILED;
	                      }
	                    }
	                  }
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseEndToken();
	                    if (s8 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c191(s2, s3, s4, s5, s6, s7);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolDeclarationList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 75,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseProtocolToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseProtocolList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c192();
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolReferenceList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 76,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c104;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c105); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseProtocolList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 62) {
	                s5 = peg$c106;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c107); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c193(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 77,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseProtocolName();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseProtocolName();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseProtocolName();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c194(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolName() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 78,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c137();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImplementationDefinitionList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 79,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseImplementationDefinition();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseImplementationDefinition();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseImplementationDefinition();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c195(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImplementationDefinition() {
	      var s0;

	      var key    = peg$currPos * 278 + 80,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseDeclaration();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseFunctionDefinition();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseClassMethodDefinition();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseInstanceMethodDefinition();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parsePropertyImplementation();
	              if (s0 === peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 59) {
	                  s0 = peg$c11;
	                  peg$currPos++;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassMethodDefinition() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 81,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 43) {
	        s1 = peg$c129;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c130); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDefinition();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c196(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInstanceMethodDefinition() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 82,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s1 = peg$c131;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c132); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDefinition();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c197(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMethodDefinition() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 83,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseMethodType();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodSelector();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseInitDeclaratorList();
	              if (s5 === peg$FAILED) {
	                s5 = null;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$currPos;
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 59) {
	                    s8 = peg$c11;
	                    peg$currPos++;
	                  } else {
	                    s8 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                  }
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	                if (s6 === peg$FAILED) {
	                  s6 = null;
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = [];
	                  s8 = peg$currPos;
	                  s9 = peg$parse__();
	                  if (s9 !== peg$FAILED) {
	                    s10 = peg$parseAttributeQualifier();
	                    if (s10 !== peg$FAILED) {
	                      s9 = [s9, s10];
	                      s8 = s9;
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s8;
	                    s8 = peg$FAILED;
	                  }
	                  while (s8 !== peg$FAILED) {
	                    s7.push(s8);
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseAttributeQualifier();
	                      if (s10 !== peg$FAILED) {
	                        s9 = [s9, s10];
	                        s8 = s9;
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseCompoundStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c198(s1, s3, s5, s7, s8, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyImplementation() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 84,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSynthesizeToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsePropertySynthesizeList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c199(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseDynamicToken();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parsePropertySynthesizeList();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 59) {
	                  s5 = peg$c11;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c200(s3);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertySynthesizeList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 85,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePropertySynthesizeItem();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsePropertySynthesizeItem();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parsePropertySynthesizeItem();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c201(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertySynthesizeItem() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 86,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s4 = peg$c55;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c56); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseIdentifier();
	              if (s6 !== peg$FAILED) {
	                s3 = [s3, s4, s5, s6];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c202(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructOrUnionSpecifier() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 87,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseStructToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseUnionToken();
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseStructOrUnionSpecifierEntity();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c203(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructOrUnionSpecifierEntity() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 88,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 123) {
	            s3 = peg$c6;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c7); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseStructDeclaration();
	              if (s7 !== peg$FAILED) {
	                s6 = [s6, s7];
	                s5 = s6;
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            if (s5 !== peg$FAILED) {
	              while (s5 !== peg$FAILED) {
	                s4.push(s5);
	                s5 = peg$currPos;
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseStructDeclaration();
	                  if (s7 !== peg$FAILED) {
	                    s6 = [s6, s7];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              }
	            } else {
	              s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 125) {
	                  s6 = peg$c8;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c9); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c204(s1, s2, s4, s5);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifier();
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c205(s1);
	        }
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 89,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSpecifierQualifierList();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseStructDeclaratorList();
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAttributeQualifier();
	              if (s7 !== peg$FAILED) {
	                s6 = [s6, s7];
	                s5 = s6;
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAttributeQualifier();
	                if (s7 !== peg$FAILED) {
	                  s6 = [s6, s7];
	                  s5 = s6;
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 59) {
	                  s6 = peg$c11;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c206(s1, s3, s4);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSpecifierQualifierList() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 90,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSpecifierQualifier();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parseIsDeclarator();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = void 0;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$FAILED;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseSpecifierQualifier();
	            if (s6 !== peg$FAILED) {
	              s4 = [s4, s5, s6];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            peg$silentFails++;
	            s6 = peg$parseIsDeclarator();
	            peg$silentFails--;
	            if (s6 === peg$FAILED) {
	              s5 = void 0;
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseSpecifierQualifier();
	              if (s6 !== peg$FAILED) {
	                s4 = [s4, s5, s6];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c207(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSpecifierQualifier() {
	      var s0;

	      var key    = peg$currPos * 278 + 91,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseTypeSpecifier();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseTypeQualifier();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructDeclaratorList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 92,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseStructDeclarator();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseStructDeclarator();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseStructDeclarator();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c174(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 93,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarator();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 58) {
	            s3 = peg$c26;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$currPos;
	              s6 = peg$parseConstant();
	              if (s6 !== peg$FAILED) {
	                s5 = input.substring(s5, peg$currPos);
	              } else {
	                s5 = s6;
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c208(s1, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseDeclarator();
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEnumSpecifier() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 94,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseEnumToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseIdentifier();
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$currPos;
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 58) {
	                s6 = peg$c26;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c27); }
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseDeclarationSpecifiers();
	                  if (s8 !== peg$FAILED) {
	                    s5 = [s5, s6, s7, s8];
	                    s4 = s5;
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 123) {
	                  s6 = peg$c6;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseEnumeratorList();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parse__();
	                      if (s9 !== peg$FAILED) {
	                        if (input.charCodeAt(peg$currPos) === 125) {
	                          s10 = peg$c8;
	                          peg$currPos++;
	                        } else {
	                          s10 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c9); }
	                        }
	                        if (s10 !== peg$FAILED) {
	                          peg$savedPos = s0;
	                          s1 = peg$c209(s2, s3, s4, s5, s7, s8, s9);
	                          s0 = s1;
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseEnumToken();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseIdentifier();
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$currPos;
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 58) {
	                  s6 = peg$c26;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c27); }
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parseDeclarationSpecifiers();
	                    if (s8 !== peg$FAILED) {
	                      s5 = [s5, s6, s7, s8];
	                      s4 = s5;
	                    } else {
	                      peg$currPos = s4;
	                      s4 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	              if (s4 === peg$FAILED) {
	                s4 = null;
	              }
	              if (s4 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c210(s2, s3, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEnumeratorList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 95,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseEnumerator();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseEnumerator();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseEnumerator();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c211(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEnumerator() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 96,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s4 = peg$c55;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c56); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseConditionalExpression();
	              if (s6 !== peg$FAILED) {
	                s3 = [s3, s4, s5, s6];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c212(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 97,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePointer();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseDirectDeclarator();
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAttributeQualifier();
	              if (s7 !== peg$FAILED) {
	                s6 = [s6, s7];
	                s5 = s6;
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAttributeQualifier();
	                if (s7 !== peg$FAILED) {
	                  s6 = [s6, s7];
	                  s5 = s6;
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c213(s1, s3, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePointer() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 98,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 42) {
	        s1 = peg$c127;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c128); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseTypeQualifier();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseTypeQualifier();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parsePointer();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c214(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDirectDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 99,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c215) {
	        s1 = peg$c215;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c216); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          s5 = peg$parseIsDeclarator();
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseDeclarationSpecifiers();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseIdentifier();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseBlockParameters();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c217(s3, s5, s9);
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s1 = peg$c30;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = [];
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseTypeQualifier();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          while (s3 !== peg$FAILED) {
	            s2.push(s3);
	            s3 = peg$currPos;
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeQualifier();
	              if (s5 !== peg$FAILED) {
	                s4 = [s4, s5];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          }
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parse__();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parseDeclarator();
	              if (s4 !== peg$FAILED) {
	                s5 = peg$parse__();
	                if (s5 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s6 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s6 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s6 !== peg$FAILED) {
	                    s7 = [];
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseDeclaratorSuffix();
	                      if (s10 !== peg$FAILED) {
	                        s9 = [s9, s10];
	                        s8 = s9;
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    while (s8 !== peg$FAILED) {
	                      s7.push(s8);
	                      s8 = peg$currPos;
	                      s9 = peg$parse__();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parseDeclaratorSuffix();
	                        if (s10 !== peg$FAILED) {
	                          s9 = [s9, s10];
	                          s8 = s9;
	                        } else {
	                          peg$currPos = s8;
	                          s8 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    }
	                    if (s7 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c218(s2, s4, s7);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = [];
	          s2 = peg$currPos;
	          s3 = peg$parseTypeQualifier();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s3 = [s3, s4];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	          while (s2 !== peg$FAILED) {
	            s1.push(s2);
	            s2 = peg$currPos;
	            s3 = peg$parseTypeQualifier();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                s3 = [s3, s4];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          }
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parseIdentifier();
	            if (s2 !== peg$FAILED) {
	              s3 = [];
	              s4 = peg$currPos;
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parseDeclaratorSuffix();
	                if (s6 !== peg$FAILED) {
	                  s5 = [s5, s6];
	                  s4 = s5;
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	              while (s4 !== peg$FAILED) {
	                s3.push(s4);
	                s4 = peg$currPos;
	                s5 = peg$parse__();
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parseDeclaratorSuffix();
	                  if (s6 !== peg$FAILED) {
	                    s5 = [s5, s6];
	                    s4 = s5;
	                  } else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s4;
	                  s4 = peg$FAILED;
	                }
	              }
	              if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c219(s1, s2, s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDeclaratorSuffix() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 100,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s2 = peg$c139;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c140); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseConditionalExpression();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 93) {
	                s6 = peg$c141;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c142); }
	              }
	              if (s6 !== peg$FAILED) {
	                s2 = [s2, s3, s4, s5, s6];
	                s1 = s2;
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c220(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s2 = peg$c30;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseParameterList();
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 41) {
	                  s6 = peg$c32;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                }
	                if (s6 !== peg$FAILED) {
	                  s2 = [s2, s3, s4, s5, s6];
	                  s1 = s2;
	                } else {
	                  peg$currPos = s1;
	                  s1 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c221(s1);
	        }
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseParameterList() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 101,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseParameterDeclarationList();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s4 = peg$c51;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.substr(peg$currPos, 3) === peg$c222) {
	                s6 = peg$c222;
	                peg$currPos += 3;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c223); }
	              }
	              if (s6 !== peg$FAILED) {
	                s3 = [s3, s4, s5, s6];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c224(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInterfaceDeclarationList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 102,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseInterfaceDeclaration();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseInterfaceDeclaration();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseInterfaceDeclaration();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c225(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInterfaceDeclaration() {
	      var s0;

	      var key    = peg$currPos * 278 + 103,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseDeclaration();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseClassMethodDeclaration();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseInstanceMethodDeclaration();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parsePropertyDeclaration();
	            if (s0 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s0 = peg$c11;
	                peg$currPos++;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDeclaration() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 104,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarationSpecifiers();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseInitDeclaratorList();
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s5 = peg$c11;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c226(s1, s2, s3, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDeclarationSpecifiers() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 105,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarationSpecifier();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parseIsDeclarator();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = void 0;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$FAILED;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseDeclarationSpecifier();
	            if (s6 !== peg$FAILED) {
	              s4 = [s4, s5, s6];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$currPos;
	            peg$silentFails++;
	            s6 = peg$parseIsDeclarator();
	            peg$silentFails--;
	            if (s6 === peg$FAILED) {
	              s5 = void 0;
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseDeclarationSpecifier();
	              if (s6 !== peg$FAILED) {
	                s4 = [s4, s5, s6];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c207(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIsDeclarator() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 106,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (peg$c227.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c228); }
	          }
	          if (s3 === peg$FAILED) {
	            s3 = peg$parseInToken();
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseDeclarator();
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            if (peg$c227.test(input.charAt(peg$currPos))) {
	              s3 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c228); }
	            }
	            if (s3 === peg$FAILED) {
	              s3 = peg$parseInToken();
	            }
	            if (s3 !== peg$FAILED) {
	              s1 = [s1, s2, s3];
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseInitDeclaratorList();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 59) {
	                s3 = peg$c11;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c12); }
	              }
	              if (s3 !== peg$FAILED) {
	                s1 = [s1, s2, s3];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDeclarationSpecifier() {
	      var s0;

	      var key    = peg$currPos * 278 + 107,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseStorageClassSpecifier();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseTypeQualifier();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseTypeSpecifier();
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStorageClassSpecifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 108,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTypedefToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseAutoToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseRegisterToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parseStaticToken();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parseExternToken();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parseInlineToken();
	              }
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c229(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeSpecifier() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 109,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseBlockTypeSpecifier();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseProtocolTypeSpecifier();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseStructOrUnionSpecifier();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseEnumSpecifier();
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              s1 = peg$parseTypeofToken();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parse__TypeofToken();
	                if (s1 === peg$FAILED) {
	                  s1 = peg$parse__TypeofToken__();
	                }
	              }
	              if (s1 !== peg$FAILED) {
	                s2 = peg$parse__();
	                if (s2 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 40) {
	                    s3 = peg$c30;
	                    peg$currPos++;
	                  } else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c31); }
	                  }
	                  if (s3 !== peg$FAILED) {
	                    s4 = peg$parse__();
	                    if (s4 !== peg$FAILED) {
	                      s5 = peg$parseUnaryExpression();
	                      if (s5 !== peg$FAILED) {
	                        s6 = peg$parse__();
	                        if (s6 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s7 = peg$c32;
	                            peg$currPos++;
	                          } else {
	                            s7 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                          }
	                          if (s7 !== peg$FAILED) {
	                            peg$savedPos = s0;
	                            s1 = peg$c230(s5);
	                            s0 = s1;
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseBasicTypeSpecifier();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseTypeNameSpecifier();
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBlockTypeSpecifier() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 278 + 110,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c215) {
	        s1 = peg$c215;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c216); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          s5 = peg$parseIsDeclarator();
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseDeclarationSpecifiers();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseIdentifier();
	              if (s5 === peg$FAILED) {
	                s5 = null;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      s10 = peg$parseBlockParameters();
	                      if (s10 !== peg$FAILED) {
	                        s9 = [s9, s10];
	                        s8 = s9;
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    if (s8 === peg$FAILED) {
	                      s8 = null;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c231(s3, s5, s8);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolTypeSpecifier() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 111,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseProtocolReferenceList();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c232(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeNameSpecifier() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 112,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseTypeIdentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseTypeParameterList();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c233(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeIdentifier() {
	      var s0, s1, s2;

	      var key    = peg$currPos * 278 + 113,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = peg$currPos;
	        s2 = peg$c234(s1);
	        if (s2) {
	          s2 = void 0;
	        } else {
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c235(s1);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeParameterList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 114,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c104;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c105); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s7 = peg$c51;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c52); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parse__();
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parseTypeName();
	                  if (s9 !== peg$FAILED) {
	                    s6 = [s6, s7, s8, s9];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s7 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parseTypeName();
	                    if (s9 !== peg$FAILED) {
	                      s6 = [s6, s7, s8, s9];
	                      s5 = s6;
	                    } else {
	                      peg$currPos = s5;
	                      s5 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 62) {
	                  s6 = peg$c106;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c107); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c236(s3, s4);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 60) {
	          s1 = peg$c104;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c105); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 62) {
	              s3 = peg$c106;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c107); }
	            }
	            if (s3 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c237();
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBasicTypeSpecifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 115,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseCharToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseShortToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseIntToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parseLongToken();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parseSignedToken();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parseUnsignedToken();
	                if (s1 === peg$FAILED) {
	                  s1 = peg$parseFloatToken();
	                  if (s1 === peg$FAILED) {
	                    s1 = peg$parseDoubleToken();
	                    if (s1 === peg$FAILED) {
	                      s1 = peg$parseVoidToken();
	                      if (s1 === peg$FAILED) {
	                        s1 = peg$parseInstanceTypeToken();
	                        if (s1 === peg$FAILED) {
	                          s1 = peg$parse_BoolToken();
	                          if (s1 === peg$FAILED) {
	                            s1 = peg$parse_ComplexToken();
	                            if (s1 === peg$FAILED) {
	                              s1 = peg$parse_ImaginaryToken();
	                              if (s1 === peg$FAILED) {
	                                s1 = peg$parseIdToken();
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c238(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 116,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseConstToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseVolatileToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseRestrictToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parse__CovariantToken();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parse__KindofToken();
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c239(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseNullabilityQualifier();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseArcBehaviourQualifier();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseAttributeQualifier();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseProtocolQualifier();
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAttributeQualifier() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

	      var key    = peg$currPos * 278 + 117,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parse__AttributeToken__();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c240) {
	            s3 = peg$c240;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c241); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseAttributeArgument();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.substr(peg$currPos, 2) === peg$c242) {
	                    s7 = peg$c242;
	                    peg$currPos += 2;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c243); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 61) {
	                        s10 = peg$c55;
	                        peg$currPos++;
	                      } else {
	                        s10 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c56); }
	                      }
	                      if (s10 !== peg$FAILED) {
	                        s11 = peg$parse__();
	                        if (s11 !== peg$FAILED) {
	                          s12 = peg$parseConditionalExpression();
	                          if (s12 !== peg$FAILED) {
	                            s9 = [s9, s10, s11, s12];
	                            s8 = s9;
	                          } else {
	                            peg$currPos = s8;
	                            s8 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s8;
	                          s8 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s8;
	                        s8 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s8;
	                      s8 = peg$FAILED;
	                    }
	                    if (s8 === peg$FAILED) {
	                      s8 = null;
	                    }
	                    if (s8 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c244();
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAttributeArgument() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 118,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = [];
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.substr(peg$currPos, 2) === peg$c242) {
	        s3 = peg$c242;
	        peg$currPos += 2;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c243); }
	      }
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = void 0;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.length > peg$currPos) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c0); }
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      while (s1 !== peg$FAILED) {
	        s0.push(s1);
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c242) {
	          s3 = peg$c242;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c243); }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c0); }
	          }
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 119,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseInToken();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseOutToken();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseInOutToken();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseByCopyToken();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseByRefToken();
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parseOneWayToken();
	                if (s1 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c245();
	                }
	                s0 = s1;
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseArcBehaviourQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 120,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parse__UnsafeUnretainedToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parse__WeakToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parse__AutoReleasingToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parse__StrongToken();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parse__BlockToken();
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c246(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNullabilityQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 121,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseNullableToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parse_NullableToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parse__NullableToken();
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c247();
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseNonnullToken();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parse_NonnullToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parse__NonnullToken();
	          }
	        }
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c248();
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseNullUnspecifiedToken();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parse_NullUnspecifiedToken();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parse__NullUnspecifiedToken();
	            }
	          }
	          if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c249();
	          }
	          s0 = s1;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInitDeclaratorList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 122,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseInitDeclarator();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseInitDeclarator();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseInitDeclarator();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c174(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInitializerCast() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 123,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c32;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	              }
	              if (s5 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInitDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      var key    = peg$currPos * 278 + 124,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarator();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s4 = peg$c55;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c56); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseInitializerCast();
	              if (s6 === peg$FAILED) {
	                s6 = null;
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseInitializer();
	                  if (s8 !== peg$FAILED) {
	                    s3 = [s3, s4, s5, s6, s7, s8];
	                    s2 = s3;
	                  } else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c250(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInitializer() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 125,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 123) {
	        s1 = peg$c6;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c7); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseInitializer();
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s7 = peg$c51;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c52); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parse__();
	                if (s8 !== peg$FAILED) {
	                  s9 = peg$parseInitializer();
	                  if (s9 !== peg$FAILED) {
	                    s6 = [s6, s7, s8, s9];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s7 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parse__();
	                  if (s8 !== peg$FAILED) {
	                    s9 = peg$parseInitializer();
	                    if (s9 !== peg$FAILED) {
	                      s6 = [s6, s7, s8, s9];
	                      s5 = s6;
	                    } else {
	                      peg$currPos = s5;
	                      s5 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 44) {
	                  s6 = peg$c51;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c52); }
	                }
	                if (s6 === peg$FAILED) {
	                  s6 = null;
	                }
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse__();
	                  if (s7 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 125) {
	                      s8 = peg$c8;
	                      peg$currPos++;
	                    } else {
	                      s8 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c9); }
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s1 = [s1, s2, s3, s4, s5, s6, s7, s8];
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s1 = peg$c144;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c145); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parseAssignmentExpression();
	          if (s2 !== peg$FAILED) {
	            s1 = [s1, s2];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseAssignmentExpression();
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassMethodDeclaration() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 126,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 43) {
	        s1 = peg$c129;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c130); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDeclaration();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c251(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInstanceMethodDeclaration() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 127,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s1 = peg$c131;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c132); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDeclaration();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c252(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMethodDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 128,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseMethodType();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodSelector();
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseAttributeQualifier();
	              if (s7 !== peg$FAILED) {
	                s6 = [s6, s7];
	                s5 = s6;
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseAttributeQualifier();
	                if (s7 !== peg$FAILED) {
	                  s6 = [s6, s7];
	                  s5 = s6;
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse__();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 59) {
	                  s6 = peg$c11;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c12); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c253(s1, s3, s4);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMethodType() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 129,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c32;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c33); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c254(s3);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMethodSelector() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 130,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseKeywordDeclarator();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseKeywordDeclarator();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseKeywordDeclarator();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                if (input.substr(peg$currPos, 3) === peg$c222) {
	                  s7 = peg$c222;
	                  peg$currPos += 3;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c223); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c255(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifier();
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c256(s1);
	        }
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseKeywordDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 131,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 === peg$FAILED) {
	        s1 = null;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 58) {
	            s3 = peg$c26;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c27); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$currPos;
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseMethodType();
	              if (s6 !== peg$FAILED) {
	                s5 = [s5, s6];
	                s4 = s5;
	              } else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$FAILED;
	            }
	            if (s4 === peg$FAILED) {
	              s4 = null;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$currPos;
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse__UnusedToken();
	                if (s7 !== peg$FAILED) {
	                  s6 = [s6, s7];
	                  s5 = s6;
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	              if (s5 === peg$FAILED) {
	                s5 = null;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseIdentifier();
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c257(s1, s4, s5, s7);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeName() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 132,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseSpecifierQualifierList();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseAbstractDeclarator();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c258(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAbstractDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      var key    = peg$currPos * 278 + 133,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePointer();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseAbstractDeclarator();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c259(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseBlockTypeSpecifier();
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseDeclarationSpecifier();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$currPos;
	            s3 = peg$parse__();
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parseAbstractDeclarator();
	              if (s4 !== peg$FAILED) {
	                s3 = [s3, s4];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	            if (s2 === peg$FAILED) {
	              s2 = null;
	            }
	            if (s2 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c260(s1, s2);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 40) {
	              s1 = peg$c30;
	              peg$currPos++;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c31); }
	            }
	            if (s1 !== peg$FAILED) {
	              s2 = peg$currPos;
	              s3 = peg$parse__();
	              if (s3 !== peg$FAILED) {
	                s4 = peg$parseAbstractDeclarator();
	                if (s4 !== peg$FAILED) {
	                  s3 = [s3, s4];
	                  s2 = s3;
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	              if (s2 === peg$FAILED) {
	                s2 = null;
	              }
	              if (s2 !== peg$FAILED) {
	                s3 = peg$parse__();
	                if (s3 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s4 = peg$c32;
	                    peg$currPos++;
	                  } else {
	                    s4 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                  }
	                  if (s4 !== peg$FAILED) {
	                    s5 = [];
	                    s6 = peg$currPos;
	                    s7 = peg$parse__();
	                    if (s7 !== peg$FAILED) {
	                      s8 = peg$parseAbstractDeclaratorSuffix();
	                      if (s8 !== peg$FAILED) {
	                        s7 = [s7, s8];
	                        s6 = s7;
	                      } else {
	                        peg$currPos = s6;
	                        s6 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                    if (s6 !== peg$FAILED) {
	                      while (s6 !== peg$FAILED) {
	                        s5.push(s6);
	                        s6 = peg$currPos;
	                        s7 = peg$parse__();
	                        if (s7 !== peg$FAILED) {
	                          s8 = peg$parseAbstractDeclaratorSuffix();
	                          if (s8 !== peg$FAILED) {
	                            s7 = [s7, s8];
	                            s6 = s7;
	                          } else {
	                            peg$currPos = s6;
	                            s6 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s6;
	                          s6 = peg$FAILED;
	                        }
	                      }
	                    } else {
	                      s5 = peg$FAILED;
	                    }
	                    if (s5 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c261(s2, s5);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              s1 = [];
	              s2 = peg$currPos;
	              s3 = peg$parse__();
	              if (s3 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 91) {
	                  s4 = peg$c139;
	                  peg$currPos++;
	                } else {
	                  s4 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c140); }
	                }
	                if (s4 !== peg$FAILED) {
	                  s5 = peg$parse__();
	                  if (s5 !== peg$FAILED) {
	                    s6 = peg$parseConditionalExpression();
	                    if (s6 === peg$FAILED) {
	                      s6 = null;
	                    }
	                    if (s6 !== peg$FAILED) {
	                      s7 = peg$parse__();
	                      if (s7 !== peg$FAILED) {
	                        if (input.charCodeAt(peg$currPos) === 93) {
	                          s8 = peg$c141;
	                          peg$currPos++;
	                        } else {
	                          s8 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c142); }
	                        }
	                        if (s8 !== peg$FAILED) {
	                          s3 = [s3, s4, s5, s6, s7, s8];
	                          s2 = s3;
	                        } else {
	                          peg$currPos = s2;
	                          s2 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s2;
	                        s2 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s2;
	                      s2 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	              if (s2 !== peg$FAILED) {
	                while (s2 !== peg$FAILED) {
	                  s1.push(s2);
	                  s2 = peg$currPos;
	                  s3 = peg$parse__();
	                  if (s3 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 91) {
	                      s4 = peg$c139;
	                      peg$currPos++;
	                    } else {
	                      s4 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c140); }
	                    }
	                    if (s4 !== peg$FAILED) {
	                      s5 = peg$parse__();
	                      if (s5 !== peg$FAILED) {
	                        s6 = peg$parseConditionalExpression();
	                        if (s6 === peg$FAILED) {
	                          s6 = null;
	                        }
	                        if (s6 !== peg$FAILED) {
	                          s7 = peg$parse__();
	                          if (s7 !== peg$FAILED) {
	                            if (input.charCodeAt(peg$currPos) === 93) {
	                              s8 = peg$c141;
	                              peg$currPos++;
	                            } else {
	                              s8 = peg$FAILED;
	                              if (peg$silentFails === 0) { peg$fail(peg$c142); }
	                            }
	                            if (s8 !== peg$FAILED) {
	                              s3 = [s3, s4, s5, s6, s7, s8];
	                              s2 = s3;
	                            } else {
	                              peg$currPos = s2;
	                              s2 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s2;
	                            s2 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s2;
	                          s2 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s2;
	                        s2 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s2;
	                      s2 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                  }
	                }
	              } else {
	                s1 = peg$FAILED;
	              }
	              if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c262(s1);
	              }
	              s0 = s1;
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAbstractDeclaratorSuffix() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 134,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c139;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c140); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseConditionalExpression();
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 93) {
	                s5 = peg$c141;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c142); }
	              }
	              if (s5 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s1 = peg$c30;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c31); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseParameterDeclarationList();
	            if (s3 === peg$FAILED) {
	              s3 = null;
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 41) {
	                  s5 = peg$c32;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c33); }
	                }
	                if (s5 !== peg$FAILED) {
	                  s1 = [s1, s2, s3, s4, s5];
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseParameterDeclarationList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 135,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseParameterDeclaration();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parseParameterDeclaration();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parseParameterDeclaration();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c174(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseParameterDeclaration() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 136,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseDeclarationSpecifiers();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseDeclarator();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$currPos;
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseAbstractDeclarator();
	            if (s4 !== peg$FAILED) {
	              s3 = [s3, s4];
	              s2 = s3;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c263(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyDeclaration() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 137,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePropertyToken();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsePropertyAttributesDeclaration();
	          if (s3 === peg$FAILED) {
	            s3 = null;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseStructDeclaration();
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c264(s3, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyAttributesDeclaration() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 138,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c30;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c31); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsePropertyAttributesList();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = null;
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse__();
	          if (s3 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 41) {
	              s4 = peg$c32;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c33); }
	            }
	            if (s4 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c265(s2);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyAttributesList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 139,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parsePropertyAttribute();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s5 = peg$c51;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c52); }
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$parsePropertyAttribute();
	              if (s7 !== peg$FAILED) {
	                s4 = [s4, s5, s6, s7];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 44) {
	              s5 = peg$c51;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c52); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parsePropertyAttribute();
	                if (s7 !== peg$FAILED) {
	                  s4 = [s4, s5, s6, s7];
	                  s3 = s4;
	                } else {
	                  peg$currPos = s3;
	                  s3 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c174(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyAttribute() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 140,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseNonatomicToken();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseAssignToken();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseWeakToken();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseStrongToken();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseRetainToken();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseReadonlyToken();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseReadwriteToken();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseNonnullToken();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseNullableToken();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseNullUnspecifiedToken();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$currPos;
	                          s1 = peg$parseGetterToken();
	                          if (s1 !== peg$FAILED) {
	                            s2 = peg$parse__();
	                            if (s2 !== peg$FAILED) {
	                              if (input.charCodeAt(peg$currPos) === 61) {
	                                s3 = peg$c55;
	                                peg$currPos++;
	                              } else {
	                                s3 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c56); }
	                              }
	                              if (s3 !== peg$FAILED) {
	                                s4 = peg$parse__();
	                                if (s4 !== peg$FAILED) {
	                                  s5 = peg$currPos;
	                                  s6 = peg$parseIdentifier();
	                                  if (s6 !== peg$FAILED) {
	                                    s5 = input.substring(s5, peg$currPos);
	                                  } else {
	                                    s5 = s6;
	                                  }
	                                  if (s5 !== peg$FAILED) {
	                                    s1 = [s1, s2, s3, s4, s5];
	                                    s0 = s1;
	                                  } else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                  }
	                                } else {
	                                  peg$currPos = s0;
	                                  s0 = peg$FAILED;
	                                }
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$currPos;
	                            s1 = peg$parseSetterToken();
	                            if (s1 !== peg$FAILED) {
	                              s2 = peg$parse__();
	                              if (s2 !== peg$FAILED) {
	                                if (input.charCodeAt(peg$currPos) === 61) {
	                                  s3 = peg$c55;
	                                  peg$currPos++;
	                                } else {
	                                  s3 = peg$FAILED;
	                                  if (peg$silentFails === 0) { peg$fail(peg$c56); }
	                                }
	                                if (s3 !== peg$FAILED) {
	                                  s4 = peg$parse__();
	                                  if (s4 !== peg$FAILED) {
	                                    s5 = peg$currPos;
	                                    s6 = peg$parseIdentifier();
	                                    if (s6 !== peg$FAILED) {
	                                      s5 = input.substring(s5, peg$currPos);
	                                    } else {
	                                      s5 = s6;
	                                    }
	                                    if (s5 !== peg$FAILED) {
	                                      s6 = peg$parse__();
	                                      if (s6 !== peg$FAILED) {
	                                        if (input.charCodeAt(peg$currPos) === 58) {
	                                          s7 = peg$c26;
	                                          peg$currPos++;
	                                        } else {
	                                          s7 = peg$FAILED;
	                                          if (peg$silentFails === 0) { peg$fail(peg$c27); }
	                                        }
	                                        if (s7 !== peg$FAILED) {
	                                          s1 = [s1, s2, s3, s4, s5, s6, s7];
	                                          s0 = s1;
	                                        } else {
	                                          peg$currPos = s0;
	                                          s0 = peg$FAILED;
	                                        }
	                                      } else {
	                                        peg$currPos = s0;
	                                        s0 = peg$FAILED;
	                                      }
	                                    } else {
	                                      peg$currPos = s0;
	                                      s0 = peg$FAILED;
	                                    }
	                                  } else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                  }
	                                } else {
	                                  peg$currPos = s0;
	                                  s0 = peg$FAILED;
	                                }
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                            if (s0 === peg$FAILED) {
	                              s0 = peg$parseCopyToken();
	                              if (s0 === peg$FAILED) {
	                                s0 = peg$parseAttributeQualifier();
	                                if (s0 === peg$FAILED) {
	                                  s0 = peg$currPos;
	                                  s1 = peg$parseIdentifier();
	                                  if (s1 !== peg$FAILED) {
	                                    s0 = input.substring(s0, peg$currPos);
	                                  } else {
	                                    s0 = s1;
	                                  }
	                                }
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdentifier() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 278 + 141,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      peg$silentFails++;
	      s2 = peg$parseReservedWord();
	      peg$silentFails--;
	      if (s2 === peg$FAILED) {
	        s1 = void 0;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$currPos;
	        s4 = peg$parseIdStart();
	        if (s4 !== peg$FAILED) {
	          s5 = [];
	          s6 = peg$parseIdPart();
	          while (s6 !== peg$FAILED) {
	            s5.push(s6);
	            s6 = peg$parseIdPart();
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = input.substring(s2, peg$currPos);
	        } else {
	          s2 = s3;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c266(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdStart() {
	      var s0;

	      var key    = peg$currPos * 278 + 142,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c267.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c268); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdPart() {
	      var s0;

	      var key    = peg$currPos * 278 + 143,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c269.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c270); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBooleanLiteral() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 144,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c271) {
	        s1 = peg$c271;
	        peg$currPos += 4;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c272); }
	      }
	      if (s1 === peg$FAILED) {
	        if (input.substr(peg$currPos, 3) === peg$c273) {
	          s1 = peg$c273;
	          peg$currPos += 3;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c274); }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseString() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 145,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s2 = peg$c275;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c276); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        s4 = peg$parseEscapeSequence();
	        if (s4 === peg$FAILED) {
	          if (peg$c277.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c278); }
	          }
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$parseEscapeSequence();
	          if (s4 === peg$FAILED) {
	            if (peg$c277.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c278); }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s4 = peg$c275;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c276); }
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStringLiteral() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

	      var key    = peg$currPos * 278 + 146,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 64) {
	        s3 = peg$c172;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c173); }
	      }
	      if (s3 !== peg$FAILED) {
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 === peg$FAILED) {
	        s2 = null;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseString();
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$currPos;
	          s6 = peg$parse__();
	          if (s6 !== peg$FAILED) {
	            s7 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 64) {
	              s8 = peg$c172;
	              peg$currPos++;
	            } else {
	              s8 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c173); }
	            }
	            if (s8 !== peg$FAILED) {
	              s9 = peg$parse__();
	              if (s9 !== peg$FAILED) {
	                s8 = [s8, s9];
	                s7 = s8;
	              } else {
	                peg$currPos = s7;
	                s7 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s7;
	              s7 = peg$FAILED;
	            }
	            if (s7 === peg$FAILED) {
	              s7 = null;
	            }
	            if (s7 !== peg$FAILED) {
	              s8 = peg$parseString();
	              if (s8 !== peg$FAILED) {
	                s6 = [s6, s7, s8];
	                s5 = s6;
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s5;
	            s5 = peg$FAILED;
	          }
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            s5 = peg$currPos;
	            s6 = peg$parse__();
	            if (s6 !== peg$FAILED) {
	              s7 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 64) {
	                s8 = peg$c172;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c173); }
	              }
	              if (s8 !== peg$FAILED) {
	                s9 = peg$parse__();
	                if (s9 !== peg$FAILED) {
	                  s8 = [s8, s9];
	                  s7 = s8;
	                } else {
	                  peg$currPos = s7;
	                  s7 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s7;
	                s7 = peg$FAILED;
	              }
	              if (s7 === peg$FAILED) {
	                s7 = null;
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parseString();
	                if (s8 !== peg$FAILED) {
	                  s6 = [s6, s7, s8];
	                  s5 = s6;
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s5;
	              s5 = peg$FAILED;
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAngleString() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 147,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s2 = peg$c104;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c105); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        s4 = peg$parseEscapeSequence();
	        if (s4 === peg$FAILED) {
	          if (peg$c279.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c280); }
	          }
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$parseEscapeSequence();
	          if (s4 === peg$FAILED) {
	            if (peg$c279.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c280); }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 62) {
	            s4 = peg$c106;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c107); }
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEscapeSequence() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 148,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 92) {
	        s2 = peg$c281;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c282); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseCharEscape();
	        if (s3 === peg$FAILED) {
	          s3 = peg$parseOctalEscape();
	          if (s3 === peg$FAILED) {
	            s3 = peg$parseHexEscape();
	            if (s3 === peg$FAILED) {
	              s3 = peg$parseUnicodeEscape();
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCharEscape() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 149,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c283.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c284); }
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseOctalEscape() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 150,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (peg$c285.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c286); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c287.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c288); }
	        }
	        if (s3 !== peg$FAILED) {
	          if (peg$c287.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c288); }
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 === peg$FAILED) {
	        s1 = peg$currPos;
	        if (peg$c287.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c288); }
	        }
	        if (s2 !== peg$FAILED) {
	          if (peg$c287.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c288); }
	          }
	          if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	        if (s1 === peg$FAILED) {
	          if (peg$c287.test(input.charAt(peg$currPos))) {
	            s1 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c288); }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseHexEscape() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 151,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 120) {
	        s2 = peg$c289;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c290); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c291.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c292); }
	        }
	        if (s3 !== peg$FAILED) {
	          peg$savedPos = s1;
	          s2 = peg$c293();
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseUnicodeEscape() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 152,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 117) {
	        s2 = peg$c294;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c295); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c291.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c292); }
	        }
	        if (s3 !== peg$FAILED) {
	          peg$savedPos = s1;
	          s2 = peg$c296();
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBinaryLiteral() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 153,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c297;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c298); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 98) {
	          s3 = peg$c299;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c300); }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 66) {
	            s3 = peg$c301;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c302); }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c303.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c304); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c303.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c304); }
	              }
	            }
	          } else {
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseIntegerTypeSuffix();
	            if (s5 === peg$FAILED) {
	              s5 = null;
	            }
	            if (s5 !== peg$FAILED) {
	              s2 = [s2, s3, s4, s5];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseHexLiteral() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 154,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c297;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c298); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 120) {
	          s3 = peg$c289;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c290); }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 88) {
	            s3 = peg$c305;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c306); }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$parseHexDigit();
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$parseHexDigit();
	            }
	          } else {
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseIntegerTypeSuffix();
	            if (s5 === peg$FAILED) {
	              s5 = null;
	            }
	            if (s5 !== peg$FAILED) {
	              s2 = [s2, s3, s4, s5];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDecimalLiteral() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 155,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c297;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c298); }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        if (peg$c307.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c308); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c309.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c310); }
	          }
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            if (peg$c309.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c310); }
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseIntegerTypeSuffix();
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseOctalLiteral() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 156,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c297;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c298); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        if (peg$c287.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c288); }
	        }
	        if (s4 !== peg$FAILED) {
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            if (peg$c287.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c288); }
	            }
	          }
	        } else {
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseIntegerTypeSuffix();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCharacterLiteral() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 157,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s2 = peg$c311;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c312); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseEscapeSequence();
	        if (s3 === peg$FAILED) {
	          if (peg$c313.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c314); }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 39) {
	            s4 = peg$c311;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c312); }
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseHexDigit() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 158,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c291.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c292); }
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIntegerTypeSuffix() {
	      var s0, s1, s2;

	      var key    = peg$currPos * 278 + 159,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      if (peg$c315.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c316); }
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          if (peg$c315.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c316); }
	          }
	        }
	      } else {
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFloatingPointLiteral() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 278 + 160,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      s3 = [];
	      if (peg$c309.test(input.charAt(peg$currPos))) {
	        s4 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s4 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c310); }
	      }
	      if (s4 !== peg$FAILED) {
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          if (peg$c309.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c310); }
	          }
	        }
	      } else {
	        s3 = peg$FAILED;
	      }
	      if (s3 !== peg$FAILED) {
	        s4 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s5 = peg$c144;
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c145); }
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = [];
	          if (peg$c309.test(input.charAt(peg$currPos))) {
	            s7 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c310); }
	          }
	          while (s7 !== peg$FAILED) {
	            s6.push(s7);
	            if (peg$c309.test(input.charAt(peg$currPos))) {
	              s7 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c310); }
	            }
	          }
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 === peg$FAILED) {
	          s4 = null;
	        }
	        if (s4 !== peg$FAILED) {
	          s3 = [s3, s4];
	          s2 = s3;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$FAILED;
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s3 = peg$c144;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c145); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c309.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c310); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c309.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c310); }
	              }
	            }
	          } else {
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        if (peg$c315.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c316); }
	        }
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseExponent();
	          if (s4 === peg$FAILED) {
	            s4 = null;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseFloatTypeSuffix();
	            if (s5 === peg$FAILED) {
	              s5 = null;
	            }
	            if (s5 !== peg$FAILED) {
	              s2 = [s2, s3, s4, s5];
	              s1 = s2;
	            } else {
	              peg$currPos = s1;
	              s1 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExponent() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 161,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (peg$c317.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c318); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c114.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c115); }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c309.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c310); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c309.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c310); }
	              }
	            }
	          } else {
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFloatTypeSuffix() {
	      var s0, s1;

	      var key    = peg$currPos * 278 + 162,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c319.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c320); }
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseReservedWord() {
	      var s0;

	      var key    = peg$currPos * 278 + 163,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseCaseToken();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseDefaultToken();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseIfToken();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseElseToken();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseSwitchToken();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseSizeofToken();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseTypeofToken();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseTypedefToken();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseStructToken();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseUnionToken();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parseEnumToken();
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$parseForToken();
	                            if (s0 === peg$FAILED) {
	                              s0 = peg$parseWhileToken();
	                              if (s0 === peg$FAILED) {
	                                s0 = peg$parseDoToken();
	                                if (s0 === peg$FAILED) {
	                                  s0 = peg$parseGotoToken();
	                                  if (s0 === peg$FAILED) {
	                                    s0 = peg$parseContinueToken();
	                                    if (s0 === peg$FAILED) {
	                                      s0 = peg$parseBreakToken();
	                                      if (s0 === peg$FAILED) {
	                                        s0 = peg$parseReturnToken();
	                                        if (s0 === peg$FAILED) {
	                                          s0 = peg$parseVoidToken();
	                                          if (s0 === peg$FAILED) {
	                                            s0 = peg$parseCharToken();
	                                            if (s0 === peg$FAILED) {
	                                              s0 = peg$parseShortToken();
	                                              if (s0 === peg$FAILED) {
	                                                s0 = peg$parseIntToken();
	                                                if (s0 === peg$FAILED) {
	                                                  s0 = peg$parseLongToken();
	                                                  if (s0 === peg$FAILED) {
	                                                    s0 = peg$parseFloatToken();
	                                                    if (s0 === peg$FAILED) {
	                                                      s0 = peg$parseDoubleToken();
	                                                      if (s0 === peg$FAILED) {
	                                                        s0 = peg$parseSignedToken();
	                                                        if (s0 === peg$FAILED) {
	                                                          s0 = peg$parseUnsignedToken();
	                                                          if (s0 === peg$FAILED) {
	                                                            s0 = peg$parseInstanceTypeToken();
	                                                            if (s0 === peg$FAILED) {
	                                                              s0 = peg$parse_BoolToken();
	                                                              if (s0 === peg$FAILED) {
	                                                                s0 = peg$parse_ComplexToken();
	                                                                if (s0 === peg$FAILED) {
	                                                                  s0 = peg$parse_ImaginaryToken();
	                                                                  if (s0 === peg$FAILED) {
	                                                                    s0 = peg$parseAutoToken();
	                                                                    if (s0 === peg$FAILED) {
	                                                                      s0 = peg$parseRegisterToken();
	                                                                      if (s0 === peg$FAILED) {
	                                                                        s0 = peg$parseStaticToken();
	                                                                        if (s0 === peg$FAILED) {
	                                                                          s0 = peg$parseExternToken();
	                                                                          if (s0 === peg$FAILED) {
	                                                                            s0 = peg$parseConstToken();
	                                                                            if (s0 === peg$FAILED) {
	                                                                              s0 = peg$parseVolatileToken();
	                                                                              if (s0 === peg$FAILED) {
	                                                                                s0 = peg$parseInlineToken();
	                                                                                if (s0 === peg$FAILED) {
	                                                                                  s0 = peg$parseRestrictToken();
	                                                                                  if (s0 === peg$FAILED) {
	                                                                                    s0 = peg$parseNonnullToken();
	                                                                                    if (s0 === peg$FAILED) {
	                                                                                      s0 = peg$parseNullableToken();
	                                                                                      if (s0 === peg$FAILED) {
	                                                                                        s0 = peg$parseNullUnspecifiedToken();
	                                                                                        if (s0 === peg$FAILED) {
	                                                                                          s0 = peg$parse_NonnullToken();
	                                                                                          if (s0 === peg$FAILED) {
	                                                                                            s0 = peg$parse_NullableToken();
	                                                                                            if (s0 === peg$FAILED) {
	                                                                                              s0 = peg$parse_NullUnspecifiedToken();
	                                                                                              if (s0 === peg$FAILED) {
	                                                                                                s0 = peg$parse__NonnullToken();
	                                                                                                if (s0 === peg$FAILED) {
	                                                                                                  s0 = peg$parse__NullableToken();
	                                                                                                  if (s0 === peg$FAILED) {
	                                                                                                    s0 = peg$parse__NullUnspecifiedToken();
	                                                                                                    if (s0 === peg$FAILED) {
	                                                                                                      s0 = peg$parse__AttributeToken__();
	                                                                                                      if (s0 === peg$FAILED) {
	                                                                                                        s0 = peg$parse__CovariantToken();
	                                                                                                        if (s0 === peg$FAILED) {
	                                                                                                          s0 = peg$parse__KindofToken();
	                                                                                                          if (s0 === peg$FAILED) {
	                                                                                                            s0 = peg$parse__TypeofToken();
	                                                                                                            if (s0 === peg$FAILED) {
	                                                                                                              s0 = peg$parseNS_ASSUME_NONNULL_BEGIN();
	                                                                                                              if (s0 === peg$FAILED) {
	                                                                                                                s0 = peg$parseNS_ASSUME_NONNULL_END();
	                                                                                                              }
	                                                                                                            }
	                                                                                                          }
	                                                                                                        }
	                                                                                                      }
	                                                                                                    }
	                                                                                                  }
	                                                                                                }
	                                                                                              }
	                                                                                            }
	                                                                                          }
	                                                                                        }
	                                                                                      }
	                                                                                    }
	                                                                                  }
	                                                                                }
	                                                                              }
	                                                                            }
	                                                                          }
	                                                                        }
	                                                                      }
	                                                                    }
	                                                                  }
	                                                                }
	                                                              }
	                                                            }
	                                                          }
	                                                        }
	                                                      }
	                                                    }
	                                                  }
	                                                }
	                                              }
	                                            }
	                                          }
	                                        }
	                                      }
	                                    }
	                                  }
	                                }
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCaseToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 164,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c321) {
	        s2 = peg$c321;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c322); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDefaultToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 165,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c323) {
	        s2 = peg$c323;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c324); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIfToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 166,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c325) {
	        s2 = peg$c325;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c326); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseElseToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 167,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c327) {
	        s2 = peg$c327;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c328); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSwitchToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 168,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c329) {
	        s2 = peg$c329;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c330); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSizeofToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 169,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c331) {
	        s2 = peg$c331;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c332); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeofToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 170,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c333) {
	        s2 = peg$c333;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c334); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypedefToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 171,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c335) {
	        s2 = peg$c335;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c336); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 172,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c337) {
	        s2 = peg$c337;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c338); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseUnionToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 173,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c339) {
	        s2 = peg$c339;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c340); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEnumToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 174,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c341) {
	        s2 = peg$c341;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c342); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSelfToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 175,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c343) {
	        s2 = peg$c343;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c344); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSuperToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 176,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c345) {
	        s2 = peg$c345;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c346); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseForToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 177,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c347) {
	        s2 = peg$c347;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c348); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDoToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 178,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c349) {
	        s2 = peg$c349;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c350); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseWhileToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 179,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c351) {
	        s2 = peg$c351;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c352); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseGotoToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 180,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c353) {
	        s2 = peg$c353;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c354); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseContinueToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 181,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c355) {
	        s2 = peg$c355;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c356); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBreakToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 182,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c357) {
	        s2 = peg$c357;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c358); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseReturnToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 183,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c359) {
	        s2 = peg$c359;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c360); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInterfaceToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 184,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c361) {
	        s2 = peg$c361;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c362); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImplementationToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 185,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 15) === peg$c363) {
	        s2 = peg$c363;
	        peg$currPos += 15;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c364); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEndToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 186,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c365) {
	        s2 = peg$c365;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c366); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePrivateToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 187,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c367) {
	        s2 = peg$c367;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c368); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePublicToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 188,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c369) {
	        s2 = peg$c369;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c370); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePackageToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 189,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c371) {
	        s2 = peg$c371;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c372); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtectedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 190,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c373) {
	        s2 = peg$c373;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c374); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertyToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 191,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c375) {
	        s2 = peg$c375;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c376); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSynthesizeToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 192,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 11) === peg$c377) {
	        s2 = peg$c377;
	        peg$currPos += 11;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c378); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDynamicToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 193,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c379) {
	        s2 = peg$c379;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c380); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseRequiredToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 194,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c381) {
	        s2 = peg$c381;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c382); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImportToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 195,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c383) {
	        s2 = peg$c383;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c384); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSelectorToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 196,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c385) {
	        s2 = peg$c385;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c386); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseClassToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 197,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c387) {
	        s2 = peg$c387;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c388); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseProtocolToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 198,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c389) {
	        s2 = peg$c389;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c390); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseEncodeToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 199,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c391) {
	        s2 = peg$c391;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c392); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAvailableToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 200,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c393) {
	        s2 = peg$c393;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c394); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseOptionalToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 201,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c395) {
	        s2 = peg$c395;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c396); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTryToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 202,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c397) {
	        s2 = peg$c397;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c398); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCatchToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 203,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c399) {
	        s2 = peg$c399;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c400); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFinallyToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 204,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c401) {
	        s2 = peg$c401;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c402); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseThrowToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 205,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c403) {
	        s2 = peg$c403;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c404); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSynchronizedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 206,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 13) === peg$c405) {
	        s2 = peg$c405;
	        peg$currPos += 13;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c406); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAutoreleasepoolToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 207,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 16) === peg$c407) {
	        s2 = peg$c407;
	        peg$currPos += 16;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c408); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseVoidToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 208,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c409) {
	        s2 = peg$c409;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c410); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCharToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 209,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c411) {
	        s2 = peg$c411;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c412); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseShortToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 210,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c413) {
	        s2 = peg$c413;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c414); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIntToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 211,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c415) {
	        s2 = peg$c415;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c416); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLongToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 212,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c417) {
	        s2 = peg$c417;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c418); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseFloatToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 213,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c419) {
	        s2 = peg$c419;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c420); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseDoubleToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 214,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c421) {
	        s2 = peg$c421;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c422); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSignedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 215,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c423) {
	        s2 = peg$c423;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c424); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseUnsignedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 216,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c425) {
	        s2 = peg$c425;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c426); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInstanceTypeToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 217,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 12) === peg$c427) {
	        s2 = peg$c427;
	        peg$currPos += 12;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c428); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 218,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c429) {
	        s2 = peg$c429;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c430); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__UnsafeUnretainedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 219,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 19) === peg$c431) {
	        s2 = peg$c431;
	        peg$currPos += 19;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c432); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__WeakToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 220,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c433) {
	        s2 = peg$c433;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c434); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__AutoReleasingToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 221,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 15) === peg$c435) {
	        s2 = peg$c435;
	        peg$currPos += 15;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c436); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__StrongToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 222,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c437) {
	        s2 = peg$c437;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c438); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__TypeofToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 223,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c439) {
	        s2 = peg$c439;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c440); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__TypeofToken__() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 224,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c441) {
	        s2 = peg$c441;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c442); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__CovariantToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 225,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 11) === peg$c443) {
	        s2 = peg$c443;
	        peg$currPos += 11;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c444); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__KindofToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 226,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c445) {
	        s2 = peg$c445;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c446); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__NonnullToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 227,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c447) {
	        s2 = peg$c447;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c448); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__NullableToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 228,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c449) {
	        s2 = peg$c449;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c450); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__NullUnspecifiedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 229,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 18) === peg$c451) {
	        s2 = peg$c451;
	        peg$currPos += 18;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c452); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_NonnullToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 230,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c453) {
	        s2 = peg$c453;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c454); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_NullableToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 231,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c455) {
	        s2 = peg$c455;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c456); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_NullUnspecifiedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 232,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 17) === peg$c457) {
	        s2 = peg$c457;
	        peg$currPos += 17;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c458); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__AttributeToken__() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 233,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 13) === peg$c459) {
	        s2 = peg$c459;
	        peg$currPos += 13;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c460); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__DeprecatedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 234,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 12) === peg$c461) {
	        s2 = peg$c461;
	        peg$currPos += 12;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c462); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__UnusedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 235,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c463) {
	        s2 = peg$c463;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c464); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__BlockToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 236,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c465) {
	        s2 = peg$c465;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c466); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAutoToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 237,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c467) {
	        s2 = peg$c467;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c468); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseRegisterToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 238,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c469) {
	        s2 = peg$c469;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c470); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStaticToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 239,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c471) {
	        s2 = peg$c471;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c472); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseExternToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 240,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c473) {
	        s2 = peg$c473;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c474); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseConstToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 241,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c475) {
	        s2 = peg$c475;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c476); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseVolatileToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 242,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c477) {
	        s2 = peg$c477;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c478); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInlineToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 243,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c479) {
	        s2 = peg$c479;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c480); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseRestrictToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 244,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c481) {
	        s2 = peg$c481;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c482); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 245,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c483) {
	        s2 = peg$c483;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c484); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseOutToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 246,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c485) {
	        s2 = peg$c485;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c486); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInOutToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 247,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c487) {
	        s2 = peg$c487;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c488); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseByCopyToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 248,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c489) {
	        s2 = peg$c489;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c490); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseByRefToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 249,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c491) {
	        s2 = peg$c491;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c492); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseOneWayToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 250,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c493) {
	        s2 = peg$c493;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c494); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNonatomicToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 251,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c495) {
	        s2 = peg$c495;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c496); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseCopyToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 252,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c497) {
	        s2 = peg$c497;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c498); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseAssignToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 253,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c499) {
	        s2 = peg$c499;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c500); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseWeakToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 254,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c501) {
	        s2 = peg$c501;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c502); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStrongToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 255,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c503) {
	        s2 = peg$c503;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c504); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseRetainToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 256,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c505) {
	        s2 = peg$c505;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c506); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseReadonlyToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 257,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c507) {
	        s2 = peg$c507;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c508); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseReadwriteToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 258,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c509) {
	        s2 = peg$c509;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c510); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseGetterToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 259,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c511) {
	        s2 = peg$c511;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c512); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSetterToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 260,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c513) {
	        s2 = peg$c513;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c514); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNonnullToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 261,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c515) {
	        s2 = peg$c515;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c516); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNullableToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 262,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c517) {
	        s2 = peg$c517;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c518); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNullUnspecifiedToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 263,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 16) === peg$c519) {
	        s2 = peg$c519;
	        peg$currPos += 16;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c520); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNS_ASSUME_NONNULL_BEGIN() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 264,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 23) === peg$c521) {
	        s2 = peg$c521;
	        peg$currPos += 23;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c522); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNS_ASSUME_NONNULL_END() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 265,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 21) === peg$c523) {
	        s2 = peg$c523;
	        peg$currPos += 21;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c524); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_BoolToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 266,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c525) {
	        s2 = peg$c525;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c526); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_ComplexToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 267,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c527) {
	        s2 = peg$c527;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c528); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_ImaginaryToken() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 268,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c529) {
	        s2 = peg$c529;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c530); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = void 0;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        s0 = input.substring(s0, peg$currPos);
	      } else {
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseWhiteSpaces() {
	      var s0, s1, s2, s3, s4;

	      var key    = peg$currPos * 278 + 269,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      if (peg$c531.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c532); }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s3 = peg$c281;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c282); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parseLineTerminator();
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          if (peg$c531.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c532); }
	          }
	          if (s2 === peg$FAILED) {
	            s2 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	              s3 = peg$c281;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c282); }
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parseLineTerminator();
	              if (s4 !== peg$FAILED) {
	                s3 = [s3, s4];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	          }
	        }
	      } else {
	        s1 = peg$FAILED;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c137();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLineTerminator() {
	      var s0;

	      var key    = peg$currPos * 278 + 270,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c533.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c534); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMultiLineComment() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 271,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c535) {
	        s1 = peg$c535;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c536); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c537) {
	          s5 = peg$c537;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c538); }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c0); }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (input.substr(peg$currPos, 2) === peg$c537) {
	            s5 = peg$c537;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c538); }
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c0); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c537) {
	            s3 = peg$c537;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c538); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c137();
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMultiLineCommentNoLineTerminator() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 272,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c535) {
	        s1 = peg$c535;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c536); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c537) {
	          s5 = peg$c537;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c538); }
	        }
	        if (s5 === peg$FAILED) {
	          s5 = peg$parseLineTerminator();
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c0); }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          if (input.substr(peg$currPos, 2) === peg$c537) {
	            s5 = peg$c537;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c538); }
	          }
	          if (s5 === peg$FAILED) {
	            s5 = peg$parseLineTerminator();
	          }
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c0); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c537) {
	            s3 = peg$c537;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c538); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c137();
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseSingleLineComment() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 278 + 273,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c539) {
	        s1 = peg$c539;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c540); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        s5 = peg$parseLineTerminator();
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	          s4 = void 0;
	        } else {
	          peg$currPos = s4;
	          s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	          if (input.length > peg$currPos) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c0); }
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$FAILED;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          s5 = peg$parseLineTerminator();
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = void 0;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	          }
	          if (s4 !== peg$FAILED) {
	            if (input.length > peg$currPos) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c0); }
	            }
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c137();
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePreprocessorTokens() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 278 + 274,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c541) {
	        s1 = peg$c541;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c542); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        peg$silentFails++;
	        s3 = peg$parseIdPart();
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	          s2 = void 0;
	        } else {
	          peg$currPos = s2;
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 5) === peg$c543) {
	          s1 = peg$c543;
	          peg$currPos += 5;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c544); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$currPos;
	          peg$silentFails++;
	          s3 = peg$parseIdPart();
	          peg$silentFails--;
	          if (s3 === peg$FAILED) {
	            s2 = void 0;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	          }
	          if (s2 !== peg$FAILED) {
	            s1 = [s1, s2];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          if (input.substr(peg$currPos, 7) === peg$c545) {
	            s1 = peg$c545;
	            peg$currPos += 7;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c546); }
	          }
	          if (s1 !== peg$FAILED) {
	            s2 = peg$currPos;
	            peg$silentFails++;
	            s3 = peg$parseIdPart();
	            peg$silentFails--;
	            if (s3 === peg$FAILED) {
	              s2 = void 0;
	            } else {
	              peg$currPos = s2;
	              s2 = peg$FAILED;
	            }
	            if (s2 !== peg$FAILED) {
	              s1 = [s1, s2];
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.substr(peg$currPos, 5) === peg$c547) {
	              s1 = peg$c547;
	              peg$currPos += 5;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c548); }
	            }
	            if (s1 !== peg$FAILED) {
	              s2 = peg$currPos;
	              peg$silentFails++;
	              s3 = peg$parseIdPart();
	              peg$silentFails--;
	              if (s3 === peg$FAILED) {
	                s2 = void 0;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	              }
	              if (s2 !== peg$FAILED) {
	                s1 = [s1, s2];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              if (input.substr(peg$currPos, 4) === peg$c327) {
	                s1 = peg$c327;
	                peg$currPos += 4;
	              } else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c328); }
	              }
	              if (s1 !== peg$FAILED) {
	                s2 = peg$currPos;
	                peg$silentFails++;
	                s3 = peg$parseIdPart();
	                peg$silentFails--;
	                if (s3 === peg$FAILED) {
	                  s2 = void 0;
	                } else {
	                  peg$currPos = s2;
	                  s2 = peg$FAILED;
	                }
	                if (s2 !== peg$FAILED) {
	                  s1 = [s1, s2];
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.substr(peg$currPos, 4) === peg$c549) {
	                  s1 = peg$c549;
	                  peg$currPos += 4;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c550); }
	                }
	                if (s1 !== peg$FAILED) {
	                  s2 = peg$currPos;
	                  peg$silentFails++;
	                  s3 = peg$parseIdPart();
	                  peg$silentFails--;
	                  if (s3 === peg$FAILED) {
	                    s2 = void 0;
	                  } else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                  }
	                  if (s2 !== peg$FAILED) {
	                    s1 = [s1, s2];
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$FAILED;
	                }
	                if (s0 === peg$FAILED) {
	                  s0 = peg$currPos;
	                  if (input.substr(peg$currPos, 5) === peg$c551) {
	                    s1 = peg$c551;
	                    peg$currPos += 5;
	                  } else {
	                    s1 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c552); }
	                  }
	                  if (s1 !== peg$FAILED) {
	                    s2 = peg$currPos;
	                    peg$silentFails++;
	                    s3 = peg$parseIdPart();
	                    peg$silentFails--;
	                    if (s3 === peg$FAILED) {
	                      s2 = void 0;
	                    } else {
	                      peg$currPos = s2;
	                      s2 = peg$FAILED;
	                    }
	                    if (s2 !== peg$FAILED) {
	                      s1 = [s1, s2];
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                  }
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$currPos;
	                    if (input.substr(peg$currPos, 6) === peg$c553) {
	                      s1 = peg$c553;
	                      peg$currPos += 6;
	                    } else {
	                      s1 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c554); }
	                    }
	                    if (s1 !== peg$FAILED) {
	                      s2 = peg$currPos;
	                      peg$silentFails++;
	                      s3 = peg$parseIdPart();
	                      peg$silentFails--;
	                      if (s3 === peg$FAILED) {
	                        s2 = void 0;
	                      } else {
	                        peg$currPos = s2;
	                        s2 = peg$FAILED;
	                      }
	                      if (s2 !== peg$FAILED) {
	                        s1 = [s1, s2];
	                        s0 = s1;
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$FAILED;
	                    }
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$currPos;
	                      if (input.substr(peg$currPos, 5) === peg$c555) {
	                        s1 = peg$c555;
	                        peg$currPos += 5;
	                      } else {
	                        s1 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c556); }
	                      }
	                      if (s1 !== peg$FAILED) {
	                        s2 = peg$currPos;
	                        peg$silentFails++;
	                        s3 = peg$parseIdPart();
	                        peg$silentFails--;
	                        if (s3 === peg$FAILED) {
	                          s2 = void 0;
	                        } else {
	                          peg$currPos = s2;
	                          s2 = peg$FAILED;
	                        }
	                        if (s2 !== peg$FAILED) {
	                          s1 = [s1, s2];
	                          s0 = s1;
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                      } else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                      }
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$currPos;
	                        if (input.substr(peg$currPos, 4) === peg$c557) {
	                          s1 = peg$c557;
	                          peg$currPos += 4;
	                        } else {
	                          s1 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c558); }
	                        }
	                        if (s1 !== peg$FAILED) {
	                          s2 = peg$currPos;
	                          peg$silentFails++;
	                          s3 = peg$parseIdPart();
	                          peg$silentFails--;
	                          if (s3 === peg$FAILED) {
	                            s2 = void 0;
	                          } else {
	                            peg$currPos = s2;
	                            s2 = peg$FAILED;
	                          }
	                          if (s2 !== peg$FAILED) {
	                            s1 = [s1, s2];
	                            s0 = s1;
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                        } else {
	                          peg$currPos = s0;
	                          s0 = peg$FAILED;
	                        }
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$currPos;
	                          if (input.substr(peg$currPos, 6) === peg$c559) {
	                            s1 = peg$c559;
	                            peg$currPos += 6;
	                          } else {
	                            s1 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c560); }
	                          }
	                          if (s1 !== peg$FAILED) {
	                            s2 = peg$currPos;
	                            peg$silentFails++;
	                            s3 = peg$parseIdPart();
	                            peg$silentFails--;
	                            if (s3 === peg$FAILED) {
	                              s2 = void 0;
	                            } else {
	                              peg$currPos = s2;
	                              s2 = peg$FAILED;
	                            }
	                            if (s2 !== peg$FAILED) {
	                              s1 = [s1, s2];
	                              s0 = s1;
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                          } else {
	                            peg$currPos = s0;
	                            s0 = peg$FAILED;
	                          }
	                          if (s0 === peg$FAILED) {
	                            s0 = peg$currPos;
	                            if (input.substr(peg$currPos, 2) === peg$c325) {
	                              s1 = peg$c325;
	                              peg$currPos += 2;
	                            } else {
	                              s1 = peg$FAILED;
	                              if (peg$silentFails === 0) { peg$fail(peg$c326); }
	                            }
	                            if (s1 !== peg$FAILED) {
	                              s2 = peg$currPos;
	                              peg$silentFails++;
	                              s3 = peg$parseIdPart();
	                              peg$silentFails--;
	                              if (s3 === peg$FAILED) {
	                                s2 = void 0;
	                              } else {
	                                peg$currPos = s2;
	                                s2 = peg$FAILED;
	                              }
	                              if (s2 !== peg$FAILED) {
	                                s1 = [s1, s2];
	                                s0 = s1;
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            } else {
	                              peg$currPos = s0;
	                              s0 = peg$FAILED;
	                            }
	                            if (s0 === peg$FAILED) {
	                              s0 = peg$currPos;
	                              if (input.substr(peg$currPos, 3) === peg$c561) {
	                                s1 = peg$c561;
	                                peg$currPos += 3;
	                              } else {
	                                s1 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c562); }
	                              }
	                              if (s1 !== peg$FAILED) {
	                                s2 = peg$currPos;
	                                peg$silentFails++;
	                                s3 = peg$parseIdPart();
	                                peg$silentFails--;
	                                if (s3 === peg$FAILED) {
	                                  s2 = void 0;
	                                } else {
	                                  peg$currPos = s2;
	                                  s2 = peg$FAILED;
	                                }
	                                if (s2 !== peg$FAILED) {
	                                  s1 = [s1, s2];
	                                  s0 = s1;
	                                } else {
	                                  peg$currPos = s0;
	                                  s0 = peg$FAILED;
	                                }
	                              } else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                              }
	                            }
	                          }
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePreprocessorDirective() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      var key    = peg$currPos * 278 + 275,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 35) {
	        s1 = peg$c13;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c14); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsePreprocessorTokens();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = [];
	              s6 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 92) {
	                s7 = peg$c281;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c282); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$parseLineTerminator();
	                if (s8 !== peg$FAILED) {
	                  s7 = [s7, s8];
	                  s6 = s7;
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              } else {
	                peg$currPos = s6;
	                s6 = peg$FAILED;
	              }
	              if (s6 === peg$FAILED) {
	                s6 = peg$currPos;
	                s7 = peg$currPos;
	                peg$silentFails++;
	                s8 = peg$parseLineTerminator();
	                peg$silentFails--;
	                if (s8 === peg$FAILED) {
	                  s7 = void 0;
	                } else {
	                  peg$currPos = s7;
	                  s7 = peg$FAILED;
	                }
	                if (s7 !== peg$FAILED) {
	                  if (input.length > peg$currPos) {
	                    s8 = input.charAt(peg$currPos);
	                    peg$currPos++;
	                  } else {
	                    s8 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c0); }
	                  }
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	              }
	              while (s6 !== peg$FAILED) {
	                s5.push(s6);
	                s6 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 92) {
	                  s7 = peg$c281;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c282); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseLineTerminator();
	                  if (s8 !== peg$FAILED) {
	                    s7 = [s7, s8];
	                    s6 = s7;
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                } else {
	                  peg$currPos = s6;
	                  s6 = peg$FAILED;
	                }
	                if (s6 === peg$FAILED) {
	                  s6 = peg$currPos;
	                  s7 = peg$currPos;
	                  peg$silentFails++;
	                  s8 = peg$parseLineTerminator();
	                  peg$silentFails--;
	                  if (s8 === peg$FAILED) {
	                    s7 = void 0;
	                  } else {
	                    peg$currPos = s7;
	                    s7 = peg$FAILED;
	                  }
	                  if (s7 !== peg$FAILED) {
	                    if (input.length > peg$currPos) {
	                      s8 = input.charAt(peg$currPos);
	                      peg$currPos++;
	                    } else {
	                      s8 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c0); }
	                    }
	                    if (s8 !== peg$FAILED) {
	                      s7 = [s7, s8];
	                      s6 = s7;
	                    } else {
	                      peg$currPos = s6;
	                      s6 = peg$FAILED;
	                    }
	                  } else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                  }
	                }
	              }
	              if (s5 !== peg$FAILED) {
	                s1 = [s1, s2, s3, s4, s5];
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$FAILED;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$FAILED;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse__() {
	      var s0, s1, s2;

	      var key    = peg$currPos * 278 + 276,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpaces();
	      if (s2 === peg$FAILED) {
	        s2 = peg$parseLineTerminator();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseMultiLineComment();
	          if (s2 === peg$FAILED) {
	            s2 = peg$parseSingleLineComment();
	            if (s2 === peg$FAILED) {
	              s2 = peg$parsePreprocessorDirective();
	            }
	          }
	        }
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseWhiteSpaces();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseLineTerminator();
	          if (s2 === peg$FAILED) {
	            s2 = peg$parseMultiLineComment();
	            if (s2 === peg$FAILED) {
	              s2 = peg$parseSingleLineComment();
	              if (s2 === peg$FAILED) {
	                s2 = peg$parsePreprocessorDirective();
	              }
	            }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c137();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_() {
	      var s0, s1, s2;

	      var key    = peg$currPos * 278 + 277,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpaces();
	      if (s2 === peg$FAILED) {
	        s2 = peg$parseMultiLineCommentNoLineTerminator();
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseWhiteSpaces();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseMultiLineCommentNoLineTerminator();
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c137();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }


	      var util = __webpack_require__(2);

	      /**
	       If `isTypeName` function is defined well,  the semantic predicate `!IsDeclarator` 
	       can be removed from the grammer. Seel also the `DeclarationSpecifiers` and
	       `TypeIdentifier` rules.

	       C-style language can not be parsed with pure context-free grammers.
	       For example, if A is a defined type name, `A * B` is a declaration of B.
	       But if A is other identifier, A * B is considered as Multiplicative of A and B. 

	       To handle such context-sensitiveness, check whether if the name is a defined type or not
	       in `isTypeName` function.
	      */
	      function isTypeName(name) {
	      	return true;
	      }

	      function extractOptional(optional, index) {
	      	if(optional) {
	      		if(util.isNumber(index)) {  		
	      			return optional[index];
	      		} else if(util.isArray(index)) {
	      			var result = [],i;
	      			for(i=0;i<index.length;i++) {
	      				result.push(optional[index[i]]);
	      			}
	      			return result;
	      		} else {
	      			throw new Error("Illegal Argument");
	      		}
	      	} else {
	      		return null;
	      	}
	      }

	      function extractList(list, index, flat) {

	      	var flat = (flat===undefined?true:flat);    

	        var result = [], i, j;
	        if(Array.isArray(index)) {
	        	for(i=0;i<list.length;i++) {
	        		if(flat) {
	        			for(j=0;j<index.length;j++) {
	        				result.push(list[i][index[j]]);
	        			}    			
	        		} else {
	        			var items = [];
	        			for(j=0;j<index.length;j++) {
	        				items.push(list[i][index[j]]);
	        			}
	        			result.push(items);
	        		}
	        	}
	        } else {
	        	for(i=0;i<list.length;i++) {
	        		if(flat) {
	        			result.push(list[i][index]);
	        		} else {
	        			result.push([list[i][index]]);
	        		}
	        	}
	        }

	        return result;
	      }

	      function flattenList(list) {
	      	var result = [], i, obj;
	      	for(i=0;i<list.length;i++) {
	      		obj = list[i];
	      		if(Array.isArray(obj)) {
	      			result = result.concat(flattenList(obj));
	      		} else {
	      			result.push(obj);
	      		}
	      	}
	      	return result;
	      }

	      function buildList(head, tail, index, flat) {
	        return [head].concat(extractList(tail, index, flat));
	      }

	      function buildLeftAssocList(head, tail, index, factory) {
	      	var result = head;
	      	for(var i=0;i<tail.length;i++) {
	      		result = factory(result,tail[i][index]);
	      	}
	      	return result;
	      }



	    peg$result = peg$startRuleFunction();

	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	      return peg$result;
	    } else {
	      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	        peg$fail(peg$endExpectation());
	      }

	      throw peg$buildStructuredError(
	        peg$maxFailExpected,
	        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
	        peg$maxFailPos < input.length
	          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
	          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
	      );
	    }
	  }

	  return {
	    SyntaxError: peg$SyntaxError,
	    parse:       peg$parse
	  };
	})()

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = (function(){
		"use strict";

		var ASTUtil = __webpack_require__(10);
		var TypeInfo = __webpack_require__(11);
		var DeclInfo = __webpack_require__(12);

		var LexicalScope = function(name,parent){
			this.name = name;
			this.parent = parent;
			this.nameToDeclInfo = {};
			this.protocolNameToDeclInfo = {};
		};

		LexicalScope.prototype.findProtocolDeclInfo = function(name) {
			var result = this.protocolNameToDeclInfo[name];
			if(result) {
				return result;
			}
			if(this.parent) {
				return this.parent.findProtocolDeclInfo(name);
			}
			return null;
		};

		LexicalScope.prototype.findDeclInfo = function(name) {
			var result = this.nameToDeclInfo[name];
			if(result) {
				return result;
			}

			if(this.parent) {
				return this.parent.findDeclInfo(name);
			}
			return null;
		};

		LexicalScope.prototype.dump = function() {
			var map = {};
			for(var key in this.nameToDeclInfo) {
				map[key] = this.nameToDeclInfo[key].kind;
			};
			var result = {id:this.name,map:map};
			if(this.parent) {
				result.parent = this.parent.dump();
			}
			return result;
		};

		var _SPACER = '        ';
		var _makeIndentString = function(size) {
			if(_SPACER.length<size) {
				return _SPACER+_makeIndentString(size-_SPACER.length);            
			}    
			return _SPACER.slice(0,size);
		};

		var ClassDeclInfo = function(name){
			this.kind = DeclInfo.KIND_CLASS;
			this.type = new TypeInfo({kind:TypeInfo.KIND_CLASS,name:name});
			this.name = name;
			this.superClass = null;
			this.protocols = [];
			this.variables = [];
			this.variableMap = {};
			this.properties = [];
			this.propertyMap = {};
			this.synthesizedVariableMap = {};
			this.classMethods = [];
			this.classMethodMap = {};
			this.methods = [];
			this.methodMap = {};
		};

	    //
	    // 
	    //

		var TypeAnalyzer = function(options){
			this.scopeLevel = 0;
			this.currentClass = null;
			this.openScope("Global");
			this.defaultNullability = null;
			this.lastDeclInfos = [];
			this.options = options;
		};

		TypeAnalyzer.prototype.openScope = function(name) {
			this.currentScope = new LexicalScope(name,this.currentScope);		
			this.scopeLevel++;
			//console.log("Enter: " + _makeIndentString(this.scopeLevel) + name);
		};

		TypeAnalyzer.prototype.closeScope = function() {
			//console.log("Leave: " + _makeIndentString(this.scopeLevel) + this.currentScope.name);	
			this.scopeLevel--;
			this.currentScope = this.currentScope.parent;
		};

		TypeAnalyzer.prototype.addDeclInfo = function(name,info) {

			if(!name) {			
				console.log("Missing name info");
				console.dir(info);
				return;
			}

			if(info.type.kind == TypeInfo.KIND_PROTOCOL) {
				this.currentScope.protocolNameToDeclInfo[name] = info;
				if(this.currentScope.findDeclInfo(name)) {
					info.type.conflictWithClass = true;
				}
				this.lastDeclInfos.push(info);
				return;
			}

			if(info.type.kind == TypeInfo.KIND_CLASS) {
				var proto = this.currentScope.findProtocolDeclInfo(name);
				if(proto) {
					proto.type.conflictWithClass = true;
				}
				this.lastDeclInfos.push(info);
				this.currentScope.nameToDeclInfo[name] = info;
				return;
			}

			if(info.kind == DeclInfo.KIND_ENUM || info.kind == DeclInfo.KIND_ENUM_ITEM) {
				this.lastDeclInfos.push(info);
				this.currentScope.nameToDeclInfo[name] = info;
				return;
			}

			// Other declarations
			this.currentScope.nameToDeclInfo[name] = info;
			return;

		};

		TypeAnalyzer.prototype.getDeclInfo = function(name) {
			return this.currentScope.findDeclInfo(name) || this.currentScope.findProtocolDeclInfo(name);
		};

		TypeAnalyzer.prototype.getProtocolDeclInfo = function(name) {
			return this.currentScope.findProtocolDeclInfo(name);
		};

		TypeAnalyzer.prototype.Declaration = function(node) {
			var info;

			if(node.initDeclarators) {
				var i;
				for(i=0;i<node.initDeclarators.length;i++) {

					var declarator = node.initDeclarators[i].declarator;
					info = DeclInfo.createObjectFromSpecDecl(node.specifiers,declarator);
					if(info.type.name == "__typeof(self)" || info.type.name == "typeof(self)") {
						var self = this.getDeclInfo("self");
						if(self) {
							info.type.name = self.type.name;
						}
					}
					declarator._declInfo = info;
					this.addDeclInfo(info.name,info);

					this.walk(node.initDeclarators[i].initializer);

				}
				
			} else {

				info  = DeclInfo.createObjectFromSpecDecl(node.specifiers,null);
				if(info.kind == DeclInfo.KIND_ENUM) {
					this.addDeclInfo(info.name,info);
					for(var i=0;i<info.enumerators.length;i++) {
						var item = info.enumerators[i];
						this.addDeclInfo(item.name,item);
					}
				}
				node._declInfo = info;

			}
		};

		var _unwrapNesting = function(node) {
			if(node.type == "NestedExpression") {
				return _unwrapNesting(node.expression)
			}
			return node;
		};

		var _revealAssignmentTarget = function(node) {
			if(node.type == "NestedExpression") {
				return _revealAssignmentTarget(node.expression);
			} else if(node.type == "PostfixDotExpression") {
				return _revealAssignmentTarget(node.context);
			} else {
				return node;
			}
		};

		TypeAnalyzer.prototype.AssignmentExpression = function(node) {
			this.walk(node.lhs);
			this.walk(node.rhs);

			var expr = _unwrapNesting(node.lhs);
			if(expr.type == "PrimaryIdentifier") {
				if(expr._declInfo) {
					expr._declInfo.isAssigned = true;
				}
			} else {
				expr = _revealAssignmentTarget(node.lhs);
				if(expr.type == "PrimaryIdentifier") {
					if(expr._declInfo) {
						if(TypeInfo.isStructType(expr._declInfo.type)) {
							expr._declInfo.isAssigned = true;
						}
					}
				}
			}

			if(node.lhs._typeInfo) {
				node._typeInfo = node.lhs._typeInfo;
			} else if(node.rhs._typeInfo) {
				node._typeInfo = node.rhs._typeInfo;			
			}
		};

		TypeAnalyzer.prototype.Expression = function(node) {
			this.walk(node.children);
			var type = node.children[node.children.length-1]._typeInfo;
			if(type) {
				node._typeInfo = type;
			}
		};

		TypeAnalyzer.prototype.LogicalOrExpression = 
		TypeAnalyzer.prototype.LogicalAndExpression = 
		TypeAnalyzer.prototype.EqualityExpression =
		TypeAnalyzer.prototype.RelationalExpression = function(node) {
			this.walk(node.children);
			node._typeInfo = TypeInfo.Bool;
		};

		TypeAnalyzer.prototype.InclusiveOrExpression = 
		TypeAnalyzer.prototype.ExclusiveOrExpression = 
		TypeAnalyzer.prototype.AndExpression = 
		TypeAnalyzer.prototype.ShiftExpression = function(node) {
			this.walk(node.children);
			var type = node.children[0]._typeInfo;
			if(type) {
				node._typeInfo = (type==TypeInfo.Bool?TypeInfo.Int:type);
			}
		};

		TypeAnalyzer.prototype.MultiplicativeExpression = function(node) {
			this.walk(node.lhs);
			this.walk(node.rhs);
			if(node.operator == "/") {
				node._typeInfo = TypeInfo.Double;
			} else {
				node._typeInfo = TypeInfo.Int;
			}
		};

		TypeAnalyzer.prototype.AdditiveExpression = function(node) {
			this.walk(node.children);
			var type = node.children[0]._typeInfo;
			if(type) { 			
				node._typeInfo = type;
			}
		};

		TypeAnalyzer.prototype.UnaryIncExpression =
		TypeAnalyzer.prototype.UnaryDecExpression =
		TypeAnalyzer.prototype.ConditionalExpression = function(node) {
			this.walk(node.children);
			var type = node.children[node.children.length-1]._typeInfo;
			if(type) {
				node._typeInfo = type;
			}
		};

		TypeAnalyzer.prototype.NotExpression = function(node) {
			this.walk(node.child);
			node._typeInfo = TypeInfo.Bool;
		};

		TypeAnalyzer.prototype.PostfixApplyExpression = function(node) {
			var context = _unwrapNesting(node.context);
			this.walk(context);
			this.walk(node.parameters);
		};

		TypeAnalyzer.prototype.findDeclInfoFromProtocolName = function(protocol, targets, name) {

			var protoInfo = this.getProtocolDeclInfo(protocol);

			if(!protoInfo) return null;

			var i=0, ret;
			for(i=0;i<targets.length;i++) {
				var target = targets[i];
				var map = protoInfo[target];
				if(map) {
					ret = map[name];
					if(ret) {
						return ret;
					}
				}
			}

			if(protoInfo.protocols) {
				for(i=0;i<protoInfo.protocols.length;i++) {
					ret = this.findDeclInfoFromProtocolName(protoInfo.protocols[i],targets,name);
					if(ret) {
						return ret;
					}
				}
			}

			return null;

		};

		TypeAnalyzer.prototype.findDeclInfoFromClassProtocol = function(classInfo, targets, name) {
			if(!classInfo) return null;

			if(classInfo.protocols) {
				for(var i=0;i<classInfo.protocols.length;i++) {
					var ret = this.findDeclInfoFromProtocolName(classInfo.protocols[i],targets,name);
					if(ret) {
						return ret;
					}
				}
			}

			return this.findDeclInfoFromClassProtocol(this.getDeclInfo(classInfo.superClass), targets, name);
		};

		TypeAnalyzer.prototype.findDeclInfoFromClass = function(classInfo, targets, name) {

			if( !classInfo ) return null;

			var i;
			for(i=0;i<targets.length;i++) {
				var target = targets[i];
				var map = classInfo[target];
				if(map) {
					var ret = map[name];
					if(ret) {
						return ret;
					}
				}
			}

			return this.findDeclInfoFromClass(this.getDeclInfo(classInfo.superClass), targets, name);
		};

		TypeAnalyzer.prototype.findMethodDeclInfo = function(className, name) {
			var classInfo = this.getDeclInfo(className);
			if(!classInfo) return null;
			return this.findDeclInfoFromClass(classInfo, ["classMethodMap","methodMap"], name) ||
				this.findDeclInfoFromClassProtocol(classInfo, ["methodMap"], name);
		};

		TypeAnalyzer.prototype.findVariableDeclInfo = function(className, name) {
			var classInfo = this.getDeclInfo(className);
			if(!classInfo) return null;
			return this.findDeclInfoFromClass(classInfo, ["propertyMap","variableMap","synthesizedVariableMap"], name) ||
				this.findDeclInfoFromClassProtocol(classInfo, ["propertyMap"], name);
		};

		TypeAnalyzer.prototype.analyzeTypeChain = function(node, context, selectorName) {

			var contextInfo = context._typeInfo;

			if(!contextInfo) return;

			if(contextInfo.kind == TypeInfo.KIND_CLASS && selectorName == "superclass") {
				node._isProperty = true;
				node._typeInfo = TypeInfo.toNullable(TypeInfo.Class);
				return;
			}

			var info;
			if(info = this.findVariableDeclInfo(contextInfo.name, selectorName)) {
				node._isProperty = true;
				if(contextInfo.nullability == "nullable" && !this.options.forceUnwrap) {
					node._typeInfo = TypeInfo.toNullable(info.type);
				} else {
					node._typeInfo = info.type;
				}
			} else if(info = this.findMethodDeclInfo(contextInfo.name, selectorName)) {
				node._isProperty = false;
				if(contextInfo.nullability == "nullable" && !this.options.forceUnwrap) {
					node._typeInfo = TypeInfo.toNullable(info.returnType);
				} else {
					node._typeInfo = info.returnType;
				}
			}

		};

		TypeAnalyzer.prototype.PostfixDotExpression = function(node) {
			var context = _unwrapNesting(node.context);
			this.walk(context);
			this.analyzeTypeChain(node, context, node.identifier);
		};

		TypeAnalyzer.prototype.MessageExpression = function(node) {
			var context = _unwrapNesting(node.receiver);
			this.walk(context);
			this.walk(node.selector);
			this.analyzeTypeChain(node, context, node.selector.name);
		};

		TypeAnalyzer.prototype.AvailableExpression = function(node) {
			node._typeInfo = TypeInfo.Bool;
		};

		TypeAnalyzer.prototype.Constant = function(node) {
			if(node.child.type == "FloatingPointLiteral") {
				node._typeInfo = TypeInfo.Double;
			} else if(node.child.type == "CharacterLiteral") {
				node._typeInfo = TypeInfo.Char;
			} else if(node.child.type == "BooleanLiteral") {
				node._typeInfo = TypeInfo.Bool;
			} else if(node.child.type == "StringLiteral") {
				if(0<=node.child.token.indexOf('@')) {
					node._typeInfo = TypeInfo.NSString;
				} else {
					node._typeInfo = TypeInfo.CString;
				}
			} else {
				var token = node.child.token.toLowerCase();			
				if(0<=token.indexOf('u')) {
					node._typeInfo = TypeInfo.Uint;
				} else {
					node._typeInfo = TypeInfo.Int;
				}
			}
		};

		TypeAnalyzer.prototype.debugOut = function(obj) {
			console.dir(obj,{depth:null});
		};

		TypeAnalyzer.prototype.FunctionDefinition = function(node) {
			var info = DeclInfo.createObjectFromFunctionDefinition(node);
			node._declInfo = info;
			this.openScope(node.name);
			for(var i=0;i<info.parameters.length;i++) {
				var param = info.parameters[i];
				this.addDeclInfo(param.name, param);
			}
			this.walk(node.statement);
			this.closeScope();
		};

		TypeAnalyzer.prototype.TypeVariableDeclarator = function(node) {
			node._declInfo = DeclInfo.createObjectFromSpecDecl(node.specifiers,node.declarator);
		};

		TypeAnalyzer.prototype.ForStatement = function(node) {

			this.openScope("ForStatement");
			this.walk(node.initDeclarators);

			if(node.initSpecifiers && node.initDeclarators) {
				for(var i=0;i<node.initDeclarators.length;i++) {
					var info = DeclInfo.createObjectFromSpecDecl(node.initSpecifiers, node.initDeclarators[i].declarator);
					node.initDeclarators[i]._declInfo = info;
					this.addDeclInfo(info.name,info);
					this.walk(node.initDeclarators[i].initializer);
				}
			}

			this.walk(node.initExpression);
			this.walk(node.condExpression);
			this.walk(node.loopExpression);
			this.walk(node.statement);
			this.closeScope();
		};

		TypeAnalyzer.prototype.ForInStatement = function(node) {
			this.walk(node.declarator);
			this.openScope("ForInStatement");
			var info = node.declarator._declInfo;
			this.addDeclInfo(info.name, info);
			this.walk(node.expression);
			this.walk(node.statement);
			this.closeScope();
		};

		TypeAnalyzer.prototype.CompoundStatement = function(node) {
			this.openScope("CompoundStatement");
			this.walk(node.blockItems);
			this.closeScope();
		};

		TypeAnalyzer.prototype.getOrCreateClassDeclInfo = function(name) {
			var info = this.getDeclInfo(name);
			if(!info || info.kind != DeclInfo.KIND_CLASS) {
				info = new ClassDeclInfo(name);
				this.addDeclInfo(name,info);
			}
			return info;
		};

		TypeAnalyzer.prototype.analyzeClassInterface = function(classInfo,node) {

			classInfo.name = node.classSpecifier.name;
			classInfo.type.name = classInfo.name;

			if(node.type == "CategoryInterface") {	
				classInfo.categoryName = node.categoryName;
			} else {
				if(node.superClass) {
					classInfo.superClass = node.superClass;
				}
			}

			if (node.protocols) {
				for(var i=0;i<node.protocols.length;i++) {
					classInfo.protocols.push(node.protocols[i]);
				}
			}

			if(node.variables) {
				var declarations = node.variables.declarations;			
				var i,j;
				for(i=0;i<declarations.length;i++) {
					var declaration = declarations[i];
					for(j=0;j<declaration.declarators.length;j++) {
						var declarator = declaration.declarators[j];
						var info = DeclInfo.createObjectFromSpecDecl(declaration.specifiers,declarator);
						if(info.type.pointer) {
							info.type.nullability = info.type.nullability||TypeInfo.defaultNullability;
						}
						if(node.type == "CategoryInterface") {
							info.categoryName = node.categoryName;
						}
						classInfo.variables.push(info);
						classInfo.variableMap[info.name] = info;
					}
				}
			}

			var isAnonymousCategory = (node.categoryName == '');

			if(node.declarations) {
				for(var i=0;i<node.declarations.length;i++) {
					var d = node.declarations[i];
					if(d.type == "PropertyDeclaration") {
						var props = DeclInfo.createObjectsFromPropertyDeclaration(d);
						for(var j=0;j<props.length;j++) {
							var prop = props[j];
							prop.isPublic = !isAnonymousCategory;
							if(node.type == "CategoryInterface") {
								prop.categoryName = node.categoryName;
							}
							if(prop.type.pointer) {
								prop.type.nullability = prop.type.nullability||TypeInfo.defaultNullability;
							}
							if(!classInfo.propertyMap[prop.name]) {
								classInfo.properties.push(prop);
								classInfo.propertyMap[prop.name] = prop;
							}
						}
					} else if(d.type=="ClassMethodDeclaration") {
						if(!classInfo.classMethodMap[d.selector.name]) {
							var method = DeclInfo.createObjectFromMethodDeclaration(d);
							method.isPublic = !isAnonymousCategory;
							if(node.type == "CategoryInterface") {
								method.categoryName = node.categoryName;
							}
							classInfo.classMethods.push(method);
							classInfo.classMethodMap[method.name] = method;
							d._declInfo = method;
						}
					} else if(d.type=="InstanceMethodDeclaration") {
						if(!classInfo.methodMap[d.selector.name]) {
							var method = DeclInfo.createObjectFromMethodDeclaration(d);
							method.isPublic = !isAnonymousCategory;
							if(node.type == "CategoryInterface") {
								method.categoryName = node.categoryName;
							}
							classInfo.methods.push(method);
							classInfo.methodMap[method.name] = method;
							d._declInfo = method;
						}
					}
				}
			}

		};

		var _adjustMethodParameterType = function(methodInfo, interfaceInfo) {
			if(methodInfo.name != interfaceInfo.name) {
				// assert(false)
				return;
			}

			methodInfo.returnType = interfaceInfo.returnType;

			if(methodInfo.parameters && interfaceInfo.parameters) {
				for(var i=0;i<interfaceInfo.parameters.length;i++) {
					methodInfo.parameters[i].type = interfaceInfo.parameters[i].type;
				}
			}
		};

		TypeAnalyzer.prototype.analyzeClassImplementation = function(classInfo, node) {

			classInfo.name = node.classSpecifier.name;
			classInfo.type.name = classInfo.name;
			
			if(node.type == "CategoryImplementation") {
				classInfo.categoryName = node.categoryName;
			} else {
				if(node.superClass) {
					classInfo.superClass = node.superClass;
				}
			}

			if(node.variables) {
				var declarations = node.variables.declarations;			
				var i,j;
				for(i=0;i<declarations.length;i++) {
					var declaration = declarations[i];
					for(j=0;j<declaration.declarators.length;j++) {
						var declarator = declaration.declarators[j];
						var info = DeclInfo.createObjectFromSpecDecl(declaration.specifiers,declarator);
						if(info.type.pointer) {
							info.type.nullability = info.type.nullability||TypeInfo.defaultNullability;
						}
						if(node.type == "CategoryImplementation") {
							info.categoryName = node.categoryName;
						}
						classInfo.variables.push(info);
						classInfo.variableMap[info.name] = info;
					}
				}
			}

			if(node.definitions) {
				for(var i=0;i<node.definitions.length;i++) {
					var d = node.definitions[i];
					var methodInfo;
					if(d.type == "ClassMethodDefinition") {
						methodInfo = classInfo.classMethodMap[d.selector.name];
						if(!methodInfo) {
							methodInfo = DeclInfo.createObjectFromMethodDeclaration(d);
							classInfo.classMethods.push(methodInfo);
							classInfo.classMethodMap[methodInfo.name] = methodInfo;
							if(node.type == "CategoryImplementation") {
								methodInfo.categoryName = node.categoryName;
							}
						}
						methodInfo.ast = d;
						d._declInfo = methodInfo;

					} else if(d.type == "InstanceMethodDefinition") {
						methodInfo = classInfo.methodMap[d.selector.name];

						if(!methodInfo) {
							methodInfo = DeclInfo.createObjectFromMethodDeclaration(d);
							classInfo.methods.push(methodInfo);
							classInfo.methodMap[methodInfo.name] = methodInfo;
							if(node.type == "CategoryImplementation") {
								methodInfo.categoryName = node.categoryName;
							}
						}

						var interfaceInfo = this.findDeclInfoFromClass(this.getDeclInfo(classInfo.superClass), ["methodMap"], methodInfo.name)||
							this.findDeclInfoFromClassProtocol(this.getDeclInfo(classInfo.superClass), ["methodMap"], methodInfo.name);
						if(interfaceInfo) {
							methodInfo.isOverride = true;
							_adjustMethodParameterType(methodInfo, interfaceInfo);
						}

						methodInfo.ast = d;
						d._declInfo = methodInfo;

					} else if(d.type == "PropertyImplementation") {
						var propInfo;
						for(var j=0;j<d.properties.length;j++) {
							var p = d.properties[j];
							propInfo = classInfo.propertyMap[p.name]; // TODO Support property defined in Protocol
							if(propInfo && p.syntheName) {
								propInfo.syntheName = p.syntheName;
							}
						}
						d._declInfo = propInfo;
					} else {
						this.walk(d);
					}
				}
			}

			for(var i=0;i<classInfo.properties.length;i++) {
				var propInfo = classInfo.properties[i];
				var syntheName = propInfo.syntheName || "_" + propInfo.name;
				classInfo.synthesizedVariableMap[syntheName] = {
					kind:"decl:variable", 
					name:propInfo.syntheName, 
					type:propInfo.type, 
					categoryName:propInfo.categoryName,
					isReferred:propInfo.syntheName!=null,
				};
			};

		};


		TypeAnalyzer.prototype.ClassInterface = function(node) {
			var classInfo = this.getOrCreateClassDeclInfo(node.classSpecifier.name);
			this.analyzeClassInterface(classInfo,node);
			node._declInfo = classInfo;
		};

		TypeAnalyzer.prototype.CategoryInterface = function(node) {
			var classInfo = this.getOrCreateClassDeclInfo(node.classSpecifier.name);
			this.analyzeClassInterface(classInfo,node);
			node._declInfo = classInfo;
		};

		TypeAnalyzer.prototype.analyzeProtocolDeclaration = function(node) {

			var result = new DeclInfo(DeclInfo.KIND_PROTOCOL);
			result.name = node.name;
			result.type = new TypeInfo({kind:TypeInfo.KIND_PROTOCOL,name:result.name});

			if (node.protocols) {
				result.protocols = node.protocols;
			}

			result.classMethods = [];
			result.classMethodMap = {};
			result.methods = [];
			result.methodMap = {};
			result.properties = [];
			result.propertyMap = {};

			var isOptional = false, obj;
			if(node.declarations) {
				node.declarations.forEach(function(d) {
					if(d.type == "PropertyDeclaration") {
						var objs = DeclInfo.createObjectsFromPropertyDeclaration(d);
						objs.forEach(function(obj){
							obj.isOptional = isOptional;
							obj.isPublic = true;
							result.properties.push(obj);
							result.propertyMap[obj.name] = obj;
						});
						d._declInfos = objs;
					} else if(d.type == "ClassMethodDeclaration") {
						obj = DeclInfo.createObjectFromMethodDeclaration(d);
						obj.isOptional = isOptional;
						result.classMethods.push(obj);
						result.classMethodMap[obj.name] = obj;
						d._declInfo = obj;
					} else if(d.type == "InstanceMethodDeclaration") {
						obj = DeclInfo.createObjectFromMethodDeclaration(d);
						obj.isOptional = isOptional;
						result.methods.push(obj);
						result.methodMap[obj.name] = obj;
						d._declInfo = obj;
					} else if(d == "@required") {
						isOptional = false;
					} else if(d == "@optional") {
						isOptional = true;
					}
				});
			}
			return result;
		};

		TypeAnalyzer.prototype.ProtocolDeclaration = function(node) {
			var decl = this.analyzeProtocolDeclaration(node);
			this.addDeclInfo(decl.name, decl);
		};

		TypeAnalyzer.prototype.analyzeMethodDefinition = function(node,info) {
			this.openScope(info.name);
			for(var i=0;i<info.parameters.length;i++) {
				var param = info.parameters[i];
				this.addDeclInfo(param.name, param);
			}
			this.walk(node.statement);
			this.closeScope();
		};

		TypeAnalyzer.prototype.CategoryImplementation = function(node) {
			this.ClassImplementation(node);
		};

		TypeAnalyzer.prototype.ClassImplementation = function(node) {
			var classInfo = this.getOrCreateClassDeclInfo(node.classSpecifier.name);

			this.analyzeClassImplementation(classInfo,node);

			node._declInfo = classInfo;

			this.openScope(classInfo.name);

			var i, d, sel, info;

			if(node.definitions) {

				for(i=0;i<node.definitions.length;i++) {
					d = node.definitions[i];
					if(d.type == "ClassMethodDefinition") {
						info = classInfo.classMethodMap[d.selector.name];
						this.analyzeMethodDefinition(d, info);
					}
				}

				this.openScope(classInfo.name + "#instance");
				this.addDeclInfo("self", classInfo);

				for(i=0;i<node.definitions.length;i++) {
					d = node.definitions[i];
					if(d.type == "InstanceMethodDefinition") {
						info = classInfo.methodMap[d.selector.name];
						this.analyzeMethodDefinition(d,info);
					}
				}
				this.closeScope();

			}

			this.closeScope();
		};

		TypeAnalyzer.prototype.PrimaryIdentifier = function(node) {

			var info = this.getDeclInfo(node.name);
			if(info) {
				node._declInfo = info;			 
				node._typeInfo = info.type;
				return;
			}		

			var classInfo = this.getDeclInfo("self");

			if(classInfo) {
				info = this.findVariableDeclInfo(classInfo.name,node.name);
				if(info) {
					info.isReferred = true;
					node._declInfo = info;
					node._typeInfo = info.type;
				}
			}

		};

		TypeAnalyzer.prototype.NSAssumeNonnullBegin = function(node) {
			TypeInfo.defaultNullability = "nonnull";
		};

		TypeAnalyzer.prototype.NSAssumeNonnullEnd = function(node) {
			TypeInfo.defaultNullability = null;
		};

		TypeAnalyzer.prototype.walkChildren = function(node) {
			if(node.children) {
				for(var i=0;i<node.children.length;i++) {
					this.walk(node.children[i]);
				}
				return;
			}
			if(node.child) {
				this.walk(node.child);
				return;
			}
			for(var key in node) {
				this.walk(node[key]);
			}
		};

		TypeAnalyzer.prototype.walk = function(node) {

			if(!node) return;

			if(typeof(node) == "string") return;

			var i;
			if(Array.isArray(node)) {
				for(i=0;i<node.length;i++) {
					this.walk(node[i]);
				}
				return;
			}

			if(node.type) {
				var handler = this[node.type];
				if(handler) { 
					handler.call(this,node);
					return;
				}
			}

			this.walkChildren(node);
		};

		TypeAnalyzer.mergeClassDeclInfo = function(a,b) {

			var i,e;

			for(i=0;i<b.variables.length;i++) {
				e = b.variables[i];
				if(!a.variableMap[e.name]) {
					a.variables.push(e);
					a.variableMap[e.name] = e;
				}
			}

			for(i=0;i<b.protocols.length;i++) {
				e = b.protocols[i];
				if(a.protocols.indexOf(e)<0) {
					a.protocols.push(e);
				}
			}

			for(i=0;i<b.properties.length;i++) {
				e = b.properties[i];
				if(!a.propertyMap[e.name]) {
					a.properties.push(e)
					a.propertyMap[e.name] = e;
				}
			}

			for(i=0;i<b.classMethods.length;i++) {
				e = b.classMethods[i];
				if(!a.classMethodMap[e.name]) {
					a.classMethods.push(e)
					a.classMethodMap[e.name] = e;
				}
			}

			for(i=0;i<b.methods.length;i++) {
				e = b.methods[i];
				if(!a.methodMap[e.name]) {
					a.methods.push(e)
					a.methodMap[e.name] = e;
				}
			}
		};

		TypeAnalyzer.prototype.analyze = function(ast) {
			this.lastDeclInfos = [];
			TypeInfo.defaultNullability = null;
			this.walk(ast);
			return this.lastDeclInfos;
		};

		TypeAnalyzer.prototype.findDeclInfoByQuery = function(query) {

			var values = query.split('.');
			var info = this.getDeclInfo(values[0]);

			while(info && (info.kind == DeclInfo.KIND_CLASS || info.kind == DeclInfo.KIND_PROTOCOL) && 1<values.length) {
				var prop = values.pop();
				info = this.findDeclInfoFromClass(info, ["classMethodMap","propertyMap","methodMap","variableMap","synthesizedVariableMap"], prop) ||
					this.findDeclInfoFromClassProtocol(inf, ["propertyMap","methodMap"]);
			}

			return info;
		}

		return TypeAnalyzer;
	})();	

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	module.exports = (function(){
		"use strict";
		
		var ASTUtil = function() {};

		var _findNodesByType = function(node,type) {

			var types = (typeof(type) == "string")?type.split(' '):type;

			if(typeof(node) != "object") {
				return [];
			}

			var key,i,buf = [];

			if(Array.isArray(node)) {
				for(i=0;i<node.length;i++) {
					if(node[i]) {
						if(0<=types.indexOf(node[i].type)) {
							buf.push(node[i]);
						} else {
							buf = buf.concat(_findNodesByType(node[i],types));
						}
					}
				}
			} else {
				for(key in node) {
					if(node[key]) {
						if(0<=types.indexOf(node[key].type)) {
							buf.push(node[key]);
						} else {
							buf = buf.concat(_findNodesByType(node[key],types));
						}
					}
				}
			}

			return buf;

		};
		ASTUtil.findNodesByType = _findNodesByType;

		ASTUtil.debugOut = function(obj) {
			console.log(JSON.stringify(obj,function(k,v){
				if(k=="_typeInfo") {
					return v?v.name:"(error)";
				}
				return v;
			},'  '));
		};

		return ASTUtil;
	})();



/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = (function(){

		var util = __webpack_require__(2);

		var _copy = function(src, dst, deep) {
			for(var key in src) {
				dst[key] = deep?_cloneIfArrayOrHash(src[key]):src[key];
			}
		};

		/**
		 * DeclInfo is intended to be (de)serializable as pure JSON.
		 * JS prototype chain is not used to define the DeclInfo and its derived classes.
	  	 *
	  	 * Thus do not use `obj instanceof TypeInfo`. Use `obj.kind == TypeInfo.KIND_XXXX` instead.
		 */
		var TypeInfo = function(obj) {
			if(!obj) {
				this.kind = TypeInfo.KIND_BASIC;
				this.name = null;
			} else {
				_copy(obj,this);
			}
		};

		TypeInfo.isStructType = function(info) {
			if(info) {
				return info.kind == TypeInfo.KIND_STRUCT ||
				info.name == "CGRect" || info.name == "CGSize" || info.name == "CGPoint";
			} 
			return false;
		};

		TypeInfo.defaultNullability = null;

		TypeInfo.KIND_BASIC = "type:basic";
		TypeInfo.KIND_CLASS = "type:class";
		TypeInfo.KIND_PROTOCOL = "type:protocol";
		TypeInfo.KIND_ENUM = "type:enum";
		TypeInfo.KIND_STRUCT = "type:struct";
		TypeInfo.KIND_BLOCK = "type:block";
		TypeInfo.KIND_FUNC = "type:func";
		TypeInfo.KIND_ARRAY = "type:array";
		TypeInfo.KIND_DICTIONARY = "type:dicrionary";
		TypeInfo.KIND_SELECTOR = "type:selector";

		/** 
		 * These constants can be used only in analysis process of TypeAnalyzer.
		 */
		TypeInfo.Bool = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"_Bool"});
		TypeInfo.Char = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"char"});
		TypeInfo.Int = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"int"});
		TypeInfo.Uint = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"unsigned int"});
		TypeInfo.Double = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"double"});
		TypeInfo.CString = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"char",pointer:{}});
		TypeInfo.NSString = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"NSString",pointer:{}});
		TypeInfo.Class = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"Class",pointer:{}});
		TypeInfo.Void = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"void"});
		TypeInfo.Id = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"id",pointer:{}});

		TypeInfo.getTypeClass = function(name) {
			if(name == "bool" || name == "_Bool" || name == "BOOL") return "bool";
			if(name == "NSInteger" || name == "NSUInteger") return "int";
			if(name == "float" || name == "CGFloat" || name == "double") return "float";
			if(/(^| )(int|short|char|long)( |$)/.test(name)) return "int";
			return "unknown";
		};

		TypeInfo.isBooleanType = function(info) {
			return(info && TypeInfo.getTypeClass(info.name) == "bool");
		};

		TypeInfo.isIntegerType = function(info) {
			return (info && TypeInfo.getTypeClass(info.name) == "int");
		};

		var _anonymousTypeCounter = 0;

		var _clone = function(obj,deep) {
			var result = new (obj.constructor)();
			_copy(obj,result,deep);
			return result;
		};

		var _cloneIfArrayOrHash = function(obj) {
			if(Array.isArray(obj)) {
				return obj.slice(0);
			} else if(typeof(obj) == "object") {
				var result = {};
				for(var key in obj) {
					result[key] = obj[key];
				}
				return result;
			} else {
				return obj;
			}
		};

		var _toNonnull = function(typeInfo) {
			var result = _clone(typeInfo);
			result.nullability = "nonnull";
			return result;
		};

		var _toNullable = function(typeInfo) {
			var result = _clone(typeInfo);
			result.nullability = "nullable";
			return result;
		};

		var _toProtocol = function(typeInfo, protocolSpec) {
			var result = _clone(typeInfo);
			result.kind = TypeInfo.KIND_PROTOCOL;
			result.protocols = protocolSpec.protocols.slice(0);
			return result;
		};

		var _toEnum = function(typeInfo,enumSpec) {
			var result = _clone(typeInfo);
			result.kind = TypeInfo.KIND_ENUM;
			result.name = "enum " + enumSpec.tagName;
			result.tagName = enumSpec.tagName;
			if(enumSpec.baseTypeSpecifiers) {
				result.baseType = _createObjectFromSpec(enumSpec.baseTypeSpecifiers);
			}
			return result;
		};

		var _toStruct = function(typeInfo,structSpec) {
			var result = new _clone(typeInfo);
			result.kind = TypeInfo.KIND_STRUCT;
			result.tagName = structSpec.tagName;
			return result;
		};

		var _toBlock = function(typeInfo,blockSpec) {
			var result = _createObjectFromBlockTypeSpecifier(blockSpec);
			if(typeInfo.specifiers) {
				result.specifiers = typeInfo.specifiers;
			}
			if(typeInfo.nullability) {
				result.nullability = typeInfo.nullability;
			}
			if(typeInfo.isTypedef) {
				result.isTypedef = typeInfo.isTypedef;
			}
			result.returnType.name = typeInfo.name||"void";
			return result;
		};

		var _toFunc = function(typeInfo,suffix) {

			var parameters = [];

			if(suffix.parameters) {
				for(var i=0;i<suffix.parameters.length;i++) {
					var param = suffix.parameters[i];
					if(param.type == "ParameterDeclaration") {
						var info = _createObjectFromSpecDecl(param.specifiers,param.declarator);
						parameters.push(info);
					}
				}
			}

			return new TypeInfo({
				kind:TypeInfo.KIND_FUNC,
				parameters:parameters,
				returnType:typeInfo,
			});
		};

		var _toArray = function(typeInfo,suffix) {
			return new TypeInfo({
				kind:TypeInfo.KIND_ARRAY,
				sizeExpression:null,
				elementType:typeInfo,
			});
		};

		TypeInfo.toNonnull = _toNonnull;
		TypeInfo.toNullable = _toNullable;
		TypeInfo.toBlockType = _toBlock;
		TypeInfo.toFuncType = _toFunc;
		TypeInfo.toArrayType = _toArray;

		var _createObjectFromBlockTypeSpecifier = function(bs) {
			var parameters = [];
			if(bs.parameters) {
				for(var i=0;i<bs.parameters.length;i++) {
					var p = bs.parameters[i];
					var info;
					if(p.type == "TypeName") {
						info = _createObjectFromTypeName(p);
						parameters.push(info);
					} else {
						var DeclInfo = __webpack_require__(12);
						info = DeclInfo.createObjectFromSpecDecl(p.specifiers,p.declarator);
						parameters.push(info.type);
					}
				}
			}

			var result = new TypeInfo({
				kind:TypeInfo.KIND_BLOCK,
				returnType: _createObjectFromSpec(bs.specifiers),
				parameters:parameters,
			});

			if(bs.name) {
				result.declName = bs.name;
			}

			return result;
		};

		var _applyDeclarator = function(typeInfo,declarator) {

			if(!declarator) return typeInfo;

			var result = _clone(typeInfo);

			if(declarator.name) {
				result.declName = declarator.name;
			}

			if(declarator.pointer) {			
				result.pointer = {}; //TODO Support Nested Pointer
				for(var i=0;i<declarator.pointer.qualifiers.length;i++) {
					if(declarator.pointer.qualifiers[i].type == "NullabilityQualifier") {
						result.pointer.nullability = declarator.pointer.qualifiers[i].token;
						result.nullability = result.pointer.nullability;
					}
				}
			}

			if(declarator.specifier) {
				result.name = _createObjectFromSpec(declarator.specifier).name;
			}

			if(declarator.type == "AbstractDeclarator") {

				// TODO

			} else if(declarator.type == "BlockTypeSpecifier") {

				result = _toBlock(result,declarator);

			} else {
				var dd = declarator.directDeclarator;
				if(dd) {

					if(dd.type == "BlockDirectDeclarator") { // typedef void(^name)(param,...);

						result = _toBlock(result,dd);

					} else {
						var suffixes = dd.suffixes;
						if(suffixes) {
							for(var i=0; i<suffixes.length;i++) {
								if(suffixes[i].type == "DeclaratorApplySuffix") {
									result = _toFunc(result,suffixes[i]);
								} else if(suffixes[i].type == "DeclaratorLookupSuffix") {
									result = _toArray(result,suffixes[i]);
								}
							}
						}
					}
				}
			}
			return result;
		};
		TypeInfo.applyDeclarator = _applyDeclarator;

		var _createObjectFromSpecDecl = function(specifiers,declarator) {
			if(declarator) {
				var result = _applyDeclarator(_createObjectFromSpec(specifiers),declarator);
				if(result.pointer) {
					result.nullability = result.nullability||TypeInfo.defaultNullability;
				}
				return result;
			} else {
				return _createObjectFromSpec(specifiers);
			}
		};
		TypeInfo.createObjectFromSpecDecl = _createObjectFromSpecDecl;

		var _createObjectFromTypeName = function(typeName) {
			return _createObjectFromSpecDecl(typeName.specifiers,typeName.abstractDeclarator);
		};
		TypeInfo.createObjectFromTypeName = _createObjectFromTypeName;

		var _typeNamesToTypeInfos = function(typenames) {
			var result = [];
			for(var i=0;i<typenames;i++) {
				result.push(_createObjectFromTypeName(typenames[i]));
			}
			return result;
		};

		var _createObjectFromSpec = function(specifiers) {

			var specifiers = Array.isArray(specifiers)?specifiers:(specifiers?[specifiers]:[]);		
			var typeSpecifiers = [], i;

			var typeInfo = new TypeInfo();

			for(var i=0;i<specifiers.length;i++) {
				var spec = specifiers[i];
				if(!spec) {
					continue;
				} else if(spec.type == "EnumSpecifier") {
					typeInfo = _toEnum(typeInfo,spec);
				} else if(spec.type == "BlockTypeSpecifier") {
					typeInfo = _toBlock(typeInfo,spec);
				} else if(spec.type == "StructOrUnionSpecifier") {
					typeInfo = _toStruct(typeInfo,spec);
				} else if(spec.type == "BasicTypeSpecifier") {
					typeSpecifiers.push(spec.token);
				} else if(spec.type == "TypeNameSpecifier") {
					typeSpecifiers.push(spec.name);
					if(spec.generics) {
						typeInfo.parameters = _typeNamesToTypeInfos(spec.generics);
					}
				} else if(spec.type == "NullabilityQualifier") {
					typeInfo.nullability = spec.token;
				} else if(spec.type == "TypeofSpecifier") {
					if(spec.expression.name == "self") {
						typeSpecifiers.push("__typeof(self)");
					} else {
						typeSpecifiers.push(spec.text);
					}
				} else if(spec.type == "ProtocolTypeSpecifier") {
					typeInfo = _toProtocol(typeInfo,spec);
				} else if(spec.type == "StorageClassSpecifier") {
					if(spec.token == "typedef")	{
						typeInfo.isTypedef = true;
					} else {
						if(!typeInfo.storageClass) typeInfo.storageClass = [];
						typeInfo.storageClass.push(spec.token);
					}
				} else if(spec.token == "__weak") {
					typeInfo.isWeak = true;
				} else if(spec.token == "const") {
					typeInfo.isConstant = true;
				} else if(spec.token == "__block") {
					typeInfo.isBlock = true;
				} else if(spec.token) {
					if(!typeInfo.qualifiers) typeInfo.qualifiers = [];
					typeInfo.qualifiers.push(spec.token);
				} else {
					console.log("Warning: unknown specifier: " + util.inspect(spec));
				}		
			}

			if(!typeInfo.name) {
				typeInfo.name = typeSpecifiers.join(' ');
			}

			if(typeInfo.name == "id") {
				typeInfo.pointer = {};
			}

			if(typeInfo.pointer) {
				typeInfo.nullability = typeInfo.nullability||TypeInfo.defaultNullability;
			}

			return typeInfo;
		};

		return TypeInfo;

	})();

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = (function(){
		"use strict"

		var util = __webpack_require__(2);
		var ASTUtil = __webpack_require__(10);
		var TypeInfo = __webpack_require__(11);

		/**
		 * DeclInfo is intended to be (de)serializable as pure JSON.
		 * JS prototype chain is not used to define the DeclInfo and its derived classes.
	  	 *
	  	 * Thus do not use `obj instanceof DeclInfo`. Use `obj.kind == DeclInfo.KIND_XXXX` instead.
		 */
		var DeclInfo = function(kind) {
			this.kind = kind;
		};

		DeclInfo.KIND_CLASS = "decl:class";
		DeclInfo.KIND_METHOD = "decl:method";
		DeclInfo.KIND_FUNC_PARAM = "decl:func_param";
		DeclInfo.KIND_METHOD_PARAM = "decl:method_param";
		DeclInfo.KIND_FUNC = "decl:func";
		DeclInfo.KIND_PROTOCOL = "decl:protocol";
		DeclInfo.KIND_DECLARATION = "decl:declaration";
		DeclInfo.KIND_TYPEDEF = "decl:typedef";
		DeclInfo.KIND_PROPERTY = "decl:property";
		DeclInfo.KIND_ENUM = "decl:enum";
		DeclInfo.KIND_ENUM_ITEM = "decl:enum_item";

		var _createObjectsFromEnumSpecifier = function(enumType, spec) {
			var result = [];
			for(var i=0;i<spec.enumerators.length;i++) {
				var e = spec.enumerators[i];
				if(e.type == "Enumerator") {
					var info = new DeclInfo(DeclInfo.KIND_ENUM_ITEM);
					info.name = e.name;
					info.type = new TypeInfo({kind:TypeInfo.KIND_ENUM});
					info.type.name = enumType.name;
					info.type.baseType = enumType.baseType;
					info.type.tagName = enumType.tagName;
					result.push(info);
				}
			}
			return result;
		};

		var _createObjectFromSpecDecl = function(specifiers, declarator) {
			var type = TypeInfo.createObjectFromSpecDecl(specifiers,declarator);

			var result;

			if(type.kind == TypeInfo.KIND_ENUM) {
				var es = ASTUtil.findNodesByType(specifiers,"EnumSpecifier")[0];
				if(es.enumerators) {
					result = new DeclInfo(DeclInfo.KIND_ENUM);
					result.name = type.name;
					result.enumerators = _createObjectsFromEnumSpecifier(type, es);
					result.type = type;
					return result;
				}
			}
			result = new DeclInfo(DeclInfo.KIND_DECLARATION);
			if(declarator) {
				result.name = declarator.name;
			} else {
				result.name = "";
			}
			result.type = type;

			return result;
		};
		DeclInfo.createObjectFromSpecDecl = _createObjectFromSpecDecl;

		var _createObjectsFromPropertyDeclaration = function(node) {
			var result = [];
			node.declaration.declarators.forEach(function(declarator) {
				var info = DeclInfo.createObjectFromSpecDecl(node.declaration.specifiers,declarator);
				info.kind = DeclInfo.KIND_PROPERTY;
				info.attributes = node.attributes||[];
				if(0<=info.attributes.indexOf('nullable')) {
					info.type.nullability = 'nullable';
				} else if(0<=info.attributes.indexOf('nonnull')) {
					info.type.nullability = 'nonnull';
				}
				result.push(info);
			});
			return result;
		};
		DeclInfo.createObjectsFromPropertyDeclaration = _createObjectsFromPropertyDeclaration;

		// KeywordDeclarator to METHOD_PARAM
		var _createObjectFromKeywordDeclarator = function(node) {
			var info = new DeclInfo(DeclInfo.KIND_METHOD_PARAM);
			if(node.methodType) {
				info.type = TypeInfo.createObjectFromSpecDecl(node.methodType.specifiers,node.methodType.abstractDeclarator);
			} else {
				info.type = TypeInfo.Id;
			}
			info.label = node.label;
			info.name = node.name;
			return info;
		};

		// MethodSelector to [METHOD_PARAM]
		var _createObjectsFromMethodSelector = function(selector) {
			var result = [];
			if(selector && selector.type == "MethodSelector") {
				if(selector.head) {
					result.push(_createObjectFromKeywordDeclarator(selector.head));
					selector.tail.forEach(function(e){
						if(e.type == "KeywordDeclarator") {
							result.push(_createObjectFromKeywordDeclarator(e));
						}
					});
				}
			}
			return result;
		};

		var _createObjectFromMethodDeclaration = function(node) {
			var info = new DeclInfo(DeclInfo.KIND_METHOD);
			info.name = node.selector.name;
			info.parameters = _createObjectsFromMethodSelector(node.selector);
			if(node.returnType) {
				info.returnType = TypeInfo.createObjectFromSpecDecl(node.returnType.specifiers,node.returnType.abstractDeclarator);
			} else {
				info.returnType = TypeInfo.Id;
			}
			if(node.attributes) {
				info.isDesignatedInitializer = node.attributes.indexOf("__attribute__((objc_designated_initializer))");
			}

			info.isClassMethod = (node.type == "ClassMethodDeclaration");
			return info;
		};
		DeclInfo.createObjectFromMethodDeclaration = _createObjectFromMethodDeclaration;

		var _createObjectFromFunctionDefinition = function(node) {
			var info = new DeclInfo(DeclInfo.KIND_FUNC);
			var type = TypeInfo.createObjectFromSpecDecl(node.specifiers,node.declarator);
			if(type.kind == TypeInfo.KIND_FUNC) {
				info.type = type;
				info.returnType = type.returnType;
				info.name = node.declarator.name;
				var parameters = [];
				if(type.parameters) {
					for(var i=0;i<type.parameters.length;i++) {
						var param = type.parameters[i];
						var decl = new DeclInfo(DeclInfo.KIND_FUNC_PARAM);
						if(param.declName) {
							decl.name = param.declName;
							decl.type = param;
							parameters.push(decl);
						}
					}
					info.parameters = parameters;
				}
			} else {
				info.returnType = TypeInfo.Void;			
				info.type = type;
				info.parameters = [];
				info.name = node.declarator.name;
			}
			return info;
		};
		DeclInfo.createObjectFromFunctionDefinition = _createObjectFromFunctionDefinition;

		return DeclInfo;
	})();

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	module.exports = (function(){
		var SPACER = '        ';
		function makeIndentString(indent) {
			if(SPACER.length<indent) {
				return SPACER + makeIndentString(indent-SPACER.length);            
			}    
			return SPACER.slice(0,indent);
		}

		function getSourceFragment(text,location) {
			var lines = text.split(/\n/);
			var result = ">> " + lines[location.start.line-1] + "\n";
			return result + "  " + makeIndentString(location.start.column) + "^";
		}

		var ParserUtil = function(){};

		ParserUtil.buildErrorMessage = function(e, source, file) {
			var buf = [];
			if(e.location && e.location.start) {
				buf.push("Syntax Error" + (file?" in "+file:""));
				buf.push("At line " + e.location.start.line + " column " + e.location.start.column);
				buf.push(getSourceFragment(source,e.location));
			} else {
				buf.push("Internal Error");
				console.log(e);
			}
			return buf.join('\n');
		};

		return ParserUtil;
	})();

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = (function(){
		"use strict"

		var util = __webpack_require__(2);
		var ASTUtil = __webpack_require__(10);
		var o2s = __webpack_require__(1);
		var parser = __webpack_require__(8);

		var TypeInfo = __webpack_require__(11);
		var DeclInfo = __webpack_require__(12);

		var defaultOptions = {
			tabSize:4,
			inlineDump:false,
			forceUnwrap:true,
		};

		var OBJC_TO_SWIFT_LITERAL_MAP = { 
			"NULL":"nil", "YES":"true", "NO":"false", "MAX":"max", "MIN":"min" 
		};

		var OBJC_TO_SWIFT_TYPE_MAP = {
			"float":"Float", "double":"Double",
			"NSString":"String",
			"BOOL":"Bool", "Class":"AnyClass", 
			"void":"Void", 
			"char":"Int8", "unsigned char":"UInt8", "signed char":"Int8",
			"int":"Int", "unsigned int":"UInt", "signed int":"Int", 
			"short":"Int16", "unsigned short":"UInt16", "signed short":"Int16",
			"short int":"Int16", "unsigned short int":"UInt16", "signed short int":"Int16",
			"long":"Int32", "unsigned long":"UInt32", "signed long":"Int32",
			"long int":"Int32", "unsigned long int":"UInt32", "signed long int":"Int32",
			"long long":"Int64", "unsigned long long":"UInt64", "signed long long":"Int64", 
			"long long int":"Int64", "unsigned long long int":"UInt64", "signed long long int":"Int64", 
			"NSInteger":"Int", "NSUInteger":"UInt",
			"id":"AnyObject", "NSArray":"[AnyObject]",'instancetype':"Self",		
		};

	  	var _trim = function(s) { 
	  		return s?s.replace(/^ *| *$/g,''):s; 
	  	};

		var _SPACER = '        ';
		var _makeIndentString = function(size) {
			if(_SPACER.length<size) {
				return _SPACER+_makeIndentString(size-_SPACER.length);            
			}    
			return _SPACER.slice(0,size);
		};

	  	var smartLineBreak = function(text) {
	  		return text.replace(/\s+$/,'') + '\n';
	  	};

		var Generator = function(analyzer,options) {
			this.analyzer = analyzer;
			this.options = {};
			for(var key in defaultOptions) {
				var value = options[key];
				this.options[key] = (value!=null)?value:defaultOptions[key];
			}
			this.options.indent = _makeIndentString(this.options.tabSize);
		};

		Generator.prototype.toSwiftType = function(typeInfo) {

			if(typeInfo.kind == TypeInfo.KIND_BASIC || typeInfo.kind == TypeInfo.KIND_CLASS) {

				var name = OBJC_TO_SWIFT_TYPE_MAP[typeInfo.name]||typeInfo.name;
				
				if(typeInfo.nullability == "nullable") {
					return name + "?";
				} else if(typeInfo.isWeak) {
					return name + "!";
				} else if(typeInfo.nullability == "nonnull") {
					return name;
				} else if(typeInfo.pointer) {
					return name + "!";
				} else {
					return name;
				}

			} else if(typeInfo.kind == TypeInfo.KIND_ARRAY) {
				var name = "[" + this.toSwiftType(typeInfo.elementType) + "]";
				if(typeInfo.nullability == "nullable") {
					return name + "?";
				} else if(typeInfo.nullability == "nonnull") {
					return name;
				} else {
					return name + "!";
				}

			} else if(typeInfo.kind == TypeInfo.KIND_PROTOCOL) {
				if(1<typeInfo.protocols.length) {
					return typeInfo.protocols.join(',');
				} else {
					var proto = this.analyzer.getProtocolDeclInfo(typeInfo.protocols[0]);
					var name;
					if(proto && proto.type.conflictWithClass) {
						name = typeInfo.protocols[0]+"Protocol"
					} else {
						name = typeInfo.protocols[0];
					}
					if(typeInfo.nullability == "nullable") {
						return name + "?";
					} else if(typeInfo.nullability == "nonnull") {
						return name;
					} else {
						return name + "!";
					}
				}

			} else if(typeInfo.kind == TypeInfo.KIND_BLOCK) {

				var buf = [];
				for(var i=0;i<typeInfo.parameters.length;i++) {	
					var par = typeInfo.parameters[i];
					buf.push(this.toSwiftType(par));
				}

				return "(" + buf.join(',') + ")->" + this.toSwiftType(typeInfo.returnType);

			} else if(typeInfo.kind == TypeInfo.KIND_FUNC) {

				var buf = [];
				for(var i=0;i<typeInfo.parameters.length;i++) {	
					var par = typeInfo.parameters[i];
					if(par.pointer||par.kind == TypeInfo.KIND_PROTOCOL) {
						buf.push("UnsafeMutablePointer<" + this.toSwiftType(par) + ">");
					} else {
						buf.push(this.toSwiftType(par));
					}
				}
				return "@convention(c) (" + buf.join(',') + ")->" + this.toSwiftType(typeInfo.returnType);			

			} else if(typeInfo.kind == TypeInfo.KIND_ENUM) {
				return typeInfo.tagName;
			} else {
				return "$(" + typeInfo.kind + ":" + typeInfo.name + ")";
			} 
		};


		Generator.prototype.smartIndent = function(text,indent) {		
			if(/^ *$/.test(text)) {
				return text;
			}
			indent = indent||this.options.indent;
			return text.split(/\n/).map(function(e){
				if(/^\s*$/.test(e)) {
					return '';
				} else if(!/^#/.test(e)) {
					return indent+e;
				} else {
					return e;
				}
			}).join('\n');
		};

		Generator.prototype.postProcess = function(source) {
			return source.replace(/^\s*|\s*$/,'')
			.replace(/^# *pragma +mark( |$)/mg,this.options.indent + '// MARK: ')
			.replace(/^# *(pragma|define)( |$)/mg,'// $1 ')
			.replace(/^# *ifdef( |$)/mg,'// #if ')
			.replace(/(^|\n)([ \t]*\n){3,}/g,'$1\n\n');
		};

		Generator.prototype.generate = function(ast) {
			return this.postProcess(this.convert(ast));
		};

		Generator.prototype.convert = function(node) {

			if(node == null) {
				return '';
			}

			if(typeof(node) == "string") {
				return node;
			}

			if(util.isArray(node)) {
				var result = [];
				for(var i=0;i<node.length;i++) {
					result.push(this.convert(node[i]));
				}
				return result.join('');
			}

			if(this[node.type]) {
				return this[node.type](node);
			}

			if(node.children) {
				return this.convert(node.children);
			}

			if(node.child) {
				return this.convert(node.child);
			}

			if(util.isString(node.token)) {
				return node.token;
			}

			if(!node._hidden) {
				return ("$(" + node.type + ")");
			}

			return '';

		};

		Generator.prototype.TranslationUnit = function(node) {

			var children = node.externalDeclarations;
			var buf = [],i;
			for(i=0;i<children.length;i++) {
				buf.push(this.convert(children[i]));
			}
			return buf.join('');
		};

		Generator.prototype.ImportDirective = function(node) {
			return "//#import " + node.argument;
		};

		Generator.prototype.ModuleImportDirective = function(node) {
			return "import " + node.argument.name;
		}

		Generator.prototype.FunctionDefinition = function(node) {	

			var info = node._declInfo;
			var result = "func" + (node.c1!=''?node.c1:' ') + info.name;

			var buf = [];
			for(var i=0;i<info.parameters.length;i++) {
				var param = info.parameters[i];
				buf.push(param.name + ":" + this.toSwiftType(param.type));
			}

			result += "(" + buf.join(', ') + ")";

			if(info.returnType && info.returnType.name != "void") {
				result += " -> " + this.toSwiftType(info.returnType);
			}

			return result + node.c2 + "{" + this.convert(node.statement) + "}";
		};

		Generator.prototype.generateProtocolPropertyDeclaration = function(propInfo) {
			var prefix = '';
			var suffix = "{ get set }";
			if(0<=propInfo.attributes.indexOf('copy')) {
				prefix += "@NSCopying ";
			}
			if(0<=propInfo.attributes.indexOf("readonly")) {
				suffix = "{ get }";
			}
			return prefix + "var " + propInfo.name + ":" + this.toSwiftType(propInfo.type) + " " + suffix;
		};

		Generator.prototype.generateMethodDeclaration = function(node) {
			var info = node._declInfo;
			if(_isInitializerMethod(info)) {
				return this.generateMethodSelector(info,true);
			} else if(info.returnType && info.returnType.name == "IBAction") {
				return "@IBAction func " + this.generateMethodSelector(info);
			} else if(info.returnType && info.returnType.name != "void") {
				return "func " + this.generateMethodSelector(info) + " -> " + this.toSwiftType(info.returnType);
			} else {
				return "func " + this.generateMethodSelector(info);
			}
		};

		Generator.prototype.ProtocolDeclaration = function(node) {

			if(node.declarations==null||node.declarations.length==0) {
				return;
			}

			var buf = [];
			var declInfo = node._declInfo;
			buf.push("protocol");
			buf.push(node.c1);
			buf.push(node.name);
			if(node.protocols) {
				buf.push(node.c2);
				buf.push(": ")
				buf.push(node.protocols.join(','));
				buf.push(" {");
			} else {
				buf.push(" {");
				buf.push(node.c2);
			}

			var body = [];
			for(var i=0;i<node.declarations.length;i++) {
				var d = node.declarations[i];
				if(d == "@required" || d == "@optional") {
					// through
				} else if(d.type == "PropertyDeclaration") {
					for(var j=0;j<d._declInfos.length;j++) {
						var di = d._declInfos[j];
						if(di.isOptional) body.push("optional ");
						body.push(this.generateProtocolPropertyDeclaration(di));
						if(j<d._declInfos.length-1) {
							body.push('\n');
						}
					}
				} else if(d.type == "ClassMethodDeclaration") {
					if(d._declInfo.isOptional) body.push("optional ");
					body.push("class " + this.generateMethodDeclaration(d));
				} else if(d.type == "InstanceMethodDeclaration") {
					if(d._declInfo.isOptional) body.push("optional ");
					body.push(this.generateMethodDeclaration(d));
				} else {
					body.push(this.convert(d));
				}
			}
			buf.push(this.smartIndent(body.join('')));
			buf.push(node.c3);
			buf.push("}")
			return buf.join('');
		};

		Generator.prototype.CategoryInterface = function(node) {
			return '';
		};

		Generator.prototype.ClassInterface = function(node) {
			return '';
		};

		Generator.prototype.generateVariables = function(classInfo) {
			var buf = [],i;
			for(i=0;i<classInfo.variables.length;i++) {
				var info = classInfo.variables[i];
				buf.push("private var " + info.name + ":" + this.toSwiftType(info.type));
			}
			return this.smartIndent(buf.join('\n'));
		};

		Generator.prototype.generateProperties = function(classInfo) {

			var properties = classInfo.properties;
			var buf = [], i;

			var self = this;
			function _makeNameAndType(propInfo, altName) {
				return (altName?altName:propInfo.name) + ":" + self.toSwiftType(propInfo.type);
			};

			for(i=0;i<properties.length;i++) {

				var propInfo = properties[i];

				var prefix = '';

				var getterName = propInfo.getterName || propInfo.name;
				var setterName = propInfo.setterName;
				if(!setterName) {
					setterName = "set" + getterName.replace(/^[a-z]/,function(m){return m.toUpperCase();});
				}
				var syntheName = propInfo.syntheName || "_" + getterName;

				if(classInfo.synthesizedVariableMap[syntheName].isReferred) {

					buf.push("private var " + _makeNameAndType(propInfo,syntheName));

					var getter = classInfo.methodMap[getterName];
					var setter = classInfo.methodMap[setterName+":"];
					
					if(getter) {
						getter.isGetter = true;
					} 
					if(setter) {
						setter.isSetter = true;
					}

					prefix += propInfo.isPublic?"":"private ";

					buf.push(prefix + "var " + _makeNameAndType(propInfo) + " {");

					// Use existing computed property.
					if(getter) {
						buf.push(this.options.indent + "get { " + this.smartIndent(this.convert(getter.ast.statement)+"}"));
					} else {
						buf.push(this.options.indent + "get { return " + syntheName + " }");
					}
					if(setter) {
						var setterArgName = setter.parameters[0].name;
						buf.push(this.options.indent + "set(" + setterArgName + ") { " + this.smartIndent(this.convert(setter.ast.statement)+ "}"));
					} else {
						if(propInfo.attributes.indexOf("readonly")<0) {
							buf.push(this.options.indent + "set { " + syntheName + " = newValue }");
						}
					}
					buf.push("}");

				} else {
					if(0<=propInfo.attributes.indexOf('copy')) {
						prefix += "@NSCopying ";
					}
					if(0<=propInfo.attributes.indexOf("readonly")) {
						prefix += "private(set) ";
					} else {
						prefix += propInfo.isPublic?"":"private ";
					}
					buf.push(prefix + "var " + _makeNameAndType(propInfo));

				}

			}

			if(0<buf.length) {
				return smartLineBreak(this.smartIndent(buf.join('\n')))+"\n";
			} else {
				return '';
			}

		};

		Generator.prototype.CategoryImplementation = function(node) {

			var classInfo = node._declInfo, buf = [], i;
			buf.push("extension " + classInfo.name);
			buf.push(" {");
			buf.push(node.c2);

			var ext = [];
			ext.push(node.c3);
			ext.push(this.convert(node.definitions));
			ext.push(node.c4);
			buf.push(this.smartIndent(ext.join('')));

			return smartLineBreak(buf.join('')).replace(/^ */,'') + "}";

		};

		Generator.prototype.ClassImplementation = function(node) {

			var classInfo = node._declInfo, buf = [], i;

			buf.push("class " + classInfo.name);

			var ext = [];
			if(classInfo.superClass) {
				ext.push(classInfo.superClass);
			}

			if(classInfo.protocols) {
				for(i=0;i<classInfo.protocols.length;i++) {
					var protocol = classInfo.protocols[i];
					var info = this.analyzer.getProtocolDeclInfo(protocol);
					if(info && info.type.conflictWithClass) {
						protocol += "Protocol";
					}
					ext.push(protocol);
				}
			}

			if(0 < ext.length) {
				buf.push(" : " + ext.join(', '));
			}

			buf.push(" {");
			buf.push(node.c2);

			if(0<classInfo.variables.length) {
				buf.push(this.generateVariables(classInfo));
				buf.push("\n");
			}
			buf.push(this.generateProperties(classInfo));
			
			ext = [];
			ext.push(node.c3);
			ext.push(this.convert(node.definitions));
			ext.push(node.c4);
			buf.push(this.smartIndent(ext.join('')));

			// remove heading and trailing blanks lines, then add "\n}"
			return smartLineBreak(buf.join('')).replace(/^ */,'') + "}";
		};

		Generator.prototype.PropertyImplementation = function(node) {
			return '';
		};

		Generator.prototype.generateMethodSelector = function(info, toInit) {

			if(!info.parameters||info.parameters.length==0) {
				return (toInit?"init":info.name) + "()";			
			}

			var param = info.parameters[0];

			var buf = [(toInit?"init":param.label) + "(" + param.name + ":" + this.toSwiftType(param.type)];

			for(var i=1;i<info.parameters.length;i++) {
				param = info.parameters[i];
				if(param.label && param.label!=param.name) {
					buf.push(param.label + " " + param.name + ":" + this.toSwiftType(param.type));
				} else {
					buf.push(param.name + ":" + this.toSwiftType(param.type));
				}
			};

			return buf.join(", ") + ")";
		};

		var _isInitializerMethod = function(info) {
			if(info) {
				return !info.isClassMethod && /^init(With)?/.test(info.name) && 
					info.returnType && 
					(info.returnType.name == "id" || info.returnType.name == "instancetype");
			} else {
				return false;
			}
		};

		Generator.prototype.generateMethodDefinition = function(node) {
			return this.generateMethodDeclaration(node) + " {" + this.convert(node.statement) + "}";
		};

		Generator.prototype.ClassMethodDefinition = function(node) {
			return "class " + this.generateMethodDefinition(node);
		};

		Generator.prototype.InstanceMethodDefinition = function(node) {	
			if(node._declInfo.isGetter) {
				return '// `' + node._declInfo.name + "` has moved as a getter.";
			}
			if(node._declInfo.isSetter) {
				return '// `' + node._declInfo.name + "` has moved as a setter.";
			}
			if(node._declInfo.isOverride) {
				return "override " + this.generateMethodDefinition(node);
			}

			return this.generateMethodDefinition(node);
		};

		Generator.prototype.generateAdjustedCondition = function(node) {

			var info = node._typeInfo;

			if(!info) {
				return this.convert(node);
			}

			if(TypeInfo.isBooleanType(info)) {
				return this.convert(node);
			} 

			if(TypeInfo.isIntegerType(info)) {
				return "(" + this.convert(node) + " != 0)";
			} 

			return "(" + this.convert(node) + " != nil)";			

		};

		Generator.prototype.CatchStatement = function(node) {
			return "@catch" + node.c1 + "(" + node.c2 + this.convert(node.declarator) + node.c3 + ")" + node.c4 + "{" + this.convert(node.statement) + "}";
		};

		Generator.prototype.TryStatement = function(node) {
			return "@try" + node.c1 + "{" + this.convert(node.statement) + "}";
		};

		Generator.prototype.ThrowStatement = function(node) {
			return "@throw" + node.c1 + this.convert(node.expression) + node.c2;
		};

		Generator.prototype.FinallyStatement = function(node) {
			return "@finally" + node.c1 + "{" + this.convert(node.statement) + "}";
		};

		Generator.prototype.TryBlock = function(node) {
			return this.convert([node.tryStatement, node.catchStatements, node.c1, node.finallyStatement]);
		};

		Generator.prototype.IfStatement = function(node) {		
			var buf = [];

			var spc = node.c1 + node.c2;	

			buf.push("if");
			buf.push(0<spc.length?spc:' ');
			buf.push(this.generateAdjustedCondition(node.expression));
			buf.push(node.c3);
			
			if(node.thenBlock) {
				buf.push(node.thenBlock.prefix!=''?node.thenBlock.prefix:' ');
				buf.push(this.convert(["{", node.thenBlock.statement, "}" ,node.thenBlock.suffix]));
			}

			if(node.elseBlock) {
				buf.push("else");
				if(node.elseBlock.statement.type == "IfStatement") {		
					buf.push(node.elseBlock.prefix!=''?node.elseBlock.prefix:' ');
					buf.push(this.convert(node.elseBlock.statement));				
				} else {
					buf.push(node.elseBlock.prefix);
					buf.push("{" + this.convert(node.elseBlock.statement) + "}");
				}
			}

			return buf.join('');
		};

		Generator.prototype.ForStatement = function(node) {

			var initString = '';
			if(node.initExpression) {
				initString = this.convert(node.initExpression);
			} else if(node.initDeclarators) {
				var buf = [];
				for(var i=0;i<node.initDeclarators.length;i++) {
					var initDecl = node.initDeclarators[i];
					var info = DeclInfo.createObjectFromSpecDecl(node.initSpecifiers,initDecl.declarator);				
					var s = info.name + ":" + this.toSwiftType(info.type);
					if(initDecl.initializer) {
						s += "=" + this.convert(initDecl.initializer);
					}
					buf.push(s);
				}
				initString = "var " + buf.join(',');
			}

			var result = this.convert([
				"for ",
				_trim(initString),
				" ; ",
				_trim(this.convert(node.condExpression)),
				" ; ",
				_trim(this.convert(node.loopExpression))
			]);

			result += " { " + this.convert([node.prefix,node.statement]) + " }";

			return result;
		};

		Generator.prototype.WhileStatement = function(node)	{
			return "while " + node.c1 + node.c2 + 
				this.generateAdjustedCondition(node.condExpression) +
				node.c3 + node.c4 + "{" + this.convert(node.statement) +  "}";
		};

		Generator.prototype.DoStatement = function(node)	{
			return "repeat" + node.prefix + "{" + this.convert(node.statement) + "}" 
				+ node.suffix + "while " + this.generateAdjustedCondition(node.condExpression);
		};

		Generator.prototype.ForInStatement = function(node) {

			var result = this.convert([
				"for ",
				_trim(node.c1), 
				node.declarator,
				_trim(node.c2 + node.c3),
				" in",
				node.c4,
				node.expression,
				node.c5,
			]);
			result += " { " + this.convert([node.c6,node.statement]) + " }";

			return result;
		};

		Generator.prototype.AutoreleaseStatement = function(node) {
			return this.convert(["autoreleasepool", node.c1, "{ ", node.statement, "}"]);
		};

		Generator.prototype.ReturnStatement = function(node) {
			return this.convert(["return",node.c1,node.expression,node.c2]);
		};

		Generator.prototype.BreakStatement = function(node) {
			return "break" + node.c1;
		};

		Generator.prototype.SwitchStatement = function(node) {
			var buf = [];
			buf.push('switch');
			buf.push(node.c1);
			if(node.expression.type == "NestedExpression" || node.expression.type == "CastExpression") {
				buf.push(this.convert(node.expression));
			} else {
				buf.push('(');
				buf.push(node.c2);
				buf.push(this.convert(node.expression));
				buf.push(node.c3);
				buf.push(')');
			}
			buf.push(node.c4);
			buf.push('{ ' + this.convert(node.statement) + '}');
			return buf.join('');
		}	

		Generator.prototype.convert_CaseChain = function(node) {
			if(node.statement.type == "CaseStatement") {
				return this.convert(node.expression) + node.c2 + "," + node.c3 + "     " + this.convert_CaseChain(node.statement);
			} else {
				return this.convert(node.expression) + node.c2 + ":" + node.c3 + this.convert(node.statement);
			}
		}

		Generator.prototype.CaseStatement = function(node) {
			return "case " + this.convert_CaseChain(node);
		};

		Generator.prototype.StatementList = function(node) {
			var	buf = '';
			for(var i=0;i<node.statements.length;i++) {
				var statement = node.statements[i];
				if(statement.type == "CompoundStatement") {
					buf += node.prefixes[i];
					buf += "{" + this.convert(statement) + "}";
				} else {
					if(!/(^|\n|})\s*$/.test(buf + node.prefixes[i])) {
						buf += ";"
					}
					buf += node.prefixes[i] + this.convert(statement);
				}
			}
			return buf;
		};

		Generator.prototype.CompoundStatement = function(node) {
			return this.convert([node.prefix, node.blockItems, node.suffix]);
		};

		Generator.prototype.KeywordArgument = function(node) {
			return this.convert([node.name,node.separator,node.expression]);
		};

		var _toSwiftEnumItemName = function(tagName, itemName) {
			if(!tagName) return itemName;

			var result = itemName;

			if(itemName.indexOf(tagName)==0) {
				result = itemName.slice(tagName.length)
			} else if(tagName.charAt(tagName.length-1) == 's') { // Considering UIControlEvent's'
				if(itemName.indexOf(tagName.substring(0,tagName.length-1))==0) {
					result = itemName.slice(tagName.length-1);
				}
			}

			if(result.charAt(0)=='_') {
				return result.slice(1);
			}

			return result;
		};

		Generator.prototype.convert_Enum = function(node, typeInfo) {

			var result = this.convert(["enum", node.c1, node.tagName]);

			if(typeInfo.baseType) { 
				result += ":" + this.toSwiftType(typeInfo.baseType);
			}

			if(node.enumerators) {
				result += node.c2 + '{' + node.c3;
				var buf = [];
				for(var i=0;i<node.enumerators.length;i++) {
					var e = node.enumerators[i];
					if(e.type == "Enumerator") {
						buf.push("case " + _toSwiftEnumItemName(node.tagName,e.name));
						if(e.expression) {
							buf.push(" = " + this.convert(e.expression));
						}
					} else {
						buf.push(this.convert(e));
					}
				};
				result += buf.join('') + node.c4 + "}";
			}

			return result;
		};

		Generator.prototype.convert_Typedef = function(node) {
			var info = node._declInfo;
			var newName, oldName;

			if(info.kind == DeclInfo.KIND_ENUM) {
				newName = info.type.declName;
				oldName = info.type.tagName;
			} else {
				newName = info.name;
				oldName = this.toSwiftType(info.type);
			}

			if(newName!=oldName) {
				return "typealias " + newName + " = " + oldName;
			} else {
				return "";
			}
		};

		Generator.prototype.Declaration = function(node) {

			var buf=[], i, e;

			var lastPrefix;

			if(node.initDeclarators) {

				for(i=0;i<node.initDeclarators.length;i++) {
					var initDeclarator = node.initDeclarators[i];
					var info = initDeclarator.declarator._declInfo;
					if(info.type.isTypedef) {
						buf.push(this.convert_Typedef(initDeclarator.declarator));
						continue;
					}
					
					var prefixes = [];
					if(info.type.isStatic) prefixes.push("static");
					if(info.type.isWeak) prefixes.push("weak");
					var isLet = !info.type.isWeak&&(!info.isAssigned||info.type.isConst)&&initDeclarator.initializer;
					prefixes.push(isLet?"let":"var");
					var prefix = prefixes.join(' ');
					if(prefix!=lastPrefix) {
						if(0<i) buf.push('; ');
						buf.push(prefix);
					} else {
						buf.push(',');
					}
					lastPrefix = prefix;

					buf.push(node.c1!=''?node.c1:' ');
					buf.push(info.name);

					buf.push(":" + this.toSwiftType(info.type));

					if(initDeclarator.initializer) {
						buf.push(" = ");
						buf.push(this.convert(initDeclarator.initializer));
						if(this.options.inlineDump) {
							buf.push("/*" + this.debugTypeInfo(initDeclarator.initializer) + "*/");
						}
					}
				}
				
			} else {

				var info = node._declInfo;
				if(info && info.kind == DeclInfo.KIND_ENUM) {
					buf.push(this.convert_Enum(ASTUtil.findNodesByType(node,"EnumSpecifier")[0],info.type));
				} else {
					// not declaration
					buf.push(this.convert([node.specifiers,node.c1,node.c2]));
				}

			}

			return buf.join('') + node.c2;

		};

		Generator.prototype.LogicalOrExpression = Generator.prototype.LogicalAndExpression = function(node) {
			var buf = [];
			for(var i=0;i<node.children.length;i++) {
				var child = node.children[i];
				if(typeof(child) == "string") {
					buf.push(child);
				} else {
					buf.push(this.generateAdjustedCondition(child));
				}
			}
			return buf.join('');
		};


		Generator.prototype.NestedExpression = function(node) {
			if(node.expression.type=="NestedExpression" || node.expression.type=="CastExpression") {
				return this.convert(node.expression);
			} else {
				return '(' + this.convert(node.expression) + ')';
			}
		};

		Generator.prototype.NotExpression = function(node) {
			var info = node.child._typeInfo;

			if(!info) {
				return "!" + node.c1 + this.convert(node.child);
			}

			if(TypeInfo.isBooleanType(info)) {
				return "!" + node.c1 + this.convert(node.child);
			}

			if(TypeInfo.isIntegerType(info)) {
				return "(" + node.c1 + this.convert(node.child) + " == 0)";
			} 

			return "(" + node.c1 + this.convert(node.child) + " == nil)";
		};

		Generator.prototype.SelectorExpression = function(node) {		
			return this.convert('Selector("' + node.name + '")');
		};

		Generator.prototype.CastExpression = function(node) {
			var info = TypeInfo.createObjectFromSpecDecl(node.castTo.specifiers, node.castTo.abstractDeclarator);
			return '(' + this.convert(node.expression) + " as! " + info.name + ')';
		};

		Generator.prototype.EncodeExpression = function(node) {
			return node.text;
		};

		Generator.prototype.AvailableExpression = function(node) {
			return '#available(' + this.convert(node.args) + ')';
		};

		Generator.prototype.BlockExpression = function(node) {
			var buf = [];
			buf.push("{ ");

			buf.push(_trim(node.c1));
			buf.push(this.convert_BlockParameters(node.parameters));
			if(node.specifiers) {
				if(!node.parameters) {
					buf.push("()");
				}
				buf.push("->" + this.convert(node.specifiers));
			}
			buf.push(_trim(node.c2));

			if(node.parameters||node.specifiers) {
				buf.push(" in ");
			}

			buf.push(this.convert(node.statement));
			buf.push("}");
			return buf.join('');
		};

		Generator.prototype.convert_BlockParameters = function(parameters) {
			if(parameters) {
				var buf = [], i;
				for(i=0;i<parameters.length;i++) {
					buf.push(this.convert(parameters[i]));
				}
				return "(" + buf.join(',') + ")";
			} else {
				return '';
			}
		};

		Generator.prototype.TypeVariableDeclarator = function(node) {
			return node._declInfo.name + ":" + this.toSwiftType(node._declInfo.type);
		};

		Generator.prototype.ProtocolExpression = function(node) {		
			return this.convert(node.name);
		};

		Generator.prototype.DictionaryExpression = function(node) {
			return "[" + this.convert(node.body) + "]";
		};

		Generator.prototype.ArrayExpression = function(node) {
			return "[" + this.convert(node.body) + "]";
		};

		Generator.prototype.PostfixApplyExpression = function(node) {
			return this.convert(node.context) + "(" + this.convert(node.parameters) + ")";
		};

		Generator.prototype.PostfixDotExpression = function(node) {

			var context = this.convert(node.context);
			var contextInfo = node.context._typeInfo;

			if(contextInfo && contextInfo.nullability == "nullable") {
				context += this.options.forceUnwrap?"!":"?";
			}

			var ret, sel = node.identifier;

			if(sel == "alloc") {
				ret = context;
			} else if(sel == "init" ||sel == "new") {
				ret = context + "()";
			} else if(sel == "class") {
				if(contextInfo && contextInfo.kind == TypeInfo.KIND_CLASS) {
					ret = context + ".self";
				} else if(/^[A-Z]/.test(context)) {
					ret = context + ".self";
				} else {
					ret =context + ".dynamicType";
				}
			} else {
				ret = context + "." + sel + ((!node._typeInfo||node._isProperty)?"":"()");
			}

			if(this.options.inlineDump) {
				ret += "/*" + this.debugTypeInfo(node) + "*/";
			}
			return ret;

		};

		Generator.prototype.MessageExpression = function(node) {		
			var result = this.convert_messageExpression(node);
			if(this.options.inlineDump) {
				return result + "/*" + this.debugTypeInfo(node) + "*/";
			}
			return result;
		}

		Generator.prototype.convert_messageExpression = function(node) {

			var receiver = this.convert(node.receiver);
			var receiverInfo = node.receiver._typeInfo;

			if(receiverInfo&&receiverInfo.nullability=="nullable") {
				receiver += this.options.forceUnwrap?"!":"?";
			}

			if(node.selector.type == "Identifier") {
				var sel = node.selector.name;

				if(sel == "alloc") return receiver;

				if(sel == "init" || sel == "new") {
					if(receiver == "self" || receiver == "super") {
						return receiver + ".init()";
					} else {
						return receiver + "()";
					}
				}

				if(sel == "class") {
					if(receiverInfo && receiverInfo.kind == TypeInfo.KIND_CLASS) {
						return receiver + ".self";
					} else if(/^[A-Z]/.test(receiver)) {
						return receiver + ".self";
					}
					return receiver + ".dynamicType";
				}

				if(node._isProperty) {
					return receiver + "." + node.selector.name;
				}
				return receiver + "." + node.selector.name + "()";
			}

			var keyword, i, buf=[], prefix = '';

			var methodName = node.selector[0].name;

			if(methodName == "isKindOfClass" && node.selector.length==1) { 
				var exp = node.selector[0].expression;
				if(exp.type == "PrimaryIdentifier") {
					return "(" + this.convert(node.receiver) + " is " + exp.name + ")";
				}
				if(exp.type == "MessageExpression" && 
					exp.receiver &&
					exp.receiver && 
					exp.receiver.type == "PrimaryIdentifier") {
					return "(" + this.convert(node.receiver) + " is " + exp.receiver.name + ")";
				}
			}

			if(methodName == "isEqualToString" && node.selector.length==1) {
				return "("+ this.convert(node.receiver) + " == " + this.convert(node.selector[0].expression) + ")";
			}

			if(/^set[A-Z]/.test(methodName) && node.selector.length == 1) {
				return receiver + 
					"." + (methodName[3].toLowerCase())+methodName.slice(4) + 
					" = " + this.convert(node.selector[0].expression);
			}

			if(/^(init|color|value|string)With./.test(methodName)) {
				var m = methodName.match(/^.*?With(.*)$/);
				if(/^[A-Z][a-z0-9]/.test(m[1])) {
					methodName = m[1].charAt(0).toLowerCase() + m[1].slice(1);
				} else {
					methodName = m[1];
				}

				var ix = '';
				if(receiver == "super" || receiver == "self") {
					ix = '.init';
				}

				buf.push(ix + "(" + methodName + ":" + this.convert(node.selector[0].expression));
			} else {
				buf.push("." + this.convert([node.selector[0].name,"(",node.selector[0].expression]));
			}

			for(i=1;i<node.selector.length;i++) {
				keyword = node.selector[i];
				if(util.isString(keyword)) {
					prefix += this.convert(keyword);
					continue;
				}
				buf.push(prefix + this.convert(keyword));
				prefix = '';
			}

			return receiver + buf.join(",") + ")";

		};

		Generator.prototype.MultiplicativeExpression = function(node) {
			return this.convert(node.lhs) + node.c1 + node.operator + node.c2 + this.convert(node.rhs);
		};

		Generator.prototype.AssignmentExpression = function(node) {
			return this.convert(node.lhs) + node.c1 + node.operator + node.c2 + this.convert(node.rhs);
		};

		Generator.prototype.debugTypeInfo = function(node) {

			var declInfo = node._declInfo;

			if(declInfo) {
				var buf = [];
				if(declInfo.type) {
					var t = this.toSwiftType(declInfo.type);
					buf.push(t);
				}
				if(declInfo.isAssigned) {
					buf.push("assigned");
				}
				return buf.join(',');
			} else {
				var typeInfo = node._typeInfo;
				if(typeInfo) {
					return this.toSwiftType(typeInfo);
				}
			}
			return 'Uknown';

		}

		Generator.prototype.PrimaryIdentifier = function(node) {		

			var ret;

			var declInfo = node._declInfo;
			
			if(declInfo && declInfo.kind == DeclInfo.KIND_ENUM_ITEM) {
				if(declInfo.type.tagName) {
					ret = declInfo.type.tagName + "." + _toSwiftEnumItemName(declInfo.type.tagName,declInfo.name);
				} else {
					ret = declInfo.name;
				}
			} else {
				ret = OBJC_TO_SWIFT_LITERAL_MAP[node.name]||OBJC_TO_SWIFT_TYPE_MAP[node.name]||node.name;
			}

			if(this.options.inlineDump) {
				return ret + "/*{" + this.debugTypeInfo(node) + "}*/";
			}

			return ret;
		};

		Generator.prototype.FloatingPointLiteral = function(node) {
			return node.token.replace(/\.[fFdD]$/,'.0').replace(/[fFdD]$/,'');
		};


		Generator.prototype.Identifier = function(node) {
			return node.name;
		};

		return Generator;

	})();


/***/ })
/******/ ]);