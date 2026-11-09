/* TVS Horana CMMS – public Generator log (view only, anyone with the link). For HR / audit: is the diesel given to the
   generator used in line with its running hours, which days did it run, and the full log. Data: API action genLog. */
(function () {
  'use strict';
  var C = CMMS, esc = C.esc, $ = function (id) { return document.getElementById(id); };
  var V = window.Viz, num = V.num, dayLong = V.dayLong, stat = V.stat, line = V.line, tankSvg = V.tankSvg;
  var S = { data: null, period: C.store.get('cmms_genlog_period') || 'last30' };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var hm = function (h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ' h ' + pad(m % 60) + ' m'; };
  var parseAt = function (s) { return new Date(String(s).replace(' ', 'T') + ':00'); };

  /** [from, to] (yyyy-MM-dd, inclusive) and a label for the chosen period. */
  function range() {
    var now = new Date(), p = S.period;
    if (p === 'last30' || p === 'last90') {
      var n = p === 'last30' ? 30 : 90, f = new Date(now.getTime() - (n - 1) * 86400000);
      return { from: ymd(f), to: ymd(now), label: 'Last ' + n + ' days' };
    }
    var y = Number(p.slice(0, 4)), m = Number(p.slice(5, 7)), last = new Date(y, m, 0);
    return { from: p + '-01', to: ymd(last) > ymd(now) ? ymd(now) : ymd(last), label: last.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
  }

  /** Fuel and hours accounting for the period, pair by pair between fuel readings. */
  function account(d, r) {
    var lim = d.limits, tank = lim.tankLitres;
    var rd = d.readings.map(function (x) { return Object.assign({ t: Date.parse(x.at) }, x); }).sort(function (a, b) { return a.t - b.t; });
    var hoursAt = function (x) {
      if (x.hours !== undefined && x.hours !== null) return x.hours;
      var h = null; rd.forEach(function (y) { if (y.t <= x.t && y.hours !== undefined && y.hours !== null) h = y.hours; }); return h;
    };
    var refills = d.refills.filter(function (f) { return !f.exclude && f.litres > 0 && (!tank || f.litres <= tank); });
    var fedBetween = function (a, b) { return refills.filter(function (f) { return f.date > a.date && f.date <= b.date; }).reduce(function (s, f) { return s + f.litres; }, 0); };
    var inP = function (x) { return x.date >= r.from && x.date <= r.to; };
    // hours run: meter at the last reading of the period minus the last reading before it (or the first in it)
    var withH = rd.filter(function (x) { return x.hours !== undefined && x.hours !== null; });
    var base = null, endR = null;
    withH.forEach(function (x) { if (x.date < r.from) base = x; else if (x.date <= r.to) { endR = x; if (!base) base = x; } });
    var hoursRun = base && endR ? Math.max(0, endR.hours - base.hours) : 0;
    // fuel pairs
    var fuel = rd.filter(function (x) { return x.fuelPct !== undefined && x.fuelPct !== null; });
    var pairs = [];
    for (var i = 1; i < fuel.length; i++) {
      var a = fuel[i - 1], b = fuel[i];
      if (!inP(b)) continue;
      var ha = hoursAt(a), hb = hoursAt(b), ran = ha !== null && hb !== null ? Math.max(0, hb - ha) : 0;
      var fed = fedBetween(a, b), drop = (a.fuelPct - b.fuelPct) / 100 * tank + fed;
      var allowed = ran * lim.lphMax + 0.05 * tank;
      pairs.push({ a: a, b: b, ran: ran, fed: fed, used: drop, expected: ran * lim.lphExpected, unexplained: Math.max(0, drop - allowed), missingRefill: drop < -0.05 * tank });
    }
    var sum = function (k) { return pairs.reduce(function (s, p) { return s + Math.max(0, p[k]); }, 0); };
    return { hoursRun: hoursRun, pairs: pairs, used: sum('used'), expected: sum('expected'), unexplained: sum('unexplained'),
      fuelHours: pairs.reduce(function (s, p) { return s + p.ran; }, 0),
      filled: refills.filter(inP).reduce(function (s, f) { return s + f.litres; }, 0), refills: refills.filter(inP), rd: rd, hoursAt: hoursAt };
  }

  /** Run hours per day: recorded runs first (exact), otherwise hour-meter change between readings (on the later reading's day). */
  function perDay(d, acc) {
    var days = {};
    d.runs.forEach(function (x) {
      var k = x.start.slice(0, 10), o = days[k] = days[k] || { h: 0, runs: [], approx: 0 };
      o.h += Math.max(0, x.hoursStop - x.hoursStart); o.runs.push(x);
    });
    var withH = acc.rd.filter(function (x) { return x.hours !== undefined && x.hours !== null; });
    for (var i = 1; i < withH.length; i++) {
      var a = withH[i - 1], b = withH[i], dh = b.hours - a.hours;
      if (dh <= 0.01 || /^Run GR-/.test(b.note || '')) continue;
      var covered = d.runs.some(function (x) { var s = parseAt(x.start).getTime(), e = parseAt(x.stop).getTime(); return s >= a.t - 60000 && e <= b.t + 60000; });
      if (covered) continue;
      var o = days[b.date] = days[b.date] || { h: 0, runs: [], approx: 0 };
      o.h += dh; o.approx += dh; o.from = a;
    }
    return days;
  }

  function calendar(r, days, readDays) {
    var out = '', start = new Date(r.from + 'T00:00:00'), end = new Date(r.to + 'T00:00:00');
    var cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      var y = cur.getFullYear(), m = cur.getMonth(), first = new Date(y, m, 1), nDays = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
      out += '<div class="cal-month">' + esc(first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })) + '</div><div class="cal">' +
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<div class="dh">' + x + '</div>'; }).join('');
      for (var b = 0; b < lead; b++) out += '<div class="d out"></div>';
      for (var dd = 1; dd <= nDays; dd++) {
        var k = y + '-' + pad(m + 1) + '-' + pad(dd), o = days[k], inside = k >= r.from && k <= r.to;
        if (!inside) { out += '<div class="d out"></div>'; continue; }
        var h = o ? o.h : 0, cls = h > 3 ? 'l3' : h >= 1 ? 'l2' : h > 0.01 ? 'l1' : (readDays[k] ? '' : 'nodata');
        var power = o && o.runs.some(function (x) { return x.reason === 'Power cut'; });
        var tip = dayLong(k) + ': ' + (h > 0.01 ? hm(h) + ' run' + (o.runs.length ? ' (' + o.runs.map(function (x) { return x.reason + ' ' + x.start.slice(11) + '–' + x.stop.slice(11); }).join(', ') + ')' : ' (from the hour meter)') : (readDays[k] ? 'did not run' : 'no reading'));
        out += '<div class="d ' + cls + '" title="' + esc(tip) + '" aria-label="' + esc(tip) + '">' + (power ? '<span class="pc" aria-hidden="true">⚡</span>' : '') +
          '<b>' + dd + '</b><small>' + (h > 0.01 ? num(h, 1) + 'h' : '') + '</small></div>';
      }
      out += '</div>';
      cur = new Date(y, m + 1, 1);
    }
    return out + '<div class="keyrow"><span><i style="background:#eef0f3"></i>Did not run</span><span><i style="background:#9ec5f4"></i>Under 1 h</span>' +
      '<span><i style="background:#3987e5"></i>1–3 h</span><span><i style="background:#184f95"></i>Over 3 h</span><span>⚡ Power cut</span>' +
      '<span><i style="background:repeating-linear-gradient(135deg,#f8fafc 0 3px,#d5d8de 3px 5px)"></i>No reading</span></div>';
  }

  function hbar(label, value, max, color, parts) {
    var w = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
    var inner = parts ? parts.filter(function (p) { return p[0] > 0; }).map(function (p, i, arr) {
      return '<i class="' + (i < arr.length - 1 ? 'part' : '') + '" style="width:' + (p[0] / (max || 1) * 100) + '%;background:' + p[1] + '"></i>';
    }).join('') : '<i style="width:' + w + '%;background:' + color + '"></i>';
    return '<div class="hbar"><span class="lab">' + esc(label) + '</span><span class="track">' + inner + '</span><span class="val">' + num(value, 0) + ' L</span></div>';
  }

  function render() {
    var d = S.data, r = range(), lim = d.limits, acc = account(d, r), days = perDay(d, acc);
    var readDays = {}; acc.rd.forEach(function (x) { readDays[x.date] = 1; }); d.runs.forEach(function (x) { readDays[x.start.slice(0, 10)] = 1; });
    var ranDays = Object.keys(days).filter(function (k) { return k >= r.from && k <= r.to && days[k].h > 0.01; });
    var runsIn = d.runs.filter(function (x) { return x.start.slice(0, 10) >= r.from && x.start.slice(0, 10) <= r.to; }).sort(function (a, b) { return b.start.localeCompare(a.start); });
    var lphAvg = acc.fuelHours >= 2 ? acc.used / acc.fuelHours : null;

    // period picker: last 30 / 90 days and the months that have data
    var months = {}, m0 = ymd(new Date(Date.now() - 365 * 86400000)).slice(0, 7);
    acc.rd.forEach(function (x) { if (x.date.slice(0, 7) >= m0) months[x.date.slice(0, 7)] = 1; });
    d.runs.forEach(function (x) { if (x.start.slice(0, 7) >= m0) months[x.start.slice(0, 7)] = 1; });
    var h = '<h1 style="margin:4px 0 2px">Generator log</h1><p class="sub">' + esc(d.name) + ' · ' + esc(d.asset) + ' · ' + lim.tankLitres + ' L tank. ' +
      'Readings are taken daily by the maintenance team, and each run (power cut, test, service) is recorded with its start and stop time.</p>';
    h += '<div class="period" id="period">' + [['last30', 'Last 30 days'], ['last90', 'Last 90 days']].map(function (x) { return '<button type="button" class="chip' + (S.period === x[0] ? ' on' : '') + '" data-p="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      Object.keys(months).sort().reverse().map(function (k) { return '<button type="button" class="chip' + (S.period === k ? ' on' : '') + '" data-p="' + k + '">' + esc(new Date(k + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })) + '</button>'; }).join('') +
      '<span class="actions"><button type="button" class="btn sm ghost" id="pdf">🖨 Print / PDF</button><button type="button" class="btn sm ghost" id="csv">⬇ Excel (CSV)</button></span></div>';
    h += '<p class="sub" style="margin-top:6px"><b>' + esc(r.label) + '</b> · ' + esc(dayLong(r.from)) + ' to ' + esc(dayLong(r.to)) + '</p>';

    h += '<div class="tiles4">' +
      stat('Hours run', num(acc.hoursRun, 1), 'h', hm(acc.hoursRun)) +
      stat('Days it ran', ranDays.length, '', runsIn.length + ' run' + (runsIn.length === 1 ? '' : 's') + ' recorded with times') +
      stat('Diesel filled', num(acc.filled, 0), 'L', acc.refills.length + ' refill' + (acc.refills.length === 1 ? '' : 's')) +
      stat('Diesel per running hour', lphAvg === null ? '—' : num(lphAvg, 1), lphAvg === null ? '' : 'L/h', 'normal ' + lim.lphMin + '–' + lim.lphMax + ' L/h') + '</div>';

    // fuel accounting
    var max = Math.max(acc.filled, acc.used, acc.expected, 1);
    var explainedUsed = Math.max(0, acc.used - acc.unexplained);
    h += '<h2>Is the diesel used in line with the running hours?</h2><p class="sub">Diesel used is worked out from the tank level (' + lim.tankLitres + ' L tank) and the refills between readings. ' +
      'Expected = hours run × ' + lim.lphExpected + ' L/h.</p><div class="panel">';
    if (!acc.pairs.length) h += '<div class="verdict info"><span class="ic">ℹ️</span><span>Not enough fuel-level readings in this period yet. The check starts once the tank level is read on two different days.</span></div>';
    else {
      h += hbar('Diesel filled', acc.filled, max, 'var(--neutral)') +
        hbar('Diesel used (tank level)', acc.used, max, null, [[explainedUsed, 'var(--series-1)'], [acc.unexplained, 'var(--bad)']]) +
        hbar('Expected for ' + num(acc.fuelHours, 1) + ' h run', acc.expected, max, '#86b6ef');
      h += '<div class="keyrow"><span><i style="background:var(--series-1)"></i>Used, matches running hours</span><span><i style="background:var(--bad)"></i>Used, not explained by running hours</span><span><i style="background:#86b6ef"></i>Expected</span><span><i style="background:var(--neutral)"></i>Filled</span></div>';
      h += acc.unexplained >= 20
        ? '<div class="verdict bad"><span class="ic">⚠️</span><span><b>About ' + num(acc.unexplained, 0) + ' L of diesel is not explained by the running hours.</b> See the flagged rows in the log below. Possible reasons: a run not recorded (power cut at night), a leak, diesel taken, or a wrong reading.</span></div>'
        : '<div class="verdict good"><span class="ic">✓</span><span><b>Diesel use matches the running hours</b> for this period (within the normal ' + lim.lphMin + '–' + lim.lphMax + ' L/h and a 5% gauge allowance).</span></div>';
      if (acc.pairs.some(function (p) { return p.missingRefill; })) h += '<div class="verdict info"><span class="ic">ℹ️</span><span>The tank level went up at least once without a refill entry. Ask maintenance to record every refill.</span></div>';
    }
    h += '</div>';

    // calendar + tank
    h += '<div class="grid2c wide-left" style="margin-top:12px"><div class="panel"><h3>Days the generator ran</h3><div class="cap">Hover or tap a day for the times.</div>' + calendar(r, days, readDays) + '</div>' +
      '<div class="panel"><h3>Tank now</h3><div class="cap">' + (d.stats.fuelDate ? 'Read ' + esc(dayLong(d.stats.fuelDate)) : 'No fuel reading yet') + '</div>' +
      (d.stats.fuelPct !== undefined && d.stats.fuelPct !== null ? '<div class="tank">' + tankSvg(d.stats.fuelPct, lim.fuelLowPct) + '<div class="facts"><div><b>' + num(d.stats.fuelLitres, 0) + ' L</b> of ' + lim.tankLitres + ' L</div>' +
        '<div>Red line = low-fuel level (' + lim.fuelLowPct + '%)</div></div></div>' : '<div class="empty-note">—</div>') + '</div></div>';
    h += '<div class="panel" style="margin-top:12px"><h3>Tank level over time</h3><div class="cap">Grey lines = refills.</div><div class="chart" id="cFuel"></div></div>';

    // runs
    h += '<h2>Runs with times</h2><p class="sub">Each time the generator ran, as recorded by the maintenance team.</p><div class="panel"><div class="runs">' +
      (runsIn.length ? runsIn.map(function (x) {
        var s = parseAt(x.start), e = parseAt(x.stop), hrs = Math.max(0, x.hoursStop - x.hoursStart);
        var used = x.fuelStart !== null && x.fuelStop !== null ? (x.fuelStart - x.fuelStop) / 100 * lim.tankLitres : null, lph = used !== null && hrs >= 0.5 ? used / hrs : null;
        var bad = lph !== null && (lph < lim.lphMin || lph > lim.lphMax);
        var dayStart = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime(), left = (s.getTime() - dayStart) / 864e5 * 100, width = Math.min(100 - left, (e - s) / 864e5 * 100);
        return '<div class="run"><div class="when"><b>' + esc(s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '</b><span>' + esc(x.start.slice(11) + ' – ' + x.stop.slice(11)) + '</span></div>' +
          '<div><div class="tl" title="00:00 to 24:00"><i style="left:' + left + '%;width:' + width + '%"></i></div><div class="meta"><span class="tag' + (x.reason === 'Power cut' ? '' : ' svc') + '">' + esc(x.reason) + '</span>' +
          hm(hrs) + ' on the meter (' + num(x.hoursStart, 2) + ' → ' + num(x.hoursStop, 2) + ' h)' + (x.fuelStart !== null && x.fuelStop !== null ? ' · fuel ' + x.fuelStart + '% → ' + x.fuelStop + '%' : '') +
          (x.by ? ' · ' + esc(x.by) : '') + (x.note ? ' · ' + esc(x.note) : '') + '</div></div>' +
          '<div class="lph' + (bad ? ' flagtxt' : '') + '">' + (used !== null ? num(used, 0) + ' L' : '—') + '<small>' + (lph !== null ? num(lph, 1) + ' L/h' : '') + '</small></div></div>';
      }).join('') : '<div class="empty-note">No runs recorded with times in this period. Daily readings still show the hours on the calendar.</div>') + '</div></div>';

    // alerts
    if (d.alerts.length) h += '<h2>Checks</h2>' + d.alerts.map(function (a) { return '<div class="flag ' + a.tone + '"><span>' + (a.tone === 'bad' ? '⛔' : '⚠️') + '</span><span><b>' + esc(a.title) + '</b>' + (a.detail ? ' – ' + esc(a.detail) : '') + '</span></div>'; }).join('');

    // log table
    var rows = logRows(d, r, acc);
    h += '<h2>Full log</h2><p class="sub">Newest first. ⚠ = fuel went down more than the running hours explain.</p><div class="panel scroll-x"><table class="var log"><thead><tr><th>Date & time</th><th>Entry</th><th>Hour meter</th><th>Fuel</th><th>Litres</th><th>By</th><th>Note</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (x) {
        return '<tr><td>' + esc(x.when) + '</td><td class="ev">' + esc(x.kind) + '</td><td>' + esc(x.meter) + '</td><td>' + esc(x.fuel) + '</td><td>' + esc(x.litres) + '</td><td class="ev">' + esc(x.by) + '</td><td class="note">' +
          (x.flag ? '<span class="flagtxt">⚠ ' + esc(x.flag) + '</span> ' : '') + esc(x.note) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="ev">No entries in this period.</td></tr>') + '</tbody></table></div>';
    h += '<p class="sub" style="margin-top:16px">View-only page. Figures come from the maintenance system (CMMS) and update when the team records readings. Updated ' + esc(new Date(d.now).toLocaleString('en-GB')) + '.</p>';
    $('main').innerHTML = h;
    S.rows = rows;

    var fuelPts = acc.rd.filter(function (x) { return x.fuelPct !== undefined && x.fuelPct !== null && x.date <= r.to; }).map(function (x) {
      return { t: x.t, value: x.fuelPct, tip: '<b>' + esc(dayLong(x.date)) + ' ' + esc(x.time || '') + '</b><br>' + x.fuelPct + '% ≈ ' + Math.round(x.fuelPct / 100 * lim.tankLitres) + ' L' };
    }).filter(function (p, i, arr) { return new Date(p.t) >= new Date(r.from + 'T00:00:00') || (arr[i + 1] && new Date(arr[i + 1].t) >= new Date(r.from + 'T00:00:00')); });
    line($('cFuel'), fuelPts, { min: 0, max: 100, unit: '%', color: 'var(--series-1)', threshold: lim.fuelLowPct, thresholdLabel: 'low ' + lim.fuelLowPct + '%', title: 'Generator tank level',
      events: acc.refills.map(function (f) { return { t: Date.parse(f.date + 'T12:00:00'), label: '+' + num(f.litres, 0) + ' L' }; }) });

    $('period').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b) return;
      S.period = b.getAttribute('data-p'); C.store.set('cmms_genlog_period', S.period); render();
    });
    $('pdf').addEventListener('click', function () { window.print(); });
    $('csv').addEventListener('click', function () {
      var lines = [['Date & time', 'Entry', 'Hour meter', 'Fuel', 'Litres', 'By', 'Flag', 'Note']].concat(S.rows.map(function (x) { return [x.when, x.kind, x.meter, x.fuel, x.litres, x.by, x.flag, x.note]; }));
      var csv = lines.map(function (l) { return l.map(function (v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      a.download = 'Generator log ' + r.from + ' to ' + r.to + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    });
  }

  function logRows(d, r, acc) {
    var lim = d.limits, out = [], flagAt = {};
    acc.pairs.forEach(function (p) { if (p.unexplained >= 20) flagAt[p.b.at] = 'About ' + num(p.used, 0) + ' L used since ' + p.a.date + ' ' + p.a.time + ' with ' + num(p.ran, 1) + ' h run'; });
    acc.rd.forEach(function (x) {
      if (x.date < r.from || x.date > r.to || /^Run GR-/.test(x.note || '')) return;
      out.push({ t: x.t, when: x.date + ' ' + (x.time || ''), kind: 'Daily reading', meter: x.hours !== undefined && x.hours !== null ? num(x.hours, 2) + ' h' : '',
        fuel: x.fuelPct !== undefined && x.fuelPct !== null ? x.fuelPct + '% ≈ ' + Math.round(x.fuelPct / 100 * lim.tankLitres) + ' L' : '', litres: '', by: x.by,
        note: (x.note || '').replace(/^From WhatsApp photos? /, 'Photo ').slice(0, 140), flag: flagAt[x.at] || '' });
    });
    d.runs.forEach(function (x) {
      if (x.start.slice(0, 10) < r.from || x.start.slice(0, 10) > r.to) return;
      var hrs = Math.max(0, x.hoursStop - x.hoursStart), used = x.fuelStart !== null && x.fuelStop !== null ? (x.fuelStart - x.fuelStop) / 100 * lim.tankLitres : null;
      out.push({ t: parseAt(x.start).getTime(), when: x.start + ' → ' + x.stop.slice(11), kind: 'Run · ' + x.reason, meter: num(x.hoursStart, 2) + ' → ' + num(x.hoursStop, 2) + ' h (' + hm(hrs) + ')',
        fuel: x.fuelStart !== null && x.fuelStop !== null ? x.fuelStart + '% → ' + x.fuelStop + '%' : '', litres: used !== null ? num(used, 0) + ' L used' : '', by: x.by, note: x.note, flag: '' });
    });
    acc.refills.forEach(function (f) {
      out.push({ t: Date.parse(f.date + 'T12:00:00'), when: f.date, kind: 'Diesel refill', meter: f.hours !== null && f.hours !== undefined ? num(f.hours, 2) + ' h' : '',
        fuel: f.before !== null && f.after !== null ? f.before + '% → ' + f.after + '%' : '', litres: '+' + num(f.litres, 0) + ' L', by: f.by, note: f.note, flag: '' });
    });
    return out.sort(function (a, b) { return b.t - a.t; });
  }

  function load() {
    C.api('genLog', { days: 400 }).then(function (d) { S.data = d; render(); })
      .catch(function (e) { $('main').innerHTML = '<div class="card"><p>' + esc(e.message) + '</p><button class="btn" onclick="location.reload()">Try again</button></div>'; });
  }
  load();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (S.data) render(); }, 200); });
})();
