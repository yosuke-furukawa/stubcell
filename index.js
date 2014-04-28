var path = require('path');
var fs = require("fs");
var JSON5 = require("json5");
var yaml = require('yamljs');
var express = require('express');
var app = express();

module.exports = StubCell;
function StubCell() {}

StubCell.prototype.loadEntry = function(entryPath) {
  this.entries = yaml.load(entryPath);
};

StubCell.prototype._parseJSON = function(data, isJSON5) {
  var result;
  try {
    if (isJSON5) {
      result = JSON5.parse(""+data);
    } else {
      result = JSON.parse(data);
    }
  } catch (e) {
    throw e;
  }
  return result;
};

StubCell.prototype.server = function() {
  this.entries.forEach(function(entry) {
    var method = entry.request.method.toLowerCase();
    var response = entry.response;
    var headers = response.headers;
    var file = response.file;
    var ext = path.extname(file);
    app[method](entry.request.url, function(req, res) {
      var expectJSON = false;
      Object.keys(headers).forEach(function(key) {
        res.setHeader(key, headers[key]);
        if (key === "content-type" && headers[key] === "application/json") {
          expectJSON = true;
        }
      });
      res.statusCode = response.status;
      fs.readFile(file, function(err, data) {
        if (err) throw err;
        var jsonData;
        if (expectJSON) {
          try {
            data = this._parseJSON(data, ext === ".json5");
          } catch(e) {
            console.log("\033[31m" + "Error occurred in " + file + "\033[39m");
            console.log(e.stack);
            res.send(500, { error : e.message });
          }
        }
        res.send(data);
      }.bind(this));
    }.bind(this));
  }.bind(this));
  return app;
};

