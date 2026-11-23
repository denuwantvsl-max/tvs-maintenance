/* Phase 2d tests: operator daily checks (forklifts, delivery vehicles) without login, leader status page, 11:00 email.
   Usage: node dev/test-opcheck.js */
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
const check = (cond, msg) => { assert.ok(cond, msg); passed++; };

setup();
DEMO_DATA.assets.forEach(a => appendObj_('Assets', a));
appendObj_('Assets', { AssetID: 'ST-MM-02', Name: 'Electric forklift 2.5 t (EP, 410 Ah)', Area: 'Material Handling', Location: 'Stores', Category: 'Forklift', Specs: 'Type: Battery electric', Criticality: 'B', Status: 'Active' });
appendObj_('Assets', { AssetID: 'ST-MM-03', Name: 'Electric forklift 2.5 t (EP, 280 Ah)', Area: 'Material Handling', Location: 'Stores', Category: 'Forklift', Criticality: 'B', Status: 'Active' });
for (let i = 1; i <= 7; i++) appendObj_('Assets', { AssetID: 'ST-LP-0' + i, Name: 'Lorry lifting platform - vehicle LP-82' + i, Area: 'Delivery Vehicles', Location: 'Vehicle LP-82' + i, Category: 'Vehicle lifting platform', Criticality: 'B', Status: 'Active' });
// the live sheet already has daily forklift tasks (T0003–T0005 with the old CL-34) and weekly CL-35 tasks on the lorries
appendObj_('PMTasks', { TaskID: 'T0003', AssetID: 'ST-MM-01', Title: 'Forklift daily pre-start check (operator)', TemplateID: 'CL-34', Scope: 'Daily', FreqUnit: 'Day', FreqValue: 1, Active: 'Yes', DoneBy: 'Internal' });
appendObj_('PMTasks', { TaskID: 'T0010', AssetID: 'ST-LP-01', Title: 'Delivery vehicle weekly inspection', TemplateID: 'CL-35', Scope: 'All', FreqUnit: 'Week', FreqValue: 1, Active: 'Yes', DoneBy: 'Internal' });
const at0 = readTable_('Assets', true);
setCells_(at0, find_(at0.rows, 'AssetID', 'ST-MM-01'), { MeterUnit: 'h', CurrentMeter: 4410, MeterUpdated: new Date(Date.now() - 86400000) });
const ut = readTable_('Users', true);
ut.rows.forEach(u => setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID], TelegramChatID: { U01: '111', U02: '222', U03: '333' }[u.UserID] }));
F.props.TELEGRAM_BOT_TOKEN = 'fake';

// ---- first use sets everything up ----
fails('opCheck', { id: 'EN-CA-01' }, /No daily check/);
check(F.props.OPCHECK_READY === '1', 'ready flag');
const st = Object.fromEntries(rowsOf('Settings').map(r => [r.Key, r.Value]));
check(st.FORKLIFT_LEADER_EMAIL === 'shantha.s@tvslanka.lk' && st.DELIVERY_LEADER_EMAIL === 'arunaw@tvsauto.lk' && st.OPCHECK_BY_HOUR === '11', 'settings');
const tasks = rowsOf('PMTasks');
const tOf = id => tasks.filter(t => t.AssetID === id && /^CL-3[45]-/.test(t.TemplateID));
check(tOf('ST-MM-01').length === 1 && tOf('ST-MM-01')[0].TaskID === 'T0003' && tOf('ST-MM-01')[0].TemplateID === 'CL-34-D', 'diesel forklift reuses T0003');
check(tOf('ST-MM-02')[0].TemplateID === 'CL-34-E' && tOf('ST-MM-03')[0].TemplateID === 'CL-34-E', 'electric forklifts');
check([1, 2, 3, 4, 5, 6, 7].every(i => tOf('ST-LP-0' + i).length === 1 && tOf('ST-LP-0' + i)[0].TemplateID === 'CL-35-D'), 'lorry daily tasks');
check(find_(tasks, 'TaskID', 'T0010').TemplateID === 'CL-35' && find_(tasks, 'TaskID', 'T0010').FreqUnit === 'Week', 'weekly CL-35 kept');
const items = rowsOf('ChecklistItems');
check(items.some(r => r.TemplateID === 'CL-35-D' && /Hook condition/.test(r.Text) && r.Safety === 'Yes'), 'hook check on the lifting platform');
check(items.filter(r => r.TemplateID === 'CL-34-E').every(r => r.TextSi), 'Sinhala text everywhere');
ensureOpChecks_(); // second run changes nothing
check(rowsOf('PMTasks').length === tasks.length && rowsOf('ChecklistItems').length === items.length, 'idempotent');

// ---- operator page ----
const form = ok('opCheck', { id: 'st-mm-02' });
check(form.group.id === 'forklift' && form.template.id === 'CL-34-E' && form.template.items.length === 21, 'electric form');
check(form.template.items.some(i => i.safety) && form.template.items.every(i => i.textSi), 'safety flags + Sinhala');
const all = (tpl, v) => Object.fromEntries(tpl.items.map(i => [i.no, v]));

fails('opCheckSave', { data: { assetId: 'ST-MM-02', name: 'K', results: all(form.template, 'ok') } }, /your name/);
fails('opCheckSave', { data: { assetId: 'ST-MM-02', name: 'Kamal', results: {} } }, /answer all/);
fails('opCheckSave', { website: 'x', data: { assetId: 'ST-MM-02', name: 'Kamal', results: all(form.template, 'ok') } }, /Rejected/);
const res1 = Object.assign(all(form.template, 'ok'), { 15: 'nok' });
fails('opCheckSave', { data: { assetId: 'ST-MM-02', name: 'Kamal', results: res1 } }, /what is wrong/);

F.mails.length = 0; F.telegram.length = 0;
const r1 = ok('opCheckSave', { data: { assetId: 'ST-MM-02', name: '  Kamal   Perera ', results: res1, notes: { 15: 'Pedal goes to the floor' } } });
check(r1.notOk === 1 && r1.woId && r1.unsafe.length === 1, 'brake = safety problem + job');
const wo = find_(rowsOf('WorkOrders'), 'WO_ID', r1.woId);
check(wo.Priority === 'Urgent' && wo.WorkType === 'Safety' && /Kamal Perera/.test(wo.RequesterName) && /Pedal goes to the floor/.test(wo.Description), 'job details');
check(F.mails.length === 1 && F.mails[0].to === 'shantha.s@tvslanka.lk' && /SAFETY/.test(F.mails[0].subject) && /Kamal Perera/.test(F.mails[0].body), 'Shantha emailed');
check(F.telegram.length >= 2, 'team Telegram alert');
const rec = rowsOf('PMRecords').find(r => r.RecordID === r1.recordId);
check(rec.DoneBy === 'Kamal Perera' && JSON.parse(rec.Results).notes['15'] === 'Pedal goes to the floor', 'record keeps name + note');
const t2 = find_(rowsOf('PMTasks'), 'AssetID', 'ST-MM-02');
check(dateNum_(t2.NextDue) > Date.now() && isOpWorkday_(new Date(dateNum_(t2.NextDue)), settings_()), 'next due = next working day');

// diesel forklift: hour meter optional, wild values refused
const fd = ok('opCheck', { id: 'ST-MM-01' });
check(fd.template.id === 'CL-34-D' && fd.asset.meterUnit === 'h', 'diesel form with hour meter');
fails('opCheckSave', { data: { assetId: 'ST-MM-01', name: 'Sunil', results: all(fd.template, 'ok'), meter: 44100 } }, /too high/);
fails('opCheckSave', { data: { assetId: 'ST-MM-01', name: 'Sunil', results: all(fd.template, 'ok'), meter: 4400 } }, /lower/);
F.mails.length = 0;
const r2 = ok('opCheckSave', { data: { assetId: 'ST-MM-01', name: 'Sunil', results: all(fd.template, 'ok'), meter: 4416 } });
check(!r2.woId && r2.notOk === 0 && F.mails.length === 0, 'all OK: no job, no email');
check(Number(find_(rowsOf('Assets'), 'AssetID', 'ST-MM-01').CurrentMeter) === 4416, 'hour meter updated');
check(ok('opCheck', { id: 'ST-MM-01' }).today.length === 1 && ok('opCheck', { id: 'ST-MM-02' }).names.indexOf('Sunil') >= 0, 'today + names');

// lorry: hook problem (not a staff login needed)
const fl = ok('opCheck', { id: 'ST-LP-03' });
const hook = fl.template.items.find(i => /Hook/.test(i.text));
F.mails.length = 0;
const r3 = ok('opCheckSave', { data: { assetId: 'ST-LP-03', name: 'Nimal', results: Object.assign(all(fl.template, 'ok'), { [hook.no]: 'nok' }), notes: { [hook.no]: 'Latch spring broken' } } });
check(r3.unsafe.length === 1 && F.mails[0].to === 'arunaw@tvsauto.lk' && /Latch spring broken/.test(F.mails[0].body), 'Aruna emailed about the hook');

// ---- leader status page ----
fails('opStatus', { g: 'nope' }, /Unknown group/);
const sf = ok('opStatus', { g: 'forklift' });
check(sf.machines.length === 3 && sf.days.length === 7, 'forklift page shape');
check(sf.machines[0].week.slice(0, 6).every(w => ['before', 'off'].indexOf(w.state) >= 0), 'days before go-live are not counted as missed');
const m2 = sf.machines.find(m => m.id === 'ST-MM-02');
check(m2.today.state === 'problem' && m2.today.records[0].by === 'Kamal Perera' && /Pedal goes to the floor/.test(m2.today.records[0].problems[0]), 'problem shown with name');
check(m2.openJobs.length === 1 && m2.openJobs[0].id === r1.woId, 'open job listed');
check(sf.machines.find(m => m.id === 'ST-MM-01').today.state === 'ok', 'ok shown');
const s3 = sf.machines.find(m => m.id === 'ST-MM-03').today.state;
check(['waiting', 'missing', 'off'].indexOf(s3) >= 0, 'not done shown');
const sd = ok('opStatus', { g: 'delivery' });
check(sd.machines.length === 7 && sd.machines.find(m => m.id === 'ST-LP-03').today.state === 'problem', 'delivery page');

// ---- 11:00 email (once a day, only missing machines, working days only) ----
F.mails.length = 0;
opCheckTick_(10);
check(F.mails.length === 0, 'nothing before 11');
opCheckTick_(11);
const work = isOpWorkday_(new Date(), settings_());
if (work) {
  const fm = F.mails.find(m => m.to === 'shantha.s@tvslanka.lk');
  check(fm && /ST-MM-03/.test(fm.body) && !/ST-MM-01/.test(fm.body.split('Done so far')[0]), 'Shantha: only the missing forklift');
  const dm = F.mails.find(m => m.to === 'arunaw@tvsauto.lk');
  check(dm && /ST-LP-01/.test(dm.body) && !/ST-LP-03 /.test(dm.body), 'Aruna: missing lorries');
} else {
  check(F.mails.length === 0, 'no email on a day off');
}
const n = F.mails.length;
opCheckTick_(12);
check(F.mails.length === n, 'only once a day');

// ---- the staff app still works for normal PM, and the QR page links to the check ----
check(ok('assetPublic', { id: 'ST-LP-03' }).opCheck === 'delivery' && !ok('assetPublic', { id: 'EN-CA-01' }).opCheck, 'QR page flag');
check(opDigestLines_().length >= 0, 'digest lines run');

console.log('All operator daily check tests passed (' + passed + ' checks).');
