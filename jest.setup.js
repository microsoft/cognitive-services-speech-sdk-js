// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetch = require("node-fetch");
global.fetch = nodeFetch;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;
global.Request = nodeFetch.Request;
