var deepEqual = require('deep-equal');
module.exports.jsonrpc = function(entryBody, reqBody){
  var matchMethod = entryBody.method === reqBody.method;
  var matchParam = entryBody.params ? deepEqual(entryBody.params, reqBody.params) : true;
  // ignore id check
  return matchMethod && matchParam;
};

module.exports.body = function(entryBody, reqBody){
  return deepEqual(entryBody, reqBody);
};

module.exports.query = function(entryQuery, reqQuery){
  return deepEqual(entryQuery, reqQuery);
};
