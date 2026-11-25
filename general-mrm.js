/* General MRM page: take the monthly plant meeting (minutes + review of open actions + new actions), list past
   meetings, follow up every action. No login (Denuwan's own page). Data: CMMS API actions mrmHome / mrmMeetingSave /
   mrmActionSave. A meeting being typed is kept in this browser (localStorage) until it is saved. */
(function () {
  'use strict';
  var C = window.CMMS, esc = C.esc;
  var DRAFT_KEY = 'gmrm_draft';
  var NAMES = ['Kaushal Allis', 'Denuwan Chamara', 'Kalpa Siriwardena', 'Pasindu Padipperuma', 'Chathura Jayalath', 'Aruna Wijesinghe',
    'Malindu Kaluthanthri', 'Supun Nelantha', 'Shantha Sanjeewa', 'Hirushan Akalanka', 'Gayan', 'Chathuranga Dias'];
  var AGENDA = '1. Review of open action items\n2. Safety, fire and 5S\n3. Maintenance and utilities\n4. Production and quality issues\n5. Stores, logistics and suppliers\n6. New items\n7. Any other business';
  var S = { data: null, view: 'meet', actFilter: 'open', openAct: '', meeting: null };

  function $(id) { return document.getElementById(id); }
  function today() { return S.data ? S.data.today : new Date().toISOString().slice(0, 10); }
  function fmtD(d) {
    if (!d) return '—';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); if (!m) return d;
    return Number(m[3]) + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m[2]) - 1] + '-' + m[1];
  }
  function msg(type, text) { $('msg').innerHTML = text ? '<div class="msg ' + type + '">' + esc(text) + '</div>' : ''; if (text) window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function sevTag(s) { return '<span class="tag ' + esc(s) + '">' + esc(s) + '</span>'; }
  function stTag(a) {
    if (a.status === 'Done') return '<span class="tag done">Done' + (a.doneAt ? ' ' + esc(fmtD(a.doneAt)) : '') + '</span>';
    if (a.status === 'Dropped') return '<span class="tag drop">Dropped</span>';
    if (a.status === 'In progress') return '<span class="tag prog">In progress</span>';
    return '';
  }
  function carriedTag(a) { return a.carried >= 2 ? '<span class="tag chronic">Carried ×' + a.carried + '</span>' : ''; }
  function targetTxt(a) { return a.target ? (a.overdue ? '<span class="late">⏰ ' + esc(fmtD(a.target)) + '</span>' : esc(fmtD(a.target))) : 'no date'; }

  /* ---------------- load ---------------- */
  function load() {
    return C.api('mrmHome').then(function (d) { S.data = d; renderAll(); })
      .catch(function (e) { $('pending').innerHTML = ''; msg('err', e.message); });
  }
  function renderAll() { renderKpis(); renderPending(); renderView(); }

  function renderKpis() {
    var s = S.data.stats;
    $('kpis').innerHTML = [
      ['Open actions', s.open, false], ['Overdue', s.overdue, s.overdue > 0], ['Critical open', s.critical, s.critical > 0],
      ['Chronic (carried 3+)', s.chronic, s.chronic > 0], ['Last meeting', s.lastMeeting ? fmtD(s.lastMeeting) : '—', false]
    ].map(function (k) { return '<div class="kpi' + (k[2] ? ' alert' : '') + '"><b>' + esc(k[1]) + '</b><span>' + esc(k[0]) + '</span></div>'; }).join('');
  }

  function renderPending() {
    var open = S.data.actions.filter(function (a) { return a.open; });
    $('pendCount').textContent = open.length + ' open';
    $('pending').innerHTML = open.length ? open.map(function (a) {
      return '<button type="button" class="pend ' + esc(a.severity) + '" data-goto="' + esc(a.id) + '"><b>' + esc(a.item) + '</b>' +
        '<div class="meta">👤 ' + esc(a.owner || '—') + ' · ' + targetTxt(a) + ' ' + carriedTag(a) + stTag(a) + '</div></button>';
    }).join('') : '<div class="muted small">Nothing pending. 🎉</div>';
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]'); if (!g) return;
    S.actFilter = 'all'; S.openAct = g.getAttribute('data-goto'); showView('acts');
    setTimeout(function () { var el = document.querySelector('[data-act="' + S.openAct + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
  });

  /* ---------------- views ---------------- */
  function showView(v) {
    S.view = v;
    document.querySelectorAll('#views .chip').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === v); });
    ['meet', 'list', 'acts'].forEach(function (n) { $('v-' + n).classList.toggle('hidden', n !== v); });
    renderView();
  }
  $('views').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]'); if (!b) return;
    msg(); if (b.getAttribute('data-view') === 'list') S.meeting = null; showView(b.getAttribute('data-view'));
  });
  function renderView() {
    if (S.view === 'meet') renderMeet();
    if (S.view === 'list') renderList();
    if (S.view === 'acts') renderActs();
  }

  /* ---------------- take a meeting ---------------- */
  function blankDraft() {
    return { id: '', date: today(), title: 'Monthly MRM', chair: 'Denuwan Chamara', attendees: '', agenda: AGENDA, minutes: '', decisions: '',
      nextDate: '', momUrl: '', reviews: {}, newActions: [{ item: '', owner: '', target: '', severity: 'medium', category: '' }] };
  }
  function getDraft() {
    var d = null; try { d = JSON.parse(C.store.get(DRAFT_KEY) || 'null'); } catch (e) { d = null; }
    return d || blankDraft();
  }
  function putDraft(d) { C.store.set(DRAFT_KEY, JSON.stringify(d)); }

  function renderMeet() {
    var d = getDraft(), open = S.data.actions.filter(function (a) { return a.open; });
    var att = d.attendees.split(/\s*,\s*/).filter(String);
    var html = '<div class="card">' +
      (d.id ? '<div class="msg info">Editing ' + esc(d.id) + '. <button type="button" class="btn sm ghost" id="newBlank">Start a new meeting instead</button></div>' :
        '<p class="muted small" style="margin-top:0">What you type is kept in this browser until you save, so nothing is lost if the page closes.</p>') +
      '<div class="gm-row"><div><label class="f">Meeting date</label><input type="date" data-f="date" value="' + esc(d.date) + '"></div>' +
      '<div><label class="f">Title</label><input type="text" data-f="title" value="' + esc(d.title) + '"></div>' +
      '<div><label class="f">Chaired by</label><input type="text" data-f="chair" value="' + esc(d.chair) + '"></div></div>' +
      '<label class="f">Attendees <span class="opt">tap names, or type (comma separated)</span></label>' +
      '<div class="gm-names" id="names">' + NAMES.map(function (n) { return '<button type="button" class="chip' + (att.indexOf(n) >= 0 ? ' on' : '') + '" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div>' +
      '<input type="text" data-f="attendees" value="' + esc(d.attendees) + '">' +
      '<label class="f">Agenda</label><textarea rows="6" data-f="agenda">' + esc(d.agenda) + '</textarea>' +
      '</div>';

    if (!d.id) {
      html += '<div class="gm-sec">Review of open actions <small>' + open.length + ' open · change only what was discussed</small></div>' +
        open.map(function (a) {
          var r = d.reviews[a.id] || {};
          var ch = r.status || r.target || r.note;
          return '<div class="rv' + (ch ? ' changed' : '') + '" data-rv="' + esc(a.id) + '"><div class="hd"><b>' + esc(a.item) + '</b>' + sevTag(a.severity) + carriedTag(a) + stTag(a) + '</div>' +
            '<div class="meta">' + esc(a.id) + ' · 👤 ' + esc(a.owner || '—') + ' · target ' + targetTxt(a) + (a.progress ? ' · last: ' + esc(a.progress) : '') + '</div>' +
            '<div class="ctl"><select data-r="status"><option value="">Status: no change</option>' +
            ['Open', 'In progress', 'Done', 'Dropped'].map(function (s) { return '<option' + (r.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
            '<input type="date" data-r="target" title="New target date" value="' + esc(r.target || '') + '">' +
            '<input type="text" class="note" data-r="note" placeholder="What was said / progress" value="' + esc(r.note || '') + '"></div></div>';
        }).join('');
      html += '<div class="gm-sec">New actions raised</div><div class="card" id="newActs">' + d.newActions.map(naRow).join('') +
        '<button type="button" class="btn sm ghost" id="addNa">＋ Add another action</button></div>';
    }

    html += '<div class="card" style="margin-top:14px"><label class="f" style="margin-top:0">Discussion / minutes</label><textarea rows="8" data-f="minutes" placeholder="Main points discussed, item by item">' + esc(d.minutes) + '</textarea>' +
      '<label class="f">Decisions</label><textarea rows="4" data-f="decisions">' + esc(d.decisions) + '</textarea>' +
      '<div class="gm-row"><div><label class="f">Next meeting</label><input type="date" data-f="nextDate" value="' + esc(d.nextDate) + '"></div>' +
      '<div><label class="f">Signed MOM on Drive <span class="opt">(optional link)</span></label><input type="url" data-f="momUrl" placeholder="https://drive.google.com/file/d/…" value="' + esc(d.momUrl) + '"></div></div>' +
      '<div class="btn-row" style="margin-top:14px"><button type="button" class="btn ghost" data-save="Draft">Save as draft</button><button type="button" class="btn dark" data-save="Final">Save as final</button></div>' +
      '<div class="btn-row" style="margin-top:8px"><button type="button" class="btn sm ghost" id="clearDraft">Clear this form</button></div></div>';
    $('v-meet').innerHTML = html;
  }
  function naRow(n, i) {
    return '<div class="na" data-na="' + i + '"><input class="item" type="text" data-n="item" placeholder="Action" value="' + esc(n.item) + '">' +
      '<input type="text" data-n="owner" placeholder="Owner" value="' + esc(n.owner) + '">' +
      '<input type="date" data-n="target" value="' + esc(n.target) + '">' +
      '<select data-n="severity">' + ['critical', 'high', 'medium', 'low'].map(function (s) { return '<option' + (n.severity === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="x" data-delna="' + i + '" title="Remove">×</button></div>';
  }

  $('v-meet').addEventListener('input', onMeetInput);
  $('v-meet').addEventListener('change', onMeetInput);
  function onMeetInput(e) {
    var el = e.target, d = getDraft();
    if (el.hasAttribute('data-f')) d[el.getAttribute('data-f')] = el.value;
    var rv = el.closest('[data-rv]');
    if (rv && el.hasAttribute('data-r')) {
      var id = rv.getAttribute('data-rv'), r = d.reviews[id] || {};
      r[el.getAttribute('data-r')] = el.value; d.reviews[id] = r;
      rv.classList.toggle('changed', !!(r.status || r.target || r.note));
    }
    var na = el.closest('[data-na]');
    if (na && el.hasAttribute('data-n')) d.newActions[Number(na.getAttribute('data-na'))][el.getAttribute('data-n')] = el.value;
    if (el.getAttribute('data-f') === 'attendees') {
      var att = el.value.split(/\s*,\s*/);
      document.querySelectorAll('#names [data-name]').forEach(function (b) { b.classList.toggle('on', att.indexOf(b.getAttribute('data-name')) >= 0); });
    }
    putDraft(d);
  }
  $('v-meet').addEventListener('click', function (e) {
    var d = getDraft(), b;
    if ((b = e.target.closest('[data-name]'))) {
      var n = b.getAttribute('data-name'), att = d.attendees.split(/\s*,\s*/).filter(String), i = att.indexOf(n);
      if (i >= 0) att.splice(i, 1); else att.push(n);
      d.attendees = att.join(', '); putDraft(d);
      b.classList.toggle('on', i < 0); document.querySelector('[data-f="attendees"]').value = d.attendees;
    } else if (e.target.id === 'addNa') {
      d.newActions.push({ item: '', owner: '', target: '', severity: 'medium', category: '' }); putDraft(d); renderMeet();
      var items = document.querySelectorAll('#newActs .na .item'); if (items.length) items[items.length - 1].focus();
    } else if ((b = e.target.closest('[data-delna]'))) {
      d.newActions.splice(Number(b.getAttribute('data-delna')), 1);
      if (!d.newActions.length) d.newActions.push({ item: '', owner: '', target: '', severity: 'medium', category: '' });
      putDraft(d); renderMeet();
    } else if (e.target.id === 'clearDraft' || e.target.id === 'newBlank') {
      if (e.target.id === 'clearDraft' && !confirm('Clear everything typed in this form?')) return;
      C.store.del(DRAFT_KEY); renderMeet();
    } else if ((b = e.target.closest('[data-save]'))) {
      saveMeeting(b.getAttribute('data-save'), b);
    }
  });

  function saveMeeting(status, btn) {
    var d = getDraft();
    if (!d.date) { msg('err', 'Pick the meeting date.'); return; }
    var reviews = Object.keys(d.reviews).map(function (id) {
      var r = d.reviews[id]; return (r.status || r.target || r.note) ? { id: id, status: r.status || '', target: r.target || '', note: r.note || '' } : null;
    }).filter(Boolean);
    var newActions = d.newActions.filter(function (n) { return n.item && n.item.trim(); });
    btn.disabled = true; btn.textContent = 'Saving…';
    C.api('mrmMeetingSave', {
      m: { id: d.id, date: d.date, title: d.title, chair: d.chair, attendees: d.attendees, agenda: d.agenda, minutes: d.minutes,
        decisions: d.decisions, nextDate: d.nextDate, momUrl: d.momUrl, status: status },
      reviews: d.id ? [] : reviews, newActions: d.id ? [] : newActions
    }).then(function (r) {
      C.store.del(DRAFT_KEY);
      return load().then(function () {
        S.meeting = r.id; showView('list');
        msg('ok', 'Saved ' + r.id + ' (' + status.toLowerCase() + ')' + (d.id ? '' : ': ' + r.reviewed + ' action(s) updated, ' + r.added + ' new.') + ' Use "Print / Save as PDF" for the signed MOM.');
      });
    }).catch(function (e) { msg('err', e.message); btn.disabled = false; btn.textContent = status === 'Final' ? 'Save as final' : 'Save as draft'; });
  }

  /* ---------------- meetings ---------------- */
  function renderList() {
    if (S.meeting) { renderMeeting(S.meeting); return; }
    var ms = S.data.meetings;
    $('v-list').innerHTML = ms.length ? ms.map(function (m) {
      var n = S.data.actions.filter(function (a) { return a.meetingId === m.id; }).length;
      return '<button type="button" class="mt" data-meet="' + esc(m.id) + '"><span class="d">' + esc(fmtD(m.date)) + '</span><span style="flex:1;min-width:0"><b>' + esc(m.title) + '</b> ' +
        '<span class="tag ' + (m.status === 'Final' ? 'final' : 'draft') + '">' + esc(m.status) + '</span><div class="s">' + esc(m.id) +
        (n ? ' · ' + n + ' action(s) raised' : '') + (m.momUrl ? ' · 📄 MOM on Drive' : '') + '</div></span><span class="arrow">›</span></button>';
    }).join('') : '<div class="muted center" style="padding:24px">No meetings yet.</div>';
  }
  $('v-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-meet]'); if (b) { S.meeting = b.getAttribute('data-meet'); msg(); renderList(); window.scrollTo({ top: 0 }); return; }
    if (e.target.id === 'backList') { S.meeting = null; msg(); renderList(); return; }
    if (e.target.id === 'printMeet') { printMeeting(S.meeting); return; }
    if (e.target.id === 'editMeet') {
      var m = findMeeting(S.meeting);
      putDraft({ id: m.id, date: m.date, title: m.title, chair: m.chair, attendees: m.attendees, agenda: m.agenda, minutes: m.minutes, decisions: m.decisions,
        nextDate: m.nextDate, momUrl: m.momUrl, reviews: {}, newActions: [] });
      showView('meet'); window.scrollTo({ top: 0 });
    }
  });
  function findMeeting(id) { return S.data.meetings.filter(function (m) { return m.id === id; })[0]; }
  function reviewedAt(id) {
    var out = [];
    S.data.actions.forEach(function (a) {
      if (a.meetingId === id) return;
      a.history.split('\n').forEach(function (line) { var i = line.indexOf('(' + id + '): '); if (i >= 0) out.push({ a: a, said: line.slice(i + id.length + 4) }); });
    });
    return out;
  }
  function renderMeeting(id) {
    var m = findMeeting(id);
    if (!m) { S.meeting = null; renderList(); return; }
    var raised = S.data.actions.filter(function (a) { return a.meetingId === id; }), rev = reviewedAt(id);
    $('v-list').innerHTML = '<div class="btn-row"><button type="button" class="btn sm ghost" id="backList">‹ All meetings</button>' +
      '<button type="button" class="btn sm ghost" id="editMeet">✏️ Edit</button><button type="button" class="btn sm dark" id="printMeet">🖨️ Print / Save as PDF</button></div>' +
      '<div class="card" style="margin-top:10px"><h2 style="margin-top:0">' + esc(m.title) + ' — ' + esc(fmtD(m.date)) + ' <span class="tag ' + (m.status === 'Final' ? 'final' : 'draft') + '">' + esc(m.status) + '</span></h2>' +
      '<dl class="kv"><dt>Meeting</dt><dd>' + esc(m.id) + '</dd><dt>Chaired by</dt><dd>' + esc(m.chair || '—') + '</dd><dt>Attendees</dt><dd>' + esc(m.attendees || '—') + '</dd>' +
      (m.agenda ? '<dt>Agenda</dt><dd class="pre">' + esc(m.agenda) + '</dd>' : '') + (m.minutes ? '<dt>Minutes</dt><dd class="pre">' + esc(m.minutes) + '</dd>' : '') +
      (m.decisions ? '<dt>Decisions</dt><dd class="pre">' + esc(m.decisions) + '</dd>' : '') + '<dt>Next meeting</dt><dd>' + esc(fmtD(m.nextDate)) + '</dd>' +
      (m.momUrl ? '<dt>Signed MOM</dt><dd><a href="' + esc(m.momUrl) + '" target="_blank" rel="noopener">Open on Drive ↗</a></dd>' : '') + '</dl></div>' +
      (rev.length ? '<div class="gm-sec">Actions reviewed <small>' + rev.length + '</small></div><div class="card">' + rev.map(function (x) {
        return '<div style="margin:6px 0"><b>' + esc(x.a.item) + '</b> <span class="muted small">' + esc(x.a.id) + '</span><div class="small">' + esc(x.said) + '</div></div>';
      }).join('') + '</div>' : '') +
      (raised.length ? '<div class="gm-sec">New actions raised <small>' + raised.length + '</small></div><div class="card">' + raised.map(function (a) {
        return '<div style="margin:6px 0"><b>' + esc(a.item) + '</b> ' + sevTag(a.severity) + stTag(a) + '<div class="small muted">👤 ' + esc(a.owner || '—') + ' · ' + targetTxt(a) + '</div></div>';
      }).join('') + '</div>' : '');
  }

  function printMeeting(id) {
    var m = findMeeting(id); if (!m) return;
    var raised = S.data.actions.filter(function (a) { return a.meetingId === id; }), rev = reviewedAt(id);
    var openNow = S.data.actions.filter(function (a) { return a.open; });
    $('print').innerHTML = '<div style="display:flex;align-items:center;gap:12px"><img src="img/tvs-logo.png" alt="" width="32"><div><h1>Management Review Meeting — Minutes</h1>' +
      '<div>TVS Lanka (Pvt) Ltd · Vehicle Assembly Complex, Horana</div></div></div>' +
      '<table style="margin-top:10px"><tr><th style="width:22%">Meeting</th><td>' + esc(m.title) + ' (' + esc(m.id) + ')</td><th style="width:16%">Date</th><td>' + esc(fmtD(m.date)) + '</td></tr>' +
      '<tr><th>Chaired by</th><td>' + esc(m.chair || '') + '</td><th>Next meeting</th><td>' + esc(m.nextDate ? fmtD(m.nextDate) : '') + '</td></tr>' +
      '<tr><th>Attendees</th><td colspan="3">' + esc(m.attendees || '') + '</td></tr></table>' +
      (m.agenda ? '<h2>Agenda</h2><div class="pre">' + esc(m.agenda) + '</div>' : '') +
      (m.minutes ? '<h2>Discussion</h2><div class="pre">' + esc(m.minutes) + '</div>' : '') +
      (m.decisions ? '<h2>Decisions</h2><div class="pre">' + esc(m.decisions) + '</div>' : '') +
      (rev.length ? '<h2>Review of previous actions</h2><table><tr><th>Action</th><th>Owner</th><th>Discussed</th></tr>' + rev.map(function (x) {
        return '<tr><td>' + esc(x.a.item) + '</td><td>' + esc(x.a.owner) + '</td><td>' + esc(x.said) + '</td></tr>';
      }).join('') + '</table>' : '') +
      (raised.length ? '<h2>New actions</h2><table><tr><th>Action</th><th>Owner</th><th>Target</th><th>Priority</th></tr>' + raised.map(function (a) {
        return '<tr><td>' + esc(a.item) + '</td><td>' + esc(a.owner) + '</td><td>' + esc(fmtD(a.target)) + '</td><td>' + esc(a.severity) + '</td></tr>';
      }).join('') + '</table>' : '') +
      '<h2>Open actions after this meeting (' + openNow.length + ')</h2><table><tr><th>Action</th><th>Owner</th><th>Target</th><th>Status</th></tr>' + openNow.map(function (a) {
        return '<tr><td>' + esc(a.item) + (a.carried >= 2 ? ' (carried ×' + a.carried + ')' : '') + '</td><td>' + esc(a.owner) + '</td><td>' + esc(fmtD(a.target)) + '</td><td>' + esc(a.status) + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="sig"><div>Prepared by</div><div>Chaired by</div><div>Approved by</div></div>';
    window.print();
  }

  /* ---------------- all actions ---------------- */
  function renderActs() {
    var f = S.actFilter, list = S.data.actions.filter(function (a) {
      return f === 'all' || (f === 'open' && a.open) || (f === 'overdue' && a.overdue) || (f === 'done' && !a.open);
    });
    var cnt = { open: 0, overdue: 0, done: 0, all: S.data.actions.length };
    S.data.actions.forEach(function (a) { if (a.open) cnt.open++; if (a.overdue) cnt.overdue++; if (!a.open) cnt.done++; });
    $('v-acts').innerHTML = '<div class="chips" id="actF">' + [['open', 'Open'], ['overdue', 'Overdue'], ['done', 'Closed'], ['all', 'All']].map(function (x) {
      return '<button type="button" class="chip' + (f === x[0] ? ' on' : '') + '" data-af="' + x[0] + '">' + x[1] + ' <span class="n">' + cnt[x[0]] + '</span></button>';
    }).join('') + '<button type="button" class="chip" data-af="new">＋ New action</button></div>' +
      (S.openAct === 'new' ? '<div class="act" data-act="new"><div class="ed">' + editForm({ id: '', item: '', owner: '', category: '', target: '', severity: 'medium', status: 'Open', history: '' }) + '</div></div>' : '') +
      (list.length ? list.map(function (a) {
        return '<div class="act" data-act="' + esc(a.id) + '"><button type="button" data-toggle="' + esc(a.id) + '"><b>' + esc(a.item) + '</b> ' + sevTag(a.severity) + carriedTag(a) + stTag(a) +
          '<div class="meta">' + esc(a.id) + (a.category ? ' · ' + esc(a.category) : '') + ' · 👤 ' + esc(a.owner || '—') + ' · ' + targetTxt(a) + (a.progress ? ' · ' + esc(a.progress) : '') + '</div></button>' +
          (S.openAct === a.id ? '<div class="ed">' + editForm(a) + '</div>' : '') + '</div>';
      }).join('') : '<div class="muted center" style="padding:24px">Nothing here.</div>');
  }
  function editForm(a) {
    return '<div class="gm-row"><div style="grid-column:1/-1"><label class="f" style="margin-top:0">Action</label><input type="text" data-e="item" value="' + esc(a.item) + '"></div>' +
      '<div><label class="f">Owner</label><input type="text" data-e="owner" value="' + esc(a.owner) + '"></div>' +
      '<div><label class="f">Category</label><input type="text" data-e="category" value="' + esc(a.category) + '"></div>' +
      '<div><label class="f">Target</label><input type="date" data-e="target" value="' + esc(a.target) + '"></div>' +
      '<div><label class="f">Priority</label><select data-e="severity">' + ['critical', 'high', 'medium', 'low'].map(function (s) { return '<option' + (a.severity === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="f">Status</label><select data-e="status">' + ['Open', 'In progress', 'Done', 'Dropped'].map(function (s) { return '<option' + (a.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="f">Progress note <span class="opt">(added to the history)</span></label><input type="text" data-e="note" placeholder="What happened since last time">' +
      (a.history ? '<div class="hist">' + esc(a.history) + '</div>' : '') +
      '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn dark sm" data-asave="' + esc(a.id) + '">Save</button>' +
      (a.id ? '<button type="button" class="btn ghost sm" data-aremove="' + esc(a.id) + '">Remove (entered by mistake)</button>' : '') + '</div>';
  }
  $('v-acts').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-af]'))) {
      var v = b.getAttribute('data-af');
      if (v === 'new') S.openAct = 'new'; else { S.actFilter = v; S.openAct = ''; }
      renderActs(); return;
    }
    if ((b = e.target.closest('[data-toggle]'))) { var id = b.getAttribute('data-toggle'); S.openAct = S.openAct === id ? '' : id; renderActs(); return; }
    if ((b = e.target.closest('[data-asave]'))) {
      var box = b.closest('.act'), a = { id: b.getAttribute('data-asave') };
      box.querySelectorAll('[data-e]').forEach(function (el) { a[el.getAttribute('data-e')] = el.value; });
      b.disabled = true; b.textContent = 'Saving…';
      C.api('mrmActionSave', { a: a }).then(function (r) {
        S.openAct = r.id; return load().then(function () { msg('ok', 'Saved ' + r.id + '.'); });
      }).catch(function (err) { msg('err', err.message); b.disabled = false; b.textContent = 'Save'; });
      return;
    }
    if ((b = e.target.closest('[data-aremove]'))) {
      if (!confirm('Remove this action? Use this only for a wrong entry. To close a real action, set Status to Done or Dropped.')) return;
      C.api('mrmActionSave', { a: { id: b.getAttribute('data-aremove'), remove: true } }).then(function () {
        S.openAct = ''; return load().then(function () { msg('ok', 'Removed.'); });
      }).catch(function (err) { msg('err', err.message); });
    }
  });

  window.addEventListener('afterprint', function () { $('print').innerHTML = ''; });
  load();
})();
