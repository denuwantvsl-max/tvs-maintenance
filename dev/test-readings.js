/* Daily readings (generator, compressor, water meter), diesel refills, alerts, photo clean-up.
   Usage: node dev/test-readings.js */
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
const day = n => Utilities.formatDate(new Date(Date.now() + n * 86400000), TZ, 'yyyy-MM-dd');
const pt = id => ok('readingsHome', { token: admin.token }).points.filter(x => x.id === id)[0];

setup();
DEMO_DATA.assets.forEach(a => appendObj_('Assets', a));
if (!find_(readTable_('Assets', true).rows, 'AssetID', 'EN-PS-06')) appendObj_('Assets', { AssetID: 'EN-PS-06', Name: 'Diesel generator 250 kVA', Area: 'Power Supply', Status: 'Active' });
const ut = readTable_('Users', true);
ut.rows.forEach(u => setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID], TelegramChatID: { U01: '111', U02: '222', U03: '333' }[u.UserID] }));
F.props.TELEGRAM_BOT_TOKEN = 'fake';
F.props.GEMINI_API_KEY = 'fake';
const admin = ok('login', { userId: 'U01', pin: '0000' });
const tech = ok('login', { userId: 'U03', pin: '2222' });

// ---- first use: tabs, settings, water meter machine, seeded generator history ----
let home = ok('readingsHome', { token: tech.token });
assert.ok(F.active.getSheetByName('Readings') && F.active.getSheetByName('FuelLog'));
assert.ok(find_(rowsOf('Assets'), 'AssetID', 'EN-FM-WM-01'), 'water meter machine added');
assert.strictEqual(find_(rowsOf('Settings'), 'Key', 'GEN_TANK_LITRES').Value, '440');
assert.deepStrictEqual(home.points.map(x => x.id), ['GEN', 'COMP', 'WATER']);
let gen = home.points[0];
assert.strictEqual(gen.last.values.Hours, 1282.42);
assert.strictEqual(gen.stats.lphRefills, 15.9, 'old refill records give about 16 L/h');
assert.ok(gen.alerts.some(a => a.tone === 'bad' && /no reading for/.test(a.title)));
ok('readingsHome', { token: tech.token });
assert.strictEqual(rowsOf('Readings').filter(r => r.ReadingID).length, 1, 'seeded only once');
fails('readingsHome', {}, /log in/);

// ---- AI reading of a photo ----
F.gemini = () => ({ candidates: [{ content: { role: 'model', parts: [{ text: '{"Hours": 1286.75, "Starts": 813, "FuelPct": null, "confidence": "high", "seen": "Engine Run Time"}' }] } }] });
let ai = ok('readingAi', { token: tech.token, point: 'GEN', photo: tinyJpeg });
assert.deepStrictEqual(ai.values, { Hours: 1286.75, Starts: 813 });
assert.strictEqual(ai.confidence, 'high');
const lastCall = F.geminiCalls[F.geminiCalls.length - 1];
assert.ok(lastCall.contents[0].parts[0].inlineData && /DSE 6120/.test(lastCall.contents[0].parts[1].text));
F.gemini = () => ({ candidates: [{ content: { role: 'model', parts: [{ text: 'not json' }] } }] });
assert.deepStrictEqual(ok('readingAi', { token: tech.token, point: 'WATER', photo: tinyJpeg }).values, {});
fails('readingAi', { token: tech.token, point: 'XYZ', photo: tinyJpeg }, /Unknown reading point/);
fails('readingAi', { token: tech.token, point: 'GEN', photo: 'hello' }, /format/);

// ---- saving: checks ----
fails('readingSave', { token: tech.token, point: 'GEN', values: { Starts: 813 }, photos: [tinyJpeg] }, /Running hours is needed/);
fails('readingSave', { token: tech.token, point: 'GEN', values: { Hours: 1286.75 } }, /photo/);
fails('readingSave', { token: tech.token, point: 'GEN', values: { Hours: 1286.75, FuelPct: 140 }, photos: [tinyJpeg] }, /Fuel level/);
fails('readingSave', { token: tech.token, point: 'GEN', values: { Hours: 1200 }, photos: [tinyJpeg] }, /LOWER/);
let r = ok('readingSave', { token: tech.token, point: 'GEN', values: { Hours: '1286.75', Starts: 813, FuelPct: 64 }, ai: { Hours: 1286.75, Starts: 813 }, photos: [tinyJpeg, tinyJpeg] });
assert.strictEqual(r.since.Hours, 4.33);
let row = find_(rowsOf('Readings'), 'ReadingID', r.id);
assert.strictEqual(row.Corrected, 'No');
assert.strictEqual(row.By, 'Gayan');
assert.strictEqual(list_(row.Photos).length, 2);
assert.strictEqual(row.PhotoUntil, day(30), 'photo kept 30 days');
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-PS-06').CurrentMeter, 1286.75, 'hour meter of the machine updated');
gen = pt('GEN');
assert.ok(gen.doneToday);
assert.ok(!gen.alerts.some(a => /no reading/.test(a.title)));
assert.strictEqual(gen.stats.fuelLitres, 282);

// corrected by the technician -> photo kept for good; fuel low -> managers alerted
F.telegram = [];
r = ok('readingSave', { token: tech.token, point: 'GEN', values: { Hours: 1286.8, FuelPct: 18 }, ai: { Hours: 1286.3, FuelPct: 18 }, photos: [tinyJpeg] });
row = find_(rowsOf('Readings'), 'ReadingID', r.id);
assert.strictEqual(row.Corrected, 'Yes');
assert.strictEqual(row.PhotoUntil, 'keep');
gen = pt('GEN');
assert.ok(gen.alerts.some(a => /fuel low: 18%/.test(a.title) && /79 L of 440 L/.test(a.title)));
assert.ok(F.telegram.some(t => /fuel low/i.test(t.payload.text) && t.payload.chat_id === '111'), 'admin told on Telegram');
assert.ok(!F.telegram.some(t => t.payload.chat_id === '333'), 'not sent back to the technician');
assert.strictEqual(gen.stats.lph, undefined, 'L/h needs 2 h of running');

// lower reading saved with a note -> kept, flagged
r = ok('readingSave', { token: admin.token, point: 'GEN', values: { Hours: 10 }, note: 'Controller replaced, meter reset', photos: [tinyJpeg] });
assert.match(find_(rowsOf('Readings'), 'ReadingID', r.id).Note, /Controller replaced.*LOWER/);
assert.ok(pt('GEN').alerts.some(a => /went backwards/.test(a.title)));

// ---- diesel use from fuel % + refills ----
const addRow = (o) => appendObj_('Readings', Object.assign({ ReadingID: 'RD-9' + (rowsOf('Readings').length + 100), Created: new Date() }, o));
const resetReadings = () => { const sh = F.active.getSheetByName('Readings'); sh.data = sh.data.slice(0, 1); TABLE_CACHE_ = {}; };
resetReadings();
addRow({ Date: day(-6), Time: '09:00', Point: 'GEN', AssetID: 'EN-PS-06', Hours: 1300, FuelPct: 80 });
const fl = readTable_('FuelLog', true);
appendObj_('FuelLog', { RefillID: 'FL-0100', Date: day(-3), AssetID: 'EN-PS-06', Litres: 100, Hours: 1305, Created: new Date(Date.now() - 3 * 86400000) });
addRow({ Date: day(-1), Time: '09:00', Point: 'GEN', AssetID: 'EN-PS-06', Hours: 1310, FuelPct: 60 });
gen = pt('GEN');
// used = (80-60)% of 440 = 88 L + 100 L fed = 188 L over 10 h
assert.strictEqual(gen.stats.lph, 18.8);
assert.ok(!gen.alerts.some(a => /diesel use/.test(a.title)));
addRow({ Date: day(0), Time: '08:00', Point: 'GEN', AssetID: 'EN-PS-06', Hours: 1311, FuelPct: 20 });
gen = pt('GEN');
assert.ok(gen.alerts.some(a => /fuel fell about 176 L/.test(a.title) && /Only 1 h of running/.test(a.detail)), 'fuel drop not explained by running hours');
// a fuel-only reading (fuel screen photo, no hours): hours taken from the reading before it
addRow({ Date: day(0), Time: '23:00', Point: 'GEN', AssetID: 'EN-PS-06', FuelPct: 10 });
gen = pt('GEN');
assert.strictEqual(gen.last.values.Hours, 1311, 'last hours still shown');
assert.strictEqual(gen.stats.fuelPct, 10);
assert.ok(gen.alerts.some(a => /fuel fell about 44 L/.test(a.title) && /No running hours/.test(a.detail)));
ok('readingSave', { token: tech.token, point: 'GEN', values: { FuelPct: 9 }, photos: [tinyJpeg] });
fails('readingSave', { token: tech.token, point: 'COMP', values: { Starts: 5 }, photos: [tinyJpeg] }, /Running hours is needed/);

// ---- compressor: loaded share ----
[[-7, 7180, 1680, 95600], [-3, 7208, 1684, 95950], [0, 7229, 1686, 96246]].forEach(c =>
  addRow({ Date: day(c[0]), Time: '09:00', Point: 'COMP', AssetID: 'EN-CA-01', Hours: c[1], LoadedHours: c[2], Starts: c[3] }));
let comp = pt('COMP');
assert.strictEqual(comp.stats.runHours, 49);
assert.strictEqual(comp.stats.loadPct, 12);
assert.strictEqual(comp.stats.startsPerDay, 92);
assert.ok(comp.alerts.some(a => /loaded only 12%/.test(a.title)));
fails('readingSave', { token: tech.token, point: 'COMP', values: { Hours: 7230, LoadedHours: 7300 }, photos: [tinyJpeg] }, /Loaded hours/);

// ---- water: daily use and spike ----
[[-6, 5340], [-5, 5347], [-4, 5354.5], [-3, 5362], [-2, 5369], [-1, 5376]].forEach(c =>
  addRow({ Date: day(c[0]), Time: '09:00', Point: 'WATER', AssetID: 'EN-FM-WM-01', WaterM3: c[1] }));
F.telegram = [];
F.gemini = () => ({ candidates: [{ content: { role: 'model', parts: [{ text: '{"WaterM3": 5398.46, "confidence": "medium", "seen": "water meter"}' }] } }] });
assert.strictEqual(ok('readingAi', { token: tech.token, point: 'WATER', photo: tinyJpeg }).values.WaterM3, 5398.46);
r = ok('readingSave', { token: tech.token, point: 'WATER', values: { WaterM3: 5398.46 }, ai: { WaterM3: 5398.46 }, photos: [tinyJpeg] });
const water = pt('WATER');
assert.ok(water.stats.avgPerDay >= 7 && water.stats.avgPerDay <= 7.5, 'usual ~7.2 m3 a day');
assert.ok(water.alerts.some(a => /High water use/.test(a.title)));
assert.ok(F.telegram.some(t => /High water use/.test(t.payload.text)), 'water spike sent to managers');
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-FM-WM-01').CurrentMeter, 5398.46);

// ---- refills ----
fails('refillSave', { token: tech.token, refill: { litres: 0, hours: 1311 } }, /litres/);
fails('refillSave', { token: tech.token, refill: { litres: 200, hours: '' } }, /hour meter/);
fails('refillSave', { token: tech.token, refill: { litres: 200, hours: 1311, date: '2099-01-01' } }, /future/);
const rf = ok('refillSave', { token: tech.token, refill: { litres: 200, hours: 1311, fuelBefore: 20, fuelAfter: 65, photo: tinyJpeg, note: 'Bowser' } });
assert.strictEqual(find_(rowsOf('FuelLog'), 'RefillID', rf.id).By, 'Gayan');
assert.strictEqual(ok('readingsHome', { token: admin.token }).refills[0].id, rf.id);

// ---- history list ----
assert.ok(ok('readingsList', { token: tech.token, point: 'WATER', days: 31 }).rows.length >= 7);

// ---- bot + Command Centre bridge ----
const ctx = { user: find_(rowsOf('Users'), 'UserID', 'U01'), token: admin.token, file: null, actions: [] };
assert.strictEqual(runBotTool_('get_readings', {}, ctx).points.length, 3);
const viaBot = runBotTool_('record_refill', { litres: 150, hours: 1312 }, ctx);
assert.match(viaBot.id, /^FL-/);
assert.ok(BRIDGE_TOOLS.indexOf('get_readings') >= 0 && BRIDGE_TOOLS.indexOf('record_refill') < 0, 'Command Centre can read, not write');
assert.ok(BOT_TOOLS.some(t => t.name === 'record_refill'));
passed += 4;

// ---- reminder at 10:00 (once) and morning digest ----
resetReadings();
addRow({ Date: day(-1), Time: '09:00', Point: 'GEN', AssetID: 'EN-PS-06', Hours: 1320 });
F.telegram = []; F.cache = {};
const realFormat = Utilities.formatDate;
Utilities.formatDate = (d, tz, f) => f === 'H' ? '10' : f === 'u' ? '2' : realFormat(d, tz, f);
hourlyTick(); hourlyTick();
const reminders = F.telegram.filter(t => /Daily readings missing/.test(t.payload.text));
assert.strictEqual(reminders.length, 3, 'one reminder per team member, once');
assert.ok(/Air compressor/.test(reminders[0].payload.text));
Utilities.formatDate = realFormat;
F.telegram = [];
Utilities.formatDate = (d, tz, f) => f === 'u' ? '2' : realFormat(d, tz, f);
dailyDigest();
Utilities.formatDate = realFormat;
assert.ok(F.telegram.some(t => t.payload.chat_id === '111' && /Daily readings/.test(t.payload.text) && /1320 h/.test(t.payload.text)), 'readings in the manager digest');
assert.ok(!F.telegram.some(t => t.payload.chat_id === '333' && /Daily readings<\/b>/.test(t.payload.text)), 'not in the technician digest');

// ---- photo clean-up ----
const rt = readTable_('Readings', true);
addRow({ Date: day(-40), Time: '09:00', Point: 'WATER', AssetID: 'EN-FM-WM-01', WaterM3: 5000, Photos: 'FAKEFILE1xxxxxxxxxxxxxxxx', PhotoUntil: day(-10) });
addRow({ Date: day(-40), Time: '09:00', Point: 'WATER', AssetID: 'EN-FM-WM-01', WaterM3: 5001, Photos: 'FAKEFILE2xxxxxxxxxxxxxxxx', PhotoUntil: 'keep' });
F.trashed = [];
assert.strictEqual(cleanReadingPhotos_(), 1);
assert.deepStrictEqual(F.trashed, ['FAKEFILE1xxxxxxxxxxxxxxxx']);
const after = rowsOf('Readings').filter(x => x.WaterM3 === 5000 || x.WaterM3 === 5001);
assert.strictEqual(after[0].PhotoUntil, 'deleted'); assert.strictEqual(after[0].Photos, ''); assert.strictEqual(after[0].WaterM3, 5000, 'number kept');
assert.strictEqual(after[1].PhotoUntil, 'keep');
passed += 6;

// ---- charts page data ----
const cd = ok('readingsData', { token: tech.token, days: 30 });
assert.deepStrictEqual(cd.points.map(x => x.id), ['GEN', 'COMP', 'WATER']);
assert.strictEqual(cd.limits.tankLitres, 440);
assert.ok(cd.points[2].rows.length === 1 && cd.points[2].rows[0].date < cd.from, 'reading before the period kept as the starting point');
assert.ok(cd.points[0].rows.some(r => r.values.Hours === 1320) && cd.summary.points.length === 3);
assert.ok(cd.points[2].rows.every(r => r.at), 'rows carry a timestamp');
assert.strictEqual(ok('readingsData', { token: tech.token, days: 2 }).days, 7, 'at least 7 days');
fails('readingsData', {}, /log in/);

// ---- generator ran (start / stop) + public generator log ----
resetReadings();
addRow({ Date: day(-2), Time: '09:00', Point: 'GEN', AssetID: 'EN-PS-06', Hours: 1400, Starts: 900, FuelPct: 70 });
const st = day(-1) + 'T18:10', sp = day(-1) + 'T21:40';
fails('genRunSave', { token: tech.token, run: { reason: 'Power cut', start: sp, stop: st, hoursStart: 1400, hoursStop: 1403.5 } }, /after the start/);
fails('genRunSave', { token: tech.token, run: { reason: 'Power cut', start: st, stop: sp, hoursStart: 1400, hoursStop: 1399 } }, /lower/);
fails('genRunSave', { token: tech.token, run: { reason: 'Power cut', start: st, stop: sp, hoursStart: 1400, hoursStop: 1408 } }, /clock says 3.5 h/);
fails('genRunSave', { token: tech.token, run: { reason: 'Other', start: st, stop: sp, hoursStart: 1400, hoursStop: 1403.5 } }, /reason in the note/);
fails('genRunSave', { token: tech.token, run: { reason: 'Power cut', start: st, stop: '2099-01-01T10:00', hoursStart: 1400, hoursStop: 1403.5 } }, /future/);
fails('genRunSave', { run: { reason: 'Power cut', start: st, stop: sp, hoursStart: 1400, hoursStop: 1403.5 } }, /log in/);
const run = ok('genRunSave', { token: tech.token, run: { reason: 'Power cut', start: st, stop: sp, hoursStart: '1400', hoursStop: '1403h 30m'.replace('h 30m', '.5'), fuelStart: 70, fuelStop: 57 } });
assert.strictEqual(run.hours, 3.5); assert.strictEqual(run.clockHours, 3.5);
const runRow = find_(rowsOf('GenRuns'), 'RunID', run.id);
assert.strictEqual(runRow.StartAt, day(-1) + ' 18:10'); assert.strictEqual(runRow.By, 'Gayan');
assert.strictEqual(rowsOf('Readings').filter(r => /Run GR-/.test(r.Note)).length, 2, 'start + stop readings added');
assert.strictEqual(find_(rowsOf('Assets'), 'AssetID', 'EN-PS-06').CurrentMeter, 1403.5);
// public log: no token needed, generator only
const gl = ok('genLog', { days: 30 });
assert.strictEqual(gl.runs.length, 1); assert.strictEqual(gl.runs[0].reason, 'Power cut');
assert.ok(gl.readings.length >= 3 && gl.readings.every(r => !('photos' in r)));
assert.strictEqual(gl.limits.lphExpected, 16);
assert.ok(!('points' in gl) && !('summary' in gl), 'no other machines on the public log');
passed += 6;

console.log('All readings tests passed (' + passed + ' checks).');
