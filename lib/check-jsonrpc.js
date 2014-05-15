var deepEqual = require('deep-equal');
exports = module.exports = function(entryBody, reqBody){
  var matchMethod = entryBody.method === reqBody.method;
  var matchParam = deepEqual(entryBody.params, reqBody.params);
  // ignore id check
  return matchMethod && matchParam;
};
