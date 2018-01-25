module.exports = (function(){
	"use strict"

	var util = require('util');
	var ASTUtil = require('./ast-util');
	var o2s = require('./main');
	var parser = require('./parser');

	var TypeInfo = require('./type-info');
	var DeclInfo = require('./decl-info');

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
