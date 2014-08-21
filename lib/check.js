var deepEqual = require('deep-equal');
var url = require("url");

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

var check = module.exports = {
  jsonrpc: function(entryBody, reqBody, looseCompare){
    var matchMethod = entryBody.method === reqBody.method;
    var matchParam = false;

    if (looseCompare) {
      matchParam = entryBody.params ? includeEqual(entryBody.params, reqBody.params) : true;
    } else {
      matchParam = entryBody.params ? deepEqual(entryBody.params, reqBody.params) : true;
      // ignore id check
    }
    return matchMethod && matchParam;
  },

  request: function(request, req, looseCompare){
    var parsedUrl = url.parse(req.url);
    return request.method === "ALL" ? true : request.method.toLowerCase() === req.method.toLowerCase() &&
      check.url(request.pathRegexp, parsedUrl.pathname) &&
      check.headers(request.headers, req.headers, looseCompare) &&
      check.query(request.query, req.query, looseCompare) &&
      check.body(request.body, req.body, looseCompare);
  },

  url: function(entryUrl, reqUrl){
    return entryUrl.exec(reqUrl) ? true : false;
  },

  headers: function(entryHeaders, reqHeaders, looseCompare){
    if (!entryHeaders) return true;
    if (looseCompare) {
      return includeEqual(entryHeaders, reqHeaders);
    } else {
      return deepEqual(entryHeaders, reqHeaders);
    }
  },

  body: function(entryBody, reqBody, looseCompare){
    if (!entryBody) return true;
    if (looseCompare) {
      return includeEqual(entryBody, reqBody);
    } else {
      return deepEqual(entryBody, reqBody);
    }
  },

  query: function(entryQuery, reqQuery, looseCompare){
    if (!entryQuery) return true;
    if (looseCompare) {
      return includeEqual(entryQuery, reqQuery);
    } else {
      return deepEqual(entryQuery, reqQuery);
    }
  }
};
