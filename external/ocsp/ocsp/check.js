'use strict';

var ocsp = require('../ocsp');
var util = require('util');
var url = require('url');

var rfc2560 = require('asn1.js-rfc2560');

module.exports = function check(options, cb) {
  var sync = true;
  var req;

  function done(err, data) {
    if (sync) {
      sync = false;
      process.nextTick(function() {
        cb(err, data);
      });
      return;
    }

    cb(err, data);
  }

  try {
    req = ocsp.request.generate(options.cert, options.issuer);
  } catch (e) {
    return done(e);
  }

  var ocspMethod = rfc2560['id-pkix-ocsp'].join('.');
  ocsp.utils.getAuthorityInfo(req.cert, ocspMethod, function(err, uri) {
    if (err)
      return done(err);

      var httpOptions;

      if (options.httpOptions !== undefined) {
          httpOptions = util._extend(options.httpOptions, url.parse(uri));
      } else {
          httpOptions = uri;
      }

    ocsp.utils.getResponse(httpOptions, req.data, function(err, raw) {
      if (err)
        return done(err);

      ocsp.verify({
        request: req,
        response: raw
      }, done);
    });
  });

  sync = false;
};
