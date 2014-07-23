var path = require('path');
var fs = require("fs");
var JSON5 = require("json5");
var yaml = require('yamljs');
var express = require('express');
var deferred = require('deferred');
var bodyParser = require('body-parser');
var check = require('./check');
var Stubrec = require('stubrec');
var glob = require('glob');


module.exports = StubCell;
function StubCell() {
  this.app = express();
}

StubCell.prototype.loadEntry = function(entryPath, options) {
  this.entries = yaml.load(entryPath);
  options = options || {};
  this.basepath = options.basepath || path.dirname(entryPath);
  this.debug = options.debug || false;
  this.pretty = options.pretty || false;
  this.record = options.record || {};
  this.looseCompare = options.looseCompare || false;
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

StubCell.prototype._getFinalEntries = function(entries){
  return entries.filter(function(entry){
    return entry.request.url === "$finally";
  }).map(function(entry){
    entry.request.url = "*";
    return entry;
  });
};

StubCell.prototype._getNormalEntries = function(entries){
  return entries.filter(function(entry){
    return entry.request.url[0] !== "$";
  });
};

StubCell.prototype._setRecordingEntries = function(record){
  if(Object.keys(this.record).length === 0) return;

  this.app.use(function(req, res, next) {
    var record = this.record;
    record.basepath = record.basepath || this.basepath;
    var storePath = this.fileFromRequest(req.url, "", req);
    var stubrec = new Stubrec(record);
    stubrec.record(storePath, req, res);
  }.bind(this));
};

StubCell.prototype.server = function() {
  this.app.use(bodyParser());
  var normalEntries = this._getNormalEntries(this.entries);
  var finalEntries  = this._getFinalEntries(this.entries);

  if(this.debug){
    var prettify = this.pretty ?
          function(obj){ return "\n" + JSON.stringify(obj, null, 4);} :
        JSON.stringify;

    this.app.all("*", function(req, res, next){
      console.log("\033[36m" + "[entry url] =" + prettify(req.url) +"\033[39m");
      console.log("\033[36m" + "[request headers] =", prettify(req.headers) +"\033[39m");
      if(Object.keys(req.query).length > 0)
        console.log("\033[36m" + "[request query] =", prettify(req.query) +"\033[39m");
      if(Object.keys(req.body).length > 0)
        console.log("\033[36m" + "[request body] =", prettify(req.body) +"\033[39m");
      next();
    });
  }

  normalEntries.forEach(this._setupEntry.bind(this));
  if(finalEntries.length > 0) {
    finalEntries.forEach(this._setupEntry.bind(this));
  }
  this._setRecordingEntries(this.record);

  return this.app;
};

StubCell.prototype.fileFromRequest = function(entryUrl, filepath, req, basepath) {
  var appendJson = appendJson === undefined ? true : appendJson;
  var req = req || {};
  var basepath = basepath || "";
  var url = entryUrl;
  var file = filepath;
  var method = req.method ? req.method.toLowerCase() : "";
  var reqBody = req.body || {};
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
  // /abc/test_get
  if (reqBody.jsonrpc) {
    // jsonrpc
    url = url + "/" + reqBody.method;
  } else if (method) {
    // not jsonrpc
    url = url + "_" + method;
  }

  // /abc/test_get -> /abc/test_get.json
  url += '.json';

  // if /abc/:id
  if (url.indexOf(":") >= 0) { 
    // /abc/:id -> /abc/*
    temp = url.replace(/:[a-zA-Z0-9]+/g, '*');
    var files = glob.sync(basepath + temp);
    var found = "";
    files.some(function(file) {
      var replacedPath = file.replace(basepath, "");
      if (replacedPath === req.url + "_" + method + ".json") {
        found = replacedPath;
        return true;
      }
      return false;
    });
    if (found) {
      url = found;
    } else {
      url = url.replace(/:/g, '');
    }
  }
  file = basepath + url;

  return file;
};

StubCell.prototype._setupEntry = function(entry) {
  // HTTP method
  var method = entry.request.method;
  if (!method) throw new Error("need method get, post, put, delete");
  method = method.toLowerCase();
  // HTTP url
  var entryUrl = entry.request.url;
  if (!entryUrl) throw new Error("need url");
  // HTTP body
  var entryBody = entry.request.body || {};
  var expectJSONRPC = entryBody.jsonrpc;
  if (expectJSONRPC) method = "use";
  // HTTP queryparams
  var entryQuery = entry.request.query || {};


  this.app[method](entryUrl, function(req, res, next) {
    var hasContentType = false;
    var reqBody = req.body || {};
    var reqQuery = req.query || {};

    var isJSONRPC = expectJSONRPC && entryBody.jsonrpc == reqBody.jsonrpc;

    // CHECK request match
    if (isJSONRPC) {
      var match = check.jsonrpc(entryBody, reqBody, this.looseCompare);
      if (!match) return next();
    } else {
      if(entry.request.body) {
        var match = check.body(entryBody, reqBody, this.looseCompare);
        if (!match) return next();
      }
      if(entry.request.query) {
        var match = check.query(entryQuery, reqQuery, this.looseCompare);
        if (!match) return next();
      }
    }
    //response header
    var response = entry.response;
    var headers = response.headers || {};
    Object.keys(headers).forEach(function(key) {
      res.setHeader(key, headers[key]);
    });
    if (!hasContentType) {
      res.setHeader('Content-Type', 'application/json');
    }
    // response data
    res.statusCode = response.status;

    var file = response.file ?
          response.file.indexOf("/") === 0 ?
          response.file :
          path.join(this.basepath, response.file)
        : this.fileFromRequest(entryUrl, response.file, req, this.basepath);

    deferred(function(){
      if (response.body) return response.body;

      var d = deferred();
      fs.readFile(file, function(err, data){
        err ? d.reject(err) : d.resolve("" + data);
      });
      return d.promise;
    }())
    .then(function(body){
      var data = null;
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
      return data;
    }.bind(this))
    .then(function(data){
      res.send(data);
    }, function(err){
      res.send(500, { error : err.message });
    });
  }.bind(this));
};
