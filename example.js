var StubCell = require("./index");
var stubcell = new StubCell();
var http = require("http");

stubcell.loadEntry("example.yaml");
var app = stubcell.server();
var server = app.listen(3000, function(){
  http.get("http://localhost:3000/test/abc", function(res){
    var data = '';
    res.on("data", function(chunk) {
      data += chunk;
    });
    res.on("end", function() {
      try {
        console.log(JSON.parse(data));
        server.close();
      } catch (e) {
        console.error(e);
      }
    });
  });
});

