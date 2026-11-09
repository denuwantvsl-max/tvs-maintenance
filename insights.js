/* TVS Horana CMMS – Readings insights: charts of the daily readings (generator, compressor, water meter).
   Data: API action readingsData (logged-in staff). Charts are plain SVG with hover tooltips; no libraries. */
(function () {
  'use strict';
  var C = CMMS, esc = C.esc, $ = function (id) { return document.getElementById(id); };
  var S = { days: Number(C.store.get('cmms_insight_days')) || 30, data: null };
  // fixed capacities from the asset register (EN-PS-06, EN-CA-01, EN-FM-WM-01)
  var CAP = { genKw: 200, genKva: 250, compKw: 30, compFad: 4.49, compBar: 10, waterQp: 3.5,
    unloadedShare: 0.25 }; // an unloaded screw compressor draws roughly 20-30 % of full power (estimate)

  /* ---------------- helpers ---------------- */
  var V = window.Viz, num = V.num, dayLabel = V.dayLabel, dayLong = V.dayLong, mean = V.mean, sd = V.sd, el = V.el, niceMax = V.niceMax, daily = V.daily, tipFor = V.tipFor, bars = V.bars, stacked = V.stacked, diverging = V.diverging, line = V.line, tankSvg = V.tankSvg, stat = V.stat, legend = V.legend;

  function render() {
    var d = S.data, main = $('main'), P = {};
    d.points.forEach(function (p) { P[p.id] = p; });
    var sum = {}; d.summary.points.forEach(function (p) { sum[p.id] = p; });
    var lim = d.limits;

    // ----- series
    var genH = daily(P.GEN.rows, 'Hours'), genSt = daily(P.GEN.rows, 'Starts');
    var stByDay = {}; genSt.forEach(function (x) { stByDay[x.date] = x.delta; });
    var cR = daily(P.COMP.rows, 'Hours'), cL = daily(P.COMP.rows, 'LoadedHours'), cS = daily(P.COMP.rows, 'Starts');
    var lByDay = {}, sByDay = {}; cL.forEach(function (x) { lByDay[x.date] = x; }); cS.forEach(function (x) { sByDay[x.date] = x; });
    var wD = daily(P.WATER.rows, 'WaterM3');
    var inP = function (x) { return x.date >= d.from; };
    genH = genH.filter(inP); cR = cR.filter(inP); wD = wD.filter(inP);

    var genRun = genH.reduce(function (s, x) { return s + x.delta; }, 0), genStarts = genSt.filter(inP).reduce(function (s, x) { return s + x.delta; }, 0);
    var cRun = cR.reduce(function (s, x) { return s + x.delta; }, 0), cLoad = cR.reduce(function (s, x) { return s + (lByDay[x.date] ? lByDay[x.date].delta : 0); }, 0);
    var loadPct = cRun > 0 ? Math.round(cLoad / cRun * 100) : null;
    var wTotal = wD.reduce(function (s, x) { return s + x.delta; }, 0), wDays = wD.reduce(function (s, x) { return s + x.span; }, 0);
    var wAvg = wDays ? wTotal / wDays : null;
    var gs = sum.GEN.stats || {}, lph = gs.lph !== undefined ? gs.lph : gs.lphRefills;
    var fuelL = gs.fuelLitres, hoursLeft = fuelL !== undefined && lph ? fuelL / lph : null;
    var realRefills = d.refills.filter(function (f) { return !f.exclude && f.litres > 0 && (!lim.tankLitres || f.litres <= lim.tankLitres); });
    var refillL = realRefills.reduce(function (s, f) { return s + f.litres; }, 0);
    var unloadedH = cRun - cLoad, wasteKwh = unloadedH * CAP.compKw * CAP.unloadedShare;

    var h = '<h1 style="margin:4px 0 2px">Readings insights</h1><p class="sub">Generator EN-PS-06 · Compressor EN-CA-01 · Water meter EN-FM-WM-01 (line out of the main tank). ' +
      'From the daily readings taken in CMMS; ' + esc(dayLong(d.from)) + ' to ' + esc(dayLong(d.today)) + '.</p>';
    h += '<div class="range" id="range">' + [7, 30, 90, 365].map(function (n) { return '<button type="button" class="chip' + (S.days === n ? ' on' : '') + '" data-d="' + n + '">' + (n === 365 ? '1 year' : n + ' days') + '</button>'; }).join('') + '</div>';
    h += '<div class="tiles4">' +
      stat('Generator run', num(genRun, 1), 'h', num(genStarts, 0) + ' starts' + (genStarts ? ' · avg ' + num(genRun / genStarts * 60, 0) + ' min a run' : '')) +
      stat('Diesel use', lph !== undefined ? num(lph, 1) : '—', 'L/h', (gs.lph !== undefined ? 'from fuel % + refills' : 'old records') + ' · normal ' + lim.lphMin + '–' + lim.lphMax) +
      stat('Compressor loaded', loadPct === null ? '—' : loadPct, loadPct === null ? '' : '%', num(cLoad, 0) + ' of ' + num(cRun, 0) + ' running h · target ≥ ' + lim.compMinLoadPct + '%') +
      stat('Water used', num(wTotal, 1), 'm³', wAvg !== null ? num(wAvg, 1) + ' m³ a day on average' : '') + '</div>';

    // alerts
    var al = d.summary.alerts.filter(function (a) { return a.tone !== 'info'; });
    h += '<div style="margin-top:12px">' + (al.length ? al.map(function (a) { return '<div class="flag ' + a.tone + '"><span>' + (a.tone === 'bad' ? '⛔' : '⚠️') + '</span><span><b>' + esc(a.title) + '</b>' + (a.detail ? ' – ' + esc(a.detail) : '') + '</span></div>'; }).join('')
      : '<div class="flag good"><span>✓</span><span>All reading checks OK.</span></div>') + '</div>';

    // ----- generator
    h += '<h2>Diesel generator · ' + CAP.genKva + ' kVA / ' + CAP.genKw + ' kW</h2><p class="sub">Greaves Power GPWII-250E, Deep Sea DSE 6120 controller, ' + lim.tankLitres + ' L built-in tank.</p>';
    h += '<div class="grid2c wide-left"><div class="panel"><h3>Run hours per day</h3><div class="cap">Hours on the engine meter between readings. Tap a bar for details.</div><div class="chart" id="cGenH"></div></div>' +
      '<div class="panel"><h3>Fuel tank now</h3><div class="cap">' + (gs.fuelDate ? 'Read ' + esc(dayLong(gs.fuelDate)) : 'No fuel % reading yet') + '</div><div class="tank">' + tankSvg(gs.fuelPct, lim.fuelLowPct) +
      '<div class="facts"><div><b>' + (fuelL !== undefined ? num(fuelL, 0) + ' L' : '—') + '</b> of ' + lim.tankLitres + ' L</div>' +
      '<div>Low-fuel alert below <b>' + lim.fuelLowPct + '%</b> (' + Math.round(lim.tankLitres * lim.fuelLowPct / 100) + ' L) – red line</div>' +
      (hoursLeft !== null ? '<div>Enough for about <b>' + num(hoursLeft, 0) + ' h</b> of running at ' + num(lph, 1) + ' L/h</div>' : '') +
      '<div>Diesel filled in this period: <b>' + num(refillL, 0) + ' L</b></div></div></div>' +
      '<div class="band"><div class="ok" style="left:' + (lim.lphMin / 60 * 100) + '%;width:' + ((lim.lphMax - lim.lphMin) / 60 * 100) + '%"></div>' +
      (lph !== undefined ? '<div class="pin" style="left:' + Math.min(100, lph / 60 * 100) + '%"></div><div class="pl" style="left:' + Math.min(96, Math.max(4, lph / 60 * 100)) + '%">' + num(lph, 1) + ' L/h</div>' : '') +
      '<div class="tk" style="left:0%;transform:none">0</div><div class="tk" style="left:' + (lim.lphMin / 60 * 100) + '%">' + lim.lphMin + '</div><div class="tk" style="left:' + (lim.lphMax / 60 * 100) + '%">' + lim.lphMax + '</div><div class="tk" style="right:0;left:auto;transform:none">60 L/h</div></div>' +
      '<div class="cap">Green = normal diesel use per running hour.</div></div></div>';
    h += '<div class="panel" style="margin-top:12px"><h3>Fuel level</h3><div class="cap">Tank % at each reading; grey lines = diesel refills; red line = low-fuel alert.</div><div class="chart" id="cFuel"></div></div>';

    // ----- compressor
    h += '<h2>Air compressor · ' + CAP.compKw + ' kW</h2><p class="sub">Atlas Copco G30, ' + CAP.compFad + ' m³/min free air delivery, ' + CAP.compBar + ' bar max.</p>';
    h += '<div class="grid2c wide-left"><div class="panel"><h3>Running hours per day: loaded vs unloaded</h3>' + legend([['var(--series-1)', 'Loaded (making air)'], ['var(--series-2)', 'Unloaded (running, no air)']]) + '<div class="chart" id="cComp"></div></div>' +
      '<div class="panel"><h3>Where the running time goes</h3><div class="cap">This period</div>' +
      (cRun > 0 ? '<div class="duty"><div style="flex:' + cLoad + ';background:var(--series-1)">' + (loadPct >= 25 ? 'Loaded ' + loadPct + '%' : loadPct >= 8 ? loadPct + '%' : '') + '</div><div style="flex:' + unloadedH + ';background:var(--series-2)">Unloaded ' + (100 - loadPct) + '%</div></div>' : '<div class="empty-note">No compressor readings yet.</div>') +
      '<div class="facts"><div>Loaded <b>' + num(cLoad, 0) + ' h</b> · unloaded <b>' + num(unloadedH, 0) + ' h</b></div>' +
      (cRun > 0 ? '<div>Air made ≈ <b>' + num(cLoad * 60 * CAP.compFad, 0) + ' m³</b> (loaded h × ' + CAP.compFad + ' m³/min)</div>' +
        '<div>Power spent running unloaded ≈ <b>' + num(wasteKwh, 0) + ' kWh</b> <span class="muted">(estimate: unloaded ≈ ' + Math.round(CAP.unloadedShare * 100) + '% of ' + CAP.compKw + ' kW)</span></div>' : '') +
      (sum.COMP.stats && sum.COMP.stats.lifeLoadPct !== undefined ? '<div>Since new: loaded <b>' + sum.COMP.stats.lifeLoadPct + '%</b> of ' + num(sum.COMP.last.values.Hours, 0) + ' running h</div>' : '') +
      '<div style="margin-top:6px">Low loaded share + many starts usually means air leaks, too wide a pressure band, or a compressor bigger than the demand.</div></div></div></div>';
    h += '<div class="panel" style="margin-top:12px"><h3>Motor starts per day</h3><div class="cap">Each start wears the motor and contactor; fewer, longer runs are better.</div><div class="chart" id="cStarts"></div></div>';

    // ----- water
    h += '<h2>Water · line out of the main tank</h2><p class="sub">ISO 4064 meter, rated ' + CAP.waterQp + ' m³/h (' + num(CAP.waterQp * 24, 0) + ' m³ a day at full flow).</p>';
    h += '<div class="grid2c"><div class="panel"><h3>Water used per day</h3><div class="cap">Black line = average for this period.</div><div class="chart" id="cWater"></div></div>' +
      '<div class="panel"><h3>Difference from the average</h3>' + legend([['var(--series-2)', 'More than usual'], ['var(--series-1)', 'Less than usual']]) + '<div class="chart" id="cWaterVar"></div></div></div>' +
      (wAvg !== null ? '<div class="panel" style="margin-top:12px"><div class="facts">Average flow <b>' + num(wAvg / 24, 2) + ' m³/h</b> = <b>' + num(wAvg / 24 / CAP.waterQp * 100, 0) + '%</b> of the meter rating · ' +
        'busiest day <b>' + num(Math.max.apply(null, wD.map(function (x) { return x.perDay; })), 1) + ' m³</b> · alert when a day is more than ' + lim.waterHighFactor + '× the usual.</div></div>' : '');

    // ----- variance table
    var row = function (name, unit, arr, dec) {
      var m = mean(arr), s = sd(arr);
      return '<tr><td>' + esc(name) + '</td><td>' + arr.length + '</td><td>' + num(m, dec) + ' ' + unit + '</td><td>' + (arr.length ? num(Math.min.apply(null, arr), dec) : '—') + '</td><td>' +
        (arr.length ? num(Math.max.apply(null, arr), dec) : '—') + '</td><td>' + num(s, dec) + '</td><td>' + (m && s !== null ? num(s / m * 100, 0) + '%' : '—') + '</td></tr>';
    };
    h += '<h2>Variance</h2><p class="sub">How much each daily figure moves around its average. A high "spread %" means the usage is irregular.</p>' +
      '<div class="panel scroll-x"><table class="var"><thead><tr><th>Per day</th><th>Days</th><th>Average</th><th>Lowest</th><th>Highest</th><th>Std dev</th><th>Spread %</th></tr></thead><tbody>' +
      row('Generator run', 'h', genH.map(function (x) { return x.perDay; }), 2) +
      row('Compressor running', 'h', cR.map(function (x) { return x.perDay; }), 1) +
      row('Compressor loaded', '%', cR.filter(function (x) { return x.delta > 0 && lByDay[x.date]; }).map(function (x) { return lByDay[x.date].delta / x.delta * 100; }), 0) +
      row('Compressor starts', '', cS.filter(inP).map(function (x) { return x.perDay; }), 0) +
      row('Water', 'm³', wD.map(function (x) { return x.perDay; }), 1) + '</tbody></table></div>';

    // ----- data table
    var days = {};
    genH.forEach(function (x) { (days[x.date] = days[x.date] || {}).g = x.perDay; });
    cR.forEach(function (x) { var o = days[x.date] = days[x.date] || {}; o.c = x.perDay; o.l = lByDay[x.date] ? lByDay[x.date].perDay : null; o.s = sByDay[x.date] ? sByDay[x.date].perDay : null; });
    wD.forEach(function (x) { (days[x.date] = days[x.date] || {}).w = x.perDay; });
    h += '<details class="tbl"><summary>Show the numbers as a table</summary><div class="panel scroll-x"><table class="var"><thead><tr><th>Day</th><th>Gen run h</th><th>Comp running h</th><th>Comp loaded h</th><th>Comp starts</th><th>Water m³</th></tr></thead><tbody>' +
      Object.keys(days).sort().reverse().map(function (k) { var o = days[k]; return '<tr><td>' + esc(dayLong(k)) + '</td><td>' + num(o.g, 2) + '</td><td>' + num(o.c, 1) + '</td><td>' + num(o.l, 1) + '</td><td>' + num(o.s, 0) + '</td><td>' + num(o.w, 2) + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>';
    h += '<p class="sub" style="margin-top:18px">Days with no reading are shown on the next reading\'s day as an average per day. Limits come from the CMMS Settings tab.</p>';
    main.innerHTML = h;

    // ----- draw
    var tipDay = function (x, txt) { return '<b>' + esc(dayLong(x.date)) + '</b><br>' + txt + (x.span > 1.5 ? '<br><span style="opacity:.75">avg over ' + num(x.span, 1) + ' days</span>' : ''); };
    bars($('cGenH'), genH.map(function (x) { return { label: dayLabel(x.date), value: Math.max(0, x.perDay), tip: tipDay(x, num(x.perDay, 2) + ' h run' + (stByDay[x.date] ? ' · ' + stByDay[x.date] + ' start' + (stByDay[x.date] > 1 ? 's' : '') : '')) }; }),
      { color: 'var(--series-1)', title: 'Generator run hours per day' });
    var fuelPts = P.GEN.rows.filter(function (r) { return r.values.FuelPct !== undefined; }).map(function (r) {
      return { t: Date.parse(r.at), value: r.values.FuelPct, tip: '<b>' + esc(dayLong(r.date)) + ' ' + esc(r.time || '') + '</b><br>' + r.values.FuelPct + '% ≈ ' + Math.round(r.values.FuelPct / 100 * lim.tankLitres) + ' L' };
    });
    line($('cFuel'), fuelPts, { min: 0, max: 100, unit: '%', color: 'var(--series-1)', threshold: lim.fuelLowPct, thresholdLabel: 'low ' + lim.fuelLowPct + '%', title: 'Generator fuel level',
      events: realRefills.map(function (f) { return { t: Date.parse(f.date + 'T12:00:00'), label: '+' + num(f.litres, 0) + ' L' }; }) });
    stacked($('cComp'), cR.map(function (x) {
      var l = lByDay[x.date] ? Math.max(0, lByDay[x.date].perDay) : 0, r = Math.max(0, x.perDay), u = Math.max(0, r - l);
      return { label: dayLabel(x.date), a: l, b: u, tip: tipDay(x, 'Running ' + num(r, 1) + ' h<br>Loaded ' + num(l, 1) + ' h (' + (r ? Math.round(l / r * 100) : 0) + '%)<br>Unloaded ' + num(u, 1) + ' h') };
    }), { colorA: 'var(--series-1)', colorB: 'var(--series-2)', title: 'Compressor loaded and unloaded hours per day' });
    var stArr = cS.filter(inP);
    bars($('cStarts'), stArr.map(function (x) { return { label: dayLabel(x.date), value: Math.max(0, x.perDay), tip: tipDay(x, num(x.perDay, 0) + ' starts') }; }),
      { color: 'var(--series-1)', avg: mean(stArr.map(function (x) { return x.perDay; })), avgLabel: 'avg ' + num(mean(stArr.map(function (x) { return x.perDay; })), 0), title: 'Compressor starts per day', height: 160 });
    bars($('cWater'), wD.map(function (x) { return { label: dayLabel(x.date), value: Math.max(0, x.perDay), tip: tipDay(x, num(x.perDay, 2) + ' m³' + (wAvg ? ' (' + (x.perDay >= wAvg ? '+' : '') + num(x.perDay - wAvg, 1) + ' vs avg)' : '')) }; }),
      { color: 'var(--series-1)', avg: wAvg, avgLabel: 'avg ' + num(wAvg, 1) + ' m³', title: 'Water used per day',
        colorOf: function (it) { return 'var(--series-1)'; } });
    diverging($('cWaterVar'), wD.map(function (x) { return { label: dayLabel(x.date), value: x.perDay - wAvg, tip: tipDay(x, (x.perDay >= wAvg ? '+' : '') + num(x.perDay - wAvg, 2) + ' m³ vs average ' + num(wAvg, 1)) }; }),
      { title: 'Water use difference from average' });

    $('range').addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      S.days = Number(b.getAttribute('data-d')); C.store.set('cmms_insight_days', String(S.days)); load();
    });
  }

  function load() {
    var main = $('main');
    if (!S.data) main.innerHTML = C.loadingHtml();
    C.api('readingsData', { days: S.days }).then(function (d) { S.data = d; render(); })
      .catch(function (e) {
        main.innerHTML = '<div class="card"><p>' + esc(e.auth ? 'Please log in to CMMS first, then come back to this page.' : e.message) + '</p>' +
          '<a class="btn" href="app.html#readings">Open CMMS</a></div>';
      });
  }

  var sess = C.session();
  if (sess) $('whoami').textContent = sess.user.name + ' · ' + sess.user.role;
  if (!sess) { $('main').innerHTML = '<div class="card"><p>Please log in to CMMS first, then come back to this page.</p><a class="btn" href="app.html#readings">Open CMMS</a></div>'; return; }
  load();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (S.data) render(); }, 200); });
})();
