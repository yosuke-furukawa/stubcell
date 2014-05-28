var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");

stubcell.loadEntry(__dirname + "/base.yaml", {basepath: "test/base", debug: true});
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
});

