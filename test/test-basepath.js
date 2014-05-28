var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var fs = require("fs");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/base.yaml", {
  basepath: "test/base",
  debug: true,
  record: {
    proxy: "http://echo.jsontest.com"
  }
});
var app = stubcell.server();
describe('Stubcell server should set json basepath', function(){
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
    it("should return test/base/test/base_get.json", function(done){
      http.get("http://localhost:3000/test/base", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).test, "base");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
  describe("request", function(){
    it("should return test/base/test/record_get.json", function(done){
      http.get("http://localhost:3000/test/record", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).test, "record");
          } catch (e) {
            done(e);
          }
        });
        fs.watch("./test/base/test/", {persistent: true },function(event, filename) {
          console.log("changed file is : ", filename);
          fs.readFile("./test/base/test/record_get.json", function(err, d) {
            assert.deepEqual(JSON.parse(d), JSON.parse('{"test":"record"}'));
            done();
          });
        });
      });
    });
  });
});

