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
	        peg$c18 = "include",
	        peg$c19 = peg$literalExpectation("include", false),
	        peg$c20 = function(arg) {
	        		return {
	        			type:"IncludeDirective",
	        			argument:arg,
	        		};
	        	},
	        peg$c21 = function(spec, c1, decl, c2, comp) {
	        		return {
	        			type:"FunctionDefinition",
	        			specifiers:spec,
	        			c1:c1,
	        			declarator:decl,
	        			c2:c2,
	        			statement:comp,
	        		};
	        	},
	        peg$c22 = function(prefix, block, suffix) {
	        		return {
	        			type:"CompoundStatement",
	        			prefix:prefix,
	        			blockItems:block,
	        			suffix:suffix,
	        		};
	        	},
	        peg$c23 = function(m) {
	        		return {
	        			type:"StatementList",
	        			prefixes:extractList(m,0),
	        			statements:extractList(m,1),
	        		};
	        	},
	        peg$c24 = function(m) { return m; },
	        peg$c25 = ":",
	        peg$c26 = peg$literalExpectation(":", false),
	        peg$c27 = function(id, stmt) {
	          	return {
	          		type:"LabeledStatement",
	          		identifier:id,
	          		statement:stmt,
	          	};
	          },
	        peg$c28 = function(c1, expr, c2, c3, stmt) {
	          	return {
	          		c1:c1,
	          		type:"CaseStatement",
	          		c2:c2,
	          		expression:expr,
	          		c3:c3,
	          		statement:stmt
	          	};
	          },
	        peg$c29 = "(",
	        peg$c30 = peg$literalExpectation("(", false),
	        peg$c31 = ")",
	        peg$c32 = peg$literalExpectation(")", false),
	        peg$c33 = function(c1, c2, expression, c3, thenBlock, elseBlock) {
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
	        peg$c34 = function(c1, c2, e, c3, c4, s) {
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
	        peg$c35 = function(c1, c2, t, c3, c4, e, c5, c6, statement) {
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
	        peg$c36 = function(init, cond, loop, prefix, statement) {
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
	        peg$c37 = function(c1, c2, cond, c3, c4, statement) {
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
	        peg$c38 = function(prefix, statement, suffix, cond) {
	        		return {
	        			type:"DoStatement",
	        			prefix:prefix,
	        			statement:statement,
	        			suffix:suffix,
	        			condExpression:cond,			
	        		}
	        	},
	        peg$c39 = function(label, suffix) { 
	          		return {
	          			type:"GotoStatement",
	          			label:identifier,
	          			suffix:suffix,
	          		};
	          	},
	        peg$c40 = function(c1) { 
	          		return {
	          			type:"BreakStatement",
	          			c1:c1,
	          		};
	          	},
	        peg$c41 = function(c1, e, c2) { 
	          		return {
	          			type:"ReturnStatement",
	          			c1:c1,
	          			expression:e,
	          			c2:c2
	          	 	};
	          	},
	        peg$c42 = function(s, c1, d) {
	        		return {
	        			type:"TypeVariableDeclarator",
	        			specifiers:s,
	        			c1:c1,
	        			declarator:d
	        		};
	        	},
	        peg$c43 = function(c1, statement) {
	        		return {
	        			type:"TryStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c44 = function(c1, c2, declarator, c3, c4, statement) {
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
	        peg$c45 = function(c1, statement) {
	        		return {
	        			type:"FinallyStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c46 = function(c1, expression, c2) {
	        		return {
	        			type:"ThrowStatement",
	        			c1:c1,
	        			expression:expression,
	        			c2:c2,
	        		};
	        	},
	        peg$c47 = function(ts, cs, c1, fs) {
	        		return {
	        			type:"TryBlock",
	        			tryStatement:ts,
	        			catchStatements:cs,
	        			c1:c1,
	        			finallyStatement:fs,
	        		};
	        	},
	        peg$c48 = function(expression, statement) {
	        		return {
	        			type:"SynchronizedStatement",
	        			expression:expression,
	        			statement:statement,
	        		};
	        	},
	        peg$c49 = function(c1, statement) {
	        		return {
	        			type:"AutoreleaseStatement",
	        			c1:c1,
	        			statement:statement,
	        		};
	        	},
	        peg$c50 = ",",
	        peg$c51 = peg$literalExpectation(",", false),
	        peg$c52 = function(head, tail) {
	        		if(0<tail.length) {
	        			return {
	        				type:"Expression",
	        				children:[head].concat(tail)
	        			};
	        		} else {
	        			return head;
	        		}
	        	},
	        peg$c53 = function(lhs, c1, op, c2, rhs) {
	            	return {
	            		type:"AssignmentExpression",
	            		lhs:lhs,
	            		c1:c1,
	            		operator:op,
	            		c2:c2,
	            		rhs:rhs
	            	};
	            },
	        peg$c54 = "=",
	        peg$c55 = peg$literalExpectation("=", false),
	        peg$c56 = "*=",
	        peg$c57 = peg$literalExpectation("*=", false),
	        peg$c58 = "/=",
	        peg$c59 = peg$literalExpectation("/=", false),
	        peg$c60 = "%=",
	        peg$c61 = peg$literalExpectation("%=", false),
	        peg$c62 = "+=",
	        peg$c63 = peg$literalExpectation("+=", false),
	        peg$c64 = "-=",
	        peg$c65 = peg$literalExpectation("-=", false),
	        peg$c66 = "<<=",
	        peg$c67 = peg$literalExpectation("<<=", false),
	        peg$c68 = ">>=",
	        peg$c69 = peg$literalExpectation(">>=", false),
	        peg$c70 = "&=",
	        peg$c71 = peg$literalExpectation("&=", false),
	        peg$c72 = "^=",
	        peg$c73 = peg$literalExpectation("^=", false),
	        peg$c74 = "|=",
	        peg$c75 = peg$literalExpectation("|=", false),
	        peg$c76 = "?",
	        peg$c77 = peg$literalExpectation("?", false),
	        peg$c78 = function(m) {
	        		if(!m[4]) {
	        			m[4] = m[0];
	        		}
	        		return {
	        			type:"ConditionalExpression", children:m
	        		};
	        	},
	        peg$c79 = "||",
	        peg$c80 = peg$literalExpectation("||", false),
	        peg$c81 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"LogicalOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c82 = "&&",
	        peg$c83 = peg$literalExpectation("&&", false),
	        peg$c84 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"LogicalAndExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c85 = "|",
	        peg$c86 = peg$literalExpectation("|", false),
	        peg$c87 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"InclusiveOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c88 = "^",
	        peg$c89 = peg$literalExpectation("^", false),
	        peg$c90 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"ExclusiveOrExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c91 = "&",
	        peg$c92 = peg$literalExpectation("&", false),
	        peg$c93 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"AndExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c94 = "!=",
	        peg$c95 = peg$literalExpectation("!=", false),
	        peg$c96 = "==",
	        peg$c97 = peg$literalExpectation("==", false),
	        peg$c98 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"EqualityExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c99 = "<=",
	        peg$c100 = peg$literalExpectation("<=", false),
	        peg$c101 = ">=",
	        peg$c102 = peg$literalExpectation(">=", false),
	        peg$c103 = "<",
	        peg$c104 = peg$literalExpectation("<", false),
	        peg$c105 = ">",
	        peg$c106 = peg$literalExpectation(">", false),
	        peg$c107 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"RelationalExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c108 = "<<",
	        peg$c109 = peg$literalExpectation("<<", false),
	        peg$c110 = ">>",
	        peg$c111 = peg$literalExpectation(">>", false),
	        peg$c112 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"ShiftExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c113 = /^[+\-]/,
	        peg$c114 = peg$classExpectation(["+", "-"], false, false),
	        peg$c115 = function(head, tail) { 
	        		if(0<tail.length) {
	        			return {
	        				type:"AdditiveExpression",
	        				children:[head].concat(tail)
	        			};
	        		}
	        		return head;
	        	},
	        peg$c116 = /^[*\/%]/,
	        peg$c117 = peg$classExpectation(["*", "/", "%"], false, false),
	        peg$c118 = function(head, tail) { 
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
	        peg$c119 = function(t, e) {
	        		return {
	        			type:"CastExpression",
	        			castTo:t,
	        			expression:e
	        		};
	        	},
	        peg$c120 = "++",
	        peg$c121 = peg$literalExpectation("++", false),
	        peg$c122 = "--",
	        peg$c123 = peg$literalExpectation("--", false),
	        peg$c124 = function(m) {
	          		return {
	          			type:(m[0]=='++'?"UnaryIncExpression":"UnaryDecExpression"),
	          			children:m,
	          		};
	          	},
	        peg$c125 = function(m) {
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
	        peg$c126 = "*",
	        peg$c127 = peg$literalExpectation("*", false),
	        peg$c128 = "+",
	        peg$c129 = peg$literalExpectation("+", false),
	        peg$c130 = "-",
	        peg$c131 = peg$literalExpectation("-", false),
	        peg$c132 = "~",
	        peg$c133 = peg$literalExpectation("~", false),
	        peg$c134 = "!",
	        peg$c135 = peg$literalExpectation("!", false),
	        peg$c136 = function() { return text(); },
	        peg$c137 = function(head, tail) { 
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
	        peg$c138 = "[",
	        peg$c139 = peg$literalExpectation("[", false),
	        peg$c140 = "]",
	        peg$c141 = peg$literalExpectation("]", false),
	        peg$c142 = function(p) {
	        		return {
	        			type:"PostfixApplyOperation",
	        			parameters:p,
	        		};
	        	},
	        peg$c143 = ".",
	        peg$c144 = peg$literalExpectation(".", false),
	        peg$c145 = function(id) {
	        		return {
	        			type:"PostfixDotOperation",
	        			identifier:id
	        		};
	        	},
	        peg$c146 = "->",
	        peg$c147 = peg$literalExpectation("->", false),
	        peg$c148 = function(e) {
	        		return {
	        			type:"NestedExpression",
	        			expression:e
	        		};
	        	},
	        peg$c149 = function(m) {
	            	return{
	            		type:"Constant", 
	            		child:m
	            	};
	            },
	        peg$c150 = function() {
	            	return {
	            		type:"PrimaryIdentifier",
	            		name:text()
	            	};
	            },
	        peg$c151 = function() {
	            	return {
	            		type:"PrimaryIdentifier",
	            		name:text(),
	            	}
	            },
	        peg$c152 = "va_arg",
	        peg$c153 = peg$literalExpectation("va_arg", false),
	        peg$c154 = function(m) {return {type:"HexLiteral",token:m};},
	        peg$c155 = function(m) {return {type:"BinaryLiteral",token:m};},
	        peg$c156 = function(m) {return {type:"OctalLiteral",token:m};},
	        peg$c157 = function(m) {return {type:"CharacterLiteral",token:m};},
	        peg$c158 = function(m) {return {type:"BooleanLiteral",token:m};},
	        peg$c159 = function(m) {return {type:"FloatingPointLiteral",token:m};},
	        peg$c160 = function(m) {return {type:"DecimalLiteral",token:m};},
	        peg$c161 = function(m) { return {type:"StringLiteral",token:m};},
	        peg$c162 = "@{",
	        peg$c163 = peg$literalExpectation("@{", false),
	        peg$c164 = function(m) {
	        		return {
	        			type:"DictionaryExpression",
	        			body:m
	        		};
	        	},
	        peg$c165 = "@[",
	        peg$c166 = peg$literalExpectation("@[", false),
	        peg$c167 = function(m) {
	        		return {
	        			type:"ArrayExpression",
	        			body:m
	        		};
	        	},
	        peg$c168 = "@(",
	        peg$c169 = peg$literalExpectation("@(", false),
	        peg$c170 = function(e) {return e;},
	        peg$c171 = "@",
	        peg$c172 = peg$literalExpectation("@", false),
	        peg$c173 = function(head, tail) {
	        		return buildList(head,tail,3);
	        	},
	        peg$c174 = function() {
	        		return [];
	        	},
	        peg$c175 = function(t, c1, p, c2, s) {
	        		return {
	        			type:"BlockExpression",
	        			specifier:t,
	        			c1:c1,
	        			parameters:p,
	        			c2:c2,
	        			statement:s,
	        		};
	        	},
	        peg$c176 = function(r, s) {

	        		return {
	        			type:"MessageExpression",
	        			receiver:r,
	        			selector:s
	        		};
	        	},
	        peg$c177 = function(h, t) {
	        		return buildList(h,t,[0,1]);
	        	},
	        peg$c178 = function(s, c1, e) {
	            	return {
	            		type:"KeywordArgument",
	            		name:s?s.name:null,
	            		separator:c1,
	            		expression:e,
	            	};
	            },
	        peg$c179 = function(name) {
	        		return {
	        			type:"SelectorExpression",
	        			name:name
	        		};
	        	},
	        peg$c180 = function(name) {
	        		return {
	        			type:"ProtocolExpression",
	        			name:name
	        		};
	        	},
	        peg$c181 = function(name) {
	        		return {
	        			type:"EncodeExpression",
	        			arg:name,
	        			text:text()
	        		};
	        	},
	        peg$c182 = function(args) {
	        		return {
	        			type:"AvailableExpression",
	        			args:args
	        		};
	        	},
	        peg$c183 = function(spec, inhr, c1, p, c2, v, c3, d, c4) {
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
	        peg$c184 = function(spec, id, c1, p, c2, v, c3, d, c4) {
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
	        peg$c185 = function(spec, inhr, c2, v, c3, d, c4) {
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
	        peg$c186 = function(spec, c1, id, c3, d, c4) {
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
	        peg$c187 = function() {
	        		return {
	        			type:"ClassDeclarationList",
	        			_hidden:true,
	        		};
	        	},
	        peg$c188 = function() {
	        		return {
	        			type:"InstanceVariables",
	        			declarations:[],
	        		};
	        	},
	        peg$c189 = function(prefix, d, suffix) {
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
	        peg$c190 = function(c1, name, c2, p, decl, c3) {
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
	        peg$c191 = function() {
	        		return {
	        			type:"ProtocolDeclarationList",
	        			_hidden:true
	        		};
	        	},
	        peg$c192 = function(p) {
	        		return p;
	        	},
	        peg$c193 = function(head, tail) {
	        	return buildList(head,tail,3);
	        },
	        peg$c194 = function(head, tail) {
	            	return buildList(head,tail,[0,1]);
	            },
	        peg$c195 = function(m) { 
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
	        peg$c196 = function(m) {
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
	        peg$c197 = function(t, s, i, a, c1, statement) {
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
	        peg$c198 = function(p) {
	            	return {
	            		type:"PropertyImplementation",
	            		properties:p,
	            	};
	            },
	        peg$c199 = function(p) {
	            	return {
	            		type:"PropertyDynamicImplementation",
	            		properties:p,
	            	};    	
	            },
	        peg$c200 = function(head, tail) {
	            	return buildList(head,tail,3);
	            },
	        peg$c201 = function(id, sub) {
	            	var s = extractOptional(sub,3);
	            	return {
	            		type:"PropertySynthesizeItem",
	            		name:id.name,
	            		syntheName:s?s.name:null,
	            	};
	            },
	        peg$c202 = function(h, e) {
	        		return {
	        			type:"StructOrUnionSpecifier",
	        			isUnion:h.token=="union",
	        			name:e.name,
	        			c1:e.c1,
	        			declarations:e.declarations,
	        			c2:e.c2,
	        		};
	        	},
	        peg$c203 = function(id, c1, d, c2) {
	        		return {
	        			tagName:id?id.name:null,
	        			c1:c1,
	        			declarations:d,
	        			c2:c2
	        		};
	        	},
	        peg$c204 = function(id) {
	        		return {tagName:id.name};
	        	},
	        peg$c205 = function(q, d, a) {
	        		return {
	        			type:"StructDeclaration",
	        			specifiers:q,
	        			declarators:d,
	        		};
	        	},
	        peg$c206 = function(head, tail) {
	        		return buildList(head,tail,2);
	        	},
	        peg$c207 = function(d, c) {
	        		return { type:"UnionDeclarator", declarator:d, width:c };
	        	},
	        peg$c208 = function(c1, id, type, c2, c3, enums, c4) {
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
	        peg$c209 = function(c1, id, type) {
	        		return {
	        			type:"EnumSpecifier", 
	        			c1:c1,
	        			tagName:id?id.name:null,
	        			c2:'',
	        			c3:'',
	        			baseTypeSpecifiers:extractOptional(type,3),
	        		};
	        	},
	        peg$c210 = function(head, tail, rest) {
	        		var result = buildList(head,tail,[0,2,3]);
	        		if(rest) {
	        			result.push(rest[0]);
	        		}
	        		return result;
	        	},
	        peg$c211 = function(name, expr) {
	        		return {
	        			type:"Enumerator",
	        			name:name.name,
	        			expression:extractOptional(expr,3)
	        		};
	        	},
	        peg$c212 = function(p, d, a) {
	        		return {
	        			type:"Declarator",
	        			pointer:p, 
	        			name:d.name,
	        			directDeclarator:d,
	        			attributes:extractOptional(a,1),
	        		};
	        	},
	        peg$c213 = function(q, p) {
	             	return {
	             		type:"Pointer",
	             		qualifiers:extractList(q,1),
	             		child:p,
	             	};
	             },
	        peg$c214 = "(^",
	        peg$c215 = peg$literalExpectation("(^", false),
	        peg$c216 = function(s, i, p) {
	            	return {
	            		type:"BlockDirectDeclarator", // compatible with BlockTypeSpecifier
	            		specifiers:extractOptional(s,1),
	            		name:i.name,
	            		parameters:p,
	            	};
	            },
	        peg$c217 = function(q, d, s) {
	            	return {
	            		type:"FunctionDirectDeclarator",
	            		qualifiers:extractList(q,1),
	            		name:d.name,
	            		declarator:d,
	            		suffixes:extractList(s,1),
	            	};
	            },
	        peg$c218 = function(q, i, s) {
	        		return {
	        			type:"DirectDeclarator",
	        			qualifiers:extractList(q,0),
	        			name:i.name,
	        			suffixes:extractList(s,1),
	        		};
	        	},
	        peg$c219 = function(m) {
	        		return {
	        			type:"DeclaratorLookupSuffix",
	        			children:m,
	        			expression:m[2],
	        		};
	        		
	        	},
	        peg$c220 = function(m) {
	         		return {
	         			type:"DeclaratorApplySuffix",
	         			children:m,
	         			parameters:m[2]?m[2].parameters:null,
	         			isVariadic:m[2]?m[2].v:null,
	         		};
	         	},
	        peg$c221 = "...",
	        peg$c222 = peg$literalExpectation("...", false),
	        peg$c223 = function(p, v) {
	        		return {
	        			type:"ParameterList",
	        			parameters:p,
	        			isVariadic:v?true:false,
	        		};
	        	},
	        peg$c224 = function(head, tail) {
	        		return buildList(head,tail,1);
	        	},
	        peg$c225 = function(spec, c1, decl, c2) {
	        		return {
	        			type:"Declaration",
	        			specifiers:spec,
	        			c1:c1,
	        			initDeclarators:decl,
	        			c2:c2,
	        		};
	        	},
	        peg$c226 = /^[{:;)=,]/,
	        peg$c227 = peg$classExpectation(["{", ":", ";", ")", "=", ","], false, false),
	        peg$c228 = function(m) {
	        		return {
	        			type:"StorageClassSpecifier",
	        			token:text()
	        		};
	        	},
	        peg$c229 = function(e) {
	        		return {
	        			type:"TypeofSpecifier",
	        			expression:e,
	        			text:text(),
	        		};
	        	},
	        peg$c230 = function(s, id, p) {
	        		return {
	        			type:"BlockTypeSpecifier",
	        			specifiers:extractOptional(s,1),
	        			name:id?id.name:null,
	        			parameters:extractOptional(p,1),
	        		};
	        	},
	        peg$c231 = function(p) {
	        		return {
	        			type:"ProtocolTypeSpecifier",
	        			protocols:p,
	        		};
	        	},
	        peg$c232 = function(i, g) { 
	        		return {
	        			type:"TypeNameSpecifier",
	        			name:i.name,
	        			generics:extractOptional(g,1),
	        		};
	        	},
	        peg$c233 = function(i) {return isTypeName(i.name);},
	        peg$c234 = function(i) {
	        		return i;
	        	},
	        peg$c235 = function(head, tail) {
	        		return {
	        			type:"TypeParameterList",
	        			parameters:buildList(head,tail,3),
	        		};
	        	},
	        peg$c236 = function() {
	        		return {
	        			type:"TypeParameterList",
	        			parameters:null,
	        		};
	        	},
	        peg$c237 = function(m) { 
	        		return {
	        			type:"BasicTypeSpecifier",
	        			token:text()
	        		}; 
	        	},
	        peg$c238 = function(m) {
	        		return {type:"TypeQualifier",token:text()};
	        	},
	        peg$c239 = "((",
	        peg$c240 = peg$literalExpectation("((", false),
	        peg$c241 = "))",
	        peg$c242 = peg$literalExpectation("))", false),
	        peg$c243 = function() {
	        		return {
	        			type:"AttributeQualifier",token:text()
	        		};
	        	},
	        peg$c244 = function() {
	        		return {type:"ProtocolQualifier",token:text()};
	        	},
	        peg$c245 = function(m) {
	        		return {type:"ArcBehaviourQualifier",token:text()};
	        	},
	        peg$c246 = function() {
	        		return {type:"NullabilityQualifier",token:"nullable"};
	        	},
	        peg$c247 = function() {
	        		return {type:"NullabilityQualifier",token:"nonnull"};
	        	},
	        peg$c248 = function() {
	        		return {type:"NuulabilityQualifier",token:"null_unspecified"};
	        	},
	        peg$c249 = function(decl, init) {
	        		return {
	        			type:"InitDeclarator",
	        			declarator:decl,
	        			cast:extractOptional(init,3),
	        			initializer:extractOptional(init,5),
	        		};
	        	},
	        peg$c250 = function(m) {
	        	return {
	        		type:"ClassMethodDeclaration",
	        		returnType:m.returnType,
	        		selector:m.selector,
	        		attributes:m.attributes,
	        	};
	        },
	        peg$c251 = function(m) {
	        	return {
	        		type:"InstanceMethodDeclaration",
	        		returnType:m.returnType,
	        		selector:m.selector,
	        		attributes:m.attributes,
	        	};
	        },
	        peg$c252 = function(t, s, a) {
	        	return {
	        		type:"MethodDeclaration",
	        		returnType:t,
	        		selector:s,
	        		attributes:a,
	        	};
	        },
	        peg$c253 = function(t) {
	        	return t;
	        },
	        peg$c254 = function(head, tail, va) {

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
	        peg$c255 = function(s) {
	        		return {
	        			type:"MethodSelector",
	        			name:s.name,
	        			selector:s,
	        		};
	        	},
	        peg$c256 = function(s, t, u, i) {
	        		return {
	        			type:"KeywordDeclarator",
	        			label:s?s.name:null,
	        			methodType:extractOptional(t,1),
	        			unused:extractOptional(u,1),
	        			name:i.name,
	        		};
	        	},
	        peg$c257 = function(s, d) {
	        		return {
	        			type:"TypeName",
	        			specifiers:s,
	        			abstractDeclarator:extractOptional(d,1),
	        		};
	        	},
	        peg$c258 = function(p, tail) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Pointer",
	        			pointer:p,
	        			child:extractOptional(tail,1),
	        		};
	        	},
	        peg$c259 = function(spec, a) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Specifier",
	        			specifier:spec,
	        			child:extractOptional(a,1),
	        		};		
	        	},
	        peg$c260 = function(a, s) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Apply",
	        			child:extractOptional(a,1),
	        			suffixes:extractList(s,1),
	        		};
	        	},
	        peg$c261 = function(m) {
	        		return {
	        			type:"AbstractDeclarator",
	        			subType:"Subscript",
	        			child:extractList(m,3),
	        		};
	        	},
	        peg$c262 = function(s, d) {
	        	return {
	        		type:"ParameterDeclaration",
	        		specifiers:s,
	        		declarator:extractOptional(d,1),
	        	};
	        },
	        peg$c263 = function(attr, decl) {
	        	return {
	        		type:"PropertyDeclaration",
	        		attributes:attr,
	        		declaration:decl,
	        	};
	        },
	        peg$c264 = function(m) {
	        		return extractOptional(m,1);
	        	},
	        peg$c265 = function(name) { 
	        		return {type:"Identifier", name:name};
	        	},
	        peg$c266 = /^[A-Za-z_]/,
	        peg$c267 = peg$classExpectation([["A", "Z"], ["a", "z"], "_"], false, false),
	        peg$c268 = /^[A-Za-z_0-9]/,
	        peg$c269 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false),
	        peg$c270 = "@YES",
	        peg$c271 = peg$literalExpectation("@YES", false),
	        peg$c272 = "@NO",
	        peg$c273 = peg$literalExpectation("@NO", false),
	        peg$c274 = "\"",
	        peg$c275 = peg$literalExpectation("\"", false),
	        peg$c276 = /^[^\\"]/,
	        peg$c277 = peg$classExpectation(["\\", "\""], true, false),
	        peg$c278 = /^[^\\>]/,
	        peg$c279 = peg$classExpectation(["\\", ">"], true, false),
	        peg$c280 = "\\",
	        peg$c281 = peg$literalExpectation("\\", false),
	        peg$c282 = /^[btnfr?"'\\]/,
	        peg$c283 = peg$classExpectation(["b", "t", "n", "f", "r", "?", "\"", "'", "\\"], false, false),
	        peg$c284 = /^[0-3]/,
	        peg$c285 = peg$classExpectation([["0", "3"]], false, false),
	        peg$c286 = /^[0-7]/,
	        peg$c287 = peg$classExpectation([["0", "7"]], false, false),
	        peg$c288 = "x",
	        peg$c289 = peg$literalExpectation("x", false),
	        peg$c290 = /^[0-9a-fA-F]/,
	        peg$c291 = peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false),
	        peg$c292 = function() {1,2},
	        peg$c293 = "u",
	        peg$c294 = peg$literalExpectation("u", false),
	        peg$c295 = function() {4},
	        peg$c296 = "0",
	        peg$c297 = peg$literalExpectation("0", false),
	        peg$c298 = "b",
	        peg$c299 = peg$literalExpectation("b", false),
	        peg$c300 = "B",
	        peg$c301 = peg$literalExpectation("B", false),
	        peg$c302 = /^[0-1]/,
	        peg$c303 = peg$classExpectation([["0", "1"]], false, false),
	        peg$c304 = "X",
	        peg$c305 = peg$literalExpectation("X", false),
	        peg$c306 = /^[1-9]/,
	        peg$c307 = peg$classExpectation([["1", "9"]], false, false),
	        peg$c308 = /^[0-9]/,
	        peg$c309 = peg$classExpectation([["0", "9"]], false, false),
	        peg$c310 = "'",
	        peg$c311 = peg$literalExpectation("'", false),
	        peg$c312 = /^[^'\\]/,
	        peg$c313 = peg$classExpectation(["'", "\\"], true, false),
	        peg$c314 = /^[uUlL]/,
	        peg$c315 = peg$classExpectation(["u", "U", "l", "L"], false, false),
	        peg$c316 = /^[eE]/,
	        peg$c317 = peg$classExpectation(["e", "E"], false, false),
	        peg$c318 = /^[fFdD]/,
	        peg$c319 = peg$classExpectation(["f", "F", "d", "D"], false, false),
	        peg$c320 = "case",
	        peg$c321 = peg$literalExpectation("case", false),
	        peg$c322 = "default",
	        peg$c323 = peg$literalExpectation("default", false),
	        peg$c324 = "if",
	        peg$c325 = peg$literalExpectation("if", false),
	        peg$c326 = "else",
	        peg$c327 = peg$literalExpectation("else", false),
	        peg$c328 = "switch",
	        peg$c329 = peg$literalExpectation("switch", false),
	        peg$c330 = "sizeof",
	        peg$c331 = peg$literalExpectation("sizeof", false),
	        peg$c332 = "typeof",
	        peg$c333 = peg$literalExpectation("typeof", false),
	        peg$c334 = "typedef",
	        peg$c335 = peg$literalExpectation("typedef", false),
	        peg$c336 = "struct",
	        peg$c337 = peg$literalExpectation("struct", false),
	        peg$c338 = "union",
	        peg$c339 = peg$literalExpectation("union", false),
	        peg$c340 = "enum",
	        peg$c341 = peg$literalExpectation("enum", false),
	        peg$c342 = "self",
	        peg$c343 = peg$literalExpectation("self", false),
	        peg$c344 = "super",
	        peg$c345 = peg$literalExpectation("super", false),
	        peg$c346 = "for",
	        peg$c347 = peg$literalExpectation("for", false),
	        peg$c348 = "do",
	        peg$c349 = peg$literalExpectation("do", false),
	        peg$c350 = "while",
	        peg$c351 = peg$literalExpectation("while", false),
	        peg$c352 = "goto",
	        peg$c353 = peg$literalExpectation("goto", false),
	        peg$c354 = "continue",
	        peg$c355 = peg$literalExpectation("continue", false),
	        peg$c356 = "break",
	        peg$c357 = peg$literalExpectation("break", false),
	        peg$c358 = "return",
	        peg$c359 = peg$literalExpectation("return", false),
	        peg$c360 = "@interface",
	        peg$c361 = peg$literalExpectation("@interface", false),
	        peg$c362 = "@implementation",
	        peg$c363 = peg$literalExpectation("@implementation", false),
	        peg$c364 = "@end",
	        peg$c365 = peg$literalExpectation("@end", false),
	        peg$c366 = "@private",
	        peg$c367 = peg$literalExpectation("@private", false),
	        peg$c368 = "@public",
	        peg$c369 = peg$literalExpectation("@public", false),
	        peg$c370 = "@package",
	        peg$c371 = peg$literalExpectation("@package", false),
	        peg$c372 = "@protected",
	        peg$c373 = peg$literalExpectation("@protected", false),
	        peg$c374 = "@property",
	        peg$c375 = peg$literalExpectation("@property", false),
	        peg$c376 = "@synthesize",
	        peg$c377 = peg$literalExpectation("@synthesize", false),
	        peg$c378 = "@dynamic",
	        peg$c379 = peg$literalExpectation("@dynamic", false),
	        peg$c380 = "@required",
	        peg$c381 = peg$literalExpectation("@required", false),
	        peg$c382 = "@selector",
	        peg$c383 = peg$literalExpectation("@selector", false),
	        peg$c384 = "@class",
	        peg$c385 = peg$literalExpectation("@class", false),
	        peg$c386 = "@protocol",
	        peg$c387 = peg$literalExpectation("@protocol", false),
	        peg$c388 = "@encode",
	        peg$c389 = peg$literalExpectation("@encode", false),
	        peg$c390 = "@available",
	        peg$c391 = peg$literalExpectation("@available", false),
	        peg$c392 = "@optional",
	        peg$c393 = peg$literalExpectation("@optional", false),
	        peg$c394 = "@try",
	        peg$c395 = peg$literalExpectation("@try", false),
	        peg$c396 = "@catch",
	        peg$c397 = peg$literalExpectation("@catch", false),
	        peg$c398 = "@finally",
	        peg$c399 = peg$literalExpectation("@finally", false),
	        peg$c400 = "@throw",
	        peg$c401 = peg$literalExpectation("@throw", false),
	        peg$c402 = "@synchronized",
	        peg$c403 = peg$literalExpectation("@synchronized", false),
	        peg$c404 = "@autoreleasepool",
	        peg$c405 = peg$literalExpectation("@autoreleasepool", false),
	        peg$c406 = "void",
	        peg$c407 = peg$literalExpectation("void", false),
	        peg$c408 = "char",
	        peg$c409 = peg$literalExpectation("char", false),
	        peg$c410 = "short",
	        peg$c411 = peg$literalExpectation("short", false),
	        peg$c412 = "int",
	        peg$c413 = peg$literalExpectation("int", false),
	        peg$c414 = "long",
	        peg$c415 = peg$literalExpectation("long", false),
	        peg$c416 = "float",
	        peg$c417 = peg$literalExpectation("float", false),
	        peg$c418 = "double",
	        peg$c419 = peg$literalExpectation("double", false),
	        peg$c420 = "signed",
	        peg$c421 = peg$literalExpectation("signed", false),
	        peg$c422 = "unsigned",
	        peg$c423 = peg$literalExpectation("unsigned", false),
	        peg$c424 = "instancetype",
	        peg$c425 = peg$literalExpectation("instancetype", false),
	        peg$c426 = "id",
	        peg$c427 = peg$literalExpectation("id", false),
	        peg$c428 = "__unsafe_unretained",
	        peg$c429 = peg$literalExpectation("__unsafe_unretained", false),
	        peg$c430 = "__weak",
	        peg$c431 = peg$literalExpectation("__weak", false),
	        peg$c432 = "__autoreleasing",
	        peg$c433 = peg$literalExpectation("__autoreleasing", false),
	        peg$c434 = "__strong",
	        peg$c435 = peg$literalExpectation("__strong", false),
	        peg$c436 = "__typeof",
	        peg$c437 = peg$literalExpectation("__typeof", false),
	        peg$c438 = "__typeof__",
	        peg$c439 = peg$literalExpectation("__typeof__", false),
	        peg$c440 = "__covariant",
	        peg$c441 = peg$literalExpectation("__covariant", false),
	        peg$c442 = "__kindof",
	        peg$c443 = peg$literalExpectation("__kindof", false),
	        peg$c444 = "__nonnull",
	        peg$c445 = peg$literalExpectation("__nonnull", false),
	        peg$c446 = "__nullable",
	        peg$c447 = peg$literalExpectation("__nullable", false),
	        peg$c448 = "__null_unspecified",
	        peg$c449 = peg$literalExpectation("__null_unspecified", false),
	        peg$c450 = "_Nonnull",
	        peg$c451 = peg$literalExpectation("_Nonnull", false),
	        peg$c452 = "_Nullable",
	        peg$c453 = peg$literalExpectation("_Nullable", false),
	        peg$c454 = "_Null_unspecified",
	        peg$c455 = peg$literalExpectation("_Null_unspecified", false),
	        peg$c456 = "__attribute__",
	        peg$c457 = peg$literalExpectation("__attribute__", false),
	        peg$c458 = "__deprecated",
	        peg$c459 = peg$literalExpectation("__deprecated", false),
	        peg$c460 = "__unused",
	        peg$c461 = peg$literalExpectation("__unused", false),
	        peg$c462 = "__block",
	        peg$c463 = peg$literalExpectation("__block", false),
	        peg$c464 = "auto",
	        peg$c465 = peg$literalExpectation("auto", false),
	        peg$c466 = "register",
	        peg$c467 = peg$literalExpectation("register", false),
	        peg$c468 = "static",
	        peg$c469 = peg$literalExpectation("static", false),
	        peg$c470 = "extern",
	        peg$c471 = peg$literalExpectation("extern", false),
	        peg$c472 = "const",
	        peg$c473 = peg$literalExpectation("const", false),
	        peg$c474 = "volatile",
	        peg$c475 = peg$literalExpectation("volatile", false),
	        peg$c476 = "inline",
	        peg$c477 = peg$literalExpectation("inline", false),
	        peg$c478 = "restrict",
	        peg$c479 = peg$literalExpectation("restrict", false),
	        peg$c480 = "in",
	        peg$c481 = peg$literalExpectation("in", false),
	        peg$c482 = "out",
	        peg$c483 = peg$literalExpectation("out", false),
	        peg$c484 = "inout",
	        peg$c485 = peg$literalExpectation("inout", false),
	        peg$c486 = "bycopy",
	        peg$c487 = peg$literalExpectation("bycopy", false),
	        peg$c488 = "byref",
	        peg$c489 = peg$literalExpectation("byref", false),
	        peg$c490 = "oneway",
	        peg$c491 = peg$literalExpectation("oneway", false),
	        peg$c492 = "nonatomic",
	        peg$c493 = peg$literalExpectation("nonatomic", false),
	        peg$c494 = "copy",
	        peg$c495 = peg$literalExpectation("copy", false),
	        peg$c496 = "assign",
	        peg$c497 = peg$literalExpectation("assign", false),
	        peg$c498 = "weak",
	        peg$c499 = peg$literalExpectation("weak", false),
	        peg$c500 = "strong",
	        peg$c501 = peg$literalExpectation("strong", false),
	        peg$c502 = "retain",
	        peg$c503 = peg$literalExpectation("retain", false),
	        peg$c504 = "readonly",
	        peg$c505 = peg$literalExpectation("readonly", false),
	        peg$c506 = "readwrite",
	        peg$c507 = peg$literalExpectation("readwrite", false),
	        peg$c508 = "getter",
	        peg$c509 = peg$literalExpectation("getter", false),
	        peg$c510 = "setter",
	        peg$c511 = peg$literalExpectation("setter", false),
	        peg$c512 = "nonnull",
	        peg$c513 = peg$literalExpectation("nonnull", false),
	        peg$c514 = "nullable",
	        peg$c515 = peg$literalExpectation("nullable", false),
	        peg$c516 = "null_unspecified",
	        peg$c517 = peg$literalExpectation("null_unspecified", false),
	        peg$c518 = "NS_ASSUME_NONNULL_BEGIN",
	        peg$c519 = peg$literalExpectation("NS_ASSUME_NONNULL_BEGIN", false),
	        peg$c520 = "NS_ASSUME_NONNULL_END",
	        peg$c521 = peg$literalExpectation("NS_ASSUME_NONNULL_END", false),
	        peg$c522 = "_Bool",
	        peg$c523 = peg$literalExpectation("_Bool", false),
	        peg$c524 = "_Complex",
	        peg$c525 = peg$literalExpectation("_Complex", false),
	        peg$c526 = "_Imaginary",
	        peg$c527 = peg$literalExpectation("_Imaginary", false),
	        peg$c528 = /^[ \t\x0B\f\xA0\uFEFF \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
	        peg$c529 = peg$classExpectation([" ", "\t", "\x0B", "\f", "\xA0", "\uFEFF", " ", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u202F", "\u205F", "\u3000"], false, false),
	        peg$c530 = /^[\r\n\u2028\u2029]/,
	        peg$c531 = peg$classExpectation(["\r", "\n", "\u2028", "\u2029"], false, false),
	        peg$c532 = "/*",
	        peg$c533 = peg$literalExpectation("/*", false),
	        peg$c534 = "*/",
	        peg$c535 = peg$literalExpectation("*/", false),
	        peg$c536 = "//",
	        peg$c537 = peg$literalExpectation("//", false),
	        peg$c538 = "define",
	        peg$c539 = peg$literalExpectation("define", false),
	        peg$c540 = "undef",
	        peg$c541 = peg$literalExpectation("undef", false),
	        peg$c542 = "warning",
	        peg$c543 = peg$literalExpectation("warning", false),
	        peg$c544 = "error",
	        peg$c545 = peg$literalExpectation("error", false),
	        peg$c546 = "line",
	        peg$c547 = peg$literalExpectation("line", false),
	        peg$c548 = "ifdef",
	        peg$c549 = peg$literalExpectation("ifdef", false),
	        peg$c550 = "ifndef",
	        peg$c551 = peg$literalExpectation("ifndef", false),
	        peg$c552 = "endif",
	        peg$c553 = peg$literalExpectation("endif", false),
	        peg$c554 = "elif",
	        peg$c555 = peg$literalExpectation("elif", false),
	        peg$c556 = "pragma",
	        peg$c557 = peg$literalExpectation("pragma", false),
	        peg$c558 = "end",
	        peg$c559 = peg$literalExpectation("end", false),

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

	      var key    = peg$currPos * 275 + 0,
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

	      var key    = peg$currPos * 275 + 1,
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

	      var key    = peg$currPos * 275 + 2,
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

	      var key    = peg$currPos * 275 + 3,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$parseImportDirective();
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

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImportDirective() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 275 + 4,
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

	    function peg$parseIncludeDirective() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 275 + 5,
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
	          if (input.substr(peg$currPos, 7) === peg$c18) {
	            s3 = peg$c18;
	            peg$currPos += 7;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c19); }
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
	                s1 = peg$c20(s5);
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

	      var key    = peg$currPos * 275 + 6,
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
	                s1 = peg$c21(s1, s2, s3, s4, s5);
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

	      var key    = peg$currPos * 275 + 7,
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
	                s1 = peg$c22(s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 8,
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
	        s1 = peg$c23(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStatement() {
	      var s0;

	      var key    = peg$currPos * 275 + 9,
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

	      var key    = peg$currPos * 275 + 10,
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
	          s1 = peg$c24(s1);
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

	      var key    = peg$currPos * 275 + 11,
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
	            s3 = peg$c25;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c26); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseStatement();
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c27(s1, s5);
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
	                  s5 = peg$c25;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c26); }
	                }
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parse__();
	                  if (s6 !== peg$FAILED) {
	                    s7 = peg$parseStatement();
	                    if (s7 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c28(s2, s3, s4, s6, s7);
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
	                s3 = peg$c25;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c26); }
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

	      var key    = peg$currPos * 275 + 12,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                        s1 = peg$c33(s2, s4, s5, s6, s8, s9);
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
	              s3 = peg$c29;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c30); }
	            }
	            if (s3 !== peg$FAILED) {
	              s4 = peg$parse__();
	              if (s4 !== peg$FAILED) {
	                s5 = peg$parseExpression();
	                if (s5 !== peg$FAILED) {
	                  s6 = peg$parse__();
	                  if (s6 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 41) {
	                      s7 = peg$c31;
	                      peg$currPos++;
	                    } else {
	                      s7 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                    }
	                    if (s7 !== peg$FAILED) {
	                      s8 = peg$parse__();
	                      if (s8 !== peg$FAILED) {
	                        s9 = peg$parseStatement();
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
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseForInStatement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

	      var key    = peg$currPos * 275 + 13,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                            s11 = peg$c31;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                          }
	                          if (s11 !== peg$FAILED) {
	                            s12 = peg$parse__();
	                            if (s12 !== peg$FAILED) {
	                              s13 = peg$parseStatement();
	                              if (s13 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$c35(s2, s4, s5, s6, s8, s9, s10, s12, s13);
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

	      var key    = peg$currPos * 275 + 14,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                                s13 = peg$c31;
	                                peg$currPos++;
	                              } else {
	                                s13 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                              }
	                              if (s13 !== peg$FAILED) {
	                                s14 = peg$parse__();
	                                if (s14 !== peg$FAILED) {
	                                  s15 = peg$parseStatement();
	                                  if (s15 !== peg$FAILED) {
	                                    peg$savedPos = s0;
	                                    s1 = peg$c36(s5, s8, s11, s14, s15);
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

	      var key    = peg$currPos * 275 + 15,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c37(s2, s4, s5, s6, s8, s9);
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

	      var key    = peg$currPos * 275 + 16,
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
	                    s7 = peg$c29;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c30); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseExpression();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s11 = peg$c31;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                                s1 = peg$c38(s2, s3, s4, s9);
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

	      var key    = peg$currPos * 275 + 17,
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

	      var key    = peg$currPos * 275 + 18,
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
	                s1 = peg$c39(s3, s4);
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
	            s1 = peg$c24(s1);
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
	                s1 = peg$c40(s2);
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
	                      s1 = peg$c41(s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 19,
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
	            s1 = peg$c42(s1, s2, s3);
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

	      var key    = peg$currPos * 275 + 20,
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
	            s1 = peg$c43(s2, s3);
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

	      var key    = peg$currPos * 275 + 21,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeVariableDeclarator();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseCompoundStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c44(s2, s4, s5, s6, s8, s9);
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

	      var key    = peg$currPos * 275 + 22,
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
	            s1 = peg$c45(s2, s3);
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

	      var key    = peg$currPos * 275 + 23,
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
	                s1 = peg$c46(s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 24,
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
	              s1 = peg$c47(s1, s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 25,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseUnaryExpression();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseCompoundStatement();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c48(s5, s9);
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

	      var key    = peg$currPos * 275 + 26,
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
	            s1 = peg$c49(s2, s3);
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

	      var key    = peg$currPos * 275 + 27,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c52(s1, s2);
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

	      var key    = peg$currPos * 275 + 28,
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
	                s1 = peg$c53(s1, s2, s3, s4, s5);
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

	      var key    = peg$currPos * 275 + 29,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (input.charCodeAt(peg$currPos) === 61) {
	        s0 = peg$c54;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c55); }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c56) {
	          s0 = peg$c56;
	          peg$currPos += 2;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c57); }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c58) {
	            s0 = peg$c58;
	            peg$currPos += 2;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c59); }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c60) {
	              s0 = peg$c60;
	              peg$currPos += 2;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c61); }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c62) {
	                s0 = peg$c62;
	                peg$currPos += 2;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c63); }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.substr(peg$currPos, 2) === peg$c64) {
	                  s0 = peg$c64;
	                  peg$currPos += 2;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c65); }
	                }
	                if (s0 === peg$FAILED) {
	                  if (input.substr(peg$currPos, 3) === peg$c66) {
	                    s0 = peg$c66;
	                    peg$currPos += 3;
	                  } else {
	                    s0 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c67); }
	                  }
	                  if (s0 === peg$FAILED) {
	                    if (input.substr(peg$currPos, 3) === peg$c68) {
	                      s0 = peg$c68;
	                      peg$currPos += 3;
	                    } else {
	                      s0 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c69); }
	                    }
	                    if (s0 === peg$FAILED) {
	                      if (input.substr(peg$currPos, 2) === peg$c70) {
	                        s0 = peg$c70;
	                        peg$currPos += 2;
	                      } else {
	                        s0 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c71); }
	                      }
	                      if (s0 === peg$FAILED) {
	                        if (input.substr(peg$currPos, 2) === peg$c72) {
	                          s0 = peg$c72;
	                          peg$currPos += 2;
	                        } else {
	                          s0 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c73); }
	                        }
	                        if (s0 === peg$FAILED) {
	                          if (input.substr(peg$currPos, 2) === peg$c74) {
	                            s0 = peg$c74;
	                            peg$currPos += 2;
	                          } else {
	                            s0 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c75); }
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

	      var key    = peg$currPos * 275 + 30,
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
	            s4 = peg$c76;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c77); }
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
	                    s8 = peg$c25;
	                    peg$currPos++;
	                  } else {
	                    s8 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	        s1 = peg$c78(s1);
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

	      var key    = peg$currPos * 275 + 31,
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
	          if (input.substr(peg$currPos, 2) === peg$c79) {
	            s5 = peg$c79;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c80); }
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
	            if (input.substr(peg$currPos, 2) === peg$c79) {
	              s5 = peg$c79;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c80); }
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
	          s1 = peg$c81(s1, s2);
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

	      var key    = peg$currPos * 275 + 32,
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
	          if (input.substr(peg$currPos, 2) === peg$c82) {
	            s5 = peg$c82;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c83); }
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
	            if (input.substr(peg$currPos, 2) === peg$c82) {
	              s5 = peg$c82;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c83); }
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
	          s1 = peg$c84(s1, s2);
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

	      var key    = peg$currPos * 275 + 33,
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
	            s7 = peg$c85;
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c86); }
	          }
	          if (s7 !== peg$FAILED) {
	            s8 = peg$currPos;
	            peg$silentFails++;
	            if (input.charCodeAt(peg$currPos) === 124) {
	              s9 = peg$c85;
	              peg$currPos++;
	            } else {
	              s9 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c86); }
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
	              s7 = peg$c85;
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c86); }
	            }
	            if (s7 !== peg$FAILED) {
	              s8 = peg$currPos;
	              peg$silentFails++;
	              if (input.charCodeAt(peg$currPos) === 124) {
	                s9 = peg$c85;
	                peg$currPos++;
	              } else {
	                s9 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c86); }
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
	          s1 = peg$c87(s1, s2);
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

	      var key    = peg$currPos * 275 + 34,
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
	            s5 = peg$c88;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c89); }
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
	              s5 = peg$c88;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c89); }
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
	          s1 = peg$c90(s1, s2);
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

	      var key    = peg$currPos * 275 + 35,
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
	            s7 = peg$c91;
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c92); }
	          }
	          if (s7 !== peg$FAILED) {
	            s8 = peg$currPos;
	            peg$silentFails++;
	            if (input.charCodeAt(peg$currPos) === 38) {
	              s9 = peg$c91;
	              peg$currPos++;
	            } else {
	              s9 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c92); }
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
	              s7 = peg$c91;
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c92); }
	            }
	            if (s7 !== peg$FAILED) {
	              s8 = peg$currPos;
	              peg$silentFails++;
	              if (input.charCodeAt(peg$currPos) === 38) {
	                s9 = peg$c91;
	                peg$currPos++;
	              } else {
	                s9 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c92); }
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
	          s1 = peg$c93(s1, s2);
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

	      var key    = peg$currPos * 275 + 36,
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
	          if (input.substr(peg$currPos, 2) === peg$c94) {
	            s5 = peg$c94;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c95); }
	          }
	          if (s5 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c96) {
	              s5 = peg$c96;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c97); }
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
	            if (input.substr(peg$currPos, 2) === peg$c94) {
	              s5 = peg$c94;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c95); }
	            }
	            if (s5 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c96) {
	                s5 = peg$c96;
	                peg$currPos += 2;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c97); }
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
	          s1 = peg$c98(s1, s2);
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

	      var key    = peg$currPos * 275 + 37,
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
	          if (input.substr(peg$currPos, 2) === peg$c99) {
	            s6 = peg$c99;
	            peg$currPos += 2;
	          } else {
	            s6 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c100); }
	          }
	          if (s6 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c101) {
	              s6 = peg$c101;
	              peg$currPos += 2;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c102); }
	            }
	            if (s6 === peg$FAILED) {
	              s6 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 60) {
	                s7 = peg$c103;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c104); }
	              }
	              if (s7 !== peg$FAILED) {
	                s8 = peg$currPos;
	                peg$silentFails++;
	                if (input.charCodeAt(peg$currPos) === 60) {
	                  s9 = peg$c103;
	                  peg$currPos++;
	                } else {
	                  s9 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c104); }
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
	                  s7 = peg$c105;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c106); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$currPos;
	                  peg$silentFails++;
	                  if (input.charCodeAt(peg$currPos) === 62) {
	                    s9 = peg$c105;
	                    peg$currPos++;
	                  } else {
	                    s9 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c106); }
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
	            if (input.substr(peg$currPos, 2) === peg$c99) {
	              s6 = peg$c99;
	              peg$currPos += 2;
	            } else {
	              s6 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c100); }
	            }
	            if (s6 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c101) {
	                s6 = peg$c101;
	                peg$currPos += 2;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c102); }
	              }
	              if (s6 === peg$FAILED) {
	                s6 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 60) {
	                  s7 = peg$c103;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c104); }
	                }
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$currPos;
	                  peg$silentFails++;
	                  if (input.charCodeAt(peg$currPos) === 60) {
	                    s9 = peg$c103;
	                    peg$currPos++;
	                  } else {
	                    s9 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c104); }
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
	                    s7 = peg$c105;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c106); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    peg$silentFails++;
	                    if (input.charCodeAt(peg$currPos) === 62) {
	                      s9 = peg$c105;
	                      peg$currPos++;
	                    } else {
	                      s9 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c106); }
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
	          s1 = peg$c107(s1, s2);
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

	      var key    = peg$currPos * 275 + 38,
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
	          if (input.substr(peg$currPos, 2) === peg$c108) {
	            s5 = peg$c108;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c109); }
	          }
	          if (s5 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c110) {
	              s5 = peg$c110;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c111); }
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
	            if (input.substr(peg$currPos, 2) === peg$c108) {
	              s5 = peg$c108;
	              peg$currPos += 2;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c109); }
	            }
	            if (s5 === peg$FAILED) {
	              if (input.substr(peg$currPos, 2) === peg$c110) {
	                s5 = peg$c110;
	                peg$currPos += 2;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c111); }
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
	          s1 = peg$c112(s1, s2);
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

	      var key    = peg$currPos * 275 + 39,
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
	          if (peg$c113.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c114); }
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
	            if (peg$c113.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c114); }
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
	          s1 = peg$c115(s1, s2);
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

	      var key    = peg$currPos * 275 + 40,
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
	          if (peg$c116.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c117); }
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
	            if (peg$c116.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c117); }
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
	          s1 = peg$c118(s1, s2);
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

	      var key    = peg$currPos * 275 + 41,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c31;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c32); }
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseCastExpression();
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c119(s3, s7);
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

	      var key    = peg$currPos * 275 + 42,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c120) {
	        s2 = peg$c120;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c121); }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c122) {
	          s2 = peg$c122;
	          peg$currPos += 2;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c123); }
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
	        s1 = peg$c124(s1);
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
	          s1 = peg$c125(s1);
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseSizeofToken();
	          if (s1 !== peg$FAILED) {
	            s2 = peg$parse__();
	            if (s2 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 40) {
	                s3 = peg$c29;
	                peg$currPos++;
	              } else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c30); }
	              }
	              if (s3 !== peg$FAILED) {
	                s4 = peg$parse__();
	                if (s4 !== peg$FAILED) {
	                  s5 = peg$parseTypeName();
	                  if (s5 !== peg$FAILED) {
	                    s6 = peg$parse__();
	                    if (s6 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 41) {
	                        s7 = peg$c31;
	                        peg$currPos++;
	                      } else {
	                        s7 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	      var key    = peg$currPos * 275 + 43,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (input.charCodeAt(peg$currPos) === 38) {
	        s0 = peg$c91;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c92); }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 42) {
	          s0 = peg$c126;
	          peg$currPos++;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c127); }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 43) {
	            s0 = peg$c128;
	            peg$currPos++;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c129); }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 45) {
	              s0 = peg$c130;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c131); }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 126) {
	                s0 = peg$c132;
	                peg$currPos++;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c133); }
	              }
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 33) {
	                  s1 = peg$c134;
	                  peg$currPos++;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c135); }
	                }
	                if (s1 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c136();
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

	      var key    = peg$currPos * 275 + 44,
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
	          s1 = peg$c137(s1, s2);
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

	      var key    = peg$currPos * 275 + 45,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c138;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c139); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 93) {
	                s5 = peg$c140;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c141); }
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
	          s1 = peg$c29;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                  s5 = peg$c31;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c142(s3);
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
	            s1 = peg$c143;
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c144); }
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
	                s1 = peg$c145(s3);
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
	            if (input.substr(peg$currPos, 2) === peg$c146) {
	              s1 = peg$c146;
	              peg$currPos += 2;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c147); }
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
	              if (input.substr(peg$currPos, 2) === peg$c120) {
	                s0 = peg$c120;
	                peg$currPos += 2;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c121); }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.substr(peg$currPos, 2) === peg$c122) {
	                  s0 = peg$c122;
	                  peg$currPos += 2;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c123); }
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

	      var key    = peg$currPos * 275 + 46,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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

	      var key    = peg$currPos * 275 + 47,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c31;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c32); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c148(s3);
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
	                                s1 = peg$c149(s1);
	                              }
	                              s0 = s1;
	                              if (s0 === peg$FAILED) {
	                                s0 = peg$currPos;
	                                s1 = peg$parseSelfToken();
	                                if (s1 !== peg$FAILED) {
	                                  peg$savedPos = s0;
	                                  s1 = peg$c150();
	                                }
	                                s0 = s1;
	                                if (s0 === peg$FAILED) {
	                                  s0 = peg$currPos;
	                                  s1 = peg$parseSuperToken();
	                                  if (s1 !== peg$FAILED) {
	                                    peg$savedPos = s0;
	                                    s1 = peg$c151();
	                                  }
	                                  s0 = s1;
	                                  if (s0 === peg$FAILED) {
	                                    s0 = peg$currPos;
	                                    s1 = peg$parseIdentifier();
	                                    if (s1 !== peg$FAILED) {
	                                      peg$savedPos = s0;
	                                      s1 = peg$c150();
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

	      var key    = peg$currPos * 275 + 48,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c152) {
	        s1 = peg$c152;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c153); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 40) {
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseIdentifier();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 44) {
	                    s7 = peg$c50;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c51); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseTypeName();
	                      if (s9 !== peg$FAILED) {
	                        s10 = peg$parse__();
	                        if (s10 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s11 = peg$c31;
	                            peg$currPos++;
	                          } else {
	                            s11 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	      var key    = peg$currPos * 275 + 49,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseHexLiteral();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c154(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parseBinaryLiteral();
	        if (s1 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c155(s1);
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          s1 = peg$parseOctalLiteral();
	          if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c156(s1);
	          }
	          s0 = s1;
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseCharacterLiteral();
	            if (s1 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c157(s1);
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              s1 = peg$parseBooleanLiteral();
	              if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c158(s1);
	              }
	              s0 = s1;
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parseFloatingPointLiteral();
	                if (s1 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c159(s1);
	                }
	                s0 = s1;
	                if (s0 === peg$FAILED) {
	                  s0 = peg$currPos;
	                  s1 = peg$parseDecimalLiteral();
	                  if (s1 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c160(s1);
	                  }
	                  s0 = s1;
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$currPos;
	                    s1 = peg$parseStringLiteral();
	                    if (s1 !== peg$FAILED) {
	                      peg$savedPos = s0;
	                      s1 = peg$c161(s1);
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

	      var key    = peg$currPos * 275 + 50,
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
	            s3 = peg$c25;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c26); }
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

	      var key    = peg$currPos * 275 + 51,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c162) {
	        s1 = peg$c162;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c163); }
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
	                s8 = peg$c50;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s8 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s8 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	            s1 = peg$c164(s2);
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

	      var key    = peg$currPos * 275 + 52,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c165) {
	        s1 = peg$c165;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c166); }
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
	                s8 = peg$c50;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s8 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s8 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s8 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	            s3 = peg$c140;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c141); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c167(s2);
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

	      var key    = peg$currPos * 275 + 53,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c168) {
	        s1 = peg$c168;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c169); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseConditionalExpression();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c31;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c32); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c170(s3);
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
	          s1 = peg$c171;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c172); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            s3 = peg$parseConditionalExpression();
	            if (s3 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c170(s3);
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

	      var key    = peg$currPos * 275 + 54,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                s7 = peg$c50;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s7 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s6 = peg$c31;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c173(s3, s4);
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
	          s1 = peg$c29;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                  s5 = peg$c31;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                }
	                if (s5 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c174();
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

	      var key    = peg$currPos * 275 + 55,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 94) {
	        s1 = peg$c88;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c89); }
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
	                  s1 = peg$c175(s2, s3, s4, s5, s6);
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

	      var key    = peg$currPos * 275 + 56,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c138;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c139); }
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
	                    s7 = peg$c140;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c141); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c176(s3, s5);
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

	      var key    = peg$currPos * 275 + 57,
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
	          s1 = peg$c177(s1, s2);
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

	      var key    = peg$currPos * 275 + 58,
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
	            s5 = peg$c25;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	            s1 = peg$c178(s1, s2, s3);
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

	      var key    = peg$currPos * 275 + 59,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$c179(s5);
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

	      var key    = peg$currPos * 275 + 60,
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
	              s5 = peg$c25;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                  s5 = peg$c25;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c26); }
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

	      var key    = peg$currPos * 275 + 61,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseProtocolName();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	    function peg$parseEncodeExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 62,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseTypeName();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	    function peg$parseAvailableExpression() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 63,
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
	            s3 = peg$c29;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c30); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseAttributeArgument();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 41) {
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	    function peg$parseClassInterface() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

	      var key    = peg$currPos * 275 + 64,
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
	                s6 = peg$c25;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                              s1 = peg$c183(s3, s4, s5, s6, s7, s8, s9, s10, s11);
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

	      var key    = peg$currPos * 275 + 65,
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
	                s5 = peg$c29;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                        s9 = peg$c31;
	                        peg$currPos++;
	                      } else {
	                        s9 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                                        s1 = peg$c184(s3, s7, s10, s11, s12, s13, s14, s15, s16);
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

	      var key    = peg$currPos * 275 + 66,
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
	                s6 = peg$c25;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                          s1 = peg$c185(s3, s4, s5, s6, s7, s8, s9);
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

	      var key    = peg$currPos * 275 + 67,
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
	                s5 = peg$c29;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c30); }
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parseIdentifier();
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 41) {
	                        s9 = peg$c31;
	                        peg$currPos++;
	                      } else {
	                        s9 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                                s1 = peg$c186(s3, s4, s7, s10, s11, s12);
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

	      var key    = peg$currPos * 275 + 68,
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
	                s1 = peg$c187();
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

	      var key    = peg$currPos * 275 + 69,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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

	      var key    = peg$currPos * 275 + 70,
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
	                  s1 = peg$c189(s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 71,
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

	      var key    = peg$currPos * 275 + 72,
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
	                      s1 = peg$c190(s2, s3, s4, s5, s6, s7);
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

	      var key    = peg$currPos * 275 + 73,
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
	                s1 = peg$c191();
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

	      var key    = peg$currPos * 275 + 74,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c103;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c104); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseProtocolList();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 62) {
	                s5 = peg$c105;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c106); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c192(s3);
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

	      var key    = peg$currPos * 275 + 75,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c193(s1, s2);
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

	      var key    = peg$currPos * 275 + 76,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = s0;
	        s1 = peg$c136();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseImplementationDefinitionList() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 275 + 77,
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

	    function peg$parseImplementationDefinition() {
	      var s0;

	      var key    = peg$currPos * 275 + 78,
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

	      var key    = peg$currPos * 275 + 79,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 43) {
	        s1 = peg$c128;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c129); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDefinition();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c195(s3);
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

	      var key    = peg$currPos * 275 + 80,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s1 = peg$c130;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c131); }
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

	    function peg$parseMethodDefinition() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

	      var key    = peg$currPos * 275 + 81,
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
	                        s1 = peg$c197(s1, s3, s5, s7, s8, s9);
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

	      var key    = peg$currPos * 275 + 82,
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
	                s1 = peg$c198(s3);
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
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parsePropertySynthesizeList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 83,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c200(s1, s2);
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

	      var key    = peg$currPos * 275 + 84,
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
	            s4 = peg$c54;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c55); }
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

	    function peg$parseStructOrUnionSpecifier() {
	      var s0, s1, s2, s3;

	      var key    = peg$currPos * 275 + 85,
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
	            s1 = peg$c202(s1, s3);
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

	      var key    = peg$currPos * 275 + 86,
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
	                  s1 = peg$c203(s1, s2, s4, s5);
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
	          s1 = peg$c204(s1);
	        }
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseStructDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 87,
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
	                  s1 = peg$c205(s1, s3, s4);
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

	      var key    = peg$currPos * 275 + 88,
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
	          s1 = peg$c206(s1, s2);
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

	      var key    = peg$currPos * 275 + 89,
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

	      var key    = peg$currPos * 275 + 90,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c173(s1, s2);
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

	      var key    = peg$currPos * 275 + 91,
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
	            s3 = peg$c25;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                s1 = peg$c207(s1, s5);
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

	      var key    = peg$currPos * 275 + 92,
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
	                s6 = peg$c25;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                          s1 = peg$c208(s2, s3, s4, s5, s7, s8, s9);
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
	                  s6 = peg$c25;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                s1 = peg$c209(s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 93,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	            s1 = peg$c210(s1, s2, s3);
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

	      var key    = peg$currPos * 275 + 94,
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
	            s4 = peg$c54;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c55); }
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
	          s1 = peg$c211(s1, s2);
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

	      var key    = peg$currPos * 275 + 95,
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
	              s1 = peg$c212(s1, s3, s4);
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

	      var key    = peg$currPos * 275 + 96,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 42) {
	        s1 = peg$c126;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c127); }
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
	            s1 = peg$c213(s2, s3);
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

	      var key    = peg$currPos * 275 + 97,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c214) {
	        s1 = peg$c214;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c215); }
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
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$parse__();
	                    if (s8 !== peg$FAILED) {
	                      s9 = peg$parseBlockParameters();
	                      if (s9 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$c216(s3, s5, s9);
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
	          s1 = peg$c29;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                    s6 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s6 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                      s1 = peg$c217(s2, s4, s7);
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
	                s1 = peg$c218(s1, s2, s3);
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

	      var key    = peg$currPos * 275 + 98,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s2 = peg$c138;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c139); }
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
	                s6 = peg$c140;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c141); }
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
	        s1 = peg$c219(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 40) {
	          s2 = peg$c29;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                  s6 = peg$c31;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseParameterList() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      var key    = peg$currPos * 275 + 99,
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
	            s4 = peg$c50;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse__();
	            if (s5 !== peg$FAILED) {
	              if (input.substr(peg$currPos, 3) === peg$c221) {
	                s6 = peg$c221;
	                peg$currPos += 3;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c222); }
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
	          s1 = peg$c223(s1, s2);
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

	      var key    = peg$currPos * 275 + 100,
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

	    function peg$parseInterfaceDeclaration() {
	      var s0;

	      var key    = peg$currPos * 275 + 101,
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

	      var key    = peg$currPos * 275 + 102,
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
	                s1 = peg$c225(s1, s2, s3, s4);
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

	      var key    = peg$currPos * 275 + 103,
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
	          s1 = peg$c206(s1, s2);
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

	      var key    = peg$currPos * 275 + 104,
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
	          if (peg$c226.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c227); }
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
	            if (peg$c226.test(input.charAt(peg$currPos))) {
	              s3 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c227); }
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

	      var key    = peg$currPos * 275 + 105,
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

	      var key    = peg$currPos * 275 + 106,
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
	        s1 = peg$c228(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeSpecifier() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 107,
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
	                    s3 = peg$c29;
	                    peg$currPos++;
	                  } else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c30); }
	                  }
	                  if (s3 !== peg$FAILED) {
	                    s4 = peg$parse__();
	                    if (s4 !== peg$FAILED) {
	                      s5 = peg$parseUnaryExpression();
	                      if (s5 !== peg$FAILED) {
	                        s6 = peg$parse__();
	                        if (s6 !== peg$FAILED) {
	                          if (input.charCodeAt(peg$currPos) === 41) {
	                            s7 = peg$c31;
	                            peg$currPos++;
	                          } else {
	                            s7 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c32); }
	                          }
	                          if (s7 !== peg$FAILED) {
	                            peg$savedPos = s0;
	                            s1 = peg$c229(s5);
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

	      var key    = peg$currPos * 275 + 108,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c214) {
	        s1 = peg$c214;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c215); }
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
	                    s7 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                      s1 = peg$c230(s3, s5, s8);
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

	      var key    = peg$currPos * 275 + 109,
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
	            s1 = peg$c231(s3);
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

	      var key    = peg$currPos * 275 + 110,
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
	          s1 = peg$c232(s1, s2);
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

	      var key    = peg$currPos * 275 + 111,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$parseIdentifier();
	      if (s1 !== peg$FAILED) {
	        peg$savedPos = peg$currPos;
	        s2 = peg$c233(s1);
	        if (s2) {
	          s2 = void 0;
	        } else {
	          s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$savedPos = s0;
	          s1 = peg$c234(s1);
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

	      var key    = peg$currPos * 275 + 112,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c103;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c104); }
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
	                s7 = peg$c50;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s7 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s6 = peg$c105;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c106); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$savedPos = s0;
	                  s1 = peg$c235(s3, s4);
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
	          s1 = peg$c103;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c104); }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parse__();
	          if (s2 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 62) {
	              s3 = peg$c105;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c106); }
	            }
	            if (s3 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c236();
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

	      var key    = peg$currPos * 275 + 113,
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
	        s1 = peg$c237(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseTypeQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 275 + 114,
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
	        s1 = peg$c238(s1);
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

	      var key    = peg$currPos * 275 + 115,
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
	          if (input.substr(peg$currPos, 2) === peg$c239) {
	            s3 = peg$c239;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c240); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseAttributeArgument();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                if (s6 !== peg$FAILED) {
	                  if (input.substr(peg$currPos, 2) === peg$c241) {
	                    s7 = peg$c241;
	                    peg$currPos += 2;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c242); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    s8 = peg$currPos;
	                    s9 = peg$parse__();
	                    if (s9 !== peg$FAILED) {
	                      if (input.charCodeAt(peg$currPos) === 61) {
	                        s10 = peg$c54;
	                        peg$currPos++;
	                      } else {
	                        s10 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c55); }
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
	                      s1 = peg$c243();
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

	      var key    = peg$currPos * 275 + 116,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = [];
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      peg$silentFails++;
	      if (input.substr(peg$currPos, 2) === peg$c241) {
	        s3 = peg$c241;
	        peg$currPos += 2;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c242); }
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
	        if (input.substr(peg$currPos, 2) === peg$c241) {
	          s3 = peg$c241;
	          peg$currPos += 2;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c242); }
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

	      var key    = peg$currPos * 275 + 117,
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
	                  s1 = peg$c244();
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

	      var key    = peg$currPos * 275 + 118,
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
	        s1 = peg$c245(s1);
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseNullabilityQualifier() {
	      var s0, s1;

	      var key    = peg$currPos * 275 + 119,
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
	        s1 = peg$c246();
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
	          s1 = peg$c247();
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
	            s1 = peg$c248();
	          }
	          s0 = s1;
	        }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseInitDeclaratorList() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 120,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c173(s1, s2);
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

	      var key    = peg$currPos * 275 + 121,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c31;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	      var key    = peg$currPos * 275 + 122,
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
	            s4 = peg$c54;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c55); }
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
	          s1 = peg$c249(s1, s2);
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

	      var key    = peg$currPos * 275 + 123,
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
	                s7 = peg$c50;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s7 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	                  s6 = peg$c50;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c143;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c144); }
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

	      var key    = peg$currPos * 275 + 124,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 43) {
	        s1 = peg$c128;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c129); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseMethodDeclaration();
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c250(s3);
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

	      var key    = peg$currPos * 275 + 125,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s1 = peg$c130;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c131); }
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

	    function peg$parseMethodDeclaration() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 126,
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
	                  s1 = peg$c252(s1, s3, s4);
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

	      var key    = peg$currPos * 275 + 127,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse__();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseTypeName();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse__();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 41) {
	                s5 = peg$c31;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c32); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$c253(s3);
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

	      var key    = peg$currPos * 275 + 128,
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parse__();
	              if (s6 !== peg$FAILED) {
	                if (input.substr(peg$currPos, 3) === peg$c221) {
	                  s7 = peg$c221;
	                  peg$currPos += 3;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c222); }
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
	            s1 = peg$c254(s1, s2, s3);
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
	          s1 = peg$c255(s1);
	        }
	        s0 = s1;
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseKeywordDeclarator() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      var key    = peg$currPos * 275 + 129,
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
	            s3 = peg$c25;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c26); }
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
	                    s1 = peg$c256(s1, s4, s5, s7);
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

	      var key    = peg$currPos * 275 + 130,
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
	          s1 = peg$c257(s1, s2);
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

	      var key    = peg$currPos * 275 + 131,
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
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 40) {
	              s1 = peg$c29;
	              peg$currPos++;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                    s4 = peg$c31;
	                    peg$currPos++;
	                  } else {
	                    s4 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c32); }
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
	                      s1 = peg$c260(s2, s5);
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
	                  s4 = peg$c138;
	                  peg$currPos++;
	                } else {
	                  s4 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c139); }
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
	                          s8 = peg$c140;
	                          peg$currPos++;
	                        } else {
	                          s8 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c141); }
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
	                      s4 = peg$c138;
	                      peg$currPos++;
	                    } else {
	                      s4 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c139); }
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
	                              s8 = peg$c140;
	                              peg$currPos++;
	                            } else {
	                              s8 = peg$FAILED;
	                              if (peg$silentFails === 0) { peg$fail(peg$c141); }
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
	                s1 = peg$c261(s1);
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

	      var key    = peg$currPos * 275 + 132,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c138;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c139); }
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
	                s5 = peg$c140;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c141); }
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
	          s1 = peg$c29;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	                  s5 = peg$c31;
	                  peg$currPos++;
	                } else {
	                  s5 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
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

	      var key    = peg$currPos * 275 + 133,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c173(s1, s2);
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

	      var key    = peg$currPos * 275 + 134,
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
	          s1 = peg$c262(s1, s2);
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

	      var key    = peg$currPos * 275 + 135,
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
	                s1 = peg$c263(s3, s5);
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

	      var key    = peg$currPos * 275 + 136,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 40) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
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
	              s4 = peg$c31;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c32); }
	            }
	            if (s4 !== peg$FAILED) {
	              peg$savedPos = s0;
	              s1 = peg$c264(s2);
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

	      var key    = peg$currPos * 275 + 137,
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
	            s5 = peg$c50;
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	              s5 = peg$c50;
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c51); }
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
	          s1 = peg$c173(s1, s2);
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

	      var key    = peg$currPos * 275 + 138,
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
	                                s3 = peg$c54;
	                                peg$currPos++;
	                              } else {
	                                s3 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c55); }
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
	                                  s3 = peg$c54;
	                                  peg$currPos++;
	                                } else {
	                                  s3 = peg$FAILED;
	                                  if (peg$silentFails === 0) { peg$fail(peg$c55); }
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
	                                          s7 = peg$c25;
	                                          peg$currPos++;
	                                        } else {
	                                          s7 = peg$FAILED;
	                                          if (peg$silentFails === 0) { peg$fail(peg$c26); }
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

	      var key    = peg$currPos * 275 + 139,
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

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdStart() {
	      var s0;

	      var key    = peg$currPos * 275 + 140,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c266.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c267); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseIdPart() {
	      var s0;

	      var key    = peg$currPos * 275 + 141,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c268.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c269); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseBooleanLiteral() {
	      var s0, s1;

	      var key    = peg$currPos * 275 + 142,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c270) {
	        s1 = peg$c270;
	        peg$currPos += 4;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c271); }
	      }
	      if (s1 === peg$FAILED) {
	        if (input.substr(peg$currPos, 3) === peg$c272) {
	          s1 = peg$c272;
	          peg$currPos += 3;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c273); }
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

	      var key    = peg$currPos * 275 + 143,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s2 = peg$c274;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c275); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        s4 = peg$parseEscapeSequence();
	        if (s4 === peg$FAILED) {
	          if (peg$c276.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c277); }
	          }
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$parseEscapeSequence();
	          if (s4 === peg$FAILED) {
	            if (peg$c276.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c277); }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s4 = peg$c274;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c275); }
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

	      var key    = peg$currPos * 275 + 144,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 64) {
	        s3 = peg$c171;
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c172); }
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
	              s8 = peg$c171;
	              peg$currPos++;
	            } else {
	              s8 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c172); }
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
	                s8 = peg$c171;
	                peg$currPos++;
	              } else {
	                s8 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c172); }
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

	      var key    = peg$currPos * 275 + 145,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s2 = peg$c103;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c104); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        s4 = peg$parseEscapeSequence();
	        if (s4 === peg$FAILED) {
	          if (peg$c278.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c279); }
	          }
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$parseEscapeSequence();
	          if (s4 === peg$FAILED) {
	            if (peg$c278.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c279); }
	            }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 62) {
	            s4 = peg$c105;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c106); }
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

	      var key    = peg$currPos * 275 + 146,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 92) {
	        s2 = peg$c280;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c281); }
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

	      var key    = peg$currPos * 275 + 147,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c282.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c283); }
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

	      var key    = peg$currPos * 275 + 148,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (peg$c284.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c285); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c286.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c287); }
	        }
	        if (s3 !== peg$FAILED) {
	          if (peg$c286.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c287); }
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
	        if (peg$c286.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c287); }
	        }
	        if (s2 !== peg$FAILED) {
	          if (peg$c286.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c287); }
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
	          if (peg$c286.test(input.charAt(peg$currPos))) {
	            s1 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c287); }
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

	      var key    = peg$currPos * 275 + 149,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 120) {
	        s2 = peg$c288;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c289); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c290.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c291); }
	        }
	        if (s3 !== peg$FAILED) {
	          peg$savedPos = s1;
	          s2 = peg$c292();
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

	      var key    = peg$currPos * 275 + 150,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 117) {
	        s2 = peg$c293;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c294); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c290.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c291); }
	        }
	        if (s3 !== peg$FAILED) {
	          peg$savedPos = s1;
	          s2 = peg$c295();
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

	      var key    = peg$currPos * 275 + 151,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c296;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c297); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 98) {
	          s3 = peg$c298;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c299); }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 66) {
	            s3 = peg$c300;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c301); }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c302.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c303); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c302.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c303); }
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

	      var key    = peg$currPos * 275 + 152,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c296;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c297); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 120) {
	          s3 = peg$c288;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c289); }
	        }
	        if (s3 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 88) {
	            s3 = peg$c304;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c305); }
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

	      var key    = peg$currPos * 275 + 153,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c296;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c297); }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        if (peg$c306.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c307); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c308.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c309); }
	          }
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            if (peg$c308.test(input.charAt(peg$currPos))) {
	              s5 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s5 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c309); }
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

	      var key    = peg$currPos * 275 + 154,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s2 = peg$c296;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c297); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = [];
	        if (peg$c286.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c287); }
	        }
	        if (s4 !== peg$FAILED) {
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            if (peg$c286.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c287); }
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

	      var key    = peg$currPos * 275 + 155,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s2 = peg$c310;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c311); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parseEscapeSequence();
	        if (s3 === peg$FAILED) {
	          if (peg$c312.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c313); }
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 39) {
	            s4 = peg$c310;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c311); }
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

	      var key    = peg$currPos * 275 + 156,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c290.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c291); }
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

	      var key    = peg$currPos * 275 + 157,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      if (peg$c314.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c315); }
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          if (peg$c314.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c315); }
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

	      var key    = peg$currPos * 275 + 158,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      s3 = [];
	      if (peg$c308.test(input.charAt(peg$currPos))) {
	        s4 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s4 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c309); }
	      }
	      if (s4 !== peg$FAILED) {
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          if (peg$c308.test(input.charAt(peg$currPos))) {
	            s4 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c309); }
	          }
	        }
	      } else {
	        s3 = peg$FAILED;
	      }
	      if (s3 !== peg$FAILED) {
	        s4 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s5 = peg$c143;
	          peg$currPos++;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c144); }
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = [];
	          if (peg$c308.test(input.charAt(peg$currPos))) {
	            s7 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s7 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c309); }
	          }
	          while (s7 !== peg$FAILED) {
	            s6.push(s7);
	            if (peg$c308.test(input.charAt(peg$currPos))) {
	              s7 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s7 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c309); }
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
	          s3 = peg$c143;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c144); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c308.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c309); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c308.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c309); }
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
	        if (peg$c314.test(input.charAt(peg$currPos))) {
	          s4 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c315); }
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

	      var key    = peg$currPos * 275 + 159,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (peg$c316.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c317); }
	      }
	      if (s2 !== peg$FAILED) {
	        if (peg$c113.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c114); }
	        }
	        if (s3 === peg$FAILED) {
	          s3 = null;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          if (peg$c308.test(input.charAt(peg$currPos))) {
	            s5 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c309); }
	          }
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              if (peg$c308.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c309); }
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

	      var key    = peg$currPos * 275 + 160,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (peg$c318.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c319); }
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

	      var key    = peg$currPos * 275 + 161,
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

	      var key    = peg$currPos * 275 + 162,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c320) {
	        s2 = peg$c320;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c321); }
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

	      var key    = peg$currPos * 275 + 163,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c322) {
	        s2 = peg$c322;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c323); }
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

	      var key    = peg$currPos * 275 + 164,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c324) {
	        s2 = peg$c324;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c325); }
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

	      var key    = peg$currPos * 275 + 165,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c326) {
	        s2 = peg$c326;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c327); }
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

	      var key    = peg$currPos * 275 + 166,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c328) {
	        s2 = peg$c328;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c329); }
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

	      var key    = peg$currPos * 275 + 167,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c330) {
	        s2 = peg$c330;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c331); }
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

	      var key    = peg$currPos * 275 + 168,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c332) {
	        s2 = peg$c332;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c333); }
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

	      var key    = peg$currPos * 275 + 169,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c334) {
	        s2 = peg$c334;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c335); }
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

	      var key    = peg$currPos * 275 + 170,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c336) {
	        s2 = peg$c336;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c337); }
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

	      var key    = peg$currPos * 275 + 171,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c338) {
	        s2 = peg$c338;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c339); }
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

	      var key    = peg$currPos * 275 + 172,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c340) {
	        s2 = peg$c340;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c341); }
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

	      var key    = peg$currPos * 275 + 173,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c342) {
	        s2 = peg$c342;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c343); }
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

	      var key    = peg$currPos * 275 + 174,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c344) {
	        s2 = peg$c344;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c345); }
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

	      var key    = peg$currPos * 275 + 175,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c346) {
	        s2 = peg$c346;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c347); }
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

	      var key    = peg$currPos * 275 + 176,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c348) {
	        s2 = peg$c348;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c349); }
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

	      var key    = peg$currPos * 275 + 177,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c350) {
	        s2 = peg$c350;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c351); }
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

	      var key    = peg$currPos * 275 + 178,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c352) {
	        s2 = peg$c352;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c353); }
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

	      var key    = peg$currPos * 275 + 179,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c354) {
	        s2 = peg$c354;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c355); }
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

	      var key    = peg$currPos * 275 + 180,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c356) {
	        s2 = peg$c356;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c357); }
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

	      var key    = peg$currPos * 275 + 181,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c358) {
	        s2 = peg$c358;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c359); }
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

	      var key    = peg$currPos * 275 + 182,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c360) {
	        s2 = peg$c360;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c361); }
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

	      var key    = peg$currPos * 275 + 183,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 15) === peg$c362) {
	        s2 = peg$c362;
	        peg$currPos += 15;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c363); }
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

	      var key    = peg$currPos * 275 + 184,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c364) {
	        s2 = peg$c364;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c365); }
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

	      var key    = peg$currPos * 275 + 185,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c366) {
	        s2 = peg$c366;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c367); }
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

	      var key    = peg$currPos * 275 + 186,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c368) {
	        s2 = peg$c368;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c369); }
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

	      var key    = peg$currPos * 275 + 187,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c370) {
	        s2 = peg$c370;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c371); }
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

	      var key    = peg$currPos * 275 + 188,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c372) {
	        s2 = peg$c372;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c373); }
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

	      var key    = peg$currPos * 275 + 189,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c374) {
	        s2 = peg$c374;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c375); }
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

	      var key    = peg$currPos * 275 + 190,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 11) === peg$c376) {
	        s2 = peg$c376;
	        peg$currPos += 11;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c377); }
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

	      var key    = peg$currPos * 275 + 191,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c378) {
	        s2 = peg$c378;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c379); }
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

	      var key    = peg$currPos * 275 + 192,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c380) {
	        s2 = peg$c380;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c381); }
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

	      var key    = peg$currPos * 275 + 193,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c382) {
	        s2 = peg$c382;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c383); }
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

	      var key    = peg$currPos * 275 + 194,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c384) {
	        s2 = peg$c384;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c385); }
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

	      var key    = peg$currPos * 275 + 195,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c386) {
	        s2 = peg$c386;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c387); }
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

	      var key    = peg$currPos * 275 + 196,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c388) {
	        s2 = peg$c388;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c389); }
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

	      var key    = peg$currPos * 275 + 197,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c390) {
	        s2 = peg$c390;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c391); }
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

	      var key    = peg$currPos * 275 + 198,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c392) {
	        s2 = peg$c392;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c393); }
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

	      var key    = peg$currPos * 275 + 199,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c394) {
	        s2 = peg$c394;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c395); }
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

	      var key    = peg$currPos * 275 + 200,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c396) {
	        s2 = peg$c396;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c397); }
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

	      var key    = peg$currPos * 275 + 201,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c398) {
	        s2 = peg$c398;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c399); }
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

	      var key    = peg$currPos * 275 + 202,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c400) {
	        s2 = peg$c400;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c401); }
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

	      var key    = peg$currPos * 275 + 203,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 13) === peg$c402) {
	        s2 = peg$c402;
	        peg$currPos += 13;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c403); }
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

	      var key    = peg$currPos * 275 + 204,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 16) === peg$c404) {
	        s2 = peg$c404;
	        peg$currPos += 16;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c405); }
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

	      var key    = peg$currPos * 275 + 205,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c406) {
	        s2 = peg$c406;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c407); }
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

	      var key    = peg$currPos * 275 + 206,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c408) {
	        s2 = peg$c408;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c409); }
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

	      var key    = peg$currPos * 275 + 207,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c410) {
	        s2 = peg$c410;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c411); }
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

	      var key    = peg$currPos * 275 + 208,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c412) {
	        s2 = peg$c412;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c413); }
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

	      var key    = peg$currPos * 275 + 209,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c414) {
	        s2 = peg$c414;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c415); }
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

	      var key    = peg$currPos * 275 + 210,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c416) {
	        s2 = peg$c416;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c417); }
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

	      var key    = peg$currPos * 275 + 211,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c418) {
	        s2 = peg$c418;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c419); }
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

	      var key    = peg$currPos * 275 + 212,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c420) {
	        s2 = peg$c420;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c421); }
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

	      var key    = peg$currPos * 275 + 213,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c422) {
	        s2 = peg$c422;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c423); }
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

	      var key    = peg$currPos * 275 + 214,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 12) === peg$c424) {
	        s2 = peg$c424;
	        peg$currPos += 12;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c425); }
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

	      var key    = peg$currPos * 275 + 215,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c426) {
	        s2 = peg$c426;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c427); }
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

	      var key    = peg$currPos * 275 + 216,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 19) === peg$c428) {
	        s2 = peg$c428;
	        peg$currPos += 19;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c429); }
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

	      var key    = peg$currPos * 275 + 217,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c430) {
	        s2 = peg$c430;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c431); }
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

	      var key    = peg$currPos * 275 + 218,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 15) === peg$c432) {
	        s2 = peg$c432;
	        peg$currPos += 15;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c433); }
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

	      var key    = peg$currPos * 275 + 219,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c434) {
	        s2 = peg$c434;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c435); }
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

	      var key    = peg$currPos * 275 + 220,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c436) {
	        s2 = peg$c436;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c437); }
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

	      var key    = peg$currPos * 275 + 221,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c438) {
	        s2 = peg$c438;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c439); }
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

	      var key    = peg$currPos * 275 + 222,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 11) === peg$c440) {
	        s2 = peg$c440;
	        peg$currPos += 11;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c441); }
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

	      var key    = peg$currPos * 275 + 223,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c442) {
	        s2 = peg$c442;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c443); }
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

	      var key    = peg$currPos * 275 + 224,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c444) {
	        s2 = peg$c444;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c445); }
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

	      var key    = peg$currPos * 275 + 225,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c446) {
	        s2 = peg$c446;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c447); }
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

	      var key    = peg$currPos * 275 + 226,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 18) === peg$c448) {
	        s2 = peg$c448;
	        peg$currPos += 18;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c449); }
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

	      var key    = peg$currPos * 275 + 227,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c450) {
	        s2 = peg$c450;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c451); }
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

	      var key    = peg$currPos * 275 + 228,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c452) {
	        s2 = peg$c452;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c453); }
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

	      var key    = peg$currPos * 275 + 229,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 17) === peg$c454) {
	        s2 = peg$c454;
	        peg$currPos += 17;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c455); }
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

	      var key    = peg$currPos * 275 + 230,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 13) === peg$c456) {
	        s2 = peg$c456;
	        peg$currPos += 13;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c457); }
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

	      var key    = peg$currPos * 275 + 231,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 12) === peg$c458) {
	        s2 = peg$c458;
	        peg$currPos += 12;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c459); }
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

	      var key    = peg$currPos * 275 + 232,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c460) {
	        s2 = peg$c460;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c461); }
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

	      var key    = peg$currPos * 275 + 233,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c462) {
	        s2 = peg$c462;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c463); }
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

	      var key    = peg$currPos * 275 + 234,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c464) {
	        s2 = peg$c464;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c465); }
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

	      var key    = peg$currPos * 275 + 235,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c466) {
	        s2 = peg$c466;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c467); }
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

	      var key    = peg$currPos * 275 + 236,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c468) {
	        s2 = peg$c468;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c469); }
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

	      var key    = peg$currPos * 275 + 237,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c470) {
	        s2 = peg$c470;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c471); }
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

	      var key    = peg$currPos * 275 + 238,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c472) {
	        s2 = peg$c472;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c473); }
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

	      var key    = peg$currPos * 275 + 239,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c474) {
	        s2 = peg$c474;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c475); }
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

	      var key    = peg$currPos * 275 + 240,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c476) {
	        s2 = peg$c476;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c477); }
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

	      var key    = peg$currPos * 275 + 241,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c478) {
	        s2 = peg$c478;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c479); }
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

	      var key    = peg$currPos * 275 + 242,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c480) {
	        s2 = peg$c480;
	        peg$currPos += 2;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c481); }
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

	      var key    = peg$currPos * 275 + 243,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 3) === peg$c482) {
	        s2 = peg$c482;
	        peg$currPos += 3;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c483); }
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

	      var key    = peg$currPos * 275 + 244,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c484) {
	        s2 = peg$c484;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c485); }
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

	      var key    = peg$currPos * 275 + 245,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c486) {
	        s2 = peg$c486;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c487); }
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

	      var key    = peg$currPos * 275 + 246,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c488) {
	        s2 = peg$c488;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c489); }
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

	      var key    = peg$currPos * 275 + 247,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c490) {
	        s2 = peg$c490;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c491); }
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

	      var key    = peg$currPos * 275 + 248,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c492) {
	        s2 = peg$c492;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c493); }
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

	      var key    = peg$currPos * 275 + 249,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c494) {
	        s2 = peg$c494;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c495); }
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

	      var key    = peg$currPos * 275 + 250,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c496) {
	        s2 = peg$c496;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c497); }
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

	      var key    = peg$currPos * 275 + 251,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 4) === peg$c498) {
	        s2 = peg$c498;
	        peg$currPos += 4;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c499); }
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

	      var key    = peg$currPos * 275 + 252,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c500) {
	        s2 = peg$c500;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c501); }
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

	      var key    = peg$currPos * 275 + 253,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c502) {
	        s2 = peg$c502;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c503); }
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

	      var key    = peg$currPos * 275 + 254,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c504) {
	        s2 = peg$c504;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c505); }
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

	      var key    = peg$currPos * 275 + 255,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 9) === peg$c506) {
	        s2 = peg$c506;
	        peg$currPos += 9;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c507); }
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

	      var key    = peg$currPos * 275 + 256,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c508) {
	        s2 = peg$c508;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c509); }
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

	      var key    = peg$currPos * 275 + 257,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c510) {
	        s2 = peg$c510;
	        peg$currPos += 6;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c511); }
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

	      var key    = peg$currPos * 275 + 258,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c512) {
	        s2 = peg$c512;
	        peg$currPos += 7;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c513); }
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

	      var key    = peg$currPos * 275 + 259,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c514) {
	        s2 = peg$c514;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c515); }
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

	      var key    = peg$currPos * 275 + 260,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 16) === peg$c516) {
	        s2 = peg$c516;
	        peg$currPos += 16;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c517); }
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

	      var key    = peg$currPos * 275 + 261,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 23) === peg$c518) {
	        s2 = peg$c518;
	        peg$currPos += 23;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c519); }
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

	      var key    = peg$currPos * 275 + 262,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 21) === peg$c520) {
	        s2 = peg$c520;
	        peg$currPos += 21;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c521); }
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

	      var key    = peg$currPos * 275 + 263,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 5) === peg$c522) {
	        s2 = peg$c522;
	        peg$currPos += 5;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c523); }
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

	      var key    = peg$currPos * 275 + 264,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 8) === peg$c524) {
	        s2 = peg$c524;
	        peg$currPos += 8;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c525); }
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

	      var key    = peg$currPos * 275 + 265,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.substr(peg$currPos, 10) === peg$c526) {
	        s2 = peg$c526;
	        peg$currPos += 10;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c527); }
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

	      var key    = peg$currPos * 275 + 266,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      s1 = [];
	      if (peg$c528.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c529); }
	      }
	      if (s2 === peg$FAILED) {
	        s2 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s3 = peg$c280;
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c281); }
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
	          if (peg$c528.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c529); }
	          }
	          if (s2 === peg$FAILED) {
	            s2 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	              s3 = peg$c280;
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c281); }
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
	        s1 = peg$c136();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseLineTerminator() {
	      var s0;

	      var key    = peg$currPos * 275 + 267,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      if (peg$c530.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c531); }
	      }

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parseMultiLineComment() {
	      var s0, s1, s2, s3, s4, s5;

	      var key    = peg$currPos * 275 + 268,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c532) {
	        s1 = peg$c532;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c533); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c534) {
	          s5 = peg$c534;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c535); }
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
	          if (input.substr(peg$currPos, 2) === peg$c534) {
	            s5 = peg$c534;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c535); }
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
	          if (input.substr(peg$currPos, 2) === peg$c534) {
	            s3 = peg$c534;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c535); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c136();
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

	      var key    = peg$currPos * 275 + 269,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c532) {
	        s1 = peg$c532;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c533); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        if (input.substr(peg$currPos, 2) === peg$c534) {
	          s5 = peg$c534;
	          peg$currPos += 2;
	        } else {
	          s5 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c535); }
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
	          if (input.substr(peg$currPos, 2) === peg$c534) {
	            s5 = peg$c534;
	            peg$currPos += 2;
	          } else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c535); }
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
	          if (input.substr(peg$currPos, 2) === peg$c534) {
	            s3 = peg$c534;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c535); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$c136();
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

	      var key    = peg$currPos * 275 + 270,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c536) {
	        s1 = peg$c536;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c537); }
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
	          s1 = peg$c136();
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

	      var key    = peg$currPos * 275 + 271,
	          cached = peg$resultsCache[key];

	      if (cached) {
	        peg$currPos = cached.nextPos;

	        return cached.result;
	      }

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c538) {
	        s1 = peg$c538;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c539); }
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
	        if (input.substr(peg$currPos, 5) === peg$c540) {
	          s1 = peg$c540;
	          peg$currPos += 5;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c541); }
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
	          if (input.substr(peg$currPos, 7) === peg$c542) {
	            s1 = peg$c542;
	            peg$currPos += 7;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c543); }
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
	            if (input.substr(peg$currPos, 5) === peg$c544) {
	              s1 = peg$c544;
	              peg$currPos += 5;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c545); }
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
	              if (input.substr(peg$currPos, 4) === peg$c326) {
	                s1 = peg$c326;
	                peg$currPos += 4;
	              } else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c327); }
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
	                if (input.substr(peg$currPos, 4) === peg$c546) {
	                  s1 = peg$c546;
	                  peg$currPos += 4;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c547); }
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
	                  if (input.substr(peg$currPos, 5) === peg$c548) {
	                    s1 = peg$c548;
	                    peg$currPos += 5;
	                  } else {
	                    s1 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c549); }
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
	                    if (input.substr(peg$currPos, 6) === peg$c550) {
	                      s1 = peg$c550;
	                      peg$currPos += 6;
	                    } else {
	                      s1 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c551); }
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
	                      if (input.substr(peg$currPos, 5) === peg$c552) {
	                        s1 = peg$c552;
	                        peg$currPos += 5;
	                      } else {
	                        s1 = peg$FAILED;
	                        if (peg$silentFails === 0) { peg$fail(peg$c553); }
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
	                        if (input.substr(peg$currPos, 4) === peg$c554) {
	                          s1 = peg$c554;
	                          peg$currPos += 4;
	                        } else {
	                          s1 = peg$FAILED;
	                          if (peg$silentFails === 0) { peg$fail(peg$c555); }
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
	                          if (input.substr(peg$currPos, 6) === peg$c556) {
	                            s1 = peg$c556;
	                            peg$currPos += 6;
	                          } else {
	                            s1 = peg$FAILED;
	                            if (peg$silentFails === 0) { peg$fail(peg$c557); }
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
	                            if (input.substr(peg$currPos, 2) === peg$c324) {
	                              s1 = peg$c324;
	                              peg$currPos += 2;
	                            } else {
	                              s1 = peg$FAILED;
	                              if (peg$silentFails === 0) { peg$fail(peg$c325); }
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
	                              if (input.substr(peg$currPos, 3) === peg$c558) {
	                                s1 = peg$c558;
	                                peg$currPos += 3;
	                              } else {
	                                s1 = peg$FAILED;
	                                if (peg$silentFails === 0) { peg$fail(peg$c559); }
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

	      var key    = peg$currPos * 275 + 272,
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
	                s7 = peg$c280;
	                peg$currPos++;
	              } else {
	                s7 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c281); }
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
	                  s7 = peg$c280;
	                  peg$currPos++;
	                } else {
	                  s7 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c281); }
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

	      var key    = peg$currPos * 275 + 273,
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
	        s1 = peg$c136();
	      }
	      s0 = s1;

	      peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

	      return s0;
	    }

	    function peg$parse_() {
	      var s0, s1, s2;

	      var key    = peg$currPos * 275 + 274,
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
	        s1 = peg$c136();
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