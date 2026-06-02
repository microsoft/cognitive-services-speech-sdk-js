// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetch = require("node-fetch");
global.fetch = nodeFetch;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;
global.Request = nodeFetch.Request;

// uuid v14 relies on the Web Crypto API (crypto.getRandomValues), which is not
// exposed as a global in the jsdom test environment. Polyfill it from Node.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { webcrypto } = require("crypto");
if (!global.crypto) {
    global.crypto = webcrypto;
}
