var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");
var express = require("express");

stubcell.loadEntry(__dirname + "/example.yaml", {
  debug: true
});
var app = stubcell.server();

describe('Stubcell server', function(){
  it('reuse middleware', function(done){
    var myapp = express();
    myapp.use(stubcell.route);
    var server = myapp.listen(9000);
    server.on("listening", function(){
      http.get("http://localhost:9000/abdul", function(res){
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          assert.equal(JSON.parse(data).message, "yes i am");
          done()
        });
      });
    });
  });
});
