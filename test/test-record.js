var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");
var fs = require("fs");

describe('Stubcell server', function(){
  var server;
  var backendServer;
  before(function(done) {
    backendServer = http.createServer(function(req, res){
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end('{"hello":"world"}');
    }).listen(3001);
    backendServer.on("listening", function(){
      var stubcell = new StubCell();
      stubcell.loadEntry(__dirname + "/example.yaml", {
        debug: true,
        record: {
          proxy: "http://localhost:3001",
          debug: true
        }
      });
      var app = stubcell.server();
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
  describe("request", function(){
    it("should return {hello:world}", function(done){
      http.get("http://localhost:3000/wouldliketorecord", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).hello, "world");
            fs.readFile("./test/wouldliketorecord.json", function(err, d) {
              assert.deepEqual(JSON.parse(d), JSON.parse('{"hello":"world"}'));
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

