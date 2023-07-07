#!/usr/bin/env node
"use strict"
function requireIfExist(m){try{return require(m);}catch(e){return null;}}

var fs = require('fs-extra');
var util = require('util');
var path = require('path');
var Getopt = require('node-getopt');
var Objc2Swift = require('../src/main');
var ImportResolver = require('../src/import-resolver');
var Tracer = requireIfExist('pegjs-backtrace');

if((process.platform != 'darwin') && (process.platform != 'linux')) {
	console.error("`" + process.platform + "` platform is not supported.");
	process.exit(1);
}

function getUserHome() {
	return (process.env.HOME||process.env.USERPROFILE);
}

function prependItems(items, newItems) {
	if(Array.isArray(newItems)) {
		newItems.reverse().forEach(function(e) {
			var idx = items.indexOf(e);
			if(0<=idx) {
				items.splice(idx,1);
			}
			items.unshift(e);
		});
	}
}

function resolveMetaPathString(pathList) {
	return pathList.map(function(e){ 
		return e.replace(/\$\{Xcode\.app\}/i,xcode)
			.replace("~/",getUserHome()+"/");
	});
}

function loadConfig(config, file, skipIfNotExist) {
	try {
		if(!fs.existsSync(file)) {
			if(skipIfNotExist) return true; 
			throw new Error("File Not Found: " + file);
		}
		var json = fs.readFileSync(file,'utf-8');
		var data = JSON.parse(json);

		if(Array.isArray(data.systemIncludePaths)) {
			prependItems(config.systemIncludePaths, data.systemIncludePaths);
		} else {
			throw new Error("systemIncludePaths is not defined.");
		}
		if(Array.isArray(data.includePaths)) {
			prependItems(config.includePaths, data.includePaths);
		} else {
			throw new Error("includePaths is not defined.");
		}
	} catch(e) {
		console.error('Failed to load: ' + file);
		console.error(e);
		process.exit(1);
	} 
}

var optdefs = [
	['o','output=FILE','specifiy output filename.'],
	['','init=ios|osx|tvos|watchos|none','Create config for the specified platform.'],
	['','xcode=PATH','Specify Xcode.app path. [default:/Applications/Xcode.app]'],
	['c','config=PATH','Load config from PATH. [default:~/.objc2swift/config]'],
	['h','help','show this help.'],
	['','isystem=PATH+','Add PATH to system include search path.'],
	['I','include=PATH+','Add PATH to include search path.'],
	['','optional-chaining','Use optional-chaining instead of forced-unwrapping.'],
	['','skip-header','Skip to import all headers.'],
	['','show-missing-header','Print out missing header file names.'],
	['','show-include-path','Print out include path settings.'],
	['','verbose','Show verbose messages.'],
	['','quiet','Suppress trace messages.'],
	['','no-cache','Do not generate pre-compiled header cache.'],
	['','clear-cache','Clear the cached pre-compiled headers.'],
	['S','preprocess-only','Only run preprocess step.'],
	['','parse-only','Do not generate swift source.'],
	['','stacktrace','Print out JS stack trace when converter fails.'],	
	['','inline-dump','Generate type analysis information as comment to Swift source inline.'],
	['q','query=CLASS','Print out type information of the specified class to console.'],
	['a','ast','Print out the internal syntax tree to console.'],
];

if(Tracer) {
	if(Objc2Swift.canUseTracer()) {
		optdefs = optdefs.concat([
			['b','backtrace','dump back trace after parse.'],
			['t','tree','dump full parse tree.'],
			['','trace','show parser trace.'],
			]);
	}
}

var getopt = new Getopt(optdefs).bindHelp();
getopt.setHelp("\nUsage: objc2swift [OPTION] file\n\nOptions:\n[[OPTIONS]]\n");
var opt = getopt.parseSystem();

function printUsageAndExit() {
	getopt.showHelp();
	process.exit(0);
}

//
// Prepare Cache
//
if(opt.options['clear-cache']) {
	var dir = ImportResolver.getCacheRoot();
	if(!/\.objc2swift/.test(dir)) {
		console.error("Invalid cache directory: " + dir);
		process.exit(1);
	}
	fs.removeSync(dir);
	console.log("Removed: " + dir);
	if(opt.argv.length==0) {
		process.exit(0);
	}
}
fs.mkdirsSync(ImportResolver.getCacheDir());

//
// Load or Setup configuration
//
var	xcode = opt.options.xcode||"/Applications/Xcode.app";
var configFile = opt.options.config || getUserHome() + "/.objc2swift/config.json";
var config;

function makeConfig(platform) {
	var config = {
		systemIncludePaths:[],
		includePaths:[],
	};
	var systemPathsMap = JSON.parse(fs.readFileSync(__dirname+"/sdk-path.json",'utf-8'));
	prependItems(config.systemIncludePaths, systemPathsMap[platform]);
	return config;
}

function addIncludePaths(config, systemIncludePaths, includePaths) {
	if(systemIncludePaths) {
		prependItems(config.systemIncludePaths, systemIncludePaths);
	}
	if(includePaths) {
		prependItems(config.includePaths, includePaths);
	}
}

if(opt.options.init) {
	config = makeConfig(opt.options.init);
	addIncludePaths(config, opt.options.isystem, opt.options.include);
	fs.writeFileSync(configFile, JSON.stringify(config,null,"    "), 'utf-8');
	console.log("Generated: " + configFile);
	process.exit(0);
}

if(fs.existsSync(configFile)) {
	config = makeConfig("none");
	loadConfig(config, configFile, true);
	addIncludePaths(config, opt.options.isystem, opt.options.include);
} else {
	console.log("Warning: " + configFile + " does not exist. The default `ios` platform configuration is applied.\n`--init` option can be used to generate the config file.");
	config = makeConfig("ios");
	addIncludePaths(config, opt.options.isystem, opt.options.include);
}

if(opt.argv.length!=0) {
	config.includePaths.unshift(path.dirname(path.resolve(opt.argv[0])));
}

if(opt.options['show-include-path']) {
	resolveMetaPathString(config.systemIncludePaths).forEach(function(e){console.log("[System] " + e);});
	resolveMetaPathString(config.includePaths).forEach(function(e){console.log(e);});
	if(opt.argv.length == 0) process.exit(0);
}

if(opt.argv.length == 0) {
	printUsageAndExit();
}

// 
// Setup options
//
var options = {
	ast:opt.options['ast'],
	skipHeader:opt.options['skip-header'],
	forceUnwrap:!opt.options['optional-chaining'],
	inlineDump:opt.options['inline-dump'],
	query:opt.options['query'],
	verbose:opt.options.verbose,
	sourcePath:path.resolve(opt.argv[0]),
	cacheHeader:!opt.options['no-cache'],
	platform:opt.options.platform,
	quiet:opt.options.quiet,
	showMissingHeader:opt.options['show-missing-header'],
};

options.importResolver = new ImportResolver({
	frameworkPath:resolveMetaPathString(config.systemIncludePaths),
	includePath:resolveMetaPathString(config.includePaths),
	verbose:options.verbose
});

//
// Load source file
//
var source;
try {
	source = fs.readFileSync(options.sourcePath,'utf-8');
} catch(e) {
	console.error(e.message);
	process.exit(1);
}

//
// Setup tracer if available
//
var tracer;
if(opt.options.tree||opt.options.backtrace||opt.options.trace) {	
	tracer = new Tracer(source,{hiddenPaths:['Identifier/.*','__','.*Token'],verbose:true, showTrace:opt.options.trace||false});
	options.tracer = tracer;
} else {
	options.tracer = {trace:function(){}};
}

//
// Parse source
//
var o2s = new Objc2Swift();

if(opt.options['preprocess-only']) {
	console.log(o2s.preprocessOnly(source));
	process.exit(0);
}

var ast;
try {	
	ast = o2s.parse(source, options);
	if(opt.options.tree) {
		console.log(tracer.getParseTreeString());
	}
} catch(e) {
	console.log(o2s.buildErrorMessage(e, source, opt.argv[0]));
	if(opt.options.stacktrace) { console.log(e.stack); }
	if(opt.options.backtrace) {	console.log(tracer.getBacktraceString()); }
	process.exit(1);
}

if(opt.options["parse-only"]||opt.options['query']||opt.options['ast']) {
	process.exit(0);
}

//
// Generate Swift code
//

var swift = o2s.generate(ast, options);

var outfile = opt.options['output'] ||
	path.basename(options.sourcePath).replace(/\.m$/,'') + ".swift";

if(outfile == '-' || outfile == '/dev/stdout') {
	console.info(swift);
} else if(outfile == '/dev/stderr') {
	console.error(swift);
} else {
	fs.writeFileSync(outfile,swift,'utf-8');
	if(!opt.options.quiet) {
		console.error("Output     : " + outfile);
	}
}
