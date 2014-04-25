var path = require('path');
var fs = require("fs");
var yaml = require('yamljs');
var _ = require('lodash');
var express = require('express');
var app = express();


module.exports = StubCell;
function StubCell() {}

StubCell.prototype.loadEntry = function(entryPath) {
  this.entries = yaml.load(entryPath);
};

StubCell.prototype.server = function() {
  this.entries.forEach(function(entry) {
    var method = entry.request.method.toLowerCase();
    var response = entry.response;
    var headers = response.headers;
    var file = response.file;
    app[method](entry.request.url, function(req, res) {
      Object.keys(headers).forEach(function(key) {
        res.setHeader(key, headers[key]);
      });
      res.statusCode = response.status;
      var readstream = fs.createReadStream(file);
      // TODO JSON5Stream or JSONStream
      readstream.pipe(res);
    });
  });
  return app;
}
