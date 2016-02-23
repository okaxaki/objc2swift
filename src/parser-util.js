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