function createSidebar() {

	var menu = document.querySelectorAll(".sidebar .menu")[0];
	if(!menu) return;

	var items = [
		{name:"Class and Category",href:"class.html"},
		{name:"Property",href:"property.html"},
		{name:"Method",href:"method.html"},
		{name:"Protocol",href:"protocol.html"},
		{name:"Enumeration",href:"enum.html"},
		{name:"Initializer",href:"initializer.html"},
		{name:"Statement",href:"statement.html"},
		{name:"Blocks",href:"blocks.html"},
		{name:"Optional Type",href:"optional.html"},
		{name:"Miscellaneous",href:"misc.html"}
	];

	var buf = [];
	buf.push('<ul><li><a href="index.html">Overview</a></li></ul>');
	buf.push("<ul>");
	for(var i=0;i<items.length;i++) {
		buf.push('<li><a href="' + items[i].href + '">' + items[i].name + "</a></li>");
	}
	buf.push("</ul>");

	menu.innerHTML = buf.join('');
}

function installTabs() {
	var items = document.querySelectorAll('.tab-items a');
	for(var i=0;i<items.length;i++) {
		var item = items[i];
		item.addEventListener('click', function(elem){
			var a = elem.target;
			var cls;
			a.classList.forEach(function(e){
				if(/diff|expect|output/.test(e)) {
					cls = e;
				}
			});
			var pres = a.closest('.tab').querySelectorAll('pre');
			for(var i=0;i<pres.length;i++) {
				pres[i].style.display = pres[i].classList.contains(cls)?"block":"none";
			}
			var as = a.closest('.tab-items').querySelectorAll('a');
			for(var i=0;i<as.length;i++) {
				as[i].classList.remove("selected");
			}
			a.classList.add("selected");
		});
	}
}

window.addEventListener("DOMContentLoaded", function(){	
	createSidebar();
	installTabs();
	
	var codes = document.querySelectorAll("pre code:not(.nohighlight)");
	for(var i=0;i<codes.length;i++) {
		hljs.highlightBlock(codes[i]);
	}
});