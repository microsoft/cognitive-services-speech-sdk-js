// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// tslint:disable:max-classes-per-file

import * as querystring from "querystring";
export interface Url {
    auth: string;
    hash: string;
    host: string;
    hostname: string;
    href: string;
    path: string;
    pathname: string;
    protocol: string;
    search: string;
    slashes: boolean | null;
    port: string;
    query: string | null | ParsedUrlQuery;
}

interface ParsedUrlQuery { [key: string]: string | string[]; }

class UrlWithStringQuery implements Url {
    public query: string = "";
    public auth: string = "";
    public hash: string = "";
    public host: string = "";
    public hostname: string = "";
    public href: string = "";
    public path: string = "";
    public pathname: string = "";
    public protocol: string = "";
    public search: string = "";
    public slashes: boolean | null = null;
    public port: string = "";
}

class UrlHelpers {
    public static protocolPattern: RegExp = /^([a-z0-9.+-]+:)/i;
    public static portPattern: RegExp = /:[0-9]*$/;

    // Special case for a simple path URL
    public static simplePathPattern: RegExp = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;

    /*
    * RFC 2396: characters reserved for delimiting URLs.
    * We actually just auto-escape these.
    */
    public static delims: string[] = [
        "<", ">", `"`, "`", " ", "\r", "\n", "\t"
    ];

    // RFC 2396: characters not allowed for various reasons.
    public static unwise: string[] = [
        "{", "}", "|", "\\", "^", "`"
    ].concat(UrlHelpers.delims);

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    public static autoEscape: string[] = ["'"].concat(UrlHelpers.unwise);
    /*
    * Characters that are never ever allowed in a hostname.
    * Note that any invalid chars are also handled, but these
    * are the ones that are *expected* to be seen, so we fast-path
    * them.
    */
    public static nonHostChars: string[] = [
        "%", "/", "?", ";", "#"
    ].concat(UrlHelpers.autoEscape);
    public static hostEndingChars: string[] = [
        "/", "?", "#"
    ];
    public static hostnameMaxLen: number = 255;
    public static hostnamePartPattern: RegExp = /^[+a-z0-9A-Z_-]{0,63}$/;
    public static hostnamePartStart: RegExp = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
    // protocols that can allow "unsafe" and "unwise" chars.
    public static unsafeProtocol = (proto: string): boolean => {
        return proto === "javascript:";
    }
    // protocols that always contain a // bit.
    public static slashedProtocol = (proto: string): boolean => {
        return proto === "http:" ||
            proto === "https:" ||
            proto === "ftp:" ||
            proto === "gopher:" ||
            proto === "file:";
    }
}

export class UrlParser {

    public static parse(url: string): UrlWithStringQuery {
        let privUrl: UrlWithStringQuery = new UrlWithStringQuery();
        if (typeof url !== "string") {
            throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
        }

        /*
        * Copy chrome, IE, opera backslash-handling behavior.
        * Back slashes before the query string get converted to forward slashes
        * See: https://code.google.com/p/chromium/issues/detail?id=25916
        */
        const queryIndex = url.indexOf("?");
        const splitter = queryIndex !== -1 && queryIndex < url.indexOf("#") ? "?" : "#";
        const uSplit = url.split(splitter);
        const slashRegex = /\\/g;
        uSplit[0] = uSplit[0].replace(slashRegex, "/");
        url = uSplit.join(splitter);

        let rest = url.trim();

        if (url.split("#").length === 1) {
            // Try fast path regexp
            const simplePath = UrlHelpers.simplePathPattern.exec(rest);

            if (simplePath) {
                privUrl.path = rest;
                privUrl.href = rest;
                privUrl.pathname = simplePath[1];

                if (simplePath[2]) {
                    privUrl.search = simplePath[2];
                    privUrl.query = privUrl.search.substr(1);
                    return privUrl;
                }
            }

            let proto: string | RegExpExecArray = UrlHelpers.protocolPattern.exec(rest);
            if (proto) {
                proto = proto[0];
                privUrl.protocol = proto.toLowerCase();
                rest = rest.substr(proto.length);
            }

            /*
            * figure out if it's got a host
            * user@server is *always* interpreted as a hostname, and url
            * resolution will treat //foo/bar as host=foo,path=bar because that's
            * how the browser resolves relative URLs.
            */
            let slashes: boolean = false;
            if (proto || rest.match(/^\/\/[^@/]+@[^@/]+/)) {
                slashes = rest.substr(0, 2) === "//";
                if (slashes && !(proto && proto === "javascript:")) {
                    rest = rest.substr(2);
                    privUrl.slashes = true;
                }
            }

            if (proto !== "javascript:" && (slashes || (proto && !UrlHelpers.slashedProtocol(proto as string)))) {

                /*
                * there's a hostname.
                * the first instance of /, ?, ;, or # ends the host.
                *
                * If there is an @ in the hostname, then non-host chars *are* allowed
                * to the left of the last @ sign, unless some host-ending character
                * comes *before* the @-sign.
                * URLs are obnoxious.
                *
                * ex:
                * http://a@b@c/ => user:a@b host:c
                * http://a@b?@c => user:a host:c path:/?@c
                */

                // find the first instance of any hostEndingChars
                let hostEnd = -1;
                for (const char of UrlHelpers.hostEndingChars) {
                    const hec = rest.indexOf(char);

                    if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
                        hostEnd = hec;
                    }
                }

                /*
                * at this point, either we have an explicit point where the
                * auth portion cannot go past, or the last @ char is the decider.
                */
                let atSign: number;
                if (hostEnd === -1) {
                    // atSign can be anywhere.
                    atSign = rest.lastIndexOf("@");
                } else {
                    /*
                    * atSign must be in auth portion.
                    * http://a@b/c@d => host:b auth:a path:/c@d
                    */
                    atSign = rest.lastIndexOf("@", hostEnd);
                }

                /*
                * Now we have a portion which is definitely the auth.
                * Pull that off.
                */
                let auth: string;
                if (atSign !== -1) {
                    auth = rest.slice(0, atSign);
                    rest = rest.slice(atSign + 1);
                    privUrl.auth = decodeURIComponent(auth);
                }

                // the host is the remaining to the left of the first non-host char
                hostEnd = -1;
                for (const char of UrlHelpers.nonHostChars) {
                    const hec = rest.indexOf(char);

                    if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
                        hostEnd = hec;
                    }
                }
                // if we still have not hit it, then the entire thing is a host.
                if (hostEnd === -1) {
                    hostEnd = rest.length;
                }

                privUrl.host = rest.slice(0, hostEnd);
                rest = rest.slice(hostEnd);

                privUrl = UrlParser.removePortFromUrl(privUrl);

                /*
                * if hostname begins with [ and ends with ]
                * assume that it's an IPv6 address.
                */
                const ipv6Hostname = privUrl.hostname[0] === "[" && privUrl.hostname[privUrl.hostname.length - 1] === "]";

                // validate a little.
                if (!ipv6Hostname) {
                    const hostparts = privUrl.hostname.split(/\./);
                    for (let i = 0; i < hostparts.length; i++) {
                        const part = hostparts[i];
                        if (part) {
                            if (!part.match(UrlHelpers.hostnamePartPattern)) {
                                let newpart: string = "";
                                for (let j = 0, k = part.length; j < k; j++) {
                                    if (part.charCodeAt(j) > 127) {
                                        /*
                                        * we replace non-ASCII char with a temporary placeholder
                                        * we need this to make sure size of hostname is not
                                        * broken by replacing non-ASCII by nothing
                                        */
                                        newpart += "x";
                                    } else {
                                        newpart += part[j];
                                    }
                                }
                                // we test again with ASCII char only
                                if (!newpart.match(UrlHelpers.hostnamePartPattern)) {
                                    const validParts = hostparts.slice(0, i);
                                    const notHost = hostparts.slice(i + 1);
                                    const bit = part.match(UrlHelpers.hostnamePartStart);
                                    if (bit) {
                                        validParts.push(bit[1]);
                                        notHost.unshift(bit[2]);
                                    }
                                    if (notHost.length) {
                                        rest = "/" + notHost.join(".") + rest;
                                    }
                                    privUrl.hostname = validParts.join(".");
                                    break;
                                }
                            }
                        }
                    }
                }

                if (privUrl.hostname.length > UrlHelpers.hostnameMaxLen) {
                    privUrl.hostname = "";
                } else {
                    // hostnames are always lower case.
                    privUrl.hostname = privUrl.hostname.toLowerCase();
                }

                if (!ipv6Hostname) {
                    /*
                    * IDNA Support: Returns a punycoded representation of "domain".
                    * It only converts parts of the domain name that
                    * have non-ASCII characters, i.e. it doesn't matter if
                    * you call it with a domain that already is ASCII-only.
                    */
                    const punycode = require("punycode");
                    privUrl.hostname = punycode.toASCII(privUrl.hostname);
                }

                privUrl.host = `${privUrl.hostname}:${privUrl.port}`;
                privUrl.href += privUrl.host;

                /*
                * strip [ and ] from the hostname
                * the host field still retains them, though
                */
                if (ipv6Hostname) {
                    privUrl.hostname = privUrl.hostname.substr(1, privUrl.hostname.length - 2);
                    if (rest[0] !== "/") {
                        rest = "/" + rest;
                    }
                }

                /*
                * now rest is set to the post-host stuff.
                * chop off any delim chars.
                */
                if (!UrlHelpers.unsafeProtocol((proto as string).toLowerCase())) {
                    /*
                    * First, make 100% sure that any "autoEscape" chars get
                    * escaped, even if encodeURIComponent doesn't think they
                    * need to be.
                    */
                    for (const str of UrlHelpers.autoEscape) {
                        if (rest.indexOf(str) !== -1) {
                            let esc = encodeURIComponent(str);
                            if (esc === str) {
                                esc = escape(str);
                            }
                            rest = rest.split(str).join(esc);
                        }
                    }
                }

                // chop off from the tail first.
                const hash = rest.indexOf("#");
                if (hash !== -1) {
                    // got a fragment string.
                    privUrl.hash = rest.substr(hash);
                    rest = rest.slice(0, hash);
                }
                const qm = rest.indexOf("?");
                if (qm !== -1) {
                    privUrl.search = rest.substr(qm);
                    privUrl.query = rest.substr(qm + 1);
                    rest = rest.slice(0, qm);
                }
                if (rest) {
                    privUrl.pathname = rest;
                }
                if (UrlHelpers.slashedProtocol((proto as string).toLowerCase()) && privUrl.hostname && !privUrl.pathname) {
                    privUrl.pathname = "/";
                }

                // to support http.request
                if (privUrl.pathname || privUrl.search) {
                    privUrl.path = privUrl.pathname + privUrl.search;
                }
            }
            privUrl.href = UrlParser.rebuildHrefFromValidated(privUrl);
            return privUrl;
        }
    }

    private static rebuildHrefFromValidated = (url: UrlWithStringQuery): string => {
        let auth = url.auth || "";
        if (auth) {
            auth = encodeURIComponent(auth);
            auth = auth.replace(/%3A/i, ":");
            auth += "@";
        }

        let protocol = url.protocol;
        let pathname = url.pathname;
        let hash = url.hash;
        let tempHost = "";
        let query = "";

        if (url.host) {
            tempHost = auth + url.host;
        } else if (url.hostname) {
            tempHost = auth + (url.hostname.indexOf(":") === -1 ? url.hostname : `[${url.hostname}]`);
            if (url.port) {
                tempHost += ":" + url.port;
            }
        }

        if (url.query && typeof url.query === "object" && Object.keys(url.query).length) {
            query = querystring.stringify(url.query);
        }

        let search = url.search || (query && ("?" + query)) || "";

        if (protocol && protocol.substr(-1) !== ":") { protocol += ":"; }

        /*
        * only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
        * unless they had them to begin with.
        */
        if (url.slashes || (!protocol || UrlHelpers.slashedProtocol(protocol)) && tempHost !== "") {
            tempHost = "//" + tempHost;
            if (pathname && pathname.charAt(0) !== "/") {
                pathname = "/" + pathname;
            }
        }

        if (hash && hash.charAt(0) !== "#") {
            hash = "#" + hash;
        }
        if (search && search.charAt(0) !== "?") {
            search = "?" + search;
        }

        pathname = pathname.replace(/[?#]/g, (match: string): string => {
            return encodeURIComponent(match);
        });
        search = search.replace("#", "%23");

        return protocol + tempHost + pathname + search + hash;
    }

    private static removePortFromUrl = (url: UrlWithStringQuery): UrlWithStringQuery => {
        let host = url.host;
        let port: string | RegExpExecArray = UrlHelpers.portPattern.exec(host);
        if (port) {
            port = port[0];
            if (port !== ":") {
                url.port = port.substr(1);
            }
            host = host.substr(0, host.length - port.length);
        }
        if (host) {
            url.hostname = host;
        }
        return url;
    }
}
