module.exports = (function(){
	"use strict"

	var util = require('util');
	var PreProcessor = require('./preprocessor');
	var parser = require('./parser');
	var TypeAnalyzer = require('./type-analyzer');
	var Generator = require('./generator');
	var ParserUtil = require('../src/parser-util');

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
