var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");
var request = require("request");

describe('Stubcell server with cors', function(){
  it('set cors', function(){
    var stubcell = new StubCell();
    stubcell.loadEntry(__dirname + "/cors.yaml", {basepath: "", debug: true, cors: true});
    assert.equal(stubcell.cors, true);
  });

  describe('request from other domain', function(){
    var server;
    var stubcell = new StubCell();
    stubcell.loadEntry(__dirname + "/cors.yaml", {basepath: "", debug: true, cors: true, port: 4000});
    var app = stubcell.server();

    before(function(done) {
      server = app.listen(4000);
      server.on("listening", done);
    });
    after(function(done) {
      server.on("close", done);
      server.close();
    });
    it("GET request", function(done){
      request({url: "http://localhost:4000/cors/1", method: "GET", proxy: ""}, function(err, res){
        assert(res.headers["access-control-allow-origin"], "*");
        assert(res.headers["access-control-allow-methods"], "GET, POST, PUT, DELETE");
        done();
      });
    });
    it("POST request", function(done){
      request({url: "http://localhost:4000/cors/1", method: "POST", proxy: ""}, function(err, res){
        assert(res.headers["access-control-allow-origin"], "*");
        assert(res.headers["access-control-allow-methods"], "GET, POST, PUT, DELETE");
        done();
      });
    });
    it("PUT request", function(done){
      request({url: "http://localhost:4000/cors/1", method: "PUT", proxy: ""}, function(err, res){
        assert(res.headers["access-control-allow-origin"], "*");
        assert(res.headers["access-control-allow-methods"], "GET, POST, PUT, DELETE");
        done();
      });
    });
    it("DELETE request", function(done){
      request({url: "http://localhost:4000/cors/1", method: "DELETE", proxy: ""}, function(err, res){
        assert(res.headers["access-control-allow-origin"], "*");
        assert(res.headers["access-control-allow-methods"], "GET, POST, PUT, DELETE");
        done();
      });
    });
  });
});
