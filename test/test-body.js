var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/example.yaml", "", true);
var app = stubcell.server();
describe('Stubcell server with query', function(){
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
    it("should return query.json", function(done){
      http.get("http://localhost:3000/example/query?q=test&t=1234", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).query, "ok");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});

describe('Stubcell server with query and body', function(){
  var server;
  beforeEach(function(done) {
    server = app.listen(3000);
    server.on("listening", done);
  });
  afterEach(function(done) {
    server.on("close", done);
    server.close();
  });
  describe("post /query", function(){

    it("should return querybody.json", function(done){

      var opt = {
        hostname: 'localhost',
        port : 3000,
        path : '/example/query?q=test&t=1234',
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
            assert.equal(JSON.parse(data).querybody, "ok");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
      var reqBody = {
        test: "test",
        id: 1234,
      };
      req.write(JSON.stringify(reqBody));
      req.end();
    });
  });
});
