var deepEqual = require('deep-equal');
var includeEqual = function(small, large){
  // request / entry do not use Class so compare loose (e.g. without comparison prototype)
  if(small === large) return true;

  if(small instanceof Date && large instanceof Date) {
    return small.getTime() === large.getTime();
  }

  if(typeof small != 'object' && typeof large != 'object') {
    return small == large;
  }

  var attrs = Object.keys(small);
  for(var i = 0; i < attrs.length; i++) {
    var attr = attrs[i];
    if(! includeEqual(small[attr], large[attr])) return false;
  }
  return true;
};

module.exports.jsonrpc = function(entryBody, reqBody, looseCompare){
  var matchMethod = entryBody.method === reqBody.method;
  var matchParam = false;

  if (looseCompare) {
    matchParam = entryBody.params ? includeEqual(entryBody.params, reqBody.params) : true;
  } else {
    matchParam = entryBody.params ? deepEqual(entryBody.params, reqBody.params) : true;
    // ignore id check
  }
  return matchMethod && matchParam;
};

module.exports.body = function(entryBody, reqBody, looseCompare){
  if (looseCompare) {
    return includeEqual(entryBody, reqBody);
  } else {
    return deepEqual(entryBody, reqBody);
  }
};

module.exports.query = function(entryQuery, reqQuery, looseCompare){
  if (looseCompare) {
    return includeEqual(entryQuery, reqQuery);
  } else {
    return deepEqual(entryQuery, reqQuery);
  }
};
