/* General MRM (monthly plant meeting): seed, meetings, action follow-up, carried count, soft delete, log.
   Usage: node dev/test-mrm.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

require('./fake-gas.js');
require('./demo-data.js');
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8'), { filename: 'Code.gs' });

let passed = 0;
const call = (action, p) => JSON.parse(doPost({ postData: { contents: JSON.stringify(Object.assign({ action }, p || {})) } }).getContent());
const ok = (action, p) => { const r = call(action, p); if (!r.ok) throw new Error(action + ' failed: ' + r.error); passed++; return r.data; };
const fails = (action, p, re) => { const r = call(action, p); assert.strictEqual(r.ok, false, action + ' should fail'); if (re) assert.match(r.error, re); passed++; return r.error; };
const rowsOf = tab => { TABLE_CACHE_ = {}; return readTable_(tab).rows; };
const day = n => Utilities.formatDate(new Date(Date.now() + n * 86400000), TZ, 'yyyy-MM-dd');

setup();

// ---- first use seeds the saved monthly MRM data (public, no token) ----
let h = ok('mrmHome');
assert.strictEqual(h.meetings.length, 6);
assert.strictEqual(h.meetings[0].date, '2025-09-29', 'newest meeting first');
assert.match(h.meetings[0].momUrl, /^https:\/\/drive\.google\.com\/file\/d\/1_3P6WSuxFkJCgMkNHSMNT9le7jL5dVh9\/view$/);
assert.strictEqual(h.actions.length, 13);
assert.strictEqual(h.stats.open, 13);
assert.strictEqual(h.stats.overdue, 13, 'July 2026 targets are past');
assert.strictEqual(h.stats.critical, 5);
assert.strictEqual(h.stats.chronic, 4);
assert.strictEqual(h.actions[0].severity, 'critical', 'critical first');
ok('mrmHome');
assert.strictEqual(rowsOf('MrmActions').filter(r => r.ActionID).length, 13, 'seed runs once');

// ---- a meeting: review two actions, add a new one ----
const water = h.actions.find(a => a.item === 'Water line connection');
const pallet = h.actions.find(a => a.item === 'Pallet jack repair');
fails('mrmMeetingSave', { m: { title: 'x' } }, /meeting date/);
const r = ok('mrmMeetingSave', {
  m: { date: day(0), chair: 'Denuwan Chamara', attendees: 'Denuwan, Hirushan, Malindu', agenda: '1. Open actions', minutes: 'Discussed water line.', decisions: 'Get 2 quotes', nextDate: day(30) },
  reviews: [{ id: water.id, target: day(14), note: 'Contractor quote received' }, { id: pallet.id, status: 'Done', note: 'Repaired' }],
  newActions: [{ item: 'Fix canteen light', owner: 'Gayan', target: day(7), severity: 'low' }, { item: '   ' }]
});
assert.strictEqual(r.id, 'GM-0007');
assert.strictEqual(r.reviewed, 2);
assert.strictEqual(r.added, 1);
h = ok('mrmHome');
assert.strictEqual(h.meetings[0].id, 'GM-0007');
assert.strictEqual(h.meetings[0].status, 'Draft');
assert.strictEqual(h.meetings[0].nextDate, day(30));
const w2 = h.actions.find(a => a.id === water.id);
assert.strictEqual(w2.carried, 5, 'moving the date out counts one more cycle');
assert.strictEqual(w2.overdue, false);
assert.strictEqual(w2.progress, 'Contractor quote received');
assert.match(w2.history, /\(GM-0007\): target 2026-07-22 → .* — Contractor quote received$/);
const p2 = h.actions.find(a => a.id === pallet.id);
assert.strictEqual(p2.status, 'Done');
assert.strictEqual(p2.open, false);
assert.strictEqual(p2.doneAt, day(0));
const canteen = h.actions.find(a => a.item === 'Fix canteen light');
assert.strictEqual(canteen.id, 'MA-0014');
assert.strictEqual(canteen.meetingId, 'GM-0007');
assert.strictEqual(canteen.severity, 'low');
assert.strictEqual(h.stats.open, 13);
assert.strictEqual(h.stats.done, 1);
assert.strictEqual(h.actions[h.actions.length - 1].id, pallet.id, 'closed items last');

// ---- edit the meeting: finalise, add the MOM link ----
ok('mrmMeetingSave', { m: { id: 'GM-0007', date: day(0), status: 'Final', minutes: 'Final text', momUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view?usp=sharing' } });
h = ok('mrmHome');
assert.strictEqual(h.meetings[0].status, 'Final');
assert.strictEqual(h.meetings[0].momUrl, 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view');
assert.strictEqual(h.meetings.length, 7);

// ---- single action changes ----
ok('mrmActionSave', { a: { id: canteen.id, target: day(3) } });
assert.strictEqual(ok('mrmHome').actions.find(a => a.id === canteen.id).carried, 0, 'an earlier date is not a carry');
ok('mrmActionSave', { a: { item: 'Paint the fire assembly point', owner: 'Hirushan', severity: 'high' } });
fails('mrmActionSave', { a: { id: 'MA-9999', status: 'Done' } }, /not found/);
fails('mrmActionSave', { a: { item: '' } }, /Write what/);
ok('mrmActionSave', { a: { id: canteen.id, status: 'Dropped', note: 'Done by admin' } });
ok('mrmActionSave', { a: { id: canteen.id, remove: true } });
h = ok('mrmHome');
assert.ok(!h.actions.find(a => a.id === canteen.id), 'removed action hidden');
assert.ok(rowsOf('MrmActions').find(a => a.ActionID === canteen.id), 'but still in the sheet');
ok('mrmMeetingSave', { m: { id: 'GM-0001', date: '2025-05-17', remove: true } });
assert.strictEqual(ok('mrmHome').meetings.length, 6);
assert.ok(rowsOf('MrmLog').length >= 8, 'every change logged');
fails('mrmMeetingSave', { m: { id: 'GM-0099', date: day(0) } }, /not found/);

console.log('test-mrm: ' + passed + ' checks passed');
