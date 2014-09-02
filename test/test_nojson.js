var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");
var request = require("request");
var fs = require("fs");

var stubcell = new StubCell();
stubcell.loadEntry(__dirname + "/nojson.yaml", {basepath: "", debug: true, looseCompare: true});
var app = stubcell.server();

describe('Stubcell server returns no json data', function(){
  var server;
  beforeEach(function(done) {
    server = app.listen(3000);
    server.on("listening", done);
  });
  afterEach(function(done) {
    server.on("close", done);
    server.close();
  });
  describe("request", function(){
    it("should return html for text/html request", function(done){
      request({
        url: "http://localhost:3000/sample.html",
        method: "GET",
        headers: {
          accept: "text/html"
        },
        proxy: ""
      }, function(err, res, body){
        assert.equal(res.headers["content-type"], "text/html; charset=utf-8");
        assert.equal(body, fs.readFileSync(__dirname + "/nojson/sample.html", "utf8"));
        done();
      });
    });
    it("should return csv for text/csv request", function(done){
      request({
        url: "http://localhost:3000/sample.csv",
        method: "GET",
        headers: {
          accept: "text/csv"
        },
        proxy:  ""
      }, function(err, res, body){
        assert.equal(res.headers["content-type"], "text/csv; charset=utf-8");
        assert.equal(body, fs.readFileSync(__dirname + "/nojson/sample.csv", "utf8"));
        done();
      });
    });
  });
});
