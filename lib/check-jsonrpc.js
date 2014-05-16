var deepEqual = require('deep-equal');
exports = module.exports = function(entryBody, reqBody){
  var matchMethod = entryBody.method === reqBody.method;
  var matchParam = entryBody.params ? deepEqual(entryBody.params, reqBody.params) : true;
  // ignore id check
  return matchMethod && matchParam;
};
