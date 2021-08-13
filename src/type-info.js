module.exports = (function(){

	var util = require('util');

	var _copy = function(src, dst, deep) {
		for(var key in src) {
			dst[key] = deep?_cloneIfArrayOrHash(src[key]):src[key];
		}
	};

	/**
	 * DeclInfo is intended to be (de)serializable as pure JSON.
	 * JS prototype chain is not used to define the DeclInfo and its derived classes.
  	 *
  	 * Thus do not use `obj instanceof TypeInfo`. Use `obj.kind == TypeInfo.KIND_XXXX` instead.
	 */
	var TypeInfo = function(obj) {
		if(!obj) {
			this.kind = TypeInfo.KIND_BASIC;
			this.name = null;
		} else {
			_copy(obj,this);
		}
	};

	TypeInfo.isStructType = function(info) {
		if(info) {
			return info.kind == TypeInfo.KIND_STRUCT ||
			info.name == "CGRect" || info.name == "CGSize" || info.name == "CGPoint";
		} 
		return false;
	};

	TypeInfo.defaultNullability = null;

	TypeInfo.KIND_BASIC = "type:basic";
	TypeInfo.KIND_CLASS = "type:class";
	TypeInfo.KIND_PROTOCOL = "type:protocol";
	TypeInfo.KIND_ENUM = "type:enum";
	TypeInfo.KIND_STRUCT = "type:struct";
	TypeInfo.KIND_BLOCK = "type:block";
	TypeInfo.KIND_FUNC = "type:func";
	TypeInfo.KIND_ARRAY = "type:array";
	TypeInfo.KIND_DICTIONARY = "type:dicrionary";
	TypeInfo.KIND_SELECTOR = "type:selector";

	/** 
	 * These constants can be used only in analysis process of TypeAnalyzer.
	 */
	TypeInfo.Bool = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"_Bool"});
	TypeInfo.Char = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"char"});
	TypeInfo.Int = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"int"});
	TypeInfo.Uint = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"unsigned int"});
	TypeInfo.Double = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"double"});
	TypeInfo.CString = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"char",pointer:{}});
	TypeInfo.NSString = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"NSString",pointer:{}});
	TypeInfo.Class = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"Class",pointer:{}});
	TypeInfo.Void = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"void"});
	TypeInfo.Id = new TypeInfo({kind:TypeInfo.KIND_BASIC,name:"id",pointer:{}});

	TypeInfo.getTypeClass = function(name) {
		if(name == "bool" || name == "_Bool" || name == "BOOL") return "bool";
		if(name == "NSInteger" || name == "NSUInteger") return "int";
		if(name == "float" || name == "CGFloat" || name == "double") return "float";
		if(/(^| )(int|short|char|long)( |$)/.test(name)) return "int";
		return "unknown";
	};

	TypeInfo.isBooleanType = function(info) {
		return(info && TypeInfo.getTypeClass(info.name) == "bool");
	};

	TypeInfo.isIntegerType = function(info) {
		return (info && TypeInfo.getTypeClass(info.name) == "int");
	};

	var _anonymousTypeCounter = 0;

	var _clone = function(obj,deep) {
		var result = new (obj.constructor)();
		_copy(obj,result,deep);
		return result;
	};

	var _cloneIfArrayOrHash = function(obj) {
		if(Array.isArray(obj)) {
			return obj.slice(0);
		} else if(typeof(obj) == "object") {
			var result = {};
			for(var key in obj) {
				result[key] = obj[key];
			}
			return result;
		} else {
			return obj;
		}
	};

	var _toNonnull = function(typeInfo) {
		var result = _clone(typeInfo);
		result.nullability = "nonnull";
		return result;
	};

	var _toNullable = function(typeInfo) {
		var result = _clone(typeInfo);
		result.nullability = "nullable";
		return result;
	};

	var _toProtocol = function(typeInfo, protocolSpec) {
		var result = _clone(typeInfo);
		result.kind = TypeInfo.KIND_PROTOCOL;
		result.protocols = protocolSpec.protocols.slice(0);
		return result;
	};

	var _toEnum = function(typeInfo,enumSpec) {
		var result = _clone(typeInfo);
		result.kind = TypeInfo.KIND_ENUM;
		result.name = "enum " + enumSpec.tagName;
		result.tagName = enumSpec.tagName;
		if(enumSpec.baseTypeSpecifiers) {
			result.baseType = _createObjectFromSpec(enumSpec.baseTypeSpecifiers);
		}
		return result;
	};

	var _toStruct = function(typeInfo,structSpec) {
		var result = new _clone(typeInfo);
		result.kind = TypeInfo.KIND_STRUCT;
		result.name = structSpec.tagName;
		result.tagName = structSpec.tagName;
		return result;
	};

	var _toBlock = function(typeInfo,blockSpec) {
		var result = _createObjectFromBlockTypeSpecifier(blockSpec);
		if(typeInfo.specifiers) {
			result.specifiers = typeInfo.specifiers;
		}
		if(typeInfo.nullability) {
			result.nullability = typeInfo.nullability;
		}
		if(typeInfo.isTypedef) {
			result.isTypedef = typeInfo.isTypedef;
		}
		result.returnType.name = typeInfo.name||"void";
		return result;
	};

	var _toFunc = function(typeInfo,suffix) {

		var parameters = [];

		if(suffix.parameters) {
			for(var i=0;i<suffix.parameters.length;i++) {
				var param = suffix.parameters[i];
				if(param.type == "ParameterDeclaration") {
					var info = _createObjectFromSpecDecl(param.specifiers,param.declarator);
					parameters.push(info);
				}
			}
		}

		return new TypeInfo({
			kind:TypeInfo.KIND_FUNC,
			parameters:parameters,
			returnType:typeInfo,
		});
	};

	var _toArray = function(typeInfo,suffix) {
		return new TypeInfo({
			kind:TypeInfo.KIND_ARRAY,
			sizeExpression:null,
			elementType:typeInfo,
		});
	};

	TypeInfo.toNonnull = _toNonnull;
	TypeInfo.toNullable = _toNullable;
	TypeInfo.toBlockType = _toBlock;
	TypeInfo.toFuncType = _toFunc;
	TypeInfo.toArrayType = _toArray;

	var _createObjectFromBlockTypeSpecifier = function(bs) {
		var parameters = [];
		if(bs.parameters) {
			for(var i=0;i<bs.parameters.length;i++) {
				var p = bs.parameters[i];
				var info;
				if(p.type == "TypeName") {
					info = _createObjectFromTypeName(p);
					parameters.push(info);
				} else {
					var DeclInfo = require('./decl-info');
					info = DeclInfo.createObjectFromSpecDecl(p.specifiers,p.declarator);
					parameters.push(info.type);
				}
			}
		}

		var result = new TypeInfo({
			kind:TypeInfo.KIND_BLOCK,
			returnType: _createObjectFromSpec(bs.specifiers),
			parameters:parameters,
		});

		if(bs.name) {
			result.declName = bs.name;
		}

		return result;
	};

	var _applyDeclarator = function(typeInfo,declarator) {

		if(!declarator) return typeInfo;

		var result = _clone(typeInfo);

		if(declarator.name) {
			result.declName = declarator.name;
		}

		if(declarator.pointer) {			
			result.pointer = {}; //TODO Support Nested Pointer
			for(var i=0;i<declarator.pointer.qualifiers.length;i++) {
				if(declarator.pointer.qualifiers[i].type == "NullabilityQualifier") {
					result.pointer.nullability = declarator.pointer.qualifiers[i].token;
					result.nullability = result.pointer.nullability;
				}
			}
		}

		if(declarator.specifier) {
			result.name = _createObjectFromSpec(declarator.specifier).name;
		}

		if(declarator.type == "AbstractDeclarator") {

			// TODO

		} else if(declarator.type == "BlockTypeSpecifier") {

			result = _toBlock(result,declarator);

		} else {
			var dd = declarator.directDeclarator;
			if(dd) {

				if(dd.type == "BlockDirectDeclarator") { // typedef void(^name)(param,...);

					result = _toBlock(result,dd);

				} else {
					var suffixes = dd.suffixes;
					if(suffixes) {
						for(var i=0; i<suffixes.length;i++) {
							if(suffixes[i].type == "DeclaratorApplySuffix") {
								result = _toFunc(result,suffixes[i]);
							} else if(suffixes[i].type == "DeclaratorLookupSuffix") {
								result = _toArray(result,suffixes[i]);
							}
						}
					}
				}
			}
		}
		return result;
	};
	TypeInfo.applyDeclarator = _applyDeclarator;

	var _createObjectFromSpecDecl = function(specifiers,declarator) {
		if(declarator) {
			var result = _applyDeclarator(_createObjectFromSpec(specifiers),declarator);
			if(result.pointer) {
				result.nullability = result.nullability||TypeInfo.defaultNullability;
			}
			return result;
		} else {
			return _createObjectFromSpec(specifiers);
		}
	};
	TypeInfo.createObjectFromSpecDecl = _createObjectFromSpecDecl;

	var _createObjectFromTypeName = function(typeName) {
		return _createObjectFromSpecDecl(typeName.specifiers,typeName.abstractDeclarator);
	};
	TypeInfo.createObjectFromTypeName = _createObjectFromTypeName;

	var _typeNamesToTypeInfos = function(typenames) {
		var result = [];
		for(var i=0;i<typenames;i++) {
			result.push(_createObjectFromTypeName(typenames[i]));
		}
		return result;
	};

	var _createObjectFromSpec = function(specifiers) {

		var specifiers = Array.isArray(specifiers)?specifiers:(specifiers?[specifiers]:[]);		
		var typeSpecifiers = [], i;

		var typeInfo = new TypeInfo();

		for(var i=0;i<specifiers.length;i++) {
			var spec = specifiers[i];
			if(!spec) {
				continue;
			} else if(spec.type == "EnumSpecifier") {
				typeInfo = _toEnum(typeInfo,spec);
			} else if(spec.type == "BlockTypeSpecifier") {
				typeInfo = _toBlock(typeInfo,spec);
			} else if(spec.type == "StructOrUnionSpecifier") {
				typeInfo = _toStruct(typeInfo,spec);
			} else if(spec.type == "BasicTypeSpecifier") {
				typeSpecifiers.push(spec.token);
			} else if(spec.type == "TypeNameSpecifier") {
				typeSpecifiers.push(spec.name);
				if(spec.generics) {
					typeInfo.parameters = _typeNamesToTypeInfos(spec.generics);
				}
			} else if(spec.type == "NullabilityQualifier") {
				typeInfo.nullability = spec.token;
			} else if(spec.type == "TypeofSpecifier") {
				if(spec.expression.name == "self") {
					typeSpecifiers.push("__typeof(self)");
				} else {
					typeSpecifiers.push(spec.text);
				}
			} else if(spec.type == "ProtocolTypeSpecifier") {
				typeInfo = _toProtocol(typeInfo,spec);
			} else if(spec.type == "StorageClassSpecifier") {
				if(spec.token == "typedef")	{
					typeInfo.isTypedef = true;
				} else {
					if(!typeInfo.storageClass) typeInfo.storageClass = [];
					typeInfo.storageClass.push(spec.token);
				}
			} else if(spec.token == "__weak") {
				typeInfo.isWeak = true;
			} else if(spec.token == "const") {
				typeInfo.isConstant = true;
			} else if(spec.token == "__block") {
				typeInfo.isBlock = true;
			} else if(spec.token) {
				if(!typeInfo.qualifiers) typeInfo.qualifiers = [];
				typeInfo.qualifiers.push(spec.token);
			} else {
				console.log("Warning: unknown specifier: " + util.inspect(spec));
			}		
		}

		if(!typeInfo.name) {
			typeInfo.name = typeSpecifiers.join(' ');
		}

		if(typeInfo.name == "id") {
			typeInfo.pointer = {};
		}

		if(typeInfo.pointer) {
			typeInfo.nullability = typeInfo.nullability||TypeInfo.defaultNullability;
		}

		return typeInfo;
	};

	return TypeInfo;

})();