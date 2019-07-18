'use strict';

var ocsp = require('../ocsp');

function Cache(options) {
  this.options = options || {};
  this.cache = {};

  // Override methods
  if (this.options.probe)
    this.probe = this.options.probe;
  if (this.options.store)
    this.store = this.options.store;
  if (this.options.filter)
    this.filter = this.options.filter;
}
module.exports = Cache;

Cache.prototype.filter = function filter(url, callback) {
  callback(null);
};

Cache.prototype.probe = function probe(id, callback) {
  if (this.cache.hasOwnProperty(id))
    callback(null, this.cache[id]);
  else
    callback(null, false);
};

Cache.prototype.store = function store(id, response, maxTime, callback) {
  if (this.cache.hasOwnProperty(id))
    clearTimeout(this.cache[id].timer);
  var self = this;
  this.cache[id] = {
    response: response,
    timer: setTimeout(function() {
      delete self.cache[id];
    }, maxTime)
  };

  callback(null, null);
};

Cache.prototype.request = function request(id, data, callback) {
  var self = this;

  function done(err, response) {
    if (callback)
      callback(err, response);
    callback = null;
  }

  function onResponse(err, ocsp) {
    if (err)
      return done(err);

    // Respond early
    done(null, ocsp);

    // Try parsing and caching response
    self.getMaxStoreTime(ocsp, function(err, maxTime) {
      if (err)
        return;

      self.store(id, ocsp, maxTime, function() {
        // No-op
      });
    });
  }

  // Check that url isn't blacklisted
  this.filter(data.url, function(err) {
    if (err)
      return done(err, null);

    ocsp.utils.getResponse(data.url, data.ocsp, onResponse);
  });

};

Cache.prototype.getMaxStoreTime = function getMaxStoreTime(response, callback) {
  var basic;
  try {
    basic = ocsp.utils.parseResponse(response).value;
  } catch (e) {
    return callback(e);
  }

  // Not enough responses
  if (basic.tbsResponseData.responses.length === 0)
    return callback(new Error('No OCSP responses'));

  var responses = basic.tbsResponseData.responses;

  // Every response should be positive
  var good = responses.every(function(response) {
    return response.certStatus.type === 'good';
  });

  // No good - no cache
  if (!good)
    return callback(new Error('Some OCSP responses are not good'));

  // Find minimum nextUpdate time
  var nextUpdate = 0;
  for (var i = 0; i < responses.length; i++) {
    var response = responses[i];
    var responseNext = response.nextUpdate;
    if (!responseNext)
      continue;

    if (nextUpdate === 0 || nextUpdate > responseNext)
      nextUpdate = responseNext;
  }

  return callback(null, Math.max(0, nextUpdate - new Date()));
};
