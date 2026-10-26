/* Runs backend/Code.gs against the fake Apps Script services. Usage: node dev/test-backend.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

require('./fake-gas.js');
require('./demo-data.js');
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8'), { filename: 'Code.gs' });

const F = globalThis.FAKE_GAS;
let passed = 0;
function call(action, p) {
  const out = JSON.parse(doPost({ postData: { contents: JSON.stringify(Object.assign({ action }, p || {})) } }).getContent());
  return out;
}
function ok(action, p) {
  const r = call(action, p);
  if (!r.ok) throw new Error(action + ' failed: ' + r.error);
  passed++;
  return r.data;
}
function fails(action, p, re) {
  const r = call(action, p);
  assert.strictEqual(r.ok, false, action + ' should fail');
  if (re) assert.match(r.error, re);
  passed++;
  return r.error;
}
function rowsOf(tab) { TABLE_CACHE_ = {}; return readTable_(tab).rows; }

// ---- setup ----
setup();
setup(); // must be safe to run twice
assert.deepStrictEqual(F.active.sheets.map(s => s.name).sort(), Object.keys(TABLES).sort());
assert.strictEqual(F.triggers.length, 2);
assert.strictEqual(rowsOf('Users').length, 3);
assert.strictEqual(rowsOf('Settings').length, DEFAULT_SETTINGS.length);
DEMO_DATA.assets.forEach(a => appendObj_('Assets', a));
F.props.TELEGRAM_BOT_TOKEN = 'fake-token';

// ---- PINs ----
fails('login', { userId: 'U01', pin: '0000' }, /No PIN set/);
const ut = readTable_('Users', true);
ut.rows.forEach(u => setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID] }));
fails('login', { userId: 'U01', pin: '9999' }, /Wrong PIN/);
const admin = ok('login', { userId: 'U01', pin: '0000' });
assert.ok(rowsOf('Users').every(u => !u.NewPIN && u.PinHash), 'NewPIN cleared and hashed');
const sup = ok('login', { userId: 'u02', pin: '1111' });
const tech = ok('login', { userId: 'U03', pin: '2222' });
assert.strictEqual(tech.user.role, 'technician');
fails('jobs', { token: admin.token + 'x' }, /log in again/);
fails('jobs', { token: 'garbage' }, /log in again/);
// lockout after 5 wrong PINs
for (let i = 0; i < 5; i++) call('login', { userId: 'U03', pin: '9999' });
fails('login', { userId: 'U03', pin: '2222' }, /Too many/);
F.cache = {};

// ---- Telegram linking ----
let link = ok('telegramLinkStart', { token: admin.token });
assert.match(link.url, /^https:\/\/t\.me\/tvs_horana_cmms_bot\?start=\d{6}$/);
const supLink = ok('telegramLinkStart', { token: sup.token });
assert.strictEqual(ok('telegramLinkCheck', { token: admin.token }).linked, false);
F.tgUpdates.push({ update_id: 10, message: { text: '/start ' + link.code, chat: { id: 111 } } });
F.tgUpdates.push({ update_id: 11, message: { text: '/start ' + supLink.code, chat: { id: 222 } } });
assert.strictEqual(ok('telegramLinkCheck', { token: admin.token }).linked, true);
assert.strictEqual(ok('telegramLinkCheck', { token: sup.token }).linked, true, 'supervisor linked by same batch');
const tl = readTable_('Users', true);
setCells_(tl, find_(tl.rows, 'UserID', 'U03'), { TelegramChatID: '333' });

// ---- meta / public asset ----
const meta = ok('meta');
assert.strictEqual(meta.assets.length, DEMO_DATA.assets.length);
assert.ok(meta.staff.length === 3 && !('PinHash' in meta.staff[0]));
const pub = ok('assetPublic', { id: 'en-ca-01' });
assert.strictEqual(pub.certStatus, 'valid');
assert.ok(!pub.staff, 'no staff data without token');
assert.strictEqual(ok('assetPublic', { id: 'ST-MM-01' }).certStatus, 'expiring');
assert.strictEqual(ok('assetPublic', { id: 'EN-PS-06' }).certStatus, 'expired');
const pubStaff = ok('assetPublic', { id: 'EN-CA-01', token: tech.token });
assert.match(pubStaff.staff.certUrl, /drive\.google\.com\/file\/d\//);
assert.strictEqual(ok('assetPublic', { id: 'PD-AL-02' }).children.length, 1);
fails('assetPublic', { id: 'NOPE' }, /not found/);

// ---- create request ----
fails('createRequest', { request: { name: 'A' } }, /department/);
fails('createRequest', { request: { name: 'A', department: 'Stores', priority: 'Urgent', category: 'Electrical', description: 'x' } }, /describe/);
fails('createRequest', { request: { name: 'A', department: 'Stores', priority: 'Urgent', category: 'Electrical', description: 'Light broken' } }, /location/);
F.telegram = []; F.mails = [];
const tinyJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
const req = ok('createRequest', { request: { name: 'Shantha', email: 'shantha@example.com', phone: '0771234567', department: 'Stores',
  assetId: 'EN-CA-01', category: 'Pneumatic', priority: 'Very Urgent', description: 'Compressor tripping, no air on line',
  productionStopped: true, photo: tinyJpeg } });
assert.match(req.id, /^WO-\d{4}-0001$/);
const req2 = ok('createRequest', { request: { name: 'Prasad', department: 'Testing', location: 'Testing runway', category: 'Electrical',
  priority: 'General', description: 'Need a light at the testing runway' } });
assert.match(req2.id, /-0002$/);
fails('createRequest', { website: 'spam', request: {} }, /Rejected/);
let wo = find_(rowsOf('WorkOrders'), 'WO_ID', req.id);
assert.strictEqual(wo.Location, 'Compressor room', 'location taken from asset');
assert.strictEqual(wo.RequesterPhone, '0771234567');
assert.ok(wo.RequestPhoto && wo.DowntimeStart instanceof Date);
assert.strictEqual(Math.round((wo.DueAt - wo.Created) / 3600000), 4);
assert.ok(F.telegram.some(t => t.method === 'sendMessage' && t.payload.chat_id === '111' && /New request/.test(t.payload.text)));
assert.ok(!F.telegram.some(t => t.payload.chat_id === '333'), 'technician not alerted for NEW');
assert.ok(F.mails.some(m => m.to === 'shantha@example.com'));

// ---- track ----
const tr = ok('track', { id: req.id });
assert.strictEqual(tr.status, 'NEW');
assert.strictEqual(tr.canConfirm, false);
assert.ok(!('RequesterEmail' in tr) && !('ConfirmKey' in tr));

// ---- workflow ----
const jobsOpen = ok('jobs', { token: tech.token, view: 'open' });
assert.strictEqual(jobsOpen.jobs[0].id, req.id, 'very urgent first');
fails('jobAction', { token: tech.token, id: req.id, op: 'assign', data: { assignee: 'U03' } }, /admin or supervisor/);
F.telegram = []; F.mails = [];
let j = ok('jobAction', { token: sup.token, id: req.id, op: 'assign', data: { assignee: 'U03', workType: 'Breakdown', note: 'Check the oil level first' } });
assert.strictEqual(j.Status, 'ASSIGNED');
assert.strictEqual(j.ApprovedBy, 'Hirushan');
assert.ok(F.telegram.some(t => t.payload.chat_id === '333' && /assigned to you/.test(t.payload.text)));
assert.ok(F.mails.some(m => /approved/.test(m.subject)));
assert.strictEqual(ok('jobs', { token: tech.token, view: 'mine' }).jobs.length, 1);
fails('jobAction', { token: tech.token, id: req.id, op: 'hold', data: {} }, /reason/);
j = ok('jobAction', { token: tech.token, id: req.id, op: 'start' });
assert.strictEqual(j.Status, 'IN_PROGRESS');
j = ok('jobAction', { token: tech.token, id: req.id, op: 'hold', data: { note: 'Waiting for pressure switch' } });
assert.strictEqual(j.Status, 'ON_HOLD');
j = ok('jobAction', { token: tech.token, id: req.id, op: 'start' });
fails('jobAction', { token: tech.token, id: req.id, op: 'complete', data: { actionTaken: 'x' } }, /describe the work/);
fails('jobAction', { token: tech.token, id: req.id, op: 'complete', data: { actionTaken: 'Replaced switch', doneBy: 'Contractor' } }, /contractor name/);
F.telegram = []; F.mails = [];
j = ok('jobAction', { token: tech.token, id: req.id, op: 'complete', data: { actionTaken: 'Replaced pressure switch', failureCause: 'Electrical fault',
  partsUsed: 'Pressure switch x1', labourHours: '1.5', cost: '12,500', doneBy: 'Internal', afterPhoto: tinyJpeg } });
assert.strictEqual(j.Status, 'DONE');
assert.strictEqual(j.Cost, 12500);
assert.ok(j.DowntimeMin >= 0 && j.DowntimeEnd);
assert.ok(j.afterPhotoUrl);
assert.ok(F.mails.some(m => /please confirm/.test(m.subject) && /k=[0-9a-f]{16}/.test(m.body)));
assert.ok(F.telegram.some(t => t.payload.chat_id === '111' && /completed/.test(t.payload.text)));
assert.ok(!F.telegram.some(t => t.payload.chat_id === '333'), 'completer not alerted about own job');
assert.ok(j.log.length >= 6);

// ---- requester confirm ----
const key = find_(rowsOf('WorkOrders'), 'WO_ID', req.id).ConfirmKey;
fails('confirm', { id: req.id, key: 'wrong', fixed: true }, /not valid/);
assert.strictEqual(ok('track', { id: req.id, key }).canConfirm, true);
fails('confirm', { id: req.id, key, fixed: false }, /still wrong/);
assert.strictEqual(ok('confirm', { id: req.id, key, fixed: false, feedback: 'Still trips after 1 hour' }).status, 'ASSIGNED');
ok('jobAction', { token: tech.token, id: req.id, op: 'complete', data: { actionTaken: 'Cleaned contacts and reset overload', doneBy: 'Internal' } });
assert.strictEqual(ok('confirm', { id: req.id, key, fixed: true, feedback: 'OK now' }).status, 'CLOSED');
fails('confirm', { id: req.id, key, fixed: true }, /not waiting/);

// ---- reject / reopen / note / edit ----
fails('jobAction', { token: admin.token, id: req2.id, op: 'reject', data: {} }, /reason/);
j = ok('jobAction', { token: admin.token, id: req2.id, op: 'reject', data: { note: 'Duplicate of MWRF102' } });
assert.strictEqual(j.Status, 'REJECTED');
j = ok('jobAction', { token: admin.token, id: req2.id, op: 'reopen', data: { note: 'Not a duplicate' } });
assert.strictEqual(j.Status, 'NEW');
j = ok('jobAction', { token: admin.token, id: req2.id, op: 'edit', data: { priority: 'Urgent', assetId: 'EN-PS-06' } });
assert.strictEqual(j.AssetName, 'Diesel generator 250 kVA');
ok('jobAction', { token: tech.token, id: req2.id, op: 'note', data: { note: 'Checked, need ladder' } });
fails('jobAction', { token: tech.token, id: req2.id, op: 'start' }, /assigned person|not allowed/);

// ---- overdue + auto close ----
const t1 = readTable_('WorkOrders', true);
setCells_(t1, find_(t1.rows, 'WO_ID', req2.id), { DueAt: new Date(Date.now() - 5 * 3600000) });
F.telegram = [];
const realFormat = Utilities.formatDate;
Utilities.formatDate = (d, tz, f) => f === 'H' ? '10' : realFormat(d, tz, f);
hourlyTick();
assert.ok(F.telegram.some(t => /OVERDUE/.test(t.payload.text)));
const n = F.telegram.length;
hourlyTick();
assert.strictEqual(F.telegram.length, n, 'overdue alert not repeated within 20 h');
Utilities.formatDate = realFormat;
assert.strictEqual(ok('jobs', { token: admin.token, view: 'overdue' }).jobs.length, 1);
ok('jobAction', { token: admin.token, id: req2.id, op: 'assign', data: { assignee: 'U03' } });
ok('jobAction', { token: tech.token, id: req2.id, op: 'complete', data: { actionTaken: 'Installed LED flood light', doneBy: 'Contractor', contractor: 'ABC Electricals' } });
const t2 = readTable_('WorkOrders', true);
setCells_(t2, find_(t2.rows, 'WO_ID', req2.id), { CompletedAt: new Date(Date.now() - 4 * 86400000) });
hourlyTick();
assert.strictEqual(find_(rowsOf('WorkOrders'), 'WO_ID', req2.id).Status, 'CLOSED');
F.telegram = [];
dailyDigest();

// ---- assets ----
fails('assetSave', { token: tech.token, asset: { AssetID: 'X-1', Name: 'x' } }, /permission/);
fails('assetSave', { token: admin.token, isNew: true, asset: { AssetID: 'EN-CA-01', Name: 'dup' } }, /already exists/);
fails('assetSave', { token: admin.token, asset: { AssetID: 'X-2', Name: 'y', ParentID: 'NOPE' } }, /Parent asset not found/);
ok('assetSave', { token: admin.token, isNew: true, asset: { AssetID: 'en-fh-01', Name: 'Electric fire pump 01', CertExpiry: '2027-06-27',
  CertFileId: 'https://drive.google.com/file/d/1QhUBlRyhgaNKp5wlzFB8VK-flLr0nJly/view?usp=drivesdk' } });
const fh = find_(rowsOf('Assets'), 'AssetID', 'EN-FH-01');
assert.strictEqual(fh.CertFileId, '1QhUBlRyhgaNKp5wlzFB8VK-flLr0nJly');
assert.ok(fh.CertExpiry instanceof Date);
ok('assetSave', { token: sup.token, asset: { AssetID: 'EN-FH-01', Name: 'Electric fire pump 01', Make: 'Solex' } });
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-FH-01').Make, 'Solex');
const list = ok('assetsList', { token: tech.token });
assert.ok(list.find(a => a.AssetID === 'EN-CA-01').openJobs === 0);

// ---- dashboard ----
const dash = ok('dashboard', { token: tech.token });
assert.strictEqual(dash.kpi.closedMonth, 2);
assert.strictEqual(dash.topAssets[0].id, 'EN-CA-01');
assert.deepStrictEqual(dash.certs.map(c => c.status).sort(), ['expired', 'expiring']);

// ---- import old Google Form ----
const old = new FAKE_GAS_Spreadsheet(OLD_REQUESTS_SHEET_ID);
const sh = old.insertSheet('Form Responses 1');
sh.data = [
  ['Timestamp', 'Requested by (Name)', 'Category of Request ', 'Request Description / Drawings ', 'Requirement ', 'Email Address',
    'Location of mainteance work ', 'Job ID ', 'Job completed Timestamp ', 'Job Status ', 'Job Approved by ', 'Email feeback '],
  ['3/1/2024', 'Shantha - Stores', 'Other', 'Replace broken pallets', 'General', 'x@example.com', 'CKD storage', 'MWRF001', '6/3/2024', 'Completed', 'Denuwan', 'sent'],
  ['3/15/2024', 'Chamara', 'General Maintenace', 'Weld beam', 'Very Urgent', 'x@example.com', 'Rectification', 'MWRF008', '22/3/2024', 'Completed', 'Denuwan', 'sent'],
  ['11/6/2024 9:12', 'Denuwan', 'General Maintenace', 'Test', 'General', 'x@example.com', 'Test', 'MWRF058', '', '', '', ''],
  ['8/1/2026 12:13:17', 'Nelantha', 'Electrical', 'Exhaust fan not working', 'Very Urgent', 'y@example.com', 'SKD Washroom', '', '', '', '', '']
];
F.others[OLD_REQUESTS_SHEET_ID] = old;
importOldRequests();
importOldRequests(); // second run must not duplicate
const imp = rowsOf('WorkOrders').filter(w => w.Source === 'Google Form import');
assert.strictEqual(imp.length, 3);
const m1 = find_(imp, 'WO_ID', 'MWRF001');
assert.strictEqual(m1.Status, 'CLOSED');
assert.strictEqual(Utilities.formatDate(m1.Created, TZ, 'yyyy-MM-dd'), '2024-03-01');
assert.strictEqual(Utilities.formatDate(m1.ClosedAt, TZ, 'yyyy-MM-dd'), '2024-03-06');
assert.strictEqual(Utilities.formatDate(find_(imp, 'WO_ID', 'MWRF008').ClosedAt, TZ, 'yyyy-MM-dd'), '2024-03-22');
assert.strictEqual(find_(imp, 'WO_ID', 'MWRF008').Category, 'General Maintenance');
const m9 = find_(imp, 'WO_ID', 'MWRF059');
assert.ok(m9 && m9.Status === 'NEW', 'request without Job ID imported as open MWRF059 (next after highest old ID)');

// ---- errors log ----
assert.strictEqual(rowsOf('Errors').length, 0, 'no unexpected server errors: ' + JSON.stringify(rowsOf('Errors')));
console.log('All backend tests passed (' + passed + ' API checks).');
