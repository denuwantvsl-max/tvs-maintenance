/* TVS Horana CMMS – Readings insights: charts of the daily readings (generator, compressor, water meter).
   Data: API action readingsData (logged-in staff). Charts are plain SVG with hover tooltips; no libraries. */
(function () {
  'use strict';
  var C = CMMS, esc = C.esc, $ = function (id) { return document.getElementById(id); };
  var S = { days: Number(C.store.get('cmms_insight_days')) || 30, data: null };
  var NS = 'http://www.w3.org/2000/svg';
  // fixed capacities from the asset register (EN-PS-06, EN-CA-01, EN-FM-WM-01)
  var CAP = { genKw: 200, genKva: 250, compKw: 30, compFad: 4.49, compBar: 10, waterQp: 3.5,
    unloadedShare: 0.25 }; // an unloaded screw compressor draws roughly 20-30 % of full power (estimate)

  /* ---------------- helpers ---------------- */
  var num = function (v, d) { return v === null || v === undefined || !isFinite(v) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d === undefined ? 1 : d }); };
  var dayLabel = function (k) { var d = new Date(k + 'T00:00:00'); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  var dayLong = function (k) { var d = new Date(k + 'T00:00:00'); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  var mean = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; };
  var sd = function (a) { var m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)) : null; };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  /** Per-day changes between consecutive readings: [{date, delta, span(days), perDay}] keyed on the later reading's date. */
  function daily(rows, field) {
    var out = {}, list = rows.filter(function (r) { return r.values[field] !== undefined; });
    for (var i = 1; i < list.length; i++) {
      var a = list[i - 1], b = list[i], span = (Date.parse(b.at) - Date.parse(a.at)) / 86400000;
      if (span <= 0) continue;
      var o = out[b.date] = out[b.date] || { date: b.date, delta: 0, span: 0 };
      o.delta += b.values[field] - a.values[field]; o.span += span;
    }
    return Object.keys(out).sort().map(function (k) {
      var o = out[k]; o.perDay = o.span > 1.5 ? o.delta / o.span : o.delta; return o;
    });
  }

  /* ---------------- tooltip ---------------- */
  function tipFor(box) {
    var t = document.createElement('div'); t.className = 'tip'; box.appendChild(t);
    return {
      show: function (html, x, y) { t.innerHTML = html; t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.opacity = 1;
        var r = t.getBoundingClientRect(), br = box.getBoundingClientRect();
        if (r.left < br.left) t.style.left = (x + (br.left - r.left)) + 'px';
        if (r.right > br.right) t.style.left = (x - (r.right - br.right)) + 'px'; },
      hide: function () { t.style.opacity = 0; }
    };
  }

  /* ---------------- charts ---------------- */
  /** Vertical bars. items [{key, label, value, tip}] ; o {color, unit, avg, avgLabel, height, colorOf(item)} */
  function bars(box, items, o) {
    box.innerHTML = '';
    if (!items.length) { box.innerHTML = '<div class="empty-note">Not enough readings yet for this chart.</div>'; return; }
    var W = Math.max(box.clientWidth || 600, 280), H = o.height || 190, L = 36, R = 8, T = 14, B = 22;
    var vals = items.map(function (i) { return i.value; }), max = niceMax(Math.max.apply(null, vals.concat([o.avg || 0, o.ref || 0])));
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || '' }, box);
    var y = function (v) { return T + (H - T - B) * (1 - v / max); };
    [0, .5, 1].forEach(function (f) {
      el('line', { x1: L, x2: W - R, y1: y(max * f), y2: y(max * f), stroke: f ? 'var(--grid)' : 'var(--axis)', 'stroke-width': 1 }, svg);
      el('text', { x: L - 6, y: y(max * f) + 4, 'text-anchor': 'end' }, svg).textContent = num(max * f, max < 10 ? 1 : 0);
    });
    var slot = (W - L - R) / items.length, bw = Math.max(2, Math.min(28, slot - 2));
    var every = Math.ceil(items.length / Math.max(2, Math.floor((W - L - R) / 46)));
    var tip = tipFor(box);
    items.forEach(function (it, i) {
      var x = L + slot * i + (slot - bw) / 2, top = y(Math.max(0, it.value)), h = Math.max(0, y(0) - top);
      if (h > 0) {
        var r = Math.min(4, bw / 2, h);
        el('path', { d: 'M' + x + ',' + y(0) + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + r) + 'V' + y(0) + 'Z',
          fill: o.colorOf ? o.colorOf(it) : o.color }, svg);
      }
      if (i % every === 0) el('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }, svg).textContent = it.label;
      var hit = el('rect', { x: L + slot * i, y: T, width: slot, height: H - T - B, fill: 'transparent' }, svg);
      hit.addEventListener('mouseenter', function () { tip.show(it.tip, (x + bw / 2) / W * box.clientWidth, top / H * box.clientHeight); });
      hit.addEventListener('mouseleave', tip.hide);
      hit.addEventListener('click', function () { tip.show(it.tip, (x + bw / 2) / W * box.clientWidth, top / H * box.clientHeight); });
    });
    if (o.avg) {
      el('line', { x1: L, x2: W - R, y1: y(o.avg), y2: y(o.avg), stroke: 'var(--text-secondary)', 'stroke-width': 1.5 }, svg);
      var t = el('text', { x: W - R, y: y(o.avg) - 5, 'text-anchor': 'end', class: 'lbl' }, svg); t.textContent = o.avgLabel || ('avg ' + num(o.avg));
    }
  }

  /** Stacked bars of two parts (bottom = part a, top = part b), 2px gap between them. items [{label, a, b, tip}] */
  function stacked(box, items, o) {
    box.innerHTML = '';
    if (!items.length) { box.innerHTML = '<div class="empty-note">Not enough readings yet for this chart.</div>'; return; }
    var W = Math.max(box.clientWidth || 600, 280), H = o.height || 200, L = 36, R = 8, T = 14, B = 22;
    var max = niceMax(Math.max.apply(null, items.map(function (i) { return i.a + i.b; })));
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || '' }, box);
    var y = function (v) { return T + (H - T - B) * (1 - v / max); };
    [0, .5, 1].forEach(function (f) {
      el('line', { x1: L, x2: W - R, y1: y(max * f), y2: y(max * f), stroke: f ? 'var(--grid)' : 'var(--axis)', 'stroke-width': 1 }, svg);
      el('text', { x: L - 6, y: y(max * f) + 4, 'text-anchor': 'end' }, svg).textContent = num(max * f, 0);
    });
    var slot = (W - L - R) / items.length, bw = Math.max(2, Math.min(28, slot - 2));
    var every = Math.ceil(items.length / Math.max(2, Math.floor((W - L - R) / 46)));
    var tip = tipFor(box);
    items.forEach(function (it, i) {
      var x = L + slot * i + (slot - bw) / 2, ya = y(it.a), yb = y(it.a + it.b);
      if (it.a > 0) el('rect', { x: x, y: ya, width: bw, height: Math.max(0, y(0) - ya), fill: o.colorA }, svg);
      if (it.b > 0) {
        var top = yb, bot = ya - (it.a > 0 ? 2 : 0), r = Math.min(4, bw / 2, Math.max(0, bot - top));
        if (bot > top) el('path', { d: 'M' + x + ',' + bot + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + r) + 'V' + bot + 'Z', fill: o.colorB }, svg);
      }
      if (i % every === 0) el('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }, svg).textContent = it.label;
      var hit = el('rect', { x: L + slot * i, y: T, width: slot, height: H - T - B, fill: 'transparent' }, svg);
      var show = function () { tip.show(it.tip, (x + bw / 2) / W * box.clientWidth, yb / H * box.clientHeight); };
      hit.addEventListener('mouseenter', show); hit.addEventListener('click', show); hit.addEventListener('mouseleave', tip.hide);
    });
  }

  /** Diverging bars around zero (above usual = series-2 orange, below = series-1 blue). items [{label, value, tip}] */
  function diverging(box, items, o) {
    box.innerHTML = '';
    if (!items.length) { box.innerHTML = '<div class="empty-note">Not enough readings yet for this chart.</div>'; return; }
    var W = Math.max(box.clientWidth || 600, 280), H = o.height || 170, L = 36, R = 8, T = 12, B = 22;
    var m = niceMax(Math.max.apply(null, items.map(function (i) { return Math.abs(i.value); })));
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || '' }, box);
    var y = function (v) { return T + (H - T - B) * (0.5 - v / (2 * m)); };
    [m, 0, -m].forEach(function (v) {
      el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: v ? 'var(--grid)' : 'var(--neutral)', 'stroke-width': 1 }, svg);
      el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = (v > 0 ? '+' : '') + num(v, 1);
    });
    var slot = (W - L - R) / items.length, bw = Math.max(2, Math.min(28, slot - 2));
    var every = Math.ceil(items.length / Math.max(2, Math.floor((W - L - R) / 46)));
    var tip = tipFor(box);
    items.forEach(function (it, i) {
      var x = L + slot * i + (slot - bw) / 2, y0 = y(0), y1 = y(it.value), r = Math.min(4, bw / 2, Math.abs(y1 - y0));
      if (Math.abs(y1 - y0) > 0.5) {
        var d = it.value > 0
          ? 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y1 + ' ' + (x + bw) + ',' + (y1 + r) + 'V' + y0 + 'Z'
          : 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y1 + ' ' + (x + bw) + ',' + (y1 - r) + 'V' + y0 + 'Z';
        el('path', { d: d, fill: it.value > 0 ? 'var(--series-2)' : 'var(--series-1)' }, svg);
      }
      if (i % every === 0) el('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }, svg).textContent = it.label;
      var hit = el('rect', { x: L + slot * i, y: T, width: slot, height: H - T - B, fill: 'transparent' }, svg);
      var show = function () { tip.show(it.tip, (x + bw / 2) / W * box.clientWidth, Math.min(y0, y1) / H * box.clientHeight); };
      hit.addEventListener('mouseenter', show); hit.addEventListener('click', show); hit.addEventListener('mouseleave', tip.hide);
    });
  }

  /** Line with markers, optional threshold line and event markers. pts [{t (ms), value, tip}] ; o {min, max, unit, threshold, thresholdLabel, events [{t, label}]} */
  function line(box, pts, o) {
    box.innerHTML = '';
    if (pts.length < 2) { box.innerHTML = '<div class="empty-note">Not enough readings yet for this chart.</div>'; return; }
    var W = Math.max(box.clientWidth || 600, 280), H = o.height || 190, L = 36, R = 10, T = 14, B = 22;
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t, lo = o.min, hi = o.max;
    var x = function (t) { return L + (W - L - R) * (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)); };
    var y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.title || '' }, box);
    [lo, (lo + hi) / 2, hi].forEach(function (v, i) {
      el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: i ? 'var(--grid)' : 'var(--axis)', 'stroke-width': 1 }, svg);
      el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = num(v, 0) + (o.unit || '');
    });
    if (o.threshold !== undefined) {
      el('line', { x1: L, x2: W - R, y1: y(o.threshold), y2: y(o.threshold), stroke: 'var(--bad)', 'stroke-width': 1.5 }, svg);
      el('text', { x: W - R, y: y(o.threshold) - 5, 'text-anchor': 'end', class: 'lbl' }, svg).textContent = o.thresholdLabel || '';
    }
    (o.events || []).forEach(function (e) {
      if (e.t < t0 || e.t > t1) return;
      el('line', { x1: x(e.t), x2: x(e.t), y1: T, y2: H - B, stroke: 'var(--axis)', 'stroke-width': 1 }, svg);
      el('text', { x: x(e.t) + 3, y: T + 8, class: 'lbl' }, svg).textContent = e.label;
    });
    var nTicks = Math.max(2, Math.floor((W - L - R) / 70));
    for (var k = 0; k <= nTicks; k++) {
      var tt = t0 + (t1 - t0) * k / nTicks;
      el('text', { x: x(tt), y: H - 6, 'text-anchor': k === 0 ? 'start' : k === nTicks ? 'end' : 'middle' }, svg).textContent = dayLabel(new Date(tt).toISOString().slice(0, 10));
    }
    el('path', { d: pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p.t) + ',' + y(p.value); }).join(''), fill: 'none', stroke: o.color, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    var tip = tipFor(box), cross = el('line', { y1: T, y2: H - B, stroke: 'var(--text-muted)', 'stroke-width': 1, opacity: 0 }, svg);
    var dot = el('circle', { r: 5, fill: o.color, stroke: 'var(--surface-1)', 'stroke-width': 2, opacity: 0 }, svg);
    if (pts.length <= 40) pts.forEach(function (p) { el('circle', { cx: x(p.t), cy: y(p.value), r: 3, fill: o.color, stroke: 'var(--surface-1)', 'stroke-width': 1.5 }, svg); });
    var hit = el('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' }, svg);
    var move = function (ev) {
      var r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) / r.width * W, best = pts[0];
      pts.forEach(function (p) { if (Math.abs(x(p.t) - mx) < Math.abs(x(best.t) - mx)) best = p; });
      cross.setAttribute('x1', x(best.t)); cross.setAttribute('x2', x(best.t)); cross.setAttribute('opacity', 1);
      dot.setAttribute('cx', x(best.t)); dot.setAttribute('cy', y(best.value)); dot.setAttribute('opacity', 1);
      tip.show(best.tip, x(best.t) / W * box.clientWidth, y(best.value) / H * box.clientHeight);
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('click', move);
    hit.addEventListener('mouseleave', function () { tip.hide(); cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); });
  }

  /** Fuel tank infographic. */
  function tankSvg(pct, lowPct) {
    var h = 150, top = 10, bh = h - 20, lvl = Math.max(0, Math.min(100, pct || 0)), fy = top + bh * (1 - lvl / 100), ly = top + bh * (1 - lowPct / 100);
    var col = pct < lowPct / 2 ? 'var(--bad)' : pct < lowPct ? 'var(--warn)' : 'var(--series-1)';
    return '<svg viewBox="0 0 92 ' + h + '" role="img" aria-label="Fuel tank ' + lvl + '%">' +
      '<rect x="14" y="' + top + '" width="64" height="' + bh + '" rx="10" fill="var(--grid)"/>' +
      '<clipPath id="tk"><rect x="14" y="' + top + '" width="64" height="' + bh + '" rx="10"/></clipPath>' +
      '<rect clip-path="url(#tk)" x="14" y="' + fy + '" width="64" height="' + (top + bh - fy) + '" fill="' + col + '"/>' +
      '<line x1="8" x2="84" y1="' + ly + '" y2="' + ly + '" stroke="var(--bad)" stroke-width="1.5"/>' +
      '<text x="46" y="' + Math.max(top + 16, fy - 6) + '" text-anchor="middle" style="font:700 15px Inter,sans-serif;fill:' + (fy < top + 20 ? '#fff' : 'var(--text-primary)') + '">' + lvl + '%</text>' +
      '<text x="88" y="' + (ly + 4) + '" text-anchor="end" style="font:10px Inter,sans-serif;fill:var(--bad)"></text></svg>';
  }

  /* ---------------- page ---------------- */
  function stat(k, v, unit, n) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + v + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div><div class="n">' + (n || '') + '</div></div>'; }
  function legend(items) { return '<div class="legend">' + items.map(function (i) { return '<span><i style="background:' + i[0] + '"></i>' + esc(i[1]) + '</span>'; }).join('') + '</div>'; }

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
