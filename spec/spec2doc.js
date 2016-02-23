#!/usr/bin/env node

"use strict"

var parser = require('./spec-parser');
var ParserUtil = require('../src/parser-util');
var o2s = new (require('../src/main'))();
var fs = require('fs');
var path = require('path');
var Getopt = require('node-getopt');
var jsdiff = require('diff');

var getopt = new Getopt([
	['o','outdir=DIR','Specify output file.'],
]).bindHelp();

var opt = getopt.parseSystem();

function printUsageAndExit() {
	getopt.showHelp();
	process.exit(0);
}

function escapeCode(text) {
	return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

if(!opt.options.outdir || opt.argv.length == 0) {
	printUsageAndExit();
}

if(!fs.existsSync(opt.options.outdir)) {
	console.error(opt.options.outdir + "does not exist.");
	process.exit(1);
}

var inputFile = opt.argv[0];
var outputFile = path.resolve(opt.options.outdir, path.basename(inputFile,'.spec') + '.html');

var gaText='', adText='';
try {
	gaText = fs.readFileSync(path.resolve(opt.options.outdir,'_ga.inc'),'utf-8');
	adText = fs.readFileSync(path.resolve(opt.options.outdir,'_ad.inc'),'utf-8');
} catch(e) {
}

var text = fs.readFileSync(inputFile,'utf-8');
var a;
try {
 	a = parser.parse(text);
} catch(e) {
	console.log(e);
	console.log(ParserUtil.buildErrorMessage(e,text));
	process.exit(1);
}

var buf = [];

buf.push(F2T(DOC_HEAD_TMPL));
buf.push("<h1>" + a.title + "</h1>\n");
buf.push(a.desc);

for(var i=0;i<a.specs.length;i++) {
	var spec = a.specs[i];

	buf.push("<h2>" + spec.title + "</h2>\n");
	buf.push(spec.prefix);
	buf.push("<h3>Objective-C</h3>");
	buf.push("<pre><code class='objc'>" + escapeCode(spec.input) + "</code></pre>\n");
	buf.push(spec.midfix);
	buf.push("<h3>Swift</h3>");
	buf.push("<pre><code class='swift'>" + escapeCode(spec.expect) + "</code></pre>\n");
	buf.push(spec.suffix);

	var output;
	try {
		output = o2s.convert(spec.input,{quiet:true});	
	} catch(e) {
		if(e.location) {
			output = ParserUtil.buildErrorMessage(e,spec.input);
		} else {
			output = e.message;
		}
	}	

	if(spec.expect != output) {

		console.log("FAIL: '" + spec.title + "'' in " + inputFile);

		buf.push("<h3 style='color:red;'>Test Failed</h3>");
	  	var diff = jsdiff.diffChars(spec.expect,output);
        buf.push("<div class='tab'>");
        buf.push("<div class='tab-items'>");
        buf.push("<a class='diff selected'>Diff</a>");
        buf.push("<a class='output'>Raw</a>");
        buf.push("</div>\n");
        buf.push("<div class='result-box'>\n")
        buf.push("<pre class='output'><code>" + output + "</code></pre>\n");
        var code = [];
	  	diff.forEach(function(part){
		    if(part.added) {
		    	code.push("<span class='added'>" + escapeCode(part.value) + "</span>");
		    } else if(part.removed) {
		    	code.push("<span class='removed'>" + escapeCode(part.value) + "</span>");
		    } else {
		    	code.push(escapeCode(part.value));
		    }
		});
        buf.push("<pre class='diff'><code>" + code.join('') + "</code></pre>\n");
        buf.push("</div>\n");
        buf.push("</div>");
	}

	buf.push("\n");

}

buf.push(F2T(DOC_FOOT_TMPL));

var outText = buf.join('')
	.replace('<!-- Banner -->', adText)
	.replace('<!-- Analytics -->', gaText);

fs.writeFileSync(outputFile,outText,'utf-8');

function F2T(f){return f.toString().replace(/^function.*?\n|\n?\*\/\}$/g,'');}

function DOC_HEAD_TMPL(){/*	
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/xcode.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/languages/swift.min.js"></script>
<script src="common.js"></script>
<style>
pre.diff {color:grey;}
pre code {background-color:#f0f0f0;}
.added {background-color:#c0f0c0;}
.removed {text-decoration:line-through;color:red;}
.stack-trace {font-size:80%;color:#666;}
pre.output {display:none;}
pre.expect {display:none;}
pre.diff {display:block;}
.tab-items {margin-top:1em;}
.tab-items a {margin:0.25em;padding:0.25em;color:grey;cursor:pointer;}
.tab-items a.selected {color:#007aff;border-bottom:2px solid #007aff;}
</style>
<link rel="stylesheet" href="common.css">
</head>
<body>
<section class="page-header">
    <nav class="root-nav">
      <ul>
      <li><a href="../index.html">Home</a></li>
        <li><a href="../demo.html">Live Demo</a></li>
        <li class="selected">Document</li>
      </ul>
    </nav>
</section>
<div class="sidebar"><div class="menu"></div></div>
<div class="content">
<!-- Banner -->

*/}

function DOC_FOOT_TMPL(){/*
</div>
<!-- Analytics -->
</body>
</html>
*/};