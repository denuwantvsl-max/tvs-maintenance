/* TVS Horana CMMS – shared SVG chart helpers (insights.html, generator-log.html). Plain SVG + hover/tap tooltips, no libraries.
   Colours come from CSS roles on .viz (viz.css). */
(function () {
  'use strict';
  var esc = CMMS.esc;
  var NS = 'http://www.w3.org/2000/svg';
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
    // short spans (< 2 days): only the two ends, with the time; otherwise evenly spaced dates
    var shortSpan = t1 - t0 < 2 * 86400000, nTicks = shortSpan ? 1 : Math.max(2, Math.min(Math.round((t1 - t0) / 86400000), Math.floor((W - L - R) / 70)));
    var stamp = function (tt) { var dd = new Date(tt); return dd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + (shortSpan ? ' ' + dd.toTimeString().slice(0, 5) : ''); };
    for (var k = 0; k <= nTicks; k++) {
      var tt = t0 + (t1 - t0) * k / nTicks;
      el('text', { x: x(tt), y: H - 6, 'text-anchor': k === 0 ? 'start' : k === nTicks ? 'end' : 'middle' }, svg).textContent = stamp(tt);
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

  window.Viz = { num: num, dayLabel: dayLabel, dayLong: dayLong, mean: mean, sd: sd, el: el, niceMax: niceMax, daily: daily, tipFor: tipFor, bars: bars, stacked: stacked, diverging: diverging, line: line, tankSvg: tankSvg, stat: stat, legend: legend };
})();
