Stubcell [![Build Status](https://travis-ci.org/yosuke-furukawa/stubcell.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/stubcell)
---------------

Stub Server for test project.


Some Stub servers have some disappointing points.

- cannot validate JSON.
- does not use JSON5, so i cannot write comments in the JSON file.
- launch https server by default (Stubby...)

Features
---------------

Stubcell has the following features.

- emulate response files
- response value can be written in JSON5
- validate JSON in stub server.
- don't launch https server :)
- Support JSON-RPC (2014/05/14)


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
    file: test/id.json
-
  request:
    url: /test/
    method: get
  response:
    status: 200
    file: test.json

# if file is not specified, url path become the response filepath
# like /abc/abc.json
-
  request:
    url: /abc/abc
    method: get
  response:
    status: 200

# support json-rpc
-
  request:
    url: /jsonrpc
    method: POST
    body:
      # need jsonrpc prop.
      jsonrpc: 2.0
      method: sum
      params: [123, 456]
  response:
    status: 200
    file: jsonrpc_sum.json
```

## need to write jsons

### test/example.json

```javascript
{
  // test comment
  // we can write comment in JSON.
  message : "Hello world", // can write trailing comma.
}
```

### jsonrpc_sum.json

```javascript
// for jsonrpc
// !NOTE! only write result value
// not include id and jsonrpc properties.
{
  // sum [123, 456]
  result: 579
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

http.get("http://localhost:3000/test/1", function(res){
  var data = '';
  res.on("data", function(chunk) {
    data += chunk;
  });
  res.on("end", function() {
    try {
      // { "message" : "Hello world" }
      console.log(data);
      server.close();
    } catch (e) {
      console.error(e);
    }
  });
});
```


