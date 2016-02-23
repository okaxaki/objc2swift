module.exports = (function(){
	"use strict"

	var util = require('util');
	var ASTUtil = require('./ast-util');
	var TypeInfo = require('./type-info');

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