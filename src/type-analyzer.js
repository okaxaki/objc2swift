module.exports = (function(){
	"use strict";

	var ASTUtil = require('./ast-util');
	var TypeInfo = require('./type-info');
	var DeclInfo = require('./decl-info');

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