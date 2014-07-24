Stubcell [![Build Status](https://travis-ci.org/yosuke-furukawa/stubcell.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/stubcell)
---------------

Stub server to develop client-side project.

Features
---------------

Stubcell has the following features.

- emulate response files
- response value can be written in JSON5 (JSON file is more readable and human friendly ♡)
- validate JSON in stub server.
- Support JSON-RPC (2014/05/14)
- Support querystring and body (2014/05/21)
- Support recording json (2014/05/23)
- Support Command Line tool (2014/05/26)
- Support [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) (2014/07/24)

Difference from other stub tools
-----------------

Almost Stub servers have some disappointing points.

- cannot validate JSON.
- does not use JSON5, so i cannot write comments in the JSON file and cannot write trailing comma.

For example:

- [stubby](https://github.com/mrak/stubby4node) always launch https server and cannot validate json, so if json is invalid, you should check the value in client side.

- [easymock](https://github.com/CyberAgent/node-easymock) is so simple, but it depends on sqlite3, and could not write comment in JSON file and could not validate json.

stubcell can check JSON and write comments in your JSON file, so you can write the specification in detail. stubcell is more simple than others and dependent libraries are small.

How to use
---------------

## Install

```sh
$ npm install stubcell
```

## need to write entry yaml

```yaml
-
  # request content
  request:
    # request url
    # :id is id params, so it matches /test/aaa, /test/1, /test/hello
    url: /test/:id
    # http method, GET, POST, PUT, DELETE
    method: GET
  # response content
  response:
    # status value 200, 404, 500 etc..
    status: 200
    # response body json path.
    file: test/id.json
-
  request:
    url: /test/
    method: get
  response:
    status: 200
    file: test.json

# if response/file is not specified, url and method become the response filepath
# like /abc/abc_get.json
# the algorithm is <url>_<method>.json
# if url is /echo/yosuke/hoge and method is PUT and entry.yaml is /usr/test/stubcell/entry.yaml
# stubcell looks up /usr/test/stubcell/echo/yosuke/hoge_put.json
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
      # if your server accept jsonrpc, need jsonrpc prop.
      jsonrpc: 2.0
      # need jsonrpc method prop.
      method: sum
  response:
    status: 200
    file: jsonrpc/sum.json

# support querystring and body
-
  request:
    url: /querystringbody
    method: POST
    # can write query
    query:
      q: yosuke
    # can write body
    body:
      test: 123
  response:
    status: 200
    file: querystringbody.json

# support writing body directly
-
  request:
    url: /write/directly
    method: GET
  response:
    status: 200
    body: '{"message": "hello"}'
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

### jsonrpc/sum.json

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

## options

```javascript
var StubCell = require("../index");
var stubcell = new StubCell();
var http = require("http");
var options = {
  // show more detail information
  debug : true, // default is false
  // json base path, stubcell return json from  basepath + "/" + filepath
  basepath : "", // default is yaml parent dir.
  // request to backend server and record json file.
  record: {
    // show more detail information
    debug : true, // default is false
    // json store base path
    basepath: "", // default is options.basepath
    // request redirectTo.
    proxy : "http://echo.jsontest.com" // default is http://localhost:3001
  },
  // loose compare request params (headers, query, body) and entry
  looseCompare: true,
  // cors option (default true)
  cors: false,
  //   or set each headers
  cors: {
    "Access-Control-Allow-Origin": "example.com",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Fields": "secret"
  }
};
stubcell.loadEntry(__dirname + "/example.yaml", options);
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
    } catch (e) {
      console.error(e);
    }
  });
});

http.get("http://localhost:3000/hello/world", function(res){
  var data = '';
  res.on("data", function(chunk) {
    data += chunk;
  });
  res.on("end", function() {
    try {
      // { "hello": "world" }
      // and record the json to __dirname/hello/world.json
      console.log(data);
    } catch (e) {
      console.error(e);
    }
  });
});
```

## Use finally routing

you can use finally routing if any request setting matches a current request.
set `request.url = $finally`, it is replaced with `*` in app's routing.

```yaml
-
  request:
    url: $finally
    method: ALL
  response:
    status: 200
    body: '{message: "you look me!"}'
```

How to use in CLI
---------------

```sh
$ npm install stubcell -g
```

```sh
$ stubcell --port 3000 --entry ./entry.yaml --record_proxy http://echo.jsontest.com
```

## commandline arguments

```sh

  Usage: stubcell [options]

  Options:

      -h, --help                            output usage information
      -V, --version                         output the version number
      --port <n>                            server start port, default is 8090
      --entry [entry filepath]              entry yaml file, default is /Users/furukawa.yosuke/Program/stubcell/entry.yaml
      --record_proxy [record proxy server]  record proxy server, default is null (no record file)
      --silent                              hide detail info, default is false
```

How to use in some other frontend tools
------------------

- [grunt-stubcell](https://github.com/yosuke-furukawa/grunt-stubcell)
- [gulp-stubcell](https://github.com/yosuke-furukawa/gulp-stubcell)
