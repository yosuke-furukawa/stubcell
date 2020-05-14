var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");

var stubcell = new StubCell();
stubcell.loadEntry(__dirname + "/example.yaml", {basepath: "", debug: true});
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
  describe("/abc/:id", function(){
    it("should return /abc/abc_get.json", function(){
      var file = stubcell.fileFromRequest("/abc/:id", "", {
        method: "GET",
        url: "/abc/abc"
      }, __dirname);
      assert.equal(file, __dirname + "/abc/abc_get.json");
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
    it("should return 'yes i am' for directly body set", function(done){
      http.get("http://localhost:3000/abdul", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "yes i am");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
    it("should return hello world for id.json", function(done){
      http.get("http://localhost:3000/test/1", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
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
    it("should return abc:def for /abc/abc.json when request abc/abc", function(done){
      http.get("http://localhost:3000/abc/abc", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).abc, "def");
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
            assert.equal(data.error, 'JSON5: invalid end of input at 7:1');
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
  });

});
