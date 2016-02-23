{
	function extractList(list, index) {
		var result = [];
    	for(var i=0;i<list.length;i++) {
    		result.push(list[i][index]);
    	}
	    return result;
  	}
}

Start = __ "#" __ title:$(!"\n" .)+ __ desc:$(!"#" .)* s:(__ SpecSection)* __ {
	return {
		title:title,
		desc:desc,
		specs:extractList(s,1)
	};
}

SpecSection = "##" __ title:$(!"\n" .)+ __ prefix:$(!"```" .)* input:FencedCodeBlock __ midfix:$(!"```" .)* expect:FencedCodeBlock __ suffix:$(!"#" .)* {
	return {
		title: title,
		prefix: prefix,
		input: input,
		midfix: midfix,
		expect: expect,
		suffix: suffix,
	};
}

FencedCodeBlock = "```" (":" [a-zA-Z0-9]*)? [ \n]* s:$(!"```" .)* "```" { 
	return s; 
}

WhiteSpaces = ([ \t\n]+ / "\\" [\n])+
MultiLineComment = "/*" ( !"*/" . )* "*/"
SingleLineComment = "//" ( ![\n] . )*
Blanks = WhiteSpaces / MultiLineComment / SingleLineComment
__ = Blanks* {return text();}

