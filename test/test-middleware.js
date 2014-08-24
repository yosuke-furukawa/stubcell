var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var assert = require("power-assert");
var express = require("express");
var request = require("request");

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
      request({
        url: "http://localhost:9000/abdul",
        method: "GET",
        proxy: ""
      }, function(err, res, body){
        try {
          assert.equal(JSON.parse(body).message, "yes i am");
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
