module.exports = (function(){
	"use strict";
	
	var ASTUtil = function() {};

	var _findNodesByType = function(node,type) {

		var types = (typeof(type) == "string")?type.split(' '):type;

		if(typeof(node) != "object") {
			return [];
		}

		var key,i,buf = [];

		if(Array.isArray(node)) {
			for(i=0;i<node.length;i++) {
				if(node[i]) {
					if(0<=types.indexOf(node[i].type)) {
						buf.push(node[i]);
					} else {
						buf = buf.concat(_findNodesByType(node[i],types));
					}
				}
			}
		} else {
			for(key in node) {
				if(node[key]) {
					if(0<=types.indexOf(node[key].type)) {
						buf.push(node[key]);
					} else {
						buf = buf.concat(_findNodesByType(node[key],types));
					}
				}
			}
		}

		return buf;

	};
	ASTUtil.findNodesByType = _findNodesByType;

	ASTUtil.debugOut = function(obj) {
		console.log(JSON.stringify(obj,function(k,v){
			if(k=="_typeInfo") {
				return v?v.name:"(error)";
			}
			return v;
		},'  '));
	};

	return ASTUtil;
})();

