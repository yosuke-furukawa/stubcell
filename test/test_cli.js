var spawn = require("child_process").spawn;
var http = require("http");
var assert = require("assert");

describe("client test", function(){
  var port = 3010;

  it("should work well", function(done){
    var stubcell = spawn("./bin/stubcell.js", [
      "--port", port, "--entry", "./test/example.yaml",
      "--record_target", "http://echo.jsontest.com"]);

    stubcell.stdout.on("data", function(data) {
      if (/Listening on/.test(data)) {
        http.get("http://localhost:"+port+"/hello/world", function(res){
          var data = "";
          res.on("data", function(chunk){
            data += chunk;
          });
          res.on("end", function(){
            assert.deepEqual({"hello":"world"}, JSON.parse(data));
            stubcell.kill("SIGHUP");
          });
        });
      }
    });
    stubcell.on("close", function(){
      done();
    });
  });
});
