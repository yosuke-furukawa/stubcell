var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");

var stubcell = new StubCell();
stubcell.loadEntry(__dirname + "/loose.yaml", {basepath: "", debug: true, looseCompare: true});
var app = stubcell.server();

describe('Stubcell server with looseCompare', function(){
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
    it("should return include when request includes entry queries", function(done){
      http.get("http://localhost:3000/loose/1?require1=1&require2=2&optional=3", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "include");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
    it("should return 'data lack require params' when request lack entry queries", function(done){
      http.get("http://localhost:3000/loose/1?require1=1&optional=3", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).message, "data lack require params");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
  });
});
