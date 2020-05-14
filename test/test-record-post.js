var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");
var fs = require("fs");

stubcell.loadEntry(__dirname + "/example.yaml", {
  debug: true,
  record: {
    proxy: "http://localhost:3001",
    debug: true
  }
});
var app = stubcell.server();
describe('Stubcell server', function(){
  var server;
  var backendServer;
  before(function(done) {
    backendServer = http.createServer(function(req, res){
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end('{"hello":"world"}');
    }).listen(3001);
    backendServer.on("listening", function(){
      server = app.listen(3000);
      server.on("listening", done);
    });
  });
  after(function(done) {
    server.on("close", function(){
      backendServer.on("close", done);
      backendServer.close();
    });
    server.close();
  });
  describe("jsonrpc", function(){
    it("should return {hello:world} jsonrpc", function(done){
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
            assert.equal(JSON.parse(data).hello, "world");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
      var reqBody = {
        jsonrpc: 2.0,
        method: 'dummyrpc',
        id: 1,
        params: [123, 456]
      };
      req.write(JSON.stringify(reqBody));
      req.end();
    });
  });
});
