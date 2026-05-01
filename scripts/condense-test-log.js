#!/usr/bin/env node
/*
 * Condense Speech SDK test.log output.
 *
 * The SDK emits one event per line in pipe-delimited form, e.g.:
 *   2026-04-30T17:17:03.485Z | RecognitionTriggeredEvent | privName: ... | privEventId: ... | ...
 *
 * Most of that is duplication of the leading timestamp / event name plus opaque
 * GUIDs. The interesting bits live deep inside `privMessage` (path, size, body).
 * This script strips the noise and surfaces what actually matters.
 *
 * Usage:
 *   node scripts/condense-test-log.js [input] [options]
 *
 * Options:
 *   --keep-audio        Don't collapse runs of audio chunks (default: collapse)
 *   --drop-audio        Drop audio chunks entirely
 *   --keep-ids          Keep full GUIDs instead of 6-char prefixes
 *   --no-strip          Skip the legacy striplines.cmd pre-filter
 *   --inline-json       Inline JSON bodies on the header line (legacy mode).
 *                       Default: emit pretty-printed JSON on subsequent indented
 *                       lines so VS Code can fold each block individually.
 *   --body-max=N        Truncate inline bodies to N chars (only with --inline-json,
 *                       default: 300, 0 = full)
 *   -o <file>           Write to file instead of stdout
 *
 * Example:
 *   node scripts/condense-test-log.js test.log -o test.short.log
 */

const fs = require("fs");
const path = require("path");

// ---------- argv ----------
const argv = process.argv.slice(2);
let inputPath = null;
let outputPath = null;
let collapseAudio = true;
let dropAudio = false;
let shortenIds = true;
let stripNoise = true;
let prettyJson = true;
let bodyMax = 300;

for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--keep-audio") collapseAudio = false;
    else if (a === "--drop-audio") dropAudio = true;
    else if (a === "--keep-ids") shortenIds = false;
    else if (a === "--no-strip") stripNoise = false;
    else if (a === "--inline-json") prettyJson = false;
    else if (a.startsWith("--body-max=")) bodyMax = parseInt(a.slice(11), 10) || 0;
    else if (a === "-o") outputPath = argv[++i];
    else if (a === "-h" || a === "--help") {
        console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 25).join("\n"));
        process.exit(0);
    } else if (!inputPath) inputPath = a;
}
if (!inputPath) {
    console.error("usage: node condense-test-log.js <input.log> [options]");
    process.exit(2);
}

const raw = fs.readFileSync(inputPath, "utf8");
const out = [];

// ---------- helpers ----------
const TS_RE = /^(\d{4}-\d{2}-\d{2}T)?(\d{2}:\d{2}:\d{2}\.\d{3})Z?$/;
const FULL_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const GUID_RE = /^[0-9a-fA-F]{32}$|^[0-9a-fA-F-]{36}$/;

const shortId = (s) => (shortenIds && s && GUID_RE.test(s) ? s.slice(0, 6) : s);
const shortTs = (s) => (FULL_TS_RE.test(s) ? s.slice(11, 23) : s);

// Fields that are always pure noise and can be dropped without losing signal.
const NOISE_FIELDS = new Set([
    "privName",          // duplicates the event name
    "privEventId",       // unique GUID per event, no cross-reference value
    "privEventTime",     // duplicates leading timestamp
    "privEventType",     // always 1
    "privMetadata",      // always {}
    "privNetworkSentTime",     // duplicates leading timestamp (within ms)
    "privNetworkReceivedTime", // ditto
]);

// Fields whose values are GUIDs we want shortened but kept.
const ID_FIELDS = new Set([
    "privRequestId", "privSessionId", "privConnectionId",
    "privAudioSourceId", "privAudioNodeId",
    "privAuthFetchEventid", "privAuthFetchEventId",
]);

function parseFields(rest) {
    // Split on " | " but only at the top level (privMessage may contain pipes? Not in observed data).
    // The SDK formatter always uses " | " between fields, and JSON values are single-line,
    // so a plain split is safe.
    const parts = rest.split(" | ");
    const fields = [];
    for (const p of parts) {
        const idx = p.indexOf(": ");
        if (idx === -1) { fields.push([p, ""]); continue; }
        fields.push([p.slice(0, idx), p.slice(idx + 2)]);
    }
    return fields;
}

function formatMessage(msgJson) {
    // privMessage is a JSON blob. Pull out path/size/headers/body.
    let m;
    try { m = JSON.parse(msgJson); } catch { return null; }
    const path = m.privPath || (m.privHeaders && (m.privHeaders.Path || m.privHeaders.path)) || "?";
    const size = m.privSize != null ? m.privSize : "?";
    const reqId = m.privRequestId
        || (m.privHeaders && (m.privHeaders["X-RequestId"] || m.privHeaders["x-requestid"]))
        || null;
    const isAudio = path === "audio";
    // body is captured two ways:
    //   inlineBody: short single-line preview for --inline-json mode
    //   prettyBody: fully expanded JSON for the default (foldable) mode
    let inlineBody = "";
    let prettyBody = null;
    if (!isAudio) {
        let b = m.privBody;
        if (b && typeof b === "object" && Object.keys(b).length === 0) b = null;
        if (b != null) {
            // If body is a JSON-encoded string, parse it so we can pretty-print.
            let parsed = b;
            if (typeof b === "string") {
                try { parsed = JSON.parse(b); } catch { /* leave as raw string */ }
            }
            const flat = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
            inlineBody = bodyMax > 0 && flat.length > bodyMax ? flat.slice(0, bodyMax) + "..." : flat;
            prettyBody = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
        }
    }
    return { path, size, reqId, isAudio, inlineBody, prettyBody };
}

function condenseEventLine(ts, eventName, fields, indent) {
    // Connection messages: the interesting payload is privMessage.
    const msgField = fields.find(([k]) => k === "privMessage");
    if (msgField) {
        const m = formatMessage(msgField[1]);
        if (m) {
            const dir = eventName.includes("Sent") ? ">>" : eventName.includes("Received") ? "<<" : "~~";
            const reqStr = m.reqId ? ` req=${shortId(m.reqId)}` : "";
            const sizeStr = String(m.size).padStart(5, " ");
            const pathStr = m.path.padEnd(20, " ");
            const header = `${ts} ${dir} ${pathStr} ${sizeStr}B${reqStr}`;
            if (prettyJson && m.prettyBody) {
                // Emit body on subsequent lines, indented deeper than the header
                // so VS Code's indentation-based folding can collapse each block.
                // The header sits at column 0 (`indent` is empty), so a small
                // body indent is enough; this keeps JSON the only indented
                // content in the file so `Fold All` only collapses JSON blocks.
                const bodyIndent = indent + "    ";
                const bodyLines = m.prettyBody.split("\n").map((l) => bodyIndent + l).join("\n");
                return header + "\n" + bodyLines;
            }
            return header + (m.inlineBody ? "  " + m.inlineBody : "");
        }
    }
    // Generic event: keep only ID-like fields (shortened) and any uri/extra payload.
    const keep = [];
    for (const [k, v] of fields) {
        if (NOISE_FIELDS.has(k)) continue;
        if (!v) continue;
        if (ID_FIELDS.has(k)) keep.push(`${k.replace(/^priv/, "").replace(/Id$/, "")}=${shortId(v)}`);
        else keep.push(`${k.replace(/^priv/, "")}=${v}`);
    }
    const evt = eventName.replace(/Event$/, "");
    return `${ts} ${evt}${keep.length ? "  " + keep.join(" ") : ""}`;
}

// ---------- main loop ----------
const lines = raw.split(/\r?\n/);
const audioRun = { count: 0, totalBytes: 0, dir: null, firstTs: null, lastTs: null };

// Pre-filter: drop lines that the legacy striplines.cmd would have removed.
// (jest console source-location markers, stack traces, bracket-only lines,
// bare timestamp lines, and lines without any space.)
const STRIP_RE = [
    /  console\./,                                              // jest "  console.log" markers
    /^      at /,                                               // stack frames
    /\]  \[/,                                                   // jest log header tails
    /^    \]$/,                                                 // closing bracket lines
    /^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*$/,        // bare timestamp lines
];
function shouldStrip(line) {
    if (!stripNoise) return false;
    if (line === "" || !/ /.test(line)) return true;            // mirror final `findstr /c:" "`
    for (const re of STRIP_RE) if (re.test(line)) return true;
    return false;
}

function flushAudio() {
    if (audioRun.count === 0) return;
    if (!dropAudio) {
        const span = audioRun.firstTs === audioRun.lastTs
            ? audioRun.firstTs
            : `${audioRun.firstTs}..${audioRun.lastTs}`;
        // Event lines emit at column 0 so the JSON bodies are the only indented
        // content in the file. That way VS Code's `Fold All` (Ctrl+K Ctrl+0)
        // collapses just the JSON blocks, not the outer jest console block.
        out.push(`${span} ${audioRun.dir} audio  x${audioRun.count}  ${audioRun.totalBytes}B total`);
    }
    audioRun.count = 0; audioRun.totalBytes = 0; audioRun.dir = null;
    audioRun.firstTs = null; audioRun.lastTs = null;
}

for (const line of lines) {
    if (shouldStrip(line)) continue;

    // Preserve indentation only to detect line type — we re-emit at column 0
    // so JSON bodies are the file's only indented (foldable) content.
    const indentMatch = line.match(/^(\s*)(.*)$/);
    const body = indentMatch[2];

    if (!body) { flushAudio(); out.push(line); continue; }

    // Try to parse as an event line: "<ts> | <EventName> | ...".
    const firstPipe = body.indexOf(" | ");
    const ts = firstPipe > 0 ? body.slice(0, firstPipe) : "";
    if (!FULL_TS_RE.test(ts)) {
        flushAudio();
        // Non-event jest output (test case banners, FAIL line, etc.): dedent so
        // it doesn't form fold regions. Keep the text content intact.
        out.push(body);
        continue;
    }

    const afterTs = body.slice(firstPipe + 3);
    const secondPipe = afterTs.indexOf(" | ");
    const eventName = secondPipe > 0 ? afterTs.slice(0, secondPipe) : afterTs;
    const rest = secondPipe > 0 ? afterTs.slice(secondPipe + 3) : "";
    const fields = rest ? parseFields(rest) : [];

    const shortTimestamp = shortTs(ts);

    // Detect audio chunks for collapsing.
    const msgField = fields.find(([k]) => k === "privMessage");
    const isConnMsg = eventName === "ConnectionMessageSentEvent" || eventName === "ConnectionMessageReceivedEvent";
    if (isConnMsg && msgField) {
        const m = formatMessage(msgField[1]);
        if (m && m.isAudio) {
            if (dropAudio) continue;
            if (collapseAudio) {
                const dir = eventName.includes("Sent") ? ">>" : "<<";
                if (audioRun.count > 0 && audioRun.dir !== dir) flushAudio();
                if (audioRun.count === 0) {
                    audioRun.dir = dir;
                    audioRun.firstTs = shortTimestamp;
                }
                audioRun.count++;
                audioRun.totalBytes += Number(m.size) || 0;
                audioRun.lastTs = shortTimestamp;
                continue;
            }
        }
    }

    flushAudio();
    // Event header at column 0; pretty JSON body (if any) is indented inside
    // condenseEventLine and is the only indented content in the file.
    out.push(condenseEventLine(shortTimestamp, eventName, fields, ""));
}
flushAudio();

const result = out.join("\n");
if (outputPath) {
    fs.writeFileSync(outputPath, result);
    const inSize = fs.statSync(inputPath).size;
    const outSize = Buffer.byteLength(result, "utf8");
    const pct = ((1 - outSize / inSize) * 100).toFixed(1);
    console.error(`${path.basename(inputPath)} ${inSize}B  →  ${path.basename(outputPath)} ${outSize}B  (-${pct}%)`);
} else {
    process.stdout.write(result);
}
