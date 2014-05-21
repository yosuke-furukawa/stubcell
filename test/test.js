var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/example.yaml", "", true);
var app = stubcell.server();
describe('Stubcell return filepath', function(){
  describe("/", function(){
    it("should return index.json", function(){
      var file = stubcell.fileFromRequest("/");
      assert.equal(file, "/index.json");
    });
  });
  describe("/test/abc", function(){
    it("should return /test/abc.json", function(){
      var file = stubcell.fileFromRequest("/test/abc");
      assert.equal(file, "/test/abc.json");
    });
  });
  describe("/test/abc/", function(){
    it("should return /test/abc.json", function(){
      var file = stubcell.fileFromRequest("/test/abc/");
      assert.equal(file, "/test/abc.json");
    });
  });
  describe("/test/abc/:id", function(){
    it("should return /test/abc/id.json", function(){
      var file = stubcell.fileFromRequest("/test/abc/:id");
      assert.equal(file, "/test/abc/id.json");
    });
  });
});

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
    it("should return hello world for id.json", function(done){
      http.get("http://localhost:3000/test/1", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          //console.log(data);
          try {
            assert.equal(JSON.parse(data).message, "Hello world");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
    it("should return hello world for index.json", function(done){
      http.get("http://localhost:3000/", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "Hello world world");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
    it("should return hello world for example.json", function(done){
      http.get("http://localhost:3000/example/abc", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "abc");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
    it("should return hello world for example.json when request example2/abc", function(done){
      http.get("http://localhost:3000/example2/abc", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "example");
            done();
          } catch (e) {
            done(e);
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
            assert.equal(data.error, "Bad object");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
  });

});
