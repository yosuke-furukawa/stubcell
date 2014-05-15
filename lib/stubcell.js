var path = require('path');
var fs = require("fs");
var JSON5 = require("json5");
var yaml = require('yamljs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var checkJSONRPC = require('./check-jsonrpc');


module.exports = StubCell;
function StubCell() {
}

StubCell.prototype.loadEntry = function(entryPath, basePath) {
  this.entries = yaml.load(entryPath);
  this.basePath = basePath || path.dirname(entryPath);
};

StubCell.prototype._parseJSON5 = function(data) {
  var result;
  try {
    result = JSON5.parse(""+data);
  } catch (e) {
    throw e;
  }
  return result;
};

StubCell.prototype.server = function() {
  app.use(bodyParser());
  this.entries.forEach(this._setupEntry.bind(this));
  return app;
};

StubCell.prototype.fileFromRequest = function(requestUrl, filepath) {
  var url = requestUrl;
  var file = filepath;
  if (file) return file;
  var isSlash = url === "/";
  if (isSlash) {
    // / -> /index.json
    url += 'index.json';
  } else {
    var hasLastSlash = url.lastIndexOf("/") === (url.length-1);
    // /abc/test/ -> /abc/test
    if (hasLastSlash) url = url.substring(0, url.length-1);
    // /abc/test -> /abc/test.json
    url += '.json';
  }
  // /abc/:id.json -> /abc/id.json
  url = url.replace(/:/g, '');
  file = url;

  return file;
};

StubCell.prototype._setupEntry = function(entry) {
  // HTTP method
  var method = entry.request.method;
  if (!method) throw new Error("need method get, post, put, delete");
  method = method.toLowerCase();
  // HTTP url
  var requestUrl = entry.request.url;
  if (!requestUrl) throw new Error("need url");
  // HTTP body
  var entryBody = entry.request.body || {};
  var expectJSONRPC = entryBody.jsonrpc;
  if (expectJSONRPC) method = "use";

  // response data
  var response = entry.response;
  var headers = response.headers || {};
  var file = response.file || this.basePath + this.fileFromRequest(requestUrl, response.file);

  app[method](requestUrl, function(req, res, next) {
    var expectJSON = true;
    var hasContentType = false;
    var reqBody = req.body || {};
    var isJSONRPC = entryBody.jsonrpc && entryBody.jsonrpc == reqBody.jsonrpc;
    Object.keys(headers).forEach(function(key) {
      res.setHeader(key, headers[key]);
      if (!hasContentType) {
        hasContentType = key.toLowerCase() === 'content-type';
      }
      if (hasContentType && headers[key].toLowerCase() !== "application/json") {
        expectJSON = false;
      }
    });
    if (expectJSON && !hasContentType) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.statusCode = response.status;
    if (isJSONRPC) {
      var match = checkJSONRPC(entryBody, reqBody);
      if (!match) next(); 
    }
    fs.readFile(file, function(err, data) {
      if (err) throw err;
      var jsonData;
      if (expectJSON) {
        try {
          data = this._parseJSON5(data);
        } catch(e) {
          console.log("\033[31m" + "Error occurred in " + file + "\033[39m");
          console.log(e.stack);
          res.send(500, { error : e.message });
        }
      }
      if (isJSONRPC) {
        data.id = reqBody.id,
        data.jsonrpc = reqBody.jsonrpc,
        res.send(data);
      } else {
        res.send(data);
      }
    }.bind(this));
  }.bind(this));
};

