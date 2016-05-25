const StubCell = require("../index");
const stubcell = new StubCell();
const http = require("http");
const fs = require("fs");
const assert = require("power-assert");
const PORTS = require("../util/PORTS");
const ECHO_SERVER_PORT = PORTS.next();
const TEST_SERVER_PORT = PORTS.next();
stubcell.loadEntry(__dirname + "./base.yaml", {
  basepath: "test/base",
  debug: true,
  record: {
    target: `http://localhost:${ECHO_SERVER_PORT}`
  }
});
const app = stubcell.server();
const server = app.listen(TEST_SERVER_PORT);

describe('Stubcell server should set json basepath', function(){
  const server;
  beforeEach(function(done) {
    server.on("listening", done);
  });
  afterEach(function(done) {
    server.on("close", done);
    server.close();
  });
  describe("request", function(){
    it("should return test/base/test/base_get.json", function(done){
      http.get("http://localhost:3000/test/base", function(res){
        const data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).test, "base");
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
  describe("request", function(){
    this.timeout(10000);
    after(function(){
      fs.unlinkSync(__dirname + "/base/test/record_get.json");
    });
    it("should return test/base/test/record_get.json", function(done){
      http.get("http://localhost:3000/test/record", function(res){
        var data = '';
        res.on("data", function(chunk) {
          data += chunk;
        });
        res.on("end", function() {
          try {
            assert.equal(JSON.parse(data).test, "record");
            setTimeout(done, 5000);
            fs.readFile("./test/base/test/record_get.json", function(err, d) {
              // error ignore file is not created.
              if (err) return;
              assert.deepEqual(JSON.parse(d), JSON.parse('{"test":"record"}'));
              done();
            });
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});

