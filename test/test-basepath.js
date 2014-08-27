var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var fs = require("fs");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/base.yaml", {
  basepath: "test/base",
  debug: true,
  record: {
    target: "http://echo.jsontest.com"
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
    this.timeout(10000);
    after(function(){
      fs.unlinkSync(__dirname + "/base/test/record_get.json");
    });
    it("should return test/base/test/record_get.json", function(done){
      http.get("http://localhost:3000/test/record", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).test, "record");
            setTimeout(done, 5000);
            fs.readFile("./test/base/test/record_get.json", function(err, d) {
              // error ignore file is not created.
              if (err) return;
              assert.deepEqual(JSON.parse(d), JSON.parse('{"test":"record"}'));
              done();
            });
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});

