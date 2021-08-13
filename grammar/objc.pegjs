/*
 * Objective-C Grammar for PEG.js
 * ==============================
 *
 * If you would like to reuse this grammar, [pegjs-strip](https://github.com/okaxaki/pegjs-strip) 
 * may be useful. It can eliminate JavaScript-related things from the grammar.
 *
 * This grammar is based on ANTLR's C.g4 and ObjC.g4 with many fixes. Notable changes are:
 *
 * - Accept parameterized type like `NSObject<T>` as class and category name.
 * - Accept multi-time occurences of `@require` and `@optional` in ProtocolDeclaration.
 * - Support C-style variable arguments; `va_arg` macro is recognized as a token.
 * - Support Elvis operator `?:` (GCC extension; abbreviation syntax of ConditionExpression).
 * - Recognize CompoundStatement as expression (GCC extension).
 * - Support C99 type tokens.
 * - Support `__attribute__` specifier.
 * - Support more type specifiers and qualifiers.
 * - Recognize some essential preprocessor delectives and macros defined in iOS and OSX sdks.
 * - Recognize `;` after `@end`.
 * - Refactor the structure of the grammar around type specifiers and qualifiers.
 * - Support `extern "C"` block.
 *
 */
{
  var util = require('util');

  /**
   If `isTypeName` function is defined well,  the semantic predicate `!IsDeclarator` 
   can be removed from the grammar. Seel also the `DeclarationSpecifiers` and
   `TypeIdentifier` rules.

   C-style language can not be parsed with pure context-free grammars.
   For example, if A is a defined type name, `A * B` is a declaration of B.
   But if A is other identifier, A * B is considered as Multiplicative of A and B. 

   To handle such context-sensitiveness, check whether if the name is a defined type or not
   in `isTypeName` function.
  */
  function isTypeName(name) {
  	return true;
  }

  function extractOptional(optional, index) {
  	if(optional) {
  		if(util.isNumber(index)) {  		
  			return optional[index];
  		} else if(util.isArray(index)) {
  			var result = [],i;
  			for(i=0;i<index.length;i++) {
  				result.push(optional[index[i]]);
  			}
  			return result;
  		} else {
  			throw new Error("Illegal Argument");
  		}
  	} else {
  		return null;
  	}
  }

  function extractList(list, index, flat) {

  	var flat = (flat===undefined?true:flat);    

    var result = [], i, j;
    if(Array.isArray(index)) {
    	for(i=0;i<list.length;i++) {
    		if(flat) {
    			for(j=0;j<index.length;j++) {
    				result.push(list[i][index[j]]);
    			}    			
    		} else {
    			var items = [];
    			for(j=0;j<index.length;j++) {
    				items.push(list[i][index[j]]);
    			}
    			result.push(items);
    		}
    	}
    } else {
    	for(i=0;i<list.length;i++) {
    		if(flat) {
    			result.push(list[i][index]);
    		} else {
    			result.push([list[i][index]]);
    		}
    	}
    }

    return result;
  }

  function flattenList(list) {
  	var result = [], i, obj;
  	for(i=0;i<list.length;i++) {
  		obj = list[i];
  		if(Array.isArray(obj)) {
  			result = result.concat(flattenList(obj));
  		} else {
  			result.push(obj);
  		}
  	}
  	return result;
  }

  function buildList(head, tail, index, flat) {
    return [head].concat(extractList(tail, index, flat));
  }

  function buildLeftAssocList(head, tail, index, factory) {
  	var result = head;
  	for(var i=0;i<tail.length;i++) {
  		result = factory(result,tail[i][index]);
  	}
  	return result;
  }

}

Start = TranslationUnit __ EOF

EOF = !.

TranslationUnit 
	= decl:(__ ExternalDeclaration)* {
		return { 
			type:"TranslationUnit", 
			externalDeclarations: extractList(decl,[0,1]),
		};
	}

ExternalDeclaration 
	= ImportDirective
	/ ModuleImportDirective
	/ IncludeDirective
	/ Declaration
	/ FunctionDefinition
	/ ClassInterface 
	/ ClassImplementation
	/ CategoryInterface
	/ CategoryImplementation
	/ ProtocolDeclaration
	/ ProtocolDeclarationList
	/ ClassDeclarationList
	/ NS_ASSUME_NONNULL_BEGIN {
		return {
			type:"NSAssumeNonnullBegin",
			context:"ExternalDeclaration",
			_hidden:true,
		};
	}
	/ NS_ASSUME_NONNULL_END {
		return{
			type:"NSAssumeNonnullEnd",
			context:"ExternalDeclaration",
			_hidden:true,
		};
	}
	/ ExternToken __ '"C"' __ "{" m:(__ ExternalDeclaration)* __ "}" { return extractList(m,[0,1]); }
	/ ";"

ImportDirective
	= '#' _ 'import' _ arg:( String / AngleString ) {
		return {
			type:"ImportDirective",
			argument:arg
		};
	}

ModuleImportDirective
	= ImportToken __ arg:( Identifier ) {
		return {
			type:"ModuleImportDirective",
			argument:arg
		};
	}

IncludeDirective
	= '#' _ 'include' _ arg:( String / AngleString ) {
		return {
			type:"IncludeDirective",
			argument:arg,
		};
	}

FunctionDefinition
	= spec:DeclarationSpecifiers? c1:__ decl:Declarator c2:__ comp:CompoundStatement {
		return {
			type:"FunctionDefinition",
			specifiers:spec,
			c1:c1,
			declarator:decl,
			c2:c2,
			statement:comp,
		};
	}

CompoundStatement
	= '{' prefix:__ block:BlockItemList suffix:__ '}' {
		return {
			type:"CompoundStatement",
			prefix:prefix,
			blockItems:block,
			suffix:suffix,
		};
	}

BlockItemList 
	= m:(__ (CastExpression __) ';' / __ Declaration / __ Statement)* {
		return {
			type:"StatementList",
			prefixes:extractList(m,0),
			statements:extractList(m,1),
		};
	}

Statement 
  = LabeledStatement
  / ExpressionStatement
  / CompoundStatement
  / SelectionStatement
  / IterationStatement
  / JumpStatement
  / SynchronizedStatement
  / AutoreleaseStatement
  / TryBlock
  / ThrowStatement
  / ';'

ExpressionStatement
  = m:(Expression __) ';' { return m; }

LabeledStatement
  = id:Identifier __ ':' __ stmt:Statement {
  	return {
  		type:"LabeledStatement",
  		identifier:id,
  		statement:stmt,
  	};
  }
  / CaseToken c1:__ expr:Expression c2:__ ':' c3:__ stmt:Statement {
  	return {
  		c1:c1,
  		type:"CaseStatement",
  		c2:c2,
  		expression:expr,
  		c3:c3,
  		statement:stmt
  	};
  }
  / DefaultToken __ ':' __ Statement

SelectionStatement
  = IfToken c1:__ '(' c2:__ expression:Expression c3:__ ')' thenBlock:(__ Statement __) elseBlock:( ElseToken __ Statement )? {
  	return {
  		type:"IfStatement",
  		c1:c1,
  		c2:c2,
  		expression:expression, 
  		c3:c3,
  		thenBlock:{
  			prefix:thenBlock[0],
  			statement:thenBlock[1],
  			suffix:thenBlock[2],
  		},
  		elseBlock:elseBlock?{
  			prefix:elseBlock[1],
  			statement:elseBlock[2]
  		}:null,
  	};
  }
  / SwitchToken c1:__ '(' c2:__ e:Expression c3:__ ')' c4:__ s:Statement {
  	return {
  		type:"SwitchStatement",
  		c1:c1,
  		c2:c2,
  		expression:e,
  		c3:c3,
  		c4:c4,
  		statement:s,
  	};
  }

ForInStatement 
	= ForToken c1:__ '(' c2:__ t:TypeVariableDeclarator c3:__ InToken c4:__ e:Expression? c5:__ ')' c6:__ statement:Statement {
		return {
			type:"ForInStatement",
			c1:c1,
			c2:c2,
			declarator:t,
			c3:c3,
			c4:c4,
			expression:e,
			c5:c5,
			c6:c6,
			statement:statement,
		};
	}

ForStatement
	= ForToken __ '(' __
		init:(DeclarationSpecifiers __ InitDeclaratorList / Expression)? __ ';'
		cond:(__ Expression)? __ ';'
		loop:(__ Expression)? __ ')' prefix:__ statement:Statement 
	{
		var specifiers, declarators, expression;

		if(init) {
			if(init.length==1) {
				expression = init[0];
			} else {
				specifiers = init[0];
				declarators = init[2];
			}
		}

		return {
			type:"ForStatement",
			initSpecifiers: specifiers,
			initDeclarators: declarators,
			initExpression: expression,
			condExpression:cond?cond[1]:null,
			loopExpression:loop?loop[1]:null,
			prefix:prefix,
			statement:statement,
		};
	}

WhileStatement
	= WhileToken c1:__ '(' c2:__ cond:Expression c3:__ ')' c4:__ statement:Statement {
		return {
			type:"WhileStatement",
			c1:c1,
			c2:c2,
			condExpression:cond,
			c3:c3,
			c4:c4,
			statement:statement,
		};
	}

DoStatement
	= DoToken prefix:__ statement:Statement suffix:__ WhileToken __ '(' __ cond:Expression __ ')' __ ';' {
		return {
			type:"DoStatement",
			prefix:prefix,
			statement:statement,
			suffix:suffix,
			condExpression:cond,			
		}
	}

IterationStatement
  = WhileStatement
  / DoStatement
  / ForStatement
  / ForInStatement

JumpStatement
  = GotoToken __ label:Identifier suffix:__ ';' { 
  		return {
  			type:"GotoStatement",
  			label:identifier,
  			suffix:suffix,
  		};
  	}
  / m:(ContinueToken __) ';' { return m; }
  / BreakToken c1:__ ';' { 
  		return {
  			type:"BreakStatement",
  			c1:c1,
  		};
  	}
  / ReturnToken c1:__ e:Expression? c2:__ ';' { 
  		return {
  			type:"ReturnStatement",
  			c1:c1,
  			expression:e,
  			c2:c2
  	 	};
  	}

TypeVariableDeclarator 
	= s:DeclarationSpecifiers c1:__ d:Declarator {
		return {
			type:"TypeVariableDeclarator",
			specifiers:s,
			c1:c1,
			declarator:d
		};
	}

TryStatement
	= TryToken c1:__ statement:CompoundStatement {
		return {
			type:"TryStatement",
			c1:c1,
			statement:statement,
		};
	}

CatchStatement
	= CatchToken c1:__ '(' c2:__ declarator:TypeVariableDeclarator c3:__ ')' c4:__ statement:CompoundStatement {
		return {
			type:"CatchStatement",
			c1:c1,
			c2:c2,
			declarator:declarator,
			c3:c3,
			c4:c4,
			statement:statement,
		};
	}

FinallyStatement
	= FinallyToken c1:__ statement:CompoundStatement {
		return {
			type:"FinallyStatement",
			c1:c1,
			statement:statement,
		};
	}

ThrowStatement
	= ThrowToken c1:__ expression:Expression c2:__ ';' {
		return {
			type:"ThrowStatement",
			c1:c1,
			expression:expression,
			c2:c2,
		};
	}

TryBlock
	= ts:TryStatement cs:(__ CatchStatement)* c1:__ fs:FinallyStatement? {
		return {
			type:"TryBlock",
			tryStatement:ts,
			catchStatements:cs,
			c1:c1,
			finallyStatement:fs,
		};
	}

SynchronizedStatement
	= SynchronizedToken __ '(' __ expression:UnaryExpression __ ')' __ statement:CompoundStatement {
		return {
			type:"SynchronizedStatement",
			expression:expression,
			statement:statement,
		};
	}

AutoreleaseStatement
	= AutoreleasepoolToken c1:__ statement:CompoundStatement {
		return {
			type:"AutoreleaseStatement",
			c1:c1,
			statement:statement,
		};
	}

//
// Expression
//

Expression 
	= head:AssignmentExpression tail:( __ ',' __ AssignmentExpression )* {
		if(0<tail.length) {
			return {
				type:"Expression",
				children:[head].concat(tail)
			};
		} else {
			return head;
		}
	}

AssignmentExpression
    = lhs:UnaryExpression c1:__ op:AssignmentOperator c2:__ rhs:AssignmentExpression {
    	return {
    		type:"AssignmentExpression",
    		lhs:lhs,
    		c1:c1,
    		operator:op,
    		c2:c2,
    		rhs:rhs
    	};
    }
    / ConditionalExpression

AssignmentOperator
	= '=' / '*=' / '/=' / '%=' / '+=' / '-=' / '<<=' / '>>=' / '&=' / '^=' / '|='

ConditionalExpression
	= m:(LogicalOrExpression __ '?' __ ConditionalExpression? __ ':' __ ConditionalExpression) {
		if(!m[4]) {
			m[4] = m[0];
		}
		return {
			type:"ConditionalExpression", children:m
		};
	}
	/ LogicalOrExpression

ConstantExpression
	= ConditionalExpression

LogicalOrExpression
	= head:LogicalAndExpression tail:( __ '||' __ LogicalAndExpression )* { 
		if(0<tail.length) {
			return {
				type:"LogicalOrExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

LogicalAndExpression
	= head:InclusiveOrExpression tail:( __ '&&' __ InclusiveOrExpression )* { 
		if(0<tail.length) {
			return {
				type:"LogicalAndExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

InclusiveOrExpression 
	= head:ExclusiveOrExpression tail:( __ $('|' !'|') __ ExclusiveOrExpression )* { 
		if(0<tail.length) {
			return {
				type:"InclusiveOrExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

ExclusiveOrExpression 
	= head:AndExpression tail:( __ '^' __ AndExpression )* { 
		if(0<tail.length) {
			return {
				type:"ExclusiveOrExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

AndExpression
	= head:EqualityExpression tail:( __ $('&' !'&') __ EqualityExpression )* { 
		if(0<tail.length) {
			return {
				type:"AndExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

EqualityExpression 
	= head:RelationalExpression tail:( __ ('!=' / '==') __ RelationalExpression )* { 
		if(0<tail.length) {
			return {
				type:"EqualityExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

RelationalExpression 
	= head:ShiftExpression tail:( __ $('<=' / '>=' / '<' !'<' / '>' !'>' ) __ ShiftExpression )* { 
		if(0<tail.length) {
			return {
				type:"RelationalExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

ShiftExpression 
	= head:AdditiveExpression tail:( __ ('<<' / '>>') __ AdditiveExpression )* { 
		if(0<tail.length) {
			return {
				type:"ShiftExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

AdditiveExpression 
	= head:MultiplicativeExpression tail:( __ [+\-] __ MultiplicativeExpression )* { 
		if(0<tail.length) {
			return {
				type:"AdditiveExpression",
				children:[head].concat(tail)
			};
		}
		return head;
	}

MultiplicativeExpression 
	= head:CastExpression tail:( __ [*/%] __ CastExpression )* { 
		if(0<tail.length) {
			var result = head;
			for(var i=0;i<tail.length;i++) {
				result = {
					type:"MultiplicativeExpression",
					lhs:result,
					c1:tail[i][0],
					operator:tail[i][1],
					c2:tail[i][2],
					rhs:tail[i][3],
				};
			}
			return result;
		}
		return head;
	}

CastExpression
	= '(' __ t:TypeName __ ')' __ e:CastExpression {
		return {
			type:"CastExpression",
			castTo:t,
			expression:e
		};
	}
	/ UnaryExpression

UnaryExpression
  	= m:(('++' / '--') __ UnaryExpression) {
  		return {
  			type:(m[0]=='++'?"UnaryIncExpression":"UnaryDecExpression"),
  			children:m,
  		};
  	}
  	/ m:(UnaryOperator __ CastExpression) {
  		if(m[0] == '!') {
  			return {
  				type:"NotExpression",
  				c1:m[1],
  				child:m[2],
  			};
  		} else {
  			return m;
  		}
  	}
  	/ m:(SizeofToken __ '(' __ TypeName __ ')')
  	/ SizeofToken __ UnaryExpression  
  	/ PostfixExpression

UnaryOperator
	= '&' / '*' / '+' / '-' / '~' / '!' { return text(); }

PostfixExpression
	= head:PrimaryExpression tail:( __ PostfixOperation )* { 
		if(0<tail.length) {
			return buildLeftAssocList(head,tail,1, function(a,b) {

				if(b.type == "PostfixApplyOperation") {

					return {type:"PostfixApplyExpression", context:a, parameters:b.parameters};

				} else if(b.type == "PostfixDotOperation") {

					return {type:"PostfixDotExpression", context:a, identifier:b.identifier};

				} else {

					return {type:"PostfixExpression", children:[a].concat(b)};

				}

			});

		}
		return head;
	}

PostfixOperation
	= '[' __ e:Expression __ ']'
	/ '(' __ p:ArgumentExpressionList? __ ')' {
		return {
			type:"PostfixApplyOperation",
			parameters:p,
		};
	}
	/ '.' __ id:$(Identifier / SelfToken) {
		return {
			type:"PostfixDotOperation",
			identifier:id
		};
	}
	/ '->' __ $Identifier
	/ '++' 
	/ '--' 

ArgumentExpressionList
  	= AssignmentExpression (__ ',' __ AssignmentExpression )*

PrimaryExpression
	= '(' __ e:Expression __ ')' {
		return {
			type:"NestedExpression",
			expression:e
		};
	}
	/ MacroExpression 
	/ MessageExpression 
	/ SelectorExpression 
	/ ProtocolExpression 
	/ EncodeExpression 
	/ AvailableExpression 
    / DictionaryExpression 
    / ArrayExpression 
    / BoxExpression 
    / BlockExpression 
    / CompoundStatement /* gcc-extension: https://gcc.gnu.org/onlinedocs/gcc-3.1/gcc/Statement-Exprs.html */
    / m:Constant {
    	return{
    		type:"Constant", 
    		child:m
    	};
    }
    / SelfToken {
    	return {
    		type:"PrimaryIdentifier",
    		name:text()
    	};
    }
    / SuperToken {
    	return {
    		type:"PrimaryIdentifier",
    		name:text(),
    	}
    }
    / Identifier {
    	return {
    		type:"PrimaryIdentifier",
    		name:text()
    	};
    }

MacroExpression // Support preprocessor macro directly.
	= 'va_arg' __ '(' __ Identifier __ ',' __ TypeName __ ')'

Constant 
	= m:HexLiteral {return {type:"HexLiteral",token:m};}
	/ m:BinaryLiteral {return {type:"BinaryLiteral",token:m};}
	/ m:OctalLiteral {return {type:"OctalLiteral",token:m};}
	/ m:CharacterLiteral {return {type:"CharacterLiteral",token:m};}
	/ m:BooleanLiteral {return {type:"BooleanLiteral",token:m};}
	/ m:FloatingPointLiteral {return {type:"FloatingPointLiteral",token:m};}
	/ m:DecimalLiteral {return {type:"DecimalLiteral",token:m};}
    / m:StringLiteral { return {type:"StringLiteral",token:m};}


DictionaryPair
	= PostfixExpression __ ':' __ PostfixExpression

DictionaryExpression
	= '@{' m:(__ DictionaryPair? (__ ',' __ DictionaryPair )* (__ ',')? __) '}' {
		return {
			type:"DictionaryExpression",
			body:m
		};
	}

ArrayExpression
	= '@[' m:(__ Expression? (__ ',' __ Expression )* (__ ',')? __) ']' {
		return {
			type:"ArrayExpression",
			body:m
		};
	}

BoxExpression
	= '@(' __ e:ConstantExpression __')' {return e;}
    / '@' __ e:ConstantExpression {return e;}

BlockParameters
	= '(' __ head:( TypeVariableDeclarator / TypeName ) tail:(__ ',' __ ( TypeVariableDeclarator / TypeName ))* __ ')' {
		return buildList(head,tail,3);
	}
	/ '(' __ VoidToken? __ ')' {
		return [];
	}

BlockExpression
	= '^' t:(__ TypeName)? c1:__ p:BlockParameters? c2:__ s:CompoundStatement {
		return {
			type:"BlockExpression",
			specifier:t,
			c1:c1,
			parameters:p,
			c2:c2,
			statement:s,
		};
	}

MessageExpression
	= '[' __ r:Receiver __ s:MessageSelector __ ']' {

		return {
			type:"MessageExpression",
			receiver:r,
			selector:s
		};
	}

Receiver
	= Expression

MessageSelector
	= h:KeywordArgument t:(__ KeywordArgument)* {
		return buildList(h,t,[0,1]);
	}
	/ Selector

KeywordArgument
    = s:Selector? c1:$(__ ':' __) e:Expression {
    	return {
    		type:"KeywordArgument",
    		name:s?s.name:null,
    		separator:c1,
    		expression:e,
    	};
    }

SelectorExpression
	= SelectorToken __ '(' __ name:$SelectorName __ ')' {
		return {
			type:"SelectorExpression",
			name:name
		};
	}

SelectorName
	= (__ Selector? __ ':')+ 
	/ Selector

ProtocolExpression
	= ProtocolToken __ '(' __ name:ProtocolName __ ')' {
		return {
			type:"ProtocolExpression",
			name:name
		};
	}

EncodeExpression
	= EncodeToken __ '(' __ name:TypeName __ ')' {
		return {
			type:"EncodeExpression",
			arg:name,
			text:text()
		};
	}

AvailableExpression
	= AvailableToken __ '(' __ args:AttributeExpressionArgument __ ')' {
		return {
			type:"AvailableExpression",
			args:args
		};
	}

AttributeExpressionArgument = (!")" .)*

//
// Class
//

ClassInterface 
	= InterfaceToken __ spec:TypeNameSpecifier inhr:(__ ':' __ Identifier)?
	c1:__ p:ProtocolReferenceList?
	c2:__ v:InstanceVariables?
	c3:__ d:InterfaceDeclarationList?
	c4:__ EndToken {
		var sup = extractOptional(inhr,3);
		var node = {
			type:"ClassInterface",
			classSpecifier:spec,
			superClass:sup?sup.name:null,
			c1:c1,
			protocols:p,
			c2:c2,
			variables:v,
			c3:c3,
			declarations:d,
			c4:c4,
		};
		return node;
	}

CategoryInterface 
	= InterfaceToken __ spec:TypeNameSpecifier __ '(' __ id:Identifier? __ ')'
	c1:__ p:ProtocolReferenceList?
	c2:__ v:InstanceVariables?
	c3:__ d:InterfaceDeclarationList?
	c4:__ EndToken {
		var node = {
			type:"CategoryInterface",
			classSpecifier:spec,
			categoryName:id?id.name:'',
			c1:c1,
			protocols:p,
			c2:c2,
			variables:v,
			c3:c3,
			declarations:d,
			c4:c4,
		};
		return node;

	}

ClassImplementation
	= ImplementationToken __ spec:TypeNameSpecifier inhr:(__ ':' __ Identifier)?
	c2:__ v:InstanceVariables?
	c3:__ d:ImplementationDefinitionList?
	c4:__ EndToken {
		var sup = extractOptional(inhr,3);
		return {
			type:"ClassImplementation",
			classSpecifier:spec,
			c1:"",
			superClass:sup?sup.name:null,
			c2:c2,
			variables:v,
			c3:c3,
			definitions:d,
			c4:c4,
		};
	}

CategoryImplementation
	= ImplementationToken __ spec:TypeNameSpecifier c1:__ '(' __ id:Identifier __ ')' 
	c3:__ d:ImplementationDefinitionList?
	c4:__ EndToken {
		return {
			type:"CategoryImplementation",
			classSpecifier:spec,
			c1:c1,
			categoryName:id.name,
			c2:"",
			variables:null,
			c3:c3,
			definitions:d,
			c4:c4,
		};
	}
	
ClassDeclarationList
	= ClassToken __ ClassList __ ';' {
		return {
			type:"ClassDeclarationList",
			_hidden:true,
		};
	}

ClassList
	= TypeNameSpecifier (__ ',' __ TypeNameSpecifier)* 

InstanceVariables
	= '{' __ '}' {
		return {
			type:"InstanceVariables",
			declarations:[],
		};
	}
	/ '{' prefix:__ d:(__ VisibilitySpecification? __ StructDeclaration)+ suffix:__ '}' {
		return {
			type:"InstanceVariables",
			prefix:prefix,
			visibilityPrefixes:extractList(d,0),
			visibilitySpecification:extractList(d,1),
			declarationPrefixes:extractList(d,2),
			declarations:extractList(d,3),
			suffix:suffix,
		};
	}

VisibilitySpecification 
	= PrivateToken 
	/ ProtectedToken 
	/ PackageToken 
	/ PublicToken

//
// Protocol
//
ProtocolDeclaration
	= ProtocolToken c1:__ name:ProtocolName 
	c2:__ p:ProtocolReferenceList?
	decl:(__ RequiredToken / __ OptionalToken / __ InterfaceDeclaration)*
	c3:__ EndToken {
		return {
			type:"ProtocolDeclaration",
			c1:c1,
			name:name,
			c2:c2,			
			protocols:p,
			declarations:extractList(decl,[0,1]),
			c3:c3
		};
	}

ProtocolDeclarationList
	= ProtocolToken __ ProtocolList __ ';' {
		return {
			type:"ProtocolDeclarationList",
			_hidden:true
		};
	}

ProtocolReferenceList 
	= '<' __ p:ProtocolList __ '>' {
		return p;
	}

ProtocolList = head:ProtocolName tail:( __ ',' __ ProtocolName )* {
	return buildList(head,tail,3);
}

ProtocolName = Identifier { return text(); }

//
// Implementation
//
ImplementationDefinitionList
    = head:ImplementationDefinition tail:(__ ImplementationDefinition)* {
    	return buildList(head,tail,[0,1]);
    }

ImplementationDefinition
	= Declaration 
	/ FunctionDefinition
	/ ClassMethodDefinition 
    / InstanceMethodDefinition
    / PropertyImplementation
    / ";"

ClassMethodDefinition
    = '+' __ m:MethodDefinition { 
    	return {
    		type:"ClassMethodDefinition",
    		returnType:m.returnType,
    		selector:m.selector,
    		initDeclarators:m.initDeclarators,
    		attributes:m.attributes,
    		c1:m.c1,
    		statement:m.statement,
    	}; 
   	}

InstanceMethodDefinition
	= '-' __ m:MethodDefinition {
    	return {
    		type:"InstanceMethodDefinition",
    		returnType:m.returnType,
    		selector:m.selector,
    		initDeclarators:m.initDeclarators,
    		attributes:m.attributes,    		
    		c1:m.c1,
    		statement:m.statement,
    	}; 
   	}

MethodDefinition
	= t:MethodType? __ s:MethodSelector __ i:InitDeclaratorList? (__ ';')? a:(__ AttributeQualifier)* c1:__ statement:CompoundStatement {
		return {
			type:"MethodDefinition",
			returnType:t,
			selector:s,
			initDeclarators:i,
			attributes:extractOptional(a,1),
			c1:c1,
			statement:statement,
		};
	}

PropertyImplementation
    = SynthesizeToken __ p:PropertySynthesizeList __ ';' {
    	return {
    		type:"PropertyImplementation",
    		properties:p,
    	};
    }
    / DynamicToken __ p:PropertySynthesizeList __ ';' {
    	return {
    		type:"PropertyDynamicImplementation",
    		properties:p,
    	};    	
    }

PropertySynthesizeList
    =  head:PropertySynthesizeItem tail:(__ ',' __ PropertySynthesizeItem)* {
    	return buildList(head,tail,3);
    }

PropertySynthesizeItem
    = id:Identifier sub:(__ '=' __ Identifier)? {
    	var s = extractOptional(sub,3);
    	return {
    		type:"PropertySynthesizeItem",
    		name:id.name,
    		syntheName:s?s.name:null,
    	};
    }

StructOrUnionSpecifier
	= h:(StructToken / UnionToken) __ e:StructOrUnionSpecifierEntity {
		return {
			type:"StructOrUnionSpecifier",
			isUnion:h.indexOf("union")==0,
			tagName:e.tagName,
			c1:e.c1,
			declarations:e.declarations,
			c2:e.c2,
		};
	}

StructOrUnionSpecifierEntity
	= id:Identifier? c1:__ '{' d:(__ StructDeclaration)+ c2:__ '}' {
		return {
			tagName:id?id.name:null,
			c1:c1,
			declarations:d,
			c2:c2
		};
	}
	/ id:Identifier {
		return {tagName:id.name};
	}


StructDeclaration 
	= q:SpecifierQualifierList __ d:StructDeclaratorList a:(__ AttributeQualifier)* __ ';' {
		return {
			type:"StructDeclaration",
			specifiers:q,
			declarators:d,
		};
	}

SpecifierQualifierList 
	= head:SpecifierQualifier tail:(__ !IsDeclarator SpecifierQualifier)* {
		return buildList(head,tail,2);
	}

SpecifierQualifier
	= TypeSpecifier / TypeQualifier

StructDeclaratorList
	= head:StructDeclarator tail:(__ ',' __ StructDeclarator)* {
		return buildList(head,tail,3);
	}

StructDeclarator
	= d:Declarator? __ ':' __ c:$(Constant) {
		return { type:"UnionDeclarator", declarator:d, width:c };
	}
	/ Declarator

EnumSpecifier
	= EnumToken c1:__ id:Identifier? type:(__ ':' __ DeclarationSpecifiers)? c2:__ '{' c3:__ enums:EnumeratorList c4:__ '}' {
		return {
			type:"EnumSpecifier", 
			c1:c1,
			tagName:id?id.name:null,
			baseTypeSpecifiers:extractOptional(type,3), 
			c2:c2,
			c3:c3,
			enumerators:enums,
			c4:c4
		};
	}
	/ EnumToken c1:__ id:Identifier? type:(__ ':' __ DeclarationSpecifiers)? {
		return {
			type:"EnumSpecifier", 
			c1:c1,
			tagName:id?id.name:null,
			c2:'',
			c3:'',
			baseTypeSpecifiers:extractOptional(type,3),
		};
	}

EnumeratorList
	= head:Enumerator tail:(__ ',' __ Enumerator)* rest:(__ ',')? {
		var result = buildList(head,tail,[0,2,3]);
		if(rest) {
			result.push(rest[0]);
		}
		return result;
	}

Enumerator
	= name:Identifier expr:(__ '=' __ ConstantExpression)? {
		return {
			type:"Enumerator",
			name:name.name,
			expression:extractOptional(expr,3)
		};
	}

Declarator 
	= p:Pointer? __ d:DirectDeclarator a:(__ AttributeQualifier)* {
		return {
			type:"Declarator",
			pointer:p, 
			name:d.name,
			directDeclarator:d,
			attributes:extractOptional(a,1),
		};
	}

Pointer 
     = '*' q:(__ TypeQualifier)* p:(__ Pointer)? {
     	return {
     		type:"Pointer",
     		qualifiers:extractList(q,1),
     		child:p,
     	};
     }

DirectDeclarator 
    = '(^' __ s:(!IsDeclarator DeclarationSpecifiers)? __ i:Identifier __ ')' __ p:BlockParameters {
    	return {
    		type:"BlockDirectDeclarator", // compatible with BlockTypeSpecifier
    		specifiers:extractOptional(s,1),
    		name:i.name,
    		parameters:p,
    	};
    }
    / '(' q:(__ TypeQualifier)* __ d:Declarator __ ')' s:( __ DeclaratorSuffix )* {
    	return {
    		type:"FunctionDirectDeclarator",
    		qualifiers:extractList(q,1),
    		name:d.name,
    		declarator:d,
    		suffixes:extractList(s,1),
    	};
    }
	/ q:(TypeQualifier __)* i:Identifier s:( __ DeclaratorSuffix )* {
		return {
			type:"DirectDeclarator",
			qualifiers:extractList(q,0),
			name:i.name,
			suffixes:extractList(s,1),
		};
	}

DeclaratorSuffix 
	= m:('[' __ ConstantExpression? __ ']') {
		return {
			type:"DeclaratorLookupSuffix",
			children:m,
			expression:m[2],
		};
		
	}
 	/ m:('(' __ ParameterList? __ ')') {
 		return {
 			type:"DeclaratorApplySuffix",
 			children:m,
 			parameters:m[2]?m[2].parameters:null,
 			isVariadic:m[2]?m[2].v:null,
 		};
 	}

ParameterList 
	= p:ParameterDeclarationList v:(__ ',' __ '...')? {
		return {
			type:"ParameterList",
			parameters:p,
			isVariadic:v?true:false,
		};
	};

InterfaceDeclarationList 
	= head:InterfaceDeclaration tail:(__ InterfaceDeclaration)* {
		return buildList(head,tail,1);
	}

InterfaceDeclaration
	= Declaration 
	/ ClassMethodDeclaration 
	/ InstanceMethodDeclaration 
	/ PropertyDeclaration
	/ ";"

Declaration
	= spec:DeclarationSpecifiers c1:__ decl:InitDeclaratorList? c2:__ ';' {
		return {
			type:"Declaration",
			specifiers:spec,
			c1:c1,
			initDeclarators:decl,
			c2:c2,
		};
	}

/**
 * `!IsDeclarator` can be removed if `isTypeName` function is well-defined.
 */
DeclarationSpecifiers
	= head:DeclarationSpecifier tail:(__ !IsDeclarator DeclarationSpecifier)* {
		return buildList(head,tail,2);
	}

IsDeclarator
	= Identifier __ ([{:;)=,] / InToken) // just for optimize: this may save looking-ahead cost of the actual Declarator.
	/ Declarator __ ([{:;)=,] / InToken)
	/ InitDeclaratorList __ ";"

DeclarationSpecifier
	= StorageClassSpecifier 
	/ TypeQualifier 
	/ TypeSpecifier // TypeSpecifier must be last because it matches any identifier.

StorageClassSpecifier 
	= m:(TypedefToken / AutoToken / RegisterToken / StaticToken / ExternToken / InlineToken) {
		return {
			type:"StorageClassSpecifier",
			token:text()
		};
	}

TypeSpecifier
	= BlockTypeSpecifier
	/ ProtocolTypeSpecifier
	/ StructOrUnionSpecifier
	/ EnumSpecifier 
	/ (TypeofToken / __TypeofToken / __TypeofToken__) __ '(' __ e:UnaryExpression __ ')' {
		return {
			type:"TypeofSpecifier",
			expression:e,
			text:text(),
		};
	}
	/ BasicTypeSpecifier
	/ TypeNameSpecifier 

BlockTypeSpecifier
	= "(^" __ s:(!IsDeclarator DeclarationSpecifiers)? __ id:Identifier? __ ")" p:(__ BlockParameters)? {
		return {
			type:"BlockTypeSpecifier",
			specifiers:extractOptional(s,1),
			name:id?id.name:null,
			parameters:extractOptional(p,1),
		};
	}

ProtocolTypeSpecifier
	= IdToken __ p:ProtocolReferenceList {
		return {
			type:"ProtocolTypeSpecifier",
			protocols:p,
		};
	}

TypeNameSpecifier
	= i:TypeIdentifier g:(__ TypeParameterList)? { 
		return {
			type:"TypeNameSpecifier",
			name:i.name,
			generics:extractOptional(g,1),
		};
	}

TypeIdentifier
	= i:Identifier &{return isTypeName(i.name);} {
		return i;
	}

TypeParameterList
	= '<' __ head:TypeName tail:( __ ',' __ TypeName)* __ '>' {
		return {
			type:"TypeParameterList",
			parameters:buildList(head,tail,3),
		};
	}
	/ '<' __ '>' {
		return {
			type:"TypeParameterList",
			parameters:null,
		};
	}

BasicTypeSpecifier
	= m:(CharToken
	/ ShortToken
	/ IntToken
	/ LongToken
	/ SignedToken
	/ UnsignedToken
	/ FloatToken
	/ DoubleToken
	/ VoidToken
	/ InstanceTypeToken
	/ _BoolToken
	/ _ComplexToken
	/ _ImaginaryToken
	/ IdToken) { 
		return {
			type:"BasicTypeSpecifier",
			token:text()
		}; 
	}

TypeQualifier
	= m:(ConstToken / VolatileToken / RestrictToken / __CovariantToken / __KindofToken) {
		return {type:"TypeQualifier",token:text()};
	}
	/ NullabilityQualifier 
	/ ArcBehaviourQualifier
	/ AttributeQualifier
	/ ProtocolQualifier

AttributeQualifier
	= __AttributeToken__ __ "((" __ AttributeArgument __ "))" (__ "=" __ ConstantExpression)? {
		return {
			type:"AttributeQualifier",token:text()
		};
	}

AttributeArgument = (!"))" .)*

ProtocolQualifier 
	= InToken / OutToken / InOutToken / ByCopyToken / ByRefToken / OneWayToken {
		return {type:"ProtocolQualifier",token:text()};
	}

ArcBehaviourQualifier 
	= m:(__UnsafeUnretainedToken / __WeakToken / __AutoReleasingToken / __StrongToken / __BlockToken) {
		return {type:"ArcBehaviourQualifier",token:text()};
	}

NullabilityQualifier
	= (NullableToken / _NullableToken /  __NullableToken) {
		return {type:"NullabilityQualifier",token:"nullable"};
	}
	/ (NonnullToken / _NonnullToken / __NonnullToken) {
		return {type:"NullabilityQualifier",token:"nonnull"};
	} 
    / (NullUnspecifiedToken / _NullUnspecifiedToken / __NullUnspecifiedToken) {
		return {type:"NuulabilityQualifier",token:"null_unspecified"};
	}

InitDeclaratorList 
	= head:InitDeclarator tail:( __ ',' __ InitDeclarator )* {
		return buildList(head,tail,3);
	}

InitializerCast 
	= '(' __ TypeName __ ')'

InitDeclarator 
	= decl:Declarator init:( __ '=' __ InitializerCast? __ Initializer)? {
		return {
			type:"InitDeclarator",
			declarator:decl,
			cast:extractOptional(init,3),
			initializer:extractOptional(init,5),
		};
	}

Initializer 
	= '{' __ Initializer ( __ ',' __ Initializer )* __ ','? __ '}'
	/ '.' AssignmentExpression
	/ AssignmentExpression

ClassMethodDeclaration = '+' __ m:MethodDeclaration {
	return {
		type:"ClassMethodDeclaration",
		returnType:m.returnType,
		selector:m.selector,
		attributes:m.attributes,
	};
}

InstanceMethodDeclaration = '-' __ m:MethodDeclaration {
	return {
		type:"InstanceMethodDeclaration",
		returnType:m.returnType,
		selector:m.selector,
		attributes:m.attributes,
	};
}

MethodDeclaration = t:MethodType? __ s:MethodSelector a:(__ AttributeQualifier)* __ ';' {
	return {
		type:"MethodDeclaration",
		returnType:t,
		selector:s,
		attributes:a,
	};
}

MethodType = '(' __ t:TypeName __ ')' {
	return t;
}

MethodSelector 
	= head:KeywordDeclarator tail:(__ KeywordDeclarator)* va:(__ ',' __ '...')? {

		var name = (head.label?head.label:head.name) + ":";
		for(var i=0;i<tail.length;i++) {
			name += (tail[i][1].label?tail[i][1].label:tail[i][1].name) + ":";
		}

		var result = {
			type:"MethodSelector",
			name:name,
			head:head,
			tail:extractList(tail,1),
			variableArgument:va?true:false,
		};		
		return result;
	}
	/ s:Selector {
		return {
			type:"MethodSelector",
			name:s.name,
			selector:s,
		};
	}

KeywordDeclarator 
	= s:Selector? __ ':' t:(__ MethodType)? u:(__ __UnusedToken)? __ i:Identifier {
		return {
			type:"KeywordDeclarator",
			label:s?s.name:null,
			methodType:extractOptional(t,1),
			unused:extractOptional(u,1),
			name:i.name,
		};
	}

Selector 
	= Identifier

TypeName 
	= s:SpecifierQualifierList d:(__ AbstractDeclarator)? {
		return {
			type:"TypeName",
			specifiers:s,
			abstractDeclarator:extractOptional(d,1),
		};
	}

AbstractDeclarator 
	= p:Pointer tail:(__ AbstractDeclarator)? {
		return {
			type:"AbstractDeclarator",
			subType:"Pointer",
			pointer:p,
			child:extractOptional(tail,1),
		};
	}
	/ BlockTypeSpecifier
	/ spec:DeclarationSpecifier a:(__ AbstractDeclarator)? {
		return {
			type:"AbstractDeclarator",
			subType:"Specifier",
			specifier:spec,
			child:extractOptional(a,1),
		};		
	}
	/ '(' a:(__ AbstractDeclarator)? __ ')' s:( __ AbstractDeclaratorSuffix )+ {
		return {
			type:"AbstractDeclarator",
			subType:"Apply",
			child:extractOptional(a,1),
			suffixes:extractList(s,1),
		};
	}
	/ m:(__ '[' __ ConstantExpression? __ ']')+ {
		return {
			type:"AbstractDeclarator",
			subType:"Subscript",
			child:extractList(m,3),
		};
	}

AbstractDeclaratorSuffix 
	= m:('[' __ ConstantExpression? __ ']')
	/ m:('(' __ ParameterDeclarationList? __ ')')

ParameterDeclarationList 
	= head:ParameterDeclaration tail:(__ ',' __ ParameterDeclaration )* {
		return buildList(head,tail,3);
	}

ParameterDeclaration = s:DeclarationSpecifiers d:(__ Declarator / __ AbstractDeclarator)? {
	return {
		type:"ParameterDeclaration",
		specifiers:s,
		declarator:extractOptional(d,1),
	};
};

PropertyDeclaration = PropertyToken __ attr:PropertyAttributesDeclaration? __ decl:StructDeclaration {
	return {
		type:"PropertyDeclaration",
		attributes:attr,
		declaration:decl,
	};
}

PropertyAttributesDeclaration 
	= '(' m:(__ PropertyAttributesList)? __ ')' {
		return extractOptional(m,1);
	}

PropertyAttributesList 
	= head:PropertyAttribute tail:( __ ',' __ PropertyAttribute )* {
		return buildList(head,tail,3);
	}

PropertyAttribute 
	= NonatomicToken 
	/ AssignToken 
	/ WeakToken 
	/ StrongToken 
	/ RetainToken 
	/ ReadonlyToken 
	/ ReadwriteToken
    / NonnullToken
    / NullableToken
    / NullUnspecifiedToken
    / GetterToken __ '=' __ $Identifier 
    / SetterToken __ '=' __ $Identifier __ ':'
    / CopyToken
    / AttributeQualifier
    / $Identifier

Identifier 
	= !ReservedWord name:$( IdStart IdPart* ) { 
		return {type:"Identifier", name:name};
	}

IdStart = [A-Za-z_]
IdPart = [A-Za-z_0-9]

BooleanLiteral = $("@YES" / "@NO")

String = $('"' ( EscapeSequence / [^\\"] )* '"')

StringLiteral = $(('@' __)? String (__ ('@' __)? String)*)

AngleString = $('<' ( EscapeSequence / [^\\>] )* '>')

EscapeSequence = $('\\' ( CharEscape / OctalEscape / HexEscape / UnicodeEscape ))

CharEscape = $([btnfr?"'\\])

OctalEscape = $([0-3][0-7][0-7] / [0-7][0-7] / [0-7])

HexEscape = $('x' [0-9a-fA-F]{1,2})

UnicodeEscape = $('u' [0-9a-fA-F]{4})

BinaryLiteral = $('0' ('b' / 'B') [0-1]+ IntegerTypeSuffix?)

HexLiteral = $('0' ('x' / 'X') HexDigit+ IntegerTypeSuffix?)

DecimalLiteral = $(('0' / [1-9][0-9]*) IntegerTypeSuffix?)

OctalLiteral = $('0' [0-7]+ IntegerTypeSuffix?)

CharacterLiteral = $("'" ( EscapeSequence / [^'\\] ) "'")

HexDigit = $([0-9a-fA-F])

IntegerTypeSuffix = $([uUlL]+)

FloatingPointLiteral = $(([0-9]+ ('.' [0-9]*)? / '.' [0-9]+) ![uUlL] Exponent? FloatTypeSuffix?)

Exponent = $([eE] [+\-]? [0-9]+)

FloatTypeSuffix = $([fFdD])

ReservedWord 
	= CaseToken / DefaultToken / IfToken / ElseToken
	/ SwitchToken / SizeofToken / TypeofToken / TypedefToken
	/ StructToken/ UnionToken / EnumToken
	/ ForToken/ WhileToken/ DoToken/ GotoToken / ContinueToken / BreakToken / ReturnToken
	/ VoidToken / CharToken / ShortToken / IntToken / LongToken / FloatToken
	/ DoubleToken / SignedToken / UnsignedToken / InstanceTypeToken
	/ _BoolToken / _ComplexToken / _ImaginaryToken
	/ AutoToken / RegisterToken / StaticToken / ExternToken
	/ ConstToken / VolatileToken / InlineToken / RestrictToken
	/ NonnullToken / NullableToken / NullUnspecifiedToken
	/ _NonnullToken / _NullableToken / _NullUnspecifiedToken
	/ __NonnullToken / __NullableToken / __NullUnspecifiedToken
	/ __AttributeToken__ / __CovariantToken / __KindofToken / __TypeofToken
	/ NS_ASSUME_NONNULL_BEGIN / NS_ASSUME_NONNULL_END

//
// Tokens
//
CaseToken = $("case" !IdPart)
DefaultToken = $("default" !IdPart)
IfToken = $("if" !IdPart)
ElseToken = $("else" !IdPart)
SwitchToken = $("switch" !IdPart)
SizeofToken = $("sizeof" !IdPart)
TypeofToken = $('typeof' !IdPart)
TypedefToken = $('typedef' !IdPart)

StructToken = $("struct" !IdPart)
UnionToken = $("union" !IdPart)
EnumToken = $("enum" !IdPart)

SelfToken = $("self" !IdPart)
SuperToken = $("super" !IdPart)

ForToken = $("for" !IdPart)
DoToken = $("do" !IdPart)
WhileToken = $("while" !IdPart)

GotoToken = $("goto" !IdPart)
ContinueToken = $("continue" !IdPart)
BreakToken = $("break" !IdPart)
ReturnToken = $("return" !IdPart)

InterfaceToken = $("@interface" !IdPart)
ImplementationToken = $("@implementation" !IdPart)
EndToken = $("@end" !IdPart)
PrivateToken = $("@private" !IdPart)
PublicToken = $("@public" !IdPart)
PackageToken = $("@package" !IdPart)
ProtectedToken = $("@protected" !IdPart)
PropertyToken = $("@property" !IdPart)
SynthesizeToken = $("@synthesize" !IdPart)
DynamicToken = $("@dynamic" !IdPart)
RequiredToken = $("@required" !IdPart)
ImportToken = $("@import" !IdPart)

SelectorToken = $("@selector" !IdPart)
ClassToken = $("@class" !IdPart)
ProtocolToken = $("@protocol" !IdPart)
EncodeToken = $("@encode" !IdPart)
AvailableToken = $("@available" !IdPart)
OptionalToken = $("@optional" !IdPart)

TryToken = $("@try" !IdPart)
CatchToken = $("@catch" !IdPart)
FinallyToken = $("@finally" !IdPart)
ThrowToken = $("@throw" !IdPart)
SynchronizedToken = $("@synchronized" !IdPart)
AutoreleasepoolToken = $("@autoreleasepool" !IdPart)

VoidToken = $('void' !IdPart)
CharToken = $('char' !IdPart)
ShortToken = $('short' !IdPart)
IntToken = $('int' !IdPart)
LongToken = $('long' !IdPart)
FloatToken = $('float' !IdPart)
DoubleToken = $('double' !IdPart)
SignedToken = $('signed' !IdPart)
UnsignedToken = $('unsigned' !IdPart)
InstanceTypeToken = $('instancetype' !IdPart)

IdToken = $('id' !IdPart)

__UnsafeUnretainedToken = $('__unsafe_unretained' !IdPart)
__WeakToken = $('__weak' !IdPart)
__AutoReleasingToken = $('__autoreleasing' !IdPart)
__StrongToken = $('__strong' !IdPart)

__TypeofToken = $('__typeof' !IdPart)
__TypeofToken__ = $('__typeof__' !IdPart)

__CovariantToken = $('__covariant' !IdPart)
__KindofToken = $('__kindof' !IdPart)

__NonnullToken = $('__nonnull' !IdPart)
__NullableToken = $('__nullable' !IdPart)
__NullUnspecifiedToken = $('__null_unspecified' !IdPart)

_NonnullToken = $('_Nonnull' !IdPart)
_NullableToken = $('_Nullable' !IdPart)
_NullUnspecifiedToken = $('_Null_unspecified' !IdPart)

__AttributeToken__ = $('__attribute__' !IdPart)
__DeprecatedToken = $('__deprecated' !IdPart)
__UnusedToken = $('__unused' !IdPart)
__BlockToken = $('__block' !IdPart)

AutoToken = $('auto' !IdPart)
RegisterToken = $('register' !IdPart)
StaticToken = $('static' !IdPart)
ExternToken = $('extern' !IdPart)

ConstToken = $("const" !IdPart)
VolatileToken = $("volatile" !IdPart)
InlineToken = $('inline' !IdPart)
RestrictToken = $('restrict' !IdPart)

InToken = $("in" !IdPart)
OutToken = $("out" !IdPart)
InOutToken = $("inout" !IdPart)
ByCopyToken = $("bycopy" !IdPart)
ByRefToken = $("byref" !IdPart)
OneWayToken = $("oneway" !IdPart)

NonatomicToken = $("nonatomic" !IdPart)
CopyToken = $("copy" !IdPart)
AssignToken = $("assign" !IdPart)
WeakToken = $("weak" !IdPart)
StrongToken = $("strong" !IdPart)
RetainToken = $("retain" !IdPart)
ReadonlyToken = $("readonly" !IdPart)
ReadwriteToken = $("readwrite" !IdPart)
GetterToken = $("getter" !IdPart)
SetterToken = $("setter" !IdPart)

NonnullToken = $('nonnull' !IdPart)
NullableToken = $('nullable' !IdPart)
NullUnspecifiedToken = $('null_unspecified' !IdPart)

NS_ASSUME_NONNULL_BEGIN = $("NS_ASSUME_NONNULL_BEGIN" !IdPart)
NS_ASSUME_NONNULL_END = $("NS_ASSUME_NONNULL_END" !IdPart)

// C99 types
_BoolToken = $('_Bool' !IdPart)
_ComplexToken = $('_Complex' !IdPart)
_ImaginaryToken = $('_Imaginary' !IdPart)

// The following identifier are defined as macros in Objective-C standard library. Do not define them as tokens.
// __used, __available, __deprecdated, __unused, __block, __weak, __strong, __autoreleasing, __unsafe_unretained 

//
// Spacing, comment and ignore.
//

WhiteSpaces
	= ([ \t\v\f\u00A0\uFEFF\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000] / '\\' LineTerminator)+ { return text(); }

LineTerminator = [\r\n\u2028\u2029]

MultiLineComment = "/*" ( !"*/" . )* "*/" { return text(); }

MultiLineCommentNoLineTerminator = "/*" ( !("*/" / LineTerminator) . )* "*/" { return text(); }

SingleLineComment = "//" ( !LineTerminator . )* { return text(); }

PreprocessorTokens
	= 'define' !IdPart
	/ 'undef' !IdPart 
	/ 'warning' !IdPart 
	/ 'error' !IdPart 
	/ 'else' !IdPart 
	/ 'line' !IdPart
	/ 'ifdef' !IdPart 
	/ 'ifndef' !IdPart 
	/ 'endif' !IdPart 
	/ 'elif' !IdPart 
	/ 'pragma' !IdPart 
	/ 'if' !IdPart 
	/ 'end' !IdPart 

PreprocessorDirective
	= '#' _ PreprocessorTokens _ ( '\\' LineTerminator / !LineTerminator . )* 

__ = ( WhiteSpaces / LineTerminator / MultiLineComment / SingleLineComment / PreprocessorDirective )* { return text(); }

_ = ( WhiteSpaces / MultiLineCommentNoLineTerminator )* { return text(); }

