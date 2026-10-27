/* Phase 2 tests: PM tasks, checklists, records, meters, asset photo/remove, team digest, certificate alerts.
   Usage: node dev/test-pm.js */
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
const call = (action, p) => JSON.parse(doPost({ postData: { contents: JSON.stringify(Object.assign({ action }, p || {})) } }).getContent());
const ok = (action, p) => { const r = call(action, p); if (!r.ok) throw new Error(action + ' failed: ' + r.error); passed++; return r.data; };
const fails = (action, p, re) => { const r = call(action, p); assert.strictEqual(r.ok, false, action + ' should fail'); if (re) assert.match(r.error, re); passed++; return r.error; };
const rowsOf = tab => { TABLE_CACHE_ = {}; return readTable_(tab).rows; };
const tinyJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';

setup();
DEMO_DATA.assets.forEach(a => appendObj_('Assets', a));
const ut = readTable_('Users', true);
ut.rows.forEach(u => setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID], TelegramChatID: { U01: '111', U02: '222', U03: '333' }[u.UserID] }));
F.props.TELEGRAM_BOT_TOKEN = 'fake';
const admin = ok('login', { userId: 'U01', pin: '0000' });
const tech = ok('login', { userId: 'U03', pin: '2222' });
assert.ok(F.active.getSheetByName('PMTasks') && F.active.getSheetByName('ChecklistItems') && F.active.getSheetByName('PMRecords'));

// ---- checklist templates ----
const items = [
  ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 1, 'Daily', 'Compressor hour reading', '', 'number', 'h', '', '', 'Daily', ''],
  ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 2, 'Daily', 'Check oil level', '', 'check', '', '', '', 'Daily', ''],
  ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 3, 'Daily', 'Discharge pressure', '', 'number', 'bar', 6, 10, 'Daily', ''],
  ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 4, 'Monthly', 'Inspect dryer condenser', '', 'check', '', '', '', 'Monthly', ''],
  ['CL-32', 'Assembly line tools', 'TVS/QMS/CL/32', 1, '', 'Tool condition', '', 'check', '', '', '', 'Monthly', 'Yes'],
  ['CL-32', 'Assembly line tools', 'TVS/QMS/CL/32', 2, '', 'Free of noise', '', 'check', '', '', '', 'Monthly', 'Yes']
];
const it = readTable_('ChecklistItems', true);
items.forEach(r => appendObj_('ChecklistItems', Object.fromEntries(TABLES.ChecklistItems.map((k, i) => [k, r[i] === undefined ? '' : r[i]]))));
const tpls = ok('templates', { token: admin.token });
assert.deepStrictEqual(tpls.map(t => t.id + ':' + t.count + ':' + t.perChild), ['CL-29:4:false', 'CL-32:2:true']);

// ---- PM tasks ----
fails('pmSave', { token: tech.token, task: { AssetID: 'EN-CA-01', Title: 'x' } }, /permission/);
fails('pmSave', { token: admin.token, task: { AssetID: 'NOPE', Title: 'x' } }, /Machine not found/);
fails('pmSave', { token: admin.token, task: { AssetID: 'EN-CA-01', Title: 'x', TemplateID: 'CL-99' } }, /Checklist not found/);
const at0 = readTable_('Assets', true);
setCells_(at0, find_(at0.rows, 'AssetID', 'EN-CA-01'), { MeterUnit: 'h', CurrentMeter: 1000 });
const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
const t1 = ok('pmSave', { token: admin.token, task: { AssetID: 'EN-CA-01', Title: 'Compressor daily check', TemplateID: 'CL-29', Scope: 'Daily',
  FreqUnit: 'Day', FreqValue: 1, NextDue: today, AssignedTo: 'U03' } });
assert.strictEqual(t1.id, 'T0001');
const t2 = ok('pmSave', { token: admin.token, task: { AssetID: 'EN-CA-01', Title: 'Compressor service (contractor)', FreqUnit: 'Month', FreqValue: 3,
  MeterInterval: 2000, NextDue: '2020-01-01', DoneBy: 'Swedish Trading Co.' } });
const t3 = ok('pmSave', { token: admin.token, task: { AssetID: 'PD-AL-02', Title: 'Tool check', TemplateID: 'CL-32', Scope: 'Monthly', FreqUnit: 'Month', FreqValue: 1 } });
let list = ok('pmList', { token: tech.token, view: 'due' });
assert.deepStrictEqual(list.tasks.map(x => x.id + ':' + x.state), ['T0002:overdue', 'T0001:today']);
assert.ok(list.tasks[0].daysLate > 100);
assert.strictEqual(ok('pmList', { token: tech.token, view: 'unscheduled' }).tasks[0].id, 'T0003');
assert.strictEqual(ok('pmList', { token: tech.token, view: 'mine' }).tasks.length, 1);

// task detail: daily scope hides monthly item; per-child lists tools
const d1 = ok('pmTask', { token: tech.token, id: 'T0001' });
assert.deepStrictEqual(d1.template.items.map(i => i.no), ['1', '2', '3']);
assert.strictEqual(d1.template.docNo, 'TVS/QMS/CL/29');
const d3 = ok('pmTask', { token: tech.token, id: 'T0003' });
assert.deepStrictEqual(d3.children.map(c => c.id), ['QIP08-001']);

// ---- complete checklist ----
fails('pmComplete', { token: tech.token, data: { taskId: 'T0001', results: { 1: 1100 } } }, /answer all items \(2/);
fails('pmComplete', { token: tech.token, data: { taskId: 'T0001', meter: 900, results: { 1: 900, 2: 'ok', 3: 8 } } }, /lower than the last/);
F.telegram = [];
const r1 = ok('pmComplete', { token: tech.token, data: { taskId: 'T0001', meter: 1012, results: { 1: 1012, 2: 'nok', 3: 12 }, remarks: 'Oil low', photo: tinyJpeg } });
assert.match(r1.recordId, /^PM-\d{6}-001$/);
assert.strictEqual(r1.notOk, 2);
assert.match(r1.woId, /^WO-\d{4}-0001$/);
const wo = find_(rowsOf('WorkOrders'), 'WO_ID', r1.woId);
assert.strictEqual(wo.Priority, 'Urgent', 'criticality A → Urgent');
assert.match(wo.Description, /Check oil level/);
assert.match(wo.Description, /Discharge pressure = 12 bar \(out of range\)/);
assert.strictEqual(wo.Source, 'PM');
assert.ok(F.telegram.some(t => t.payload.chat_id === '333' && /Not OK in PM check/.test(t.payload.text)), 'technician gets PM alert');
const task1 = find_(rowsOf('PMTasks'), 'TaskID', 'T0001');
assert.strictEqual(Utilities.formatDate(task1.NextDue, TZ, 'yyyy-MM-dd'), Utilities.formatDate(new Date(Date.now() + 86400000), TZ, 'yyyy-MM-dd'));
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-CA-01').CurrentMeter, 1012);
const rec = ok('pmRecord', { token: admin.token, id: r1.recordId });
assert.strictEqual(rec.sheet.doc, 'TVS/QMS/CL/29');
assert.strictEqual(rec.sheet.values['2'], 'nok');
assert.ok(rec.photoUrl);

// contractor service: needs remarks or contractor and meter (task has meter interval)
fails('pmComplete', { token: tech.token, data: { taskId: 'T0002' } }, /what was done/);
fails('pmComplete', { token: tech.token, data: { taskId: 'T0002', contractor: 'Swedish Trading' } }, /hour meter/);
const r2 = ok('pmComplete', { token: tech.token, data: { taskId: 'T0002', contractor: 'Swedish Trading', meter: 1015, cost: '45,000', remarks: 'Oil + filters' } });
assert.strictEqual(r2.woId, '');
const task2 = find_(rowsOf('PMTasks'), 'TaskID', 'T0002');
assert.strictEqual(task2.LastMeter, 1015);
assert.ok(dateNum_(task2.NextDue) > Date.now() + 80 * 86400000, 'next due ~3 months later');
// hour meter reaching the interval makes it due again
const at1 = readTable_('Assets', true);
setCells_(at1, find_(at1.rows, 'AssetID', 'EN-CA-01'), { CurrentMeter: 3020 });
const s2 = ok('pmTask', { token: tech.token, id: 'T0002' });
assert.strictEqual(s2.state, 'today');
assert.ok(s2.meterLeft <= 0);

// per-child: all tools must be answered
fails('pmComplete', { token: tech.token, data: { taskId: 'T0003', results: { 'QIP08-001|1': 'ok' } } }, /1 not answered/);
const r3 = ok('pmComplete', { token: tech.token, data: { taskId: 'T0003', results: { 'QIP08-001|1': 'ok', 'QIP08-001|2': 'na' } } });
assert.strictEqual(r3.notOk, 0);
assert.strictEqual(ok('pmRecords', { token: tech.token, assetId: 'PD-AL-02' }).length, 1);

// ---- asset photo / remove ----
ok('assetSave', { token: admin.token, asset: { AssetID: 'EN-CA-01', Name: 'Air compressor' }, photo: tinyJpeg });
assert.ok(ok('assetPublic', { id: 'EN-CA-01' }).photoUrl);
assert.ok(ok('assetsList', { token: tech.token }).find(a => a.AssetID === 'EN-CA-01').photoUrl);
fails('assetRemove', { token: tech.token, id: 'EN-CA-01' }, /permission/);
fails('assetRemove', { token: admin.token, id: 'PD-AL-02' }, /parts first/);
assert.strictEqual(ok('assetRemove', { token: admin.token, id: 'EN-CA-01', reason: 'Replaced' }).mode, 'disposed');
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-CA-01').Status, 'Disposed');
assert.ok(rowsOf('PMTasks').filter(t => t.AssetID === 'EN-CA-01').every(t => t.Active === 'No'), 'tasks deactivated');
ok('assetSave', { token: admin.token, isNew: true, asset: { AssetID: 'TMP-01', Name: 'Temporary' } });
const before = rowsOf('Assets').length;
assert.strictEqual(ok('assetRemove', { token: admin.token, id: 'TMP-01' }).mode, 'deleted');
assert.strictEqual(rowsOf('Assets').length, before - 1);

// ---- daily digest: every team member gets their own summary; certificate alerts once ----
F.telegram = [];
const realFormat = Utilities.formatDate;
Utilities.formatDate = (d, tz, f) => f === 'u' ? '1' : realFormat(d, tz, f);
dailyDigest();
const msgs = F.telegram.filter(t => t.method === 'sendMessage');
assert.deepStrictEqual(msgs.map(m => m.payload.chat_id).sort(), ['111', '222', '333']);
const techMsg = msgs.find(m => m.payload.chat_id === '333').payload.text;
assert.match(techMsg, /Your jobs|PM checks due|No PM checks due/);
const adminMsg = msgs.find(m => m.payload.chat_id === '111').payload.text;
assert.match(adminMsg, /Inspection certificates/);
assert.match(adminMsg, /EXPIRED EN-PS-06/);
assert.match(adminMsg, /ST-MM-01/);
F.telegram = [];
dailyDigest();
assert.ok(!F.telegram.find(m => m.payload.chat_id === '111').payload.text.includes('Inspection certificates'), 'cert alert not repeated');
Utilities.formatDate = realFormat;

// ---- dashboard PM numbers ----
const dash = ok('dashboard', { token: admin.token });
assert.strictEqual(dash.kpi.pmDoneMonth, 3);
assert.ok(dash.kpi.pmCompliance !== null);

assert.strictEqual(rowsOf('Errors').length, 0, 'no server errors: ' + JSON.stringify(rowsOf('Errors')));
console.log('All PM tests passed (' + passed + ' API checks).');
