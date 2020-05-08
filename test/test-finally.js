var StubCell = require("../index");
var http = require("http");
var assert = require("power-assert");

var stubcell = new StubCell();
stubcell.loadEntry(__dirname + "/finally.yaml", {basepath: "", debug: true});
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
    it("should return 'you look me!' when no match entries", function(done){
      http.get("http://localhost:3000/dio", function(res){
        var data = '';
        assert.equal(res.statusCode, 200);
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            data = JSON.parse(data);
            assert.equal(data.message, "you look me!");
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    });
  });
});
