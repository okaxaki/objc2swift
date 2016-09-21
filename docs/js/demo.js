"use strict"

var editor;

function showError(message) {
  document.getElementById("result").value = message;
}

function doConvert() {
  var button = document.getElementById("convert");
  var btnText = button.innerText;  
  button.innerText = "Wait";
  button.disabled = true;
  setTimeout(function(){
    compile(editor.getValue());
    button.innerText = btnText;
    button.disabled = false;
  },100);
}

function retrieve(url, complete) {
  var baseUrl = url.replace(/^(https?:\/\/)raw.githubusercontent\.com\/([^\/]+\/[^\/]+)\/(.*)$/,'$1github.com/$2/blob/$3').replace(/[^\/]*$/,'');
  var rawUrl = url.replace(/^(https?:\/\/)github\.com\/(.*)\/blob\/(.*)$/,'$1raw.githubusercontent.com/$2/$3');
  var start = Date.now();
  var xhr = new XMLHttpRequest();
  xhr.open("GET",rawUrl);
  xhr.addEventListener('load',function(){
    if(xhr.status == 200 || xhr.status == 304 || xhr.status == 0) {
      initSourceForm(xhr.responseText);
      if(complete) complete();
    } else {
      var err = new Error("Error:" + xhr.statusText);
      initSourceForm(err);
      if(complete) complete(err);
    }    
  });
  xhr.addEventListener('error',function(e){
    var err = new Error("Error: Check 'Access-Control-Allow-Origin' header is present for the target resource. See browser's development panel for detail. If you run this script local Chrome, `--allow-file-access-from-files` option is required.");
    initSourceForm(err);
    if(complete) complete(err);
  });
  xhr.send();
}

var o2s = new O2S();

function initSourceForm(inp) {
  if(typeof(inp) == "string") {
    editor.setValue(inp,-1);
    document.getElementById("result").innerText = '';
    applyHighlight();
  } else {
    editor.setValue("// " + inp.message);
    document.getElementById("result").innerText = "";
  }
}

function compile(text) {
  console.log(text);
  convert(text);
}

var _SPACER = '        ';
function makeIndentString(indent) {
  if(_SPACER.length<indent) {
    return _SPACER+_makeIndentString(indent-_SPACER.length);            
  }    
  return _SPACER.slice(0,indent);
}

function getSourceFragment(text,location) {
  var lines = text.split(/\n/);
  var result = ">> " + lines[location.start.line-1] + "\n";
  return result + "   " + makeIndentString(location.start.columns) + "^";
}

function convert(text) {
  try {
    var code = o2s.convert(text,{quiet:true});
    document.getElementById("result").innerText = code;
  } catch(e) {
    var message = o2s.buildErrorMessage(e,text);
    document.getElementById("result").innerText = message;
  }

  applyHighlight();

}

function enableTabInput(target) {
  if(window.getSelection) {
    target.addEventListener('keydown',function(e){
      if(e.keyCode==9) {
        var elem=e.target;
        var sel = window.getSelection();
        var text=elem.textContent;
        var pos=sel.anchorOffset;

        elem.textContent = text.slice(0,pos)+'    '+text.slice(pos, text.length);
        var range = document.createRange();
        range.setStart(elem.childNodes[0],pos+4);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        e.preventDefault();
      }
    });
  }
}

function disableKeys(target) {
  target.addEventListener('paste',function(e){console.log('paste');e.preventDefault();});
  target.addEventListener('cut',function(e){e.preventDefault();});
  target.addEventListener('keydown',function(e){
    if (e.ctrlKey||e.metaKey) {
          if(event.keyCode!=65&&event.keyCode!=67) { // Allow Ctrl/Cmd + A or C
            e.preventDefault();
          }
        } else if (event.keyCode < 33 || 40 < event.keyCode) {
          e.preventDefault();
        }
      });
}

function applyHighlight() {
  var codes = document.querySelectorAll("pre code:not(.nohighlight)");
  try {
    for(var i=0;i<codes.length;i++) {
      hljs.highlightBlock(codes[i]);
    }
  } catch(e) {
    // might fail to load hljs
  }
}

function onDragOver(e) {
  e.preventDefault();
}

function onDrop(e) {
  e.preventDefault();
  if(0<e.dataTransfer.files.length) {
    var file = event.dataTransfer.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
      initSourceForm(reader.result);  
    }
    reader.readAsText(file);
  }
}

window.addEventListener('DOMContentLoaded', function(){
  disableKeys(document.getElementById('result'));
  applyHighlight();

  editor = ace.edit("editor");
  editor.setTheme("ace/theme/xcode");
  editor.getSession().setMode("ace/mode/objectivec");
  editor.commands.bindKey("Ctrl-P", "golineup");

  var elem = document.getElementsByClassName("source")[0];

  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("drop", onDrop);

  document.getElementById("convert").addEventListener("click",doConvert);

  document.getElementById("source-selector").addEventListener("change", function(e){
    var target = e.target;
    target.disabled = true;
    retrieve(target.value, function(err){
      target.disabled = false;
    });
  });

});
