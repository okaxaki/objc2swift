module.exports = (function() {
	"use strict"

	var cpp = require('./preprocess-parser');
	var parser = require('./parser');
	var TypeAnalyzer = require('./type-analyzer');
	var DeclInfo = require('./decl-info');
	var ParserUtil = require('./parser-util');

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
		"NS_DURING":"@try {",
		"NS_HANDLER":"} @catch (NSException * localException) {",
		"NS_ENDHANDLER":"}",

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