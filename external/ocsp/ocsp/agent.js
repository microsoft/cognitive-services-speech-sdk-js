'use strict';

var ocsp = require('../ocsp');

var util = require('util');
var http = require('http');
var https = require('https');
var rfc5280 = require('asn1.js-rfc5280');
var SimpleCache = require('simple-lru-cache');

function Agent(options) {
  if (!options)
    options = {};

  https.Agent.call(this, options);

  this.caCache = new SimpleCache({ maxSize: options.CACacheSize || 1024 });
}
module.exports = Agent;
util.inherits(Agent, https.Agent);

Agent.prototype.createConnection = function createConnection(port,
                                                             host,
                                                             options) {

  if (port !== null && typeof port === 'object') {
    options = port;
    port = null;
  } else if (host !== null && typeof host === 'object') {
    options = host;
    host = null;
  } else if (options === null || typeof options !== 'object')
    options = {};

  if (typeof port === 'number')
    options.port = port;

  if (typeof host === 'string')
    options.host = host;

  var ocspOptions = util._extend({ requestOCSP: true }, options);
  var socket = https.Agent.prototype.createConnection.call(
      this, port, host, ocspOptions);

  var self = this;
  var stapling = null;
  socket.on('OCSPResponse', function(data) {
    stapling = data;
  });

  socket.on('secure', function() {
    return self.handleOCSPResponse(socket, stapling, function(err) {
      if (err)
        return socket.destroy(err);

      // Time to allow all writes!
      socket.uncork();
    });
  });

  // Do not let any writes come through until we will verify OCSP
  socket.cork();

  return socket;
};

Agent.prototype.handleOCSPResponse = function handleOCSPResponse(socket,
                                                                 stapling,
                                                                 cb) {
  var cert = socket.ssl.getPeerCertificate(true);
  var issuer = cert.issuerCertificate;

  cert = cert.raw;
  try {
    cert = rfc5280.Certificate.decode(cert, 'der');

    if (issuer) {
      issuer = issuer.raw;
      issuer = rfc5280.Certificate.decode(issuer, 'der');
    }
  } catch (e) {
    return cb(e);
  }

  function onIssuer(err, x509) {
    if (err)
      return cb(err);

    issuer = x509;

    if (stapling) {
      var req = ocsp.request.generate(cert, issuer);
      ocsp.verify({
        request: req,
        response: stapling
      }, cb);
    } else {
      return ocsp.check({ cert: cert, issuer: issuer }, cb);
    }
  }

  if (issuer)
    return onIssuer(null, issuer);
  else
    return this.fetchIssuer(cert, stapling, onIssuer);
};

Agent.prototype.fetchIssuer = function fetchIssuer(cert, stapling, cb) {
  var issuers = ocsp.utils['id-ad-caIssuers'].join('.');
  var self = this;

  // TODO(indutny): use info from stapling response
  ocsp.utils.getAuthorityInfo(cert, issuers, function(err, uri) {
    if (err)
      return cb(err);

    var ca = self.caCache.get(uri);
    if (ca)
      return cb(null, ca);

    var once = false;
    function done(err, data) {
      if (once)
        return;

      once = true;
      cb(err, data);
    }

    function onResponse(res) {
      if (res.statusCode < 200 || res.statusCode >= 400)
        return done(new Error('Failed to fetch CA: ' + res.statusCode));

      var chunks = [];
      res.on('readable', function() {
        var chunk = res.read();
        if (!chunk)
          return;
        chunks.push(chunk);
      });

      res.on('end', function() {
        var cert = Buffer.concat(chunks);

        try {
          cert = rfc5280.Certificate.decode(cert, 'der');
        } catch (e) {
          return done(e);
        }

        self.caCache.set(uri, cert);
        done(null, cert);
      });
    }

    http.get(uri)
        .on('error', done)
        .on('response', onResponse);
  });
};
