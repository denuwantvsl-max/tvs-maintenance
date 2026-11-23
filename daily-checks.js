/* TVS Horana CMMS – public status page of the operator daily checks for a group leader.
   daily-checks.html?g=forklift (Stores in charge) or ?g=delivery (Delivery in charge). View only, refreshes every 5 minutes. */
(function () {
  'use strict';
  var C = window.CMMS, esc = C.esc, t = C.t;

  C.addDict({
    dcViewOnly: ['VIEW ONLY', 'බැලීමට පමණි'],
    dcTitle: ['Daily checks', 'දෛනික පරීක්ෂා'],
    dcToday: ['Today', 'අද'],
    dcUpdated: ['Updated', 'යාවත්කාලීන කළේ'],
    dcRefresh: ['Refresh', 'නැවුම් කරන්න'],
    dcDone: ['Done – OK', 'කළා – හරි'],
    dcProblem: ['Problems found', 'ගැටලු ඇත'],
    dcMissing: ['Not done', 'කර නැත'],
    dcWaiting: ['Not done yet', 'තවම කර නැත'],
    dcOff: ['Day off', 'නිවාඩු දිනය'],
    dcDueBy: ['Checks are due by {h}:00. {n} still to do.', 'පරීක්ෂා {h}:00 ට පෙර කළ යුතුය. තව {n} ක් ඉතිරියි.'],
    dcAllDone: ['All checks done today.', 'අද සියලු පරීක්ෂා කර ඇත.'],
    dcLateMissing: ['{n} not done by {h}:00.', '{h}:00 වන විට {n} ක් කර නැත.'],
    dcNotWorkday: ['Today is not a working day.', 'අද වැඩ කරන දිනයක් නොවේ.'],
    dcBy: ['by', 'කළේ'],
    dcLate: ['after {h}:00', '{h}:00 න් පසු'],
    dcJob: ['Job', 'රැකියාව'],
    dcOpenJobs: ['Open maintenance jobs', 'විවෘත නඩත්තු රැකියා'],
    dcWeek: ['Last 7 days', 'පසුගිය දින 7'],
    dcKeyOk: ['✓ done, OK', '✓ කළා, හරි'],
    dcKeyPb: ['! problems', '! ගැටලු'],
    dcKeyMs: ['✗ not done', '✗ කර නැත'],
    dcNoTask: ['Daily check not set up for this machine.', 'මෙම යන්ත්‍රයට දෛනික පරීක්ෂාව සකසා නැත.'],
    dcNoGroup: ['Open this page with ?g=forklift or ?g=delivery', 'මෙම පිටුව ?g=forklift හෝ ?g=delivery සමඟ විවෘත කරන්න'],
    dcNotStarted: ['Not started yet', 'තවම ආරම්භ කර නැත'],
    dcBefore: ['Before the daily checks started', 'දෛනික පරීක්ෂා ආරම්භ කිරීමට පෙර'],
    dcStarts: ['Daily checks start on {d}.', 'දෛනික පරීක්ෂා {d} දින ආරම්භ වේ.'],
    dcRemarks: ['Remarks', 'සටහන්'],
    dcPhoto: ['photo', 'ඡායාරූපය']
  });

  var out = document.getElementById('out');
  var g = (C.param('g') || '').toLowerCase();
  var X = null, timer = null;
  C.initLangButton();
  document.addEventListener('langchange', function () { if (X) render(); });

  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
  function hhmm(iso) { var d = new Date(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  var STATE = { ok: 'dcDone', problem: 'dcProblem', missing: 'dcMissing', waiting: 'dcWaiting', off: 'dcOff', before: 'dcNotStarted' };
  var ICON = { ok: '✓', problem: '!', missing: '✗', waiting: '·', off: '–', before: '' };

  function load() {
    if (!g) { out.innerHTML = '<div class="msg err">' + esc(t('dcNoGroup')) + '</div>'; return; }
    C.api('opStatus', { g: g }).then(function (x) { X = x; render(); })
      .catch(function (e) { if (!X) out.innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
    clearTimeout(timer);
    timer = setTimeout(load, 5 * 60 * 1000);
  }

  function render() {
    var x = X, c = x.counts, si = C.lang() === 'si';
    document.title = t('dcTitle') + ' – ' + x.group.title + ' – TVS Horana';
    var h = '<div class="dc-head"><div><div class="muted small">' + esc(t('dcTitle')) + '</div><h1>' + esc(si ? x.group.titleSi : x.group.title) + '</h1>' +
      '<div class="muted small">' + esc(t('dcToday')) + ' · ' + esc(C.fmtDate(x.now, false)) + '</div></div>' +
      '<div class="dc-upd">' + esc(t('dcUpdated')) + ' ' + esc(hhmm(x.now)) + ' <button class="btn ghost sm" type="button" id="rf">↻ ' + esc(t('dcRefresh')) + '</button></div></div>';

    var notYet = c.waiting, done = c.ok + c.problem;
    h += '<div class="tiles4"><div class="tl ok"><b>' + done + '<small style="font-size:14px;color:var(--muted)"> / ' + c.total + '</small></b><span>' + esc(t('dcDone').split(' –')[0]) + '</span></div>' +
      '<div class="tl pb"><b>' + c.problem + '</b><span>' + esc(t('dcProblem')) + '</span></div>' +
      '<div class="tl ' + (c.missing ? 'ms' : 'wt') + '"><b>' + (c.missing + notYet) + '</b><span>' + esc(t(c.missing ? 'dcMissing' : 'dcWaiting')) + '</span></div></div>';
    if (x.startDay && x.days[x.days.length - 1].date < x.startDay) h += '<div class="dl info">' + esc(fill(t('dcStarts'), { d: C.fmtDate(x.startDay + 'T12:00:00', false) })) + '</div>';
    else if (!x.workday) h += '<div class="dl info">' + esc(t('dcNotWorkday')) + '</div>';
    else if (c.missing) h += '<div class="dl bad">⏰ ' + esc(fill(t('dcLateMissing'), { n: c.missing, h: x.byHour })) + '</div>';
    else if (notYet) h += '<div class="dl info">' + esc(fill(t('dcDueBy'), { n: notYet, h: x.byHour })) + '</div>';
    else h += '<div class="dl good">✓ ' + esc(t('dcAllDone')) + '</div>';

    x.machines.forEach(function (m) {
      var td = m.today;
      h += '<div class="card mc ' + esc(td.state) + '"><div class="top"><div><div class="mid">' + esc(m.id) + '</div><div class="mname">' + esc(m.name) + '</div></div>' +
        '<span class="stt ' + esc(td.state) + '">' + esc(t(STATE[td.state])) + '</span></div>';
      if (!m.set) h += '<div class="muted small" style="margin-top:6px">' + esc(t('dcNoTask')) + '</div>';
      td.records.forEach(function (r) {
        var late = new Date(r.at).getHours() >= x.byHour;
        h += '<div class="rec">🕘 <b>' + esc(hhmm(r.at)) + '</b> ' + esc(t('dcBy')) + ' <b>' + esc(r.by) + '</b>' +
          (late ? '<span class="late">' + esc(fill(t('dcLate'), { h: x.byHour })) + '</span>' : '') +
          ' · ' + (r.notOk ? '⚠️ ' + r.notOk : '✓ ' + r.ok) +
          (r.photoUrl ? ' · <a href="' + esc(r.photoUrl) + '" target="_blank" rel="noopener">📷 ' + esc(t('dcPhoto')) + '</a>' : '');
        if (r.problems.length) h += '<ul>' + r.problems.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
        if (r.remarks) h += '<div class="small muted" style="margin-top:4px">' + esc(t('dcRemarks')) + ': ' + esc(r.remarks) + '</div>';
        if (r.woId) h += '<div class="jb">' + esc(t('dcJob')) + ' <a href="track.html?id=' + encodeURIComponent(r.woId) + '">' + esc(r.woId) + '</a> ' + (r.woStatus ? C.statusPill(r.woStatus) : '') + '</div>';
        h += '</div>';
      });
      var shown = {};
      td.records.forEach(function (r) { if (r.woId) shown[r.woId] = 1; });
      var other = m.openJobs.filter(function (j) { return !shown[j.id]; });
      if (other.length) {
        h += '<div class="ojobs"><b>' + esc(t('dcOpenJobs')) + '</b>' + other.map(function (j) {
          return '<div><a href="track.html?id=' + encodeURIComponent(j.id) + '">' + esc(j.id) + '</a> ' + C.statusPill(j.status) + ' ' +
            esc(j.description.split('\n')[0].slice(0, 110)) + '</div>';
        }).join('') + '</div>';
      }
      h += '</div>';
    });

    h += '<div class="card"><h3 style="margin-top:0">' + esc(t('dcWeek')) + '</h3><div style="overflow-x:auto"><table class="wk"><thead><tr><th></th>' +
      x.days.map(function (d, i) {
        var dt = new Date(d.date + 'T12:00:00');
        return '<th class="' + (i === x.days.length - 1 ? 'today' : '') + '">' + esc(d.dow) + '<small>' + dt.getDate() + '</small></th>';
      }).join('') + '</tr></thead><tbody>' +
      x.machines.map(function (m) {
        return '<tr><td>' + esc(m.id) + '</td>' + m.week.map(function (w, i) {
          var who = w.records.map(function (r) { return hhmm(r.at) + ' ' + r.by; }).join(', ');
          return '<td class="' + (i === m.week.length - 1 ? 'today' : '') + '"><i class="' + esc(w.state) + '" title="' + esc(t(STATE[w.state]) + (who ? ' – ' + who : '')) + '">' + ICON[w.state] + '</i></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="keyrow"><span>' + esc(t('dcKeyOk')) + '</span><span>' + esc(t('dcKeyPb')) + '</span><span>' + esc(t('dcKeyMs')) + '</span></div></div>';

    out.innerHTML = h;
    document.getElementById('rf').addEventListener('click', function () { this.disabled = true; load(); });
  }

  out.innerHTML = C.loadingHtml();
  load();
})();
