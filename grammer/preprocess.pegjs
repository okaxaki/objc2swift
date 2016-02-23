Start =  m:(__ Unit)* n:__ {
	var buf = [];
	for(var i=0;i<m.length;i++) {
		buf.push(m[i][0] + m[i][1]);
	}
	buf.push(n);
	return buf.join('');
}

Unit 
	= Macro / "*" / $(!Blanks .)+ 

Macro
	= name:$([a-zA-Z_][a-zA-Z0-9_]*) ![a-zA-Z0-9_] args:(__ "(" __ ArgumentList? __ ")" )? {
		var list = args?args[3]:null;
		var result = options.expandMacro(name, list?list:[]);
		if(result!=null) return result;
		return text();
	}

ArgumentList 
	= head:Argument tail:($__ "," $__ Argument)* {
		var result = [head];
		for(var i=0;i<tail.length;i++) {
			result = result.concat(tail[i]);
		}
		return result;
	}

Argument
	= Macro / $StringLiteral / $[^\n,)]+

StringLiteral = '"' ('\\"' / !'"' .)* '"'


WhiteSpaces = ([ \t\n]+ / "\\" [\n])+
MultiLineComment = "/*" ( !"*/" . )* "*/"
SingleLineComment = "//" ( ![\n] . )*
PreprocessorDirective = '#' ( "\\\n" / ![\n] . )* 
Blanks = WhiteSpaces / MultiLineComment / SingleLineComment / PreprocessorDirective
__ = Blanks* {return text();}

