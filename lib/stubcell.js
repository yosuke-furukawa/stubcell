"use strinct";
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
var pathRegexp = require('path-to-regexp');
var colo = require('colo');

module.exports = StubCell;
function StubCell(entryPath, options) {
  if(entryPath || options) this.loadEntry(entryPath, options);
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
  this.cors = options.cors || true;
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
  this.app.use(bodyParser.urlencoded({ extended : true }));
  this.app.use(bodyParser.json());
  var normalEntries = this._getNormalEntries(this.entries);
  var finalEntries  = this._getFinalEntries(this.entries);

  if(this.debug){
    var prettify = this.pretty ?
          function(obj){ return "\n" + JSON.stringify(obj, null, 4);} :
        JSON.stringify;

    this.app.all("*", function(req, res, next){
      console.log(colo.cyan("[request url] =" + prettify(req.url)));
      console.log(colo.cyan("[request method] =" + prettify(req.method)));
      console.log(colo.cyan("[request headers] =", prettify(req.headers)));
      if(Object.keys(req.query).length > 0)
        console.log(colo.cyan("[request query] =", prettify(req.query)));
      if(Object.keys(req.body).length > 0)
        console.log(colo.cyan("[request body] =", prettify(req.body)));
      next();
    });
  }

  this._setupEntries(normalEntries.concat(finalEntries));
  this._setRecordingEntries(this.record);

  return this.app;
};

StubCell.prototype._getMatchEntry = function(req, entries){
  for(var i = 0, l = entries.length; i < l; i++){
    var request = entries[i].request;
    if ((request.body||{}).jsonrpc) {
      if (typeof req.body.id !== "undefined") request.body.id = req.body.id;
    }
    if (check.request(request, req, this.looseCompare)) {
     return entries[i];
    }
  };
  return null;
};

StubCell.prototype._validateEntry = function(){
  var methods = ["get", "post", "put", "delete"];
  return function(entry){
    if(methods.indexOf(entry.request.method.toLowerCase()) === -1){
      throw new Error("need method get, post, put, delete");
    }
    if(!entry.request.url){
      throw new Error("need url");
    }
    return true;
  };
}();

StubCell.prototype._detectContentType = function(accept, defValue){
  if (!accept) return defValue || "application/json";
  var accepts = accept.split(",");
  if (accepts.length > 0) return accepts[0];
  return defValue || "application/json";
};

StubCell.prototype._execEntry = function(req, res, entry){
  var entryUrl  = entry.request.url;
  var response  = entry.response;
  var headers   = response.headers || {};
  var entryBody = entry.request.body || {};
  var reqBody   = req.body || {};
  var isJSONRPC = entryBody.jsonrpc && entryBody.jsonrpc == reqBody.jsonrpc;
  var contentType = this._detectContentType(req.headers["accept"], 'application/json');

  // response header
  Object.keys(headers).forEach(function(key) {
    res.setHeader(key, headers[key]);
  });
  res.setHeader('Content-Type', contentType);

  // response data
  res.statusCode = response.status;

  var file = response.file ?
        response.file.indexOf("/") === 0 ?
        response.file :
        path.join(this.basepath, response.file) :
      this.fileFromRequest(entryUrl, response.file, req, this.basepath);

  if(this.cors){
    if(this.cors === true){
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    }else if(typeof this.cors === 'function'){
      res.set('Access-Control-Allow-Origin',
              this.cors['Access-Control-Allow-Origin'] || '*');
      res.set('Access-Control-Allow-Methods',
              this.cors['Access-Control-Allow-Methods'] || 'GET, POST, PUT, DELETE');
      if(this.cors['Access-Control-Allow-Headers'])
        res.set('Access-Control-Allow-Methods', this.cors['Access-Control-Allow-Headers']);
    }
  }

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
    if (contentType === "application/json") {
      try {
        data = this._parseJSON5(body);
        if (isJSONRPC) {
          data.id = reqBody.id;
          data.jsonrpc = reqBody.jsonrpc;
        }
      } catch(e) {
        console.log(colo.red("Error occurred in " + (response.body || file)));
        console.log(e.stack);
        throw e;
      }
      return data;
    } else {
      return body;
    }
  }.bind(this))
  .then(function(data){
    res.send(data);
  }, function(err){
    res.send(500, { error : err.message });
  });
};

StubCell.prototype._setupEntries = function(entries){
  entries.forEach(function(entry){
    entry.request.pathRegexp = pathRegexp(entry.request.url);
  });
  this.app.all("*", this.route = function(req, res, next){
    var entry = this._getMatchEntry(req, entries);
    if(entry){
      return this._execEntry(req, res, entry);
    }
    return next();
  }.bind(this));
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
