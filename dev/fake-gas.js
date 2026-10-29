/*
 * Minimal in-memory imitation of the Google Apps Script services used by backend/Code.gs.
 * DEV/TEST ONLY: lets us run the real backend in Node (dev/test-backend.js) and in the browser (?mock=1).
 */
(function (G) {
  'use strict';

  /* ---------- SHA-256 / HMAC (pure JS, sync) ---------- */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) { c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00); }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
    0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6,
    0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3,
    0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e,
    0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
    0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814,
    0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, m = bytes.slice();
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    var bits = l * 8;
    for (var s = 7; s >= 0; s--) m.push(s >= 4 ? 0 : (bits >>> (s * 8)) & 255);
    var W = new Array(64);
    for (var o = 0; o < m.length; o += 64) {
      for (var t = 0; t < 16; t++) W[t] = (m[o + 4 * t] << 24) | (m[o + 4 * t + 1] << 16) | (m[o + 4 * t + 2] << 8) | m[o + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = W[t - 15], y = W[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + W[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [H[0] + a, H[1] + b, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map(function (v) { return v | 0; });
    }
    var out = [];
    H.forEach(function (v) { out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
    return out;
  }
  function hmac(msgBytes, keyBytes) {
    if (keyBytes.length > 64) keyBytes = sha256(keyBytes);
    var k = keyBytes.slice(); while (k.length < 64) k.push(0);
    var ipad = k.map(function (b) { return b ^ 0x36; }), opad = k.map(function (b) { return b ^ 0x5c; });
    return sha256(opad.concat(sha256(ipad.concat(msgBytes))));
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
    }
    return s;
  }
  function unb64(str) {
    str = String(str).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
    var out = [];
    for (var i = 0; i < str.length; i += 4) {
      var n = (B64.indexOf(str[i]) << 18) | (B64.indexOf(str[i + 1]) << 12) | ((B64.indexOf(str[i + 2]) & 63) << 6) | (B64.indexOf(str[i + 3]) & 63);
      out.push((n >> 16) & 255);
      if (str[i + 2] !== undefined && str[i + 2] !== '') out.push((n >> 8) & 255);
      if (str[i + 3] !== undefined && str[i + 3] !== '') out.push(n & 255);
    }
    return out;
  }
  function bytesToStr(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }
  var toBytes = function (v) { return Array.isArray(v) ? v : utf8(String(v)); };

  /* ---------- Spreadsheet ---------- */
  function Range(sheet, r, c, nr, nc) { this.s = sheet; this.r = r; this.c = c; this.nr = nr || 1; this.nc = nc || 1; }
  Range.prototype.getValues = function () {
    var out = [];
    for (var i = 0; i < this.nr; i++) {
      var row = [];
      for (var j = 0; j < this.nc; j++) {
        var v = (this.s.data[this.r - 1 + i] || [])[this.c - 1 + j];
        row.push(v === undefined || v === null ? '' : v);
      }
      out.push(row);
    }
    return out;
  };
  Range.prototype.setValues = function (vals) {
    for (var i = 0; i < vals.length; i++) for (var j = 0; j < vals[i].length; j++) this.s._set(this.r + i, this.c + j, vals[i][j]);
    return this;
  };
  Range.prototype.setValue = function (v) { this.s._set(this.r, this.c, v); return this; };
  ['setNumberFormat', 'setFontWeight', 'setBackground', 'setFontColor'].forEach(function (m) { Range.prototype[m] = function () { return this; }; });

  function Sheet(name, data) { this.name = name; this.data = data || []; }
  Sheet.prototype._set = function (r, c, v) {
    while (this.data.length < r) this.data.push([]);
    var row = this.data[r - 1];
    while (row.length < c) row.push('');
    // Sheets turns a number-like text into a number unless the column is text; Code.gs sets text columns, so keep as is
    row[c - 1] = v;
  };
  Sheet.prototype.getName = function () { return this.name; };
  Sheet.prototype.getLastRow = function () {
    for (var i = this.data.length; i > 0; i--) if ((this.data[i - 1] || []).some(function (v) { return v !== '' && v !== null && v !== undefined; })) return i;
    return 0;
  };
  Sheet.prototype.getLastColumn = function () {
    var m = 0;
    this.data.forEach(function (r) { for (var j = r.length; j > m; j--) if (r[j - 1] !== '' && r[j - 1] !== undefined) { m = j; break; } });
    return m;
  };
  Sheet.prototype.getMaxRows = function () { return 1000; };
  Sheet.prototype.getRange = function (r, c, nr, nc) { return new Range(this, r, c, nr, nc); };
  Sheet.prototype.getDataRange = function () { return new Range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); };
  Sheet.prototype.appendRow = function (row) { this.getRange(this.getLastRow() + 1, 1, 1, row.length).setValues([row]); };
  Sheet.prototype.setFrozenRows = function () { return this; };
  Sheet.prototype.deleteRow = function (r) { this.data.splice(r - 1, 1); };

  function Spreadsheet(id) { this.id = id; this.sheets = [new Sheet('Sheet1')]; }
  Spreadsheet.prototype.getSheetByName = function (n) { return this.sheets.filter(function (s) { return s.name === n; })[0] || null; };
  Spreadsheet.prototype.insertSheet = function (n) { var s = new Sheet(n); this.sheets.push(s); return s; };
  Spreadsheet.prototype.deleteSheet = function (s) { this.sheets = this.sheets.filter(function (x) { return x !== s; }); };
  Spreadsheet.prototype.getSheets = function () { return this.sheets.slice(); };
  Spreadsheet.prototype.setSpreadsheetTimeZone = function () {};
  Spreadsheet.prototype.getId = function () { return this.id; };

  var FAKE = { active: new Spreadsheet('ACTIVE'), others: {}, props: {}, cache: {}, mails: [], telegram: [], tgUpdates: [], geminiCalls: [], gemini: null,
    files: {}, triggers: [], now: null };

  /* ---------- Date formatting (Asia/Colombo = UTC+05:30, no DST) ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function formatDate(d, tz, fmt) {
    var t = new Date(new Date(d).getTime() + 330 * 60000);
    var p2 = function (n) { return ('0' + n).slice(-2); };
    var map = { yyyy: t.getUTCFullYear(), MMM: MON[t.getUTCMonth()], MM: p2(t.getUTCMonth() + 1), dd: p2(t.getUTCDate()),
      HH: p2(t.getUTCHours()), mm: p2(t.getUTCMinutes()), ss: p2(t.getUTCSeconds()), H: t.getUTCHours(), u: (t.getUTCDay() || 7),
      EEE: DAY[t.getUTCDay()], yy: String(t.getUTCFullYear()).slice(2) };
    return fmt.replace(/'([^']*)'|yyyy|yy|EEE|MMM|MM|dd|HH|mm|ss|H|u/g, function (m, lit) { return lit !== undefined ? lit : map[m]; });
  }

  var Blob = function (bytes, type, name) { this.bytes = bytes; this.type = type; this.name = name; };
  Blob.prototype.getDataAsString = function () { return bytesToStr(this.bytes); };
  Blob.prototype.getBytes = function () { return this.bytes; };

  var nextFile = 1;
  function Folder(id, name) { this.id = id; this.name = name; }
  Folder.prototype.getId = function () { return this.id; };
  Folder.prototype.createFile = function (blob) {
    var id = 'FAKEFILE' + (nextFile++) + 'xxxxxxxxxxxxxxxx';
    FAKE.files[id] = blob;
    return { getId: function () { return id; }, setSharing: function () {} };
  };

  G.FAKE_GAS = FAKE;
  G.FAKE_GAS_Spreadsheet = Spreadsheet;
  G.SpreadsheetApp = {
    getActive: function () { return FAKE.active; },
    getActiveSpreadsheet: function () { return FAKE.active; },
    openById: function (id) { if (!FAKE.others[id]) throw new Error('No spreadsheet ' + id); return FAKE.others[id]; }
  };
  G.PropertiesService = { getScriptProperties: function () {
    return { getProperty: function (k) { return FAKE.props[k] === undefined ? null : FAKE.props[k]; },
      setProperty: function (k, v) { FAKE.props[k] = String(v); return this; },
      getProperties: function () { return Object.assign({}, FAKE.props); } };
  } };
  G.CacheService = { getScriptCache: function () {
    return { get: function (k) { var e = FAKE.cache[k]; return e && e.exp > Date.now() ? e.v : null; },
      put: function (k, v, sec) { FAKE.cache[k] = { v: String(v), exp: Date.now() + (sec || 600) * 1000 }; },
      remove: function (k) { delete FAKE.cache[k]; } };
  } };
  var fakeLock = function () { return { waitLock: function () {}, tryLock: function () { return true; }, releaseLock: function () {} }; };
  G.LockService = { getScriptLock: fakeLock, getUserLock: fakeLock };
  G.Utilities = {
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    getUuid: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
      });
    },
    computeDigest: function (alg, v) { return sha256(toBytes(v)); },
    computeHmacSha256Signature: function (v, key) { return hmac(toBytes(v), toBytes(key)); },
    base64EncodeWebSafe: function (v) { return b64(toBytes(v)).replace(/\+/g, '-').replace(/\//g, '_'); },
    base64DecodeWebSafe: function (s) { return unb64(s); },
    base64Decode: function (s) { return unb64(s); },
    base64Encode: function (v) { return b64(toBytes(v)); },
    newBlob: function (bytes, type, name) { return new Blob(bytes, type, name); },
    formatDate: formatDate,
    sleep: function () {}
  };
  G.MailApp = { sendEmail: function (o) { FAKE.mails.push(o); } };
  G.UrlFetchApp = { fetch: function (url, opt) {
    var method = url.split('/').pop();
    var payload = opt && opt.payload ? JSON.parse(opt.payload) : {};
    FAKE.telegram.push({ method: method, payload: payload });
    var body = { ok: true, result: true };
    if (method === 'getMe') body.result = { username: 'tvs_horana_cmms_bot' };
    if (method === 'getUpdates') {
      if (payload.offset) FAKE.tgUpdates = FAKE.tgUpdates.filter(function (u) { return u.update_id >= payload.offset; });
      body.result = FAKE.tgUpdates.slice();
    }
    if (method === 'getFile') body.result = { file_path: 'photos/x.jpg', file_size: 2000 };
    if (url.indexOf('generativelanguage') >= 0) {
      FAKE.geminiCalls.push(payload);
      var g = FAKE.gemini ? FAKE.gemini(payload) : { candidates: [{ content: { role: 'model', parts: [{ text: 'OK' }] } }] };
      return { getContentText: function () { return JSON.stringify(g); }, getResponseCode: function () { return g.__code || 200; } };
    }
    if (url.indexOf('/file/bot') >= 0) return { getBlob: function () { return new Blob([255, 216, 255, 224], 'image/jpeg', 'x.jpg'); } };
    return { getContentText: function () { return JSON.stringify(body); }, getResponseCode: function () { return 200; } };
  } };
  var folders = {};
  G.DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    createFolder: function (name) { var id = 'FAKEFOLDER' + Object.keys(folders).length; folders[id] = new Folder(id, name); return folders[id]; },
    getFolderById: function (id) { if (!folders[id]) throw new Error('No folder'); return folders[id]; }
  };
  G.ScriptApp = {
    getProjectTriggers: function () { return FAKE.triggers.slice(); },
    deleteTrigger: function (t) { FAKE.triggers = FAKE.triggers.filter(function (x) { return x !== t; }); },
    newTrigger: function (fn) {
      var b = { timeBased: function () { return b; }, everyHours: function () { return b; }, everyMinutes: function () { return b; }, everyDays: function () { return b; },
        atHour: function () { return b; }, nearMinute: function () { return b; }, inTimezone: function () { return b; },
        create: function () { var t = { getHandlerFunction: function () { return fn; } }; FAKE.triggers.push(t); return t; } };
      return b;
    }
  };
  G.ContentService = { MimeType: { JSON: 'JSON' }, createTextOutput: function (s) {
    return { content: s, setMimeType: function () { return this; }, getContent: function () { return this.content; } };
  } };
  G.Session = { getEffectiveUser: function () { return { getEmail: function () { return 'owner@example.com'; } }; } };
  G.Logger = { log: function () {} };
})(typeof globalThis !== 'undefined' ? globalThis : window);
