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
  describe("jsonrpc request", function(){
    it("should return 579 for jsonrpc", function(done){

      var opt = {
        hostname: 'localhost',
        port : 3000,
        path : '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' 
        }
      };
      var req = http.request(opt, function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).result, 579);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
      var reqBody = {
        jsonrpc: 2.0,
        method: 'sum',
        id: 1,
        params: [123, 456]
      };
      req.write(JSON.stringify(reqBody));
      req.end();
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
  describe("post jsonrpc request2", function(){

    it("should return 333 for jsonrpc", function(done){

      var opt = {
        hostname: 'localhost',
        port : 3000,
        path : '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' 
        }
      };
      var req = http.request(opt, function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).result, 333);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
      var reqBody = {
        jsonrpc: 2.0,
        method: 'subtract',
        id: 1,
        params: [456, 123]
      };
      req.write(JSON.stringify(reqBody));
      req.end();
    });
  });
});
