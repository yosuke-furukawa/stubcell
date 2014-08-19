var StubCell = require("../index");
var connect = require("connect");
var app = connect();
var http = require("http");
var assert = require("power-assert");

var stubcell = new StubCell(app);
stubcell.loadEntry(__dirname + "/example.yaml", "/api", {debug: true});
app = stubcell.server();
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
  describe("/api", function(){
    it("should return abc:def for /api/abc/abc.json when request abc/abc", function(done){
      http.get("http://localhost:3000/api/abc/abc?q=123", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            console.log(data);
            assert.equal(JSON.parse(data).abc, "def");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});
