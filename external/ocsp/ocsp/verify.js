'use strict';

var ocsp = require('../ocsp');
var rfc5280 = require('asn1.js-rfc5280');
var crypto = require('crypto');

// TODO(indutny): verify issuer, etc...
function findResponder(issuer, certs, raws) {
  var issuerKey = issuer.tbsCertificate.subjectPublicKeyInfo;
  issuerKey = ocsp.utils.toPEM(
      rfc5280.SubjectPublicKeyInfo.encode(issuerKey, 'der'), 'PUBLIC KEY');

  for (var i = 0; i < certs.length; i++) {
    var cert = certs[i];
    var signAlg = ocsp.utils.sign[cert.signatureAlgorithm.algorithm.join('.')];
    if (!signAlg) {
      throw new Error('Unknown signature algorithm ' +
                      cert.signatureAlgorithm.algorithm);
    }

    var verify = crypto.createVerify(signAlg);

    verify.update(raws[i]);
    if (!verify.verify(issuerKey, cert.signature.data))
      throw new Error('Invalid signature');

    var certKey = cert.tbsCertificate.subjectPublicKeyInfo;
    certKey = ocsp.utils.toPEM(
        rfc5280.SubjectPublicKeyInfo.encode(certKey, 'der'), 'PUBLIC KEY');
    return certKey;
  }

  return issuerKey;
}

module.exports = function verify(options, cb) {
  var req = options.request;
  var issuer;
  var res;

  function done(err) {
    process.nextTick(function() {
      cb(err, res && res.certStatus);
    });
  }

  try {
    issuer = req.issuer ||
             rfc5280.Certificate.decode(
                 ocsp.utils.toDER(options.issuer, 'CERTIFICATE'), 'der');

    res = ocsp.utils.parseResponse(options.response);
  } catch (e) {
    return done(e);
  }

  var rawTBS = options.response.slice(res.start, res.end);
  var certs = res.certs;
  var raws = res.certsTbs.map(function(tbs) {
    return options.response.slice(tbs.start, tbs.end);
  });
  res = res.value;

  // Verify signature using CAs Public Key
  var signAlg = ocsp.utils.sign[res.signatureAlgorithm.algorithm.join('.')];
  if (!signAlg) {
    done(new Error('Unknown signature algorithm ' +
                   res.signatureAlgorithm.algorithm));
    return;
  }

  var responderKey = findResponder(issuer, certs, raws);

  var verify = crypto.createVerify(signAlg);
  var tbs = res.tbsResponseData;

  var signature = res.signature.data;

  verify.update(rawTBS);
  if (!verify.verify(responderKey, signature))
    return done(new Error('Invalid signature'));

  if (tbs.responses.length < 1)
    return done(new Error('Expected at least one response'));

  var res = tbs.responses[0];

  // Verify CertID
  // XXX(indutny): verify parameters
  if (res.certId.hashAlgorithm.algorithm.join('.') !==
      req.certID.hashAlgorithm.algorithm.join('.')) {
    return done(new Error('Hash algorithm mismatch'));
  }

  if (res.certId.issuerNameHash.toString('hex') !==
      req.certID.issuerNameHash.toString('hex')) {
    return done(new Error('Issuer name hash mismatch'));
  }

  if (res.certId.issuerKeyHash.toString('hex') !==
      req.certID.issuerKeyHash.toString('hex')) {
    return done(new Error('Issuer key hash mismatch'));
  }

  if (res.certId.serialNumber.cmp(req.certID.serialNumber) !== 0)
    return done(new Error('Serial number mismatch'));

  if (res.certStatus.type !== 'good') {
    return done(new Error('OCSP Status: ' + res.certStatus.type));
  }

  var now = +new Date();
  var nudge = options.nudge || 60000;
  if (res.thisUpdate - nudge > now || res.nextUpdate + nudge < now)
    return done(new Error('OCSP Response expired'));

  return done(null);
};
