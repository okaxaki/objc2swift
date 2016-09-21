"use strict"

var editor;
var viewer;

function showError(message) {
  window.alert(message);
}

function doConvert(e) {
  var button = e.target;
  var btnText = button.innerText;  
  button.style.opacity = 0.5;
  button.disabled = true;
  setTimeout(function(){
    compile(editor.getValue());
    button.style.opacity = 1.0;
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
    } else if(xhr.status == 404) {
      var err = new Error("File Not Found: " + url);
      initSourceForm(err);
      if(complete) complete(err);
    } else {
      var err = new Error(xhr.statusText);
      initSourceForm(err);
      if(complete) complete(err);
    } 
  });
  xhr.addEventListener('error',function(e){
    var err = new Error("Load Error: Check 'Access-Control-Allow-Origin' header is present for the target resource. See browser's development panel for detail. If you run this script local Chrome, `--allow-file-access-from-files` option is required.");
    initSourceForm(err);
    if(complete) complete(err);
  });
  xhr.send();
}

var o2s = new O2S();

function initSourceForm(inp) {
  if(typeof(inp) == "string") {
    editor.setValue(inp,-1);
    viewer.setValue('',-1);
    applyHighlight();
  } else {
    editor.setValue("// " + inp.message);
    viewer.setValue('',-1);
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
    viewer.setValue(code,-1);
  } catch(e) {
    var message = o2s.buildErrorMessage(e,text);
    viewer.setValue(message,-1);
  }

  applyHighlight();

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

window.addEventListener("DOMContentLoaded", function() {
  try {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/xcode");
    editor.getSession().setMode("ace/mode/objectivec");
    editor.commands.bindKey("Ctrl-P", "golineup");
    editor.$blockScrolling = Infinity;
    //editor.getSession().setUseWrapMode(true);
    editor.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);

    viewer = ace.edit("viewer");
    viewer.setTheme("ace/theme/xcode");
    viewer.getSession().setMode("ace/mode/swift");
    viewer.commands.bindKey("Ctrl-P", "golineup");
    viewer.setReadOnly(true);
    viewer.$blockScrolling = Infinity;
    //viewer.getSession().setUseWrapMode(true);
    viewer.setShowPrintMargin(false);
    viewer.setHighlightActiveLine(false);
    
  } catch(e) {
    window.alert('Failed to create the Ace editor instance. Please check your network connection.');
  }

  function openFile(evt) {
    var files = evt.target.files;
    if(!files) return;
    var f = files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onloadend = function() {
      initSourceForm(reader.result);
      document.getElementById('modal-loading').style.display = "none";
    }
    reader.readAsText(f);
    document.getElementById('modal-loading').style.display = "block";
  }

  function openUrlDialog() {
    document.getElementById('modal-background').style.display = "block";
    document.getElementById('modal-stage').style.display = "block";
  }

  function closeUrlDialog(url) {
    document.getElementById('modal-background').style.display = "none";
    document.getElementById('modal-stage').style.display = "none";
    if(url) {
      retrieve(url, function(){});
    }
  }

  document.getElementById('open-url').addEventListener("click",openUrlDialog);
  document.getElementById('open-file').addEventListener("change",openFile);
  document.getElementById('source-url').addEventListener("focus", function(e){
    e.target.select();
  });

  var buttons = document.querySelectorAll('#open-url-dialog button');
  buttons[0].addEventListener("click",function(){
    closeUrlDialog(document.getElementById('source-url').value);
  });
  buttons[1].addEventListener("click",function(){
    closeUrlDialog();
  });

  var elem = document.getElementsByClassName("editor-wrap")[0];
  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("drop", onDrop);

  document.getElementById("convert").addEventListener("click",doConvert);

  retrieve("https://github.com/okaxaki/objc2swift/blob/gh-pages/example/hello-world.m", function(){    
  });

});


