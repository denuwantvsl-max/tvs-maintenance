/* Bills / costs and the Telegram chat assistant (Gemini is faked: each test scripts the model's tool calls).
   Usage: node dev/test-bot.js */
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
const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

setup();
DEMO_DATA.assets.forEach(a => appendObj_('Assets', a));
const ut = readTable_('Users', true);
ut.rows.forEach(u => setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID], TelegramChatID: { U01: '111', U02: '222', U03: '333' }[u.UserID] }));
F.props.TELEGRAM_BOT_TOKEN = 'fake';
const admin = ok('login', { userId: 'U01', pin: '0000' });
const tech = ok('login', { userId: 'U03', pin: '2222' });
assert.ok(F.triggers.some(t => t.getHandlerFunction() === 'telegramPoll'), 'poll trigger installed');

// ---- bills in the app ----
fails('expenseSave', { token: tech.token, bill: { type: 'Lunch', amount: 100 } }, /choose the type/);
fails('expenseSave', { token: tech.token, bill: { type: 'Repair', amount: 0 } }, /amount/);
fails('expenseSave', { token: tech.token, bill: { type: 'Repair', amount: 10, assetId: 'NOPE' } }, /Machine not found/);
const b1 = ok('expenseSave', { token: tech.token, photo: tinyJpeg, bill: { type: 'spare parts', amount: '12,500', supplier: 'Abans', billNo: 'A-77',
  billDate: today, assetId: 'en-ca-01', description: 'Oil filter' } });
assert.match(b1.id, /^EX-\d{4}-001$/);
assert.strictEqual(b1.type, 'Spare parts');
fails('expenseSave', { token: tech.token, bill: { type: 'Repair', amount: 1, supplier: 'abans', billNo: 'a-77' } }, /already saved as EX-/);
ok('expenseSave', { token: admin.token, bill: { type: 'Tool purchase', amount: 30000, project: 'Line 2 tools', billDate: today } });
ok('expenseSave', { token: admin.token, bill: { type: 'Project', amount: 100000, project: 'Paint shop roof', billDate: '2020-01-05' } });
let ex = ok('expenses', { token: tech.token, from: today.slice(0, 8) + '01' });
assert.strictEqual(ex.count, 2);
assert.strictEqual(ex.total, 42500);
assert.deepStrictEqual(ex.byType.map(x => x.name), ['Tool purchase', 'Spare parts']);
assert.deepStrictEqual(ex.projects, ['Line 2 tools', 'Paint shop roof']);
assert.ok(ex.bills.find(b => b.id === b1.id).thumbUrl, 'bill photo kept');
assert.strictEqual(ok('expenses', { token: tech.token, project: 'paint' }).total, 100000);
fails('expenseSave', { token: admin.token, bill: { type: 'Repair', amount: 5, billDate: '2999-01-01' } }, /future/);
// edit: only managers or the person who entered it
const b2 = rowsOf('Expenses').find(r => r.Project === 'Line 2 tools').ExpenseID;
fails('expenseSave', { token: tech.token, bill: { id: b2, type: 'Repair', amount: 1 } }, /Only the admin/);
ok('expenseSave', { token: tech.token, bill: { id: b1.id, type: 'Spare parts', amount: 13000, supplier: 'Abans', billNo: 'A-77', billDate: today, assetId: 'EN-CA-01' } });
fails('expenseRemove', { token: tech.token, id: b2 }, /permission/);
ok('expenseRemove', { token: admin.token, id: b2 });
assert.strictEqual(ok('expenses', { token: tech.token, from: today.slice(0, 8) + '01' }).total, 13000);
assert.strictEqual(ok('dashboard', { token: admin.token }).kpi.billsMonth, 13000);

// ---- bot: helpers ----
let upd = 100;
const say = (chatId, text, extra) => {
  F.telegram = [];
  F.tgUpdates.push({ update_id: upd++, message: Object.assign({ chat: { id: chatId, type: 'private' }, text: text }, extra || {}) });
  telegramPoll();
  return F.telegram.filter(t => t.method === 'sendMessage').map(t => t.payload.text).join('\n');
};
// scripted model: a list of steps; each step = tool calls array or final text
let script = [];
F.gemini = () => {
  const step = script.shift();
  if (step === undefined) throw new Error('model called more times than scripted');
  if (typeof step === 'string') return { candidates: [{ content: { role: 'model', parts: [{ text: step }] } }] };
  return { candidates: [{ content: { role: 'model', parts: step.map(c => ({ functionCall: { name: c[0], args: c[1] } })) } }] };
};
const lastToolResults = () => {
  const c = F.geminiCalls[F.geminiCalls.length - 1].contents;
  return c[c.length - 1].parts.map(p => p.functionResponse && p.functionResponse.response.result);
};

// unknown chat
assert.match(say(999, 'hello'), /not connected/);
// link code still works through the poll
const link = ok('telegramLinkStart', { token: tech.token });
const lt = readTable_('Users', true);
setCells_(lt, find_(lt.rows, 'UserID', 'U03'), { TelegramChatID: '' });
assert.match(say(333, '/start ' + link.code), /Hello Gayan/);
assert.strictEqual(find_(rowsOf('Users'), 'UserID', 'U03').TelegramChatID, '333');
// no AI key: basic commands
assert.match(say(333, '/help'), /maintenance assistant/);
assert.match(say(333, '/pm'), /PM due now/);
assert.match(say(333, 'what is overdue?'), /not switched on/);
assert.strictEqual(F.geminiCalls.length, 0);
// same update is never answered twice
F.telegram = []; telegramPoll(); assert.strictEqual(F.telegram.filter(t => t.method === 'sendMessage').length, 0);
passed += 6;

// ---- bot with AI ----
F.props.GEMINI_API_KEY = 'fake-key';
script = [[['summary', {}]], 'All good.'];
assert.strictEqual(say(111, 'how are things?'), 'All good.');
assert.ok(lastToolResults()[0].kpi, 'summary returns KPIs');
assert.match(F.geminiCalls[0].systemInstruction.parts[0].text, /Gayan/);
assert.ok(F.geminiCalls[0].tools[0].functionDeclarations.length >= 15);

// bill photo → model reads it → asks → user says yes → saved with the photo
script = ['Supplier: Singer, LKR 8,750. Save as Repair for EN-PS-06?'];
const reply1 = say(222, '', { photo: [{ file_id: 'small' }, { file_id: 'big' }], caption: 'generator bill' });
assert.match(reply1, /Save as Repair/);
const firstUser = F.geminiCalls[F.geminiCalls.length - 1].contents.slice(-1)[0];
assert.ok(firstUser.parts[0].inlineData && firstUser.parts[0].inlineData.mimeType === 'image/jpeg', 'photo sent to the model');
script = [[['add_bill', { type: 'Repair', amount: 8750, supplier: 'Singer', bill_no: 'S-1', bill_date: today, asset_id: 'EN-PS-06', attach_last_file: true }]], 'Saved.'];
assert.strictEqual(say(222, 'yes'), 'Saved.');
const hist = F.geminiCalls[F.geminiCalls.length - 2].contents;
assert.ok(hist.length >= 3 && /Save as Repair/.test(JSON.stringify(hist)), 'conversation remembered');
const saved = rowsOf('Expenses').find(r => r.Supplier === 'Singer');
assert.ok(saved && saved.Source === 'Telegram' && saved.EnteredBy === 'Hirushan' && /^FAKEFILE/.test(saved.BillFile));

// job actions through the bot (assign by name, complete with cost)
const job = ok('createRequest', { request: { name: 'Nimal', department: 'Stores', location: 'Stores', category: 'Electrical', priority: 'Urgent', description: 'Light not working' } });
script = [[['job_action', { id: job.id, op: 'assign', assignee: 'gayan' }]], 'Assigned.'];
say(111, 'give ' + job.id + ' to Gayan');
assert.strictEqual(find_(rowsOf('WorkOrders'), 'WO_ID', job.id).AssignedTo, 'U03');
script = [[['job_action', { id: job.id, op: 'complete', action_taken: 'Replaced the tube', cost: 1500 }]], 'Done.'];
say(333, job.id + ' done, replaced tube, 1500');
const w = find_(rowsOf('WorkOrders'), 'WO_ID', job.id);
assert.strictEqual(w.Status, 'DONE'); assert.strictEqual(w.Cost, 1500); assert.strictEqual(w.DoneBy, 'Internal');
// technician cannot close – the error goes back to the model, not a crash
script = [[['job_action', { id: job.id, op: 'close' }]], 'You cannot close jobs.'];
assert.strictEqual(say(333, 'close it'), 'You cannot close jobs.');
assert.match(lastToolResults()[0].error, /Only the admin or supervisor/);

// PM: set a date, then mark done (all OK) – checklist with readings must go to the app
const items = [
  ['GEN-ELEC', 'Electrical panel check', 'TVS/QMS/CL/30', 1, '', 'Panel clean and dry', '', 'check', '', '', '', 'Monthly', ''],
  ['GEN-ELEC', 'Electrical panel check', 'TVS/QMS/CL/30', 2, '', 'Indicator lamps working', '', 'check', '', '', '', 'Monthly', ''],
  ['CL-29', 'Compressor', 'TVS/QMS/CL/29', 1, '', 'Discharge pressure', '', 'number', 'bar', 6, 10, 'Daily', '']
];
items.forEach(r => appendObj_('ChecklistItems', Object.fromEntries(TABLES.ChecklistItems.map((k, i) => [k, r[i] === undefined ? '' : r[i]]))));
const tA = ok('pmSave', { token: admin.token, task: { AssetID: 'EN-PS-06', Title: 'Panel monthly check', TemplateID: 'GEN-ELEC', Scope: 'Monthly', FreqUnit: 'Month', FreqValue: 1 } }).id;
const tB = ok('pmSave', { token: admin.token, task: { AssetID: 'EN-CA-01', Title: 'Compressor daily', TemplateID: 'CL-29', Scope: 'Daily', FreqUnit: 'Day', FreqValue: 1, NextDue: today } }).id;
script = [[['update_pm_task', { task_id: tA, next_due: today, assigned_to: 'Gayan' }]], 'Set.'];
say(222, 'panel check due today, give to gayan');
assert.deepStrictEqual(lastToolResults()[0].assigned, 'Gayan');
script = [[['update_pm_task', { task_id: tA, next_due: '2026-13-40' }]], 'Bad date.'];
say(222, 'x'); assert.match(lastToolResults()[0].error, /Date looks wrong/);
script = [[['pm_done', { task_id: tA }]], 'Were all OK?'];
say(333, 'panel check done'); assert.match(lastToolResults()[0].error, /all checklist items OK/);
script = [[['pm_done', { task_id: tA, not_ok_items: ['indicator lamps'] }]], 'Saved, job raised.'];
say(333, 'panel check done, indicator lamps not ok');
const pd = lastToolResults()[0];
assert.strictEqual(pd.ok, 1); assert.strictEqual(pd.notOk, 1); assert.match(pd.newJob, /^WO-/);
script = [[['pm_done', { task_id: tB, all_ok: true }]], 'Use the app.'];
say(333, 'compressor daily ok'); assert.match(lastToolResults()[0].error, /needs readings/);
script = [[['pm_done', { task_id: tA, not_ok_items: ['roof leak'] }]], '?'];
say(333, 'x'); assert.match(lastToolResults()[0].error, /not on the checklist/);

// meter + machine photo + permissions
script = [[['set_meter', { asset_id: 'ST-MM-01', value: 1250 }]], 'OK'];
say(333, 'forklift 1250 h');
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'ST-MM-01').CurrentMeter, 1250);
script = [[['set_meter', { asset_id: 'ST-MM-01', value: 1000 }]], 'lower'];
say(333, 'forklift 1000'); assert.match(lastToolResults()[0].error, /lower than the last/);
script = ['Which machine?'];
say(222, '', { photo: [{ file_id: 'm1' }] });
script = [[['save_machine', { id: 'EN-CA-01', use_last_photo: true, location: 'Compressor room 2' }]], 'Photo set.'];
say(222, 'EN-CA-01');
const ca = find_(rowsOf('Assets'), 'AssetID', 'EN-CA-01');
assert.ok(/^FAKEFILE/.test(ca.Photo)); assert.strictEqual(ca.Location, 'Compressor room 2');
assert.strictEqual(ca.Make, 'Atlas Copco', 'other fields kept');
assert.strictEqual(Utilities.formatDate(ca.CertExpiry, TZ, 'yyyy-MM-dd'), '2027-06-27', 'certificate date kept');
script = [[['save_machine', { id: 'EN-NEW-01', name: 'x' }]], '?'];
say(222, 'x'); assert.match(lastToolResults()[0].error, /To add it as a new machine/);
script = [[['save_machine', { id: 'EN-NEW-01', is_new: true, name: 'Water pump 2', area: 'Utilities' }]], 'Added.'];
say(222, 'add'); assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-NEW-01').Name, 'Water pump 2');
script = [[['remove_machine', { id: 'EN-NEW-01' }]], 'no'];
say(333, 'remove it'); assert.match(lastToolResults()[0].error, /permission/);
script = [[['find_machines', { query: 'forklift' }], ['cost_report', { from: today.slice(0, 8) + '01' }]], 'Report.'];
say(111, 'forklift and costs');
const rr = lastToolResults();
assert.strictEqual(rr[0].machines[0].id, 'ST-MM-01');
assert.strictEqual(rr[1].total, 13000 + 8750);
// create a job from chat
script = [[['create_job', { description: 'Roller door stuck at gate 2', location: 'Gate 2', priority: 'Urgent', category: 'Mechanical' }]], 'Raised.'];
say(333, 'gate 2 roller door stuck, urgent');
assert.match(lastToolResults()[0].id, /^WO-/);

// AI quota / errors are explained, not crashed
F.gemini = () => ({ __code: 429, error: { message: 'quota' } });
assert.match(say(111, 'hi'), /free AI limit/);
F.gemini = () => ({ __code: 500, error: { message: 'boom' } });
assert.match(say(111, 'hi'), /assistant had a problem/);
assert.ok(rowsOf('BotLog').length > 10, 'conversations logged');
// /reset clears memory
say(111, '/reset');
F.gemini = null; F.geminiCalls = [];
say(111, 'hello');
assert.strictEqual(F.geminiCalls[0].contents.length, 1, 'memory cleared');
passed += 30;

console.log('All bot / cost tests passed (' + passed + ' checks).');
