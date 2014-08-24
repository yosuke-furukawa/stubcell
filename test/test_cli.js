var spawn = require("child_process").spawn;
var http = require("http");
var assert = require("assert");
var stubcell = spawn("./bin/stubcell.js", ["--port", 3005, "--entry", "./test/example.yaml", "--record_target", "http://echo.jsontest.com"]);

stubcell.stdout.on("data", function(data) {
  console.log(""+data);
  if (/Listening on/.test(data)) {
    http.get("http://localhost:3005/hello/world", function(res){
      var data = "";
      res.on("data", function(chunk){
        data += chunk;
      });
      res.on("end", function(){
        console.log(""+data);
        assert.deepEqual({"hello":"world"}, JSON.parse(data));
        stubcell.kill("SIGHUP");
      });
    });
  }
});
stubcell.on("close", function(){
  console.log("finished");
});
