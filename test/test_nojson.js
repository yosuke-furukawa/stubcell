var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");
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
      http.request("http://localhost:3000/sample.html", {
        method: "GET",
        headers: {
          accept: "text/html"
        },
      }, function(res){
        assert.equal(res.headers["content-type"], "text/html; charset=utf-8");
        var body = '';
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          assert.equal(body, fs.readFileSync(__dirname + "/nojson/sample.html", "utf8"));
          done();
        })
      }).end();
    });
    it("should return csv for text/csv request", function(done){
      http.request("http://localhost:3000/sample.csv", {
        method: "GET",
        headers: {
          accept: "text/csv"
        },
      }, function(res){
        assert.equal(res.headers["content-type"], "text/csv; charset=utf-8");
        var body = '';
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          assert.equal(body, fs.readFileSync(__dirname + "/nojson/sample.csv", "utf8"));
          done();
        })
      }).end();
    });
  });
});
