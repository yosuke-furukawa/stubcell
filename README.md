Stubcell [![Build Status](https://travis-ci.org/yosuke-furukawa/stubcell.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/stubcell)
---------------

Stub Server for test project.


Some Stub server has some disappointing points.

- cannot check the response JSON when JSON response.
- does not use JSON5, so i cannot write comments in the JSON file.
- launch https server by default (Stubby...)

Features
---------------

Stubcell has the following features.

- response value can be written in JSON5
- validate JSON in stub server.
- don't launch https server :)


How to use
---------------

## Install

```sh
$ npm install stubcell -D
```

## need to write entry yaml

```yaml
-
  request:
    url: /test/:id
    method: GET
  response:
    status: 200
    headers:
      content-type: application/json
    file: test/example.json5
-
  request:
    url: /test/
    method: GET
  response:
    status: 200
    headers:
      content-type: application/json
    file: test/example.json

```

## need to write jsons

### test/example.json5

```javascript
{
  // test comment
  // we can write comment in JSON.
  "message" : "Hello world"
}
```

## sample code

```javascript
var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
stubcell.loadEntry(__dirname + "/example.yaml");
var app = stubcell.server();
var server = app.listen(3000);

http.get("http://localhost:3000/test/abc", function(res){
  var data = '';
  res.on("data", function(chunk) {
    data += chunk;
  });
  res.on("end", function() {
    try {
      console.log(data);
      server.close();
    } catch (e) {
      console.error(e);
    }
  });
});
```


