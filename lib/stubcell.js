var path = require('path');
var fs = require("fs");
var JSON5 = require("json5");
var yaml = require('yamljs');
var express = require('express');
var deferred = require('deferred');
var app = express();
var bodyParser = require('body-parser');
var check = require('./check');
var Stubrec = require('stubrec');


module.exports = StubCell;
function StubCell() {
}

StubCell.prototype.loadEntry = function(entryPath, options) {
  this.entries = yaml.load(entryPath);
  options = options || {};
  this.basePath = options.basePath || path.dirname(entryPath);
  this.debug = options.debug || false;
  this.record = options.record || {};
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
  // record json
  if (Object.keys(this.record).length > 0) {
    app.use(function(req, res, next) {
      var record = this.record;
      var reqBody = req.body || {};
      var filepath = this.fileFromRequest(req.url, "", req.method, reqBody);
      var storePath = filepath;
      record.basepath = record.basepath || this.basePath;
      var stubrec = new Stubrec(record);
      stubrec.record(storePath, req, res);
    }.bind(this));
  }
  return app;
};

StubCell.prototype.fileFromRequest = function(requestUrl, filepath, method, reqBody) {
  var appendJson = appendJson === undefined ? true : appendJson;
  var url = requestUrl;
  var file = filepath;
  if (file) return file;
  var isSlash = url === "/";
  if (isSlash) {
    // / -> /index
    url += 'index';
  } else {
    // /abc/test/ -> /abc/test
    var hasLastSlash = url.lastIndexOf("/") === (url.length-1);
    if (hasLastSlash) url = url.substring(0, url.length-1);
  }

  // append method
  if (reqBody && reqBody.jsonrpc) {
    // jsonrpc
    url = url + "/" + reqBody.method;
  } else if (method) {
    // not jsonrpc
    url = url + "_" + method.toLowerCase();
  }

  // /abc/test -> /abc/test.json
  url += '.json';
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
  // HTTP queryparams
  var entryQuery = entry.request.query || {};


  app[method](requestUrl, function(req, res, next) {
    var expectJSON = true;
    var hasContentType = false;
    var reqBody = req.body || {};
    var reqQuery = req.query || {};

    var isJSONRPC = expectJSONRPC && entryBody.jsonrpc == reqBody.jsonrpc;
    if (expectJSONRPC) {
      if (!isJSONRPC) return next();
    }

    // CHECK request match
    if (isJSONRPC) {
      var match = check.jsonrpc(entryBody, reqBody);
      if (!match) return next(); 
    } else {
      if(entry.request.body) {
        match = check.body(entryBody, reqBody);
        if (!match) return next();
      }
      if(entry.request.query) {
        match = check.query(entryQuery, reqQuery);
        if (!match) return next();
      }
    }
    //response header
    var response = entry.response;
    var headers = response.headers || {};
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
    // response data
    res.statusCode = response.status;

    var file = response.file || this.basePath + this.fileFromRequest(requestUrl, response.file, req.method, reqBody);

    deferred(function(){
      if (response.body) return response.body;

      var d = deferred();
      fs.readFile(file, function(err, data){
        err ? d.reject(err) : d.resolve("" + data);
      });
      return d.promise;
    }())
    .then(function(body){
      var data = undefined;
      if (expectJSON) {
        try {
          data = this._parseJSON5(body);
          if (isJSONRPC) {
            data.id = reqBody.id;
            data.jsonrpc = reqBody.jsonrpc;
          }
        } catch(e) {
          console.log("\033[31m" + "Error occurred in " + (response.body || file) + "\033[39m");
          console.log(e.stack);
          throw e;
        }
      }
      if (this.debug) {
        console.log("\033[36m" + "[request url] = " + requestUrl +"\033[39m");
        console.log("\033[36m" + "[request body] = " + JSON.stringify(reqBody) +"\033[39m");
        console.log("\033[36m" + "[request query] = " + JSON.stringify(reqQuery) +"\033[39m");
        console.log("\033[36m" + "[return jsonfile] = " + (response.body || file) +"\033[39m");
      }
      return data;
    }.bind(this))
    .then(function(data){
      res.send(data);
    }, function(err){
      res.send(500, { error : err.message });
    });
  }.bind(this));
};
