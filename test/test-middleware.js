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
  var server;
  var myapp;
  beforeEach(function(done) {
    myapp = express();
    myapp.use(stubcell.route);
    server = myapp.listen(9000, done);
  });
  afterEach(function(done) {
    server.close(done);
  });

  it('reuse middleware', function(done){
      http.get("http://localhost:9000/abdul", function(res){
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          assert.equal(JSON.parse(data).message, "yes i am");
          done();
        });
      });
  });
});
