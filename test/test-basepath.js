var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var fs = require("fs");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/base.yaml", {
  basepath: "test/base",
  debug: true,
  record: {
    target: "http://localhost:3001",
    debug: true
  }
});
var app = stubcell.server();
describe('Stubcell server should set json basepath', function(){
  var server;
  var backendServer;
  before(function(done) {
    backendServer = http.createServer(function(req, res){
      var data = req.url.split("/");
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({[data[1]]: data[2]}));
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
            fs.readFile("./test/base/test/record_get.json", function(err, d) {
              if (err) throw new Error(err);
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

