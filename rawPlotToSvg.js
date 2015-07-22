var fs = require('fs');
var phantom = require('phantom');
var path = require('path');
var crypto = require('crypto');

var _dataFile;
var _configFile;
var _outputFile = __dirname + '/{{ID}}';
var _svgHeight;
var _svgWidth;
var _rawSvg;
var _templateId;
var _sourceFile = __dirname + '/';
var _readmeFile = __dirname + 'README.md';
var _plottableCSS = __dirname + '/bower_components/plottable/plottable.css';

function createPlotAndExtractSVG(callback) {
    phantom.create(function(ph) {
        ph.createPage(function(page) {
            page.open(_sourceFile, function(status) {
                if (status !== "success") {
                    throw new Error("Could not find file " + _sourceFile);
                }
                _extractSVG(page);
                ph.exit();
                callback();
            });
        });
    });
}


function _extractSVG(page,rawSvg) {
    page.evaluate(function() {
        var node = document.getElementsByTagName('svg')[0];
        node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        var svgData = new XMLSerializer().serializeToString(node);
        return svgData;
    }, function (svgData) {
        createSVGFile(svgData);
    });
}

function createSVGFile(svgNodeData) {
    var header = '<?xml version="1.0" standalone="no"?>';
    generateCSS(function(cssContent){
        cssInjectedSvgNodeData = svgNodeData.replace("</svg>", cssContent + "</svg>")
        var content = header + cssInjectedSvgNodeData + "\n" ;
    var outFile;
    if(process.argv.slice(2).length > 1){
        outFile = _outputFile.replace("{{ID}}",process.argv.slice(2)[1]);
    } else {
        outFile = _outputFile.replace("{{ID}}",_templateId+'.svg');
    }
    fs.writeFile(outFile, content, function (err, data) {
        if (err) {
            throw new Error(err);
        }
    })
    })
}

function _loadFile(file, callback) {
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        callback(data);
    });
}

function generateCSS(callback) {
    _loadFile(_plottableCSS, function(stylesheet) {
        var injection = "<defs>"
        injection += '<style type="text/css">'
        injection += '<![CDATA[';
    injection += stylesheet;
    injection += ']]>'
        injection += '</style>';
    injection += '</defs>';
    callback(injection);
    });
}

function processArguments() {
    var inputSvgFile = process.argv[2];
    _rawSvg = fs.readFileSync(inputSvgFile,{'encoding':'utf-8'});
    var rawHtml = fs.readFileSync(__dirname+'/template.html',{'encoding':'utf-8'});
    rawHtml = rawHtml.replace("{{SVG}}",_rawSvg);
    var templateId = crypto.randomBytes(20).toString('hex');
    _sourceFile += templateId+'.html';
    _templateId = templateId;
    fs.writeFileSync(_sourceFile,rawHtml);

}

function start() {
    processArguments();
    createPlotAndExtractSVG(function(){
        fs.unlinkSync(_sourceFile);
    });
}

start();
