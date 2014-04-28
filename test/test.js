var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/example.yaml");
var app = stubcell.server();

describe('Stubcell server', function(){
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
    it("should return hello world for example.json5", function(done){
      http.get("http://localhost:3000/test/abc", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal("Hello world", JSON.parse(data).message);
            done();
          } catch (e) {
            console.error(e);
          }
        });
      });

    });
    it("should return hello world for example.json", function(done){
      http.get("http://localhost:3000/test/", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal("Hello world world", JSON.parse(data).message);
            done();
          } catch (e) {
            console.error(e);
          }
        });
      });

    });
    it("should return error for error.json", function(done){
      http.get("http://localhost:3000/error/", function(res){
        var data = '';
        assert.equal(res.statusCode, 500);
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            data = JSON.parse(data);
            assert.equal(data.error, "Unexpected token }");
            done();
          } catch (e) {
            console.error(e);
          }
        });
      });

    });
  });
});

