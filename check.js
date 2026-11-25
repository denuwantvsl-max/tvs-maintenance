/* TVS Horana CMMS – operator daily check (forklifts, delivery vehicles). Public page opened from the QR label:
   check.html?id=ST-MM-01. No PIN: the operator types a name (remembered on this phone). Sinhala first. */
(function () {
  'use strict';
  var C = window.CMMS, esc = C.esc, t = C.t;
  var NAME_KEY = 'cmms_op_name';

  C.addDict({
    chkTitle: ['Daily check', 'දෛනික පරීක්ෂාව'],
    chkNoId: ['No machine ID in the link. Please scan the QR label again.', 'සබැඳියේ යන්ත්‍ර අංකය නැත. QR ලේබලය නැවත ස්කෑන් කරන්න.'],
    chkDoneToday: ['Already checked today', 'අද දැනටමත් පරීක්ෂා කර ඇත'],
    chkAgain: ['You can check again if something changed.', 'යමක් වෙනස් වී ඇත්නම් නැවත පරීක්ෂා කළ හැක.'],
    chkDueBy: ['Please do this check before {h}:00 today.', 'කරුණාකර අද {h}:00 ට පෙර මෙම පරීක්ෂාව කරන්න.'],
    chkNameQ: ['Who is checking?', 'පරීක්ෂා කරන්නේ කවුද?'],
    chkNameHint: ['Type your full name. This phone remembers it next time.', 'ඔබේ සම්පූර්ණ නම ලියන්න. ඊළඟ වතාවේ මෙම දුරකථනය එය මතක තබා ගනී.'],
    chkNamePh: ['e.g. Kamal Perera', 'උදා: කමල් පෙරේරා'],
    chkNameErr: ['Please type your name.', 'කරුණාකර ඔබේ නම ලියන්න.'],
    chkNext: ['Continue', 'ඉදිරියට'],
    chkAs: ['Checking as', 'පරීක්ෂා කරන්නා'],
    chkNotMe: ['Not you? Change', 'ඔබ නොවේද? වෙනස් කරන්න'],
    chkAnswered: ['Answered', 'පිළිතුරු දුන්'],
    chkOk: ['OK', 'හරි'],
    chkNok: ['Not OK', 'දෝෂයි'],
    chkNa: ['N/A', 'අදාළ නැත'],
    chkSafety: ['SAFETY', 'ආරක්ෂාව'],
    chkWhat: ['What is wrong? (required)', 'මොකක්ද වැරැද්ද? (අනිවාර්යයි)'],
    chkStop: ['⛔ Do NOT use this machine. Tell your supervisor and the maintenance team.', '⛔ මෙම යන්ත්‍රය භාවිතා නොකරන්න. ඔබේ අධීක්ෂකට සහ නඩත්තු කණ්ඩායමට දන්වන්න.'],
    chkMeter: ['Hour meter reading (optional)', 'පැය මීටර කියවීම (අවශ්‍ය නම්)'],
    chkMeterLast: ['Last reading', 'අවසන් කියවීම'],
    chkRemarks: ['Other remarks (optional)', 'වෙනත් සටහන් (අවශ්‍ය නම්)'],
    chkPhoto: ['Photo of the problem (optional)', 'ගැටලුවේ ඡායාරූපය (අවශ්‍ය නම්)'],
    chkSave: ['Save daily check', 'දෛනික පරීක්ෂාව සුරකින්න'],
    chkSaving: ['Saving…', 'සුරකිමින්…'],
    chkMissing: ['Please answer every item ({n} left). They are marked in red.', 'කරුණාකර සියලු අයිතමවලට පිළිතුරු දෙන්න (තව {n}). ඒවා රතු පාටින් පෙන්වා ඇත.'],
    chkNoteMissing: ['Please write what is wrong for each Not OK item.', 'දෝෂයි යැයි සලකුණු කළ සෑම අයිතමයකටම වැරැද්ද ලියන්න.'],
    chkThanks: ['Saved. Thank you, {n}!', 'සුරැකිණි. ස්තූතියි, {n}!'],
    chkAllOk: ['Everything OK. You can use the machine.', 'සියල්ල හරි. ඔබට යන්ත්‍රය භාවිතා කළ හැක.'],
    chkProblems: ['{n} problem(s) recorded. The maintenance team has been told.', 'ගැටලු {n} ක් සටහන් විය. නඩත්තු කණ්ඩායමට දන්වා ඇත.'],
    chkJob: ['Maintenance job', 'නඩත්තු රැකියා අංකය'],
    chkCheckAgain: ['Do another check', 'නැවත පරීක්ෂා කරන්න'],
    chkMeterNote: ['The hour meter number looks wrong, so it was not used. The maintenance team will check it.', 'පැය මීටර අංකය වැරදි ලෙස පෙනේ, එබැවින් එය භාවිතා නොකළේය. නඩත්තු කණ්ඩායම එය පරීක්ෂා කරයි.'],
    chkPractice: ['PRACTICE ONLY – nothing is saved. Use the QR label on the machine for the real check.', 'පුහුණුව සඳහා පමණි – කිසිවක් සුරැකෙන්නේ නැත. සැබෑ පරීක්ෂාවට යන්ත්‍රයේ ඇති QR ලේබලය භාවිතා කරන්න.'],
    chkSunday: ['Today is not a working day, but you can still record a check.', 'අද වැඩ කරන දිනයක් නොවේ, නමුත් ඔබට පරීක්ෂාවක් සටහන් කළ හැක.']
  });

  var out = document.getElementById('out');
  var S = { id: (C.param('id') || '').toUpperCase(), x: null, ans: {}, notes: {}, photo: null };

  // operators read Sinhala first unless they chose English before
  if (C.store.get('cmms_lang') === null) C.setLang('si');
  C.initLangButton();
  document.addEventListener('langchange', function () { if (S.x) render(); });

  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
  function txt(it) { return C.lang() === 'si' && it.textSi ? it.textSi : it.text; }
  function secName(sec) {
    var si = { 'Before starting': 'පණගැන්වීමට පෙර', 'After starting': 'පණගැන්වූ පසු', 'After switching on': 'ස්විච් ඔන් කළ පසු',
      'Lorry – before driving': 'ලොරිය – පදවන්න පෙර', 'Lorry – after starting': 'ලොරිය – පණගැන්වූ පසු', 'Lifting platform': 'ලිෆ්ටින් ප්ලැට්ෆෝම් එක', 'Cargo': 'බඩු' }[sec];
    return C.lang() === 'si' && si ? si : sec;
  }
  function hhmm(iso) { var d = new Date(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function opName() { return (C.store.get(NAME_KEY) || '').trim(); }

  function load() {
    if (!S.id) { out.innerHTML = '<div class="msg err">' + esc(t('chkNoId')) + '</div>'; return; }
    out.innerHTML = C.loadingHtml();
    C.api('opCheck', { id: S.id }).then(function (x) { S.x = x; S.ans = {}; S.notes = {}; S.photo = null; render(); })
      .catch(function (e) { out.innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
  }

  function machineCard() {
    var x = S.x, a = x.asset;
    var h = (C.isMock() ? '<div class="msg" style="background:#fef3c7;color:#92400e;border-color:#fde68a;font-weight:700">🧪 ' + esc(t('chkPractice')) + '</div>' : '') + '<div class="card"><div class="mach">' + (a.photoUrl ? '<img src="' + esc(a.photoUrl) + '" alt="">' : '') +
      '<div><div class="muted small">' + esc(t('chkTitle')) + ' · ' + esc(C.lang() === 'si' ? x.group.titleSi : x.group.title) + '</div>' +
      '<div class="id">' + esc(a.id) + '</div><div class="nm">' + esc(a.name) + '</div>' +
      (a.location ? '<div class="muted small">📍 ' + esc(a.location) + '</div>' : '') + '</div></div>';
    if (x.today.length) {
      h += '<div class="msg ok" style="margin-bottom:0"><b>✓ ' + esc(t('chkDoneToday')) + '</b><ul class="today-list">' + x.today.map(function (r) {
        return '<li>' + esc(hhmm(r.at)) + ' – ' + esc(r.by) + (r.notOk ? ' · ⚠️ ' + r.notOk + (r.woId ? ' (' + esc(r.woId) + ')' : '') : ' · ✓') + '</li>';
      }).join('') + '</ul><div class="small" style="margin-top:4px">' + esc(t('chkAgain')) + '</div></div>';
    } else if (x.workday) {
      h += '<div class="msg info" style="margin-bottom:0">' + esc(fill(t('chkDueBy'), { h: x.byHour })) + '</div>';
    } else {
      h += '<div class="msg info" style="margin-bottom:0">' + esc(t('chkSunday')) + '</div>';
    }
    return h + '</div>';
  }

  function render() {
    if (!opName() || S.askName) return renderName();
    renderForm();
  }

  function renderName() {
    var names = S.x.names || [];
    out.innerHTML = machineCard() + '<form class="card" id="nameForm" autocomplete="off" novalidate><h2 style="margin-top:0">' + esc(t('chkNameQ')) + '</h2>' +
      '<input type="text" id="opName" list="opNames" maxlength="60" value="' + esc(opName()) + '" placeholder="' + esc(t('chkNamePh')) + '" style="font-size:18px">' +
      '<datalist id="opNames">' + names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<div class="muted small" style="margin-top:6px">' + esc(t('chkNameHint')) + '</div><div id="nameMsg" class="msg hidden"></div>' +
      '<button class="btn dark" type="submit" style="margin-top:14px">' + esc(t('chkNext')) + ' →</button></form>';
    var inp = document.getElementById('opName');
    document.getElementById('nameForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = inp.value.replace(/\s+/g, ' ').trim();
      if (v.length < 2) { C.showMsg(document.getElementById('nameMsg'), 'err', t('chkNameErr')); return; }
      C.store.set(NAME_KEY, v);
      S.askName = false;
      renderForm();
      window.scrollTo(0, 0);
    });
    if (!opName()) inp.focus();
  }

  function rowHtml(it) {
    var v = S.ans[it.no], bad = v === 'nok';
    var h = '<div class="op-row' + (bad ? ' bad' : '') + '" data-no="' + esc(it.no) + '"><div class="q">' + esc(it.no) + '. ' + esc(txt(it)) +
      (it.safety ? '<span class="sf">' + esc(t('chkSafety')) + '</span>' : '') +
      (C.lang() === 'si' && it.textSi ? '<span class="en">' + esc(it.text) + '</span>' : '') + '</div>' +
      '<div class="op-btns"><button type="button" class="ok' + (v === 'ok' ? ' on' : '') + '" data-v="ok">✓ ' + esc(t('chkOk')) + '</button>' +
      '<button type="button" class="nok' + (bad ? ' on' : '') + '" data-v="nok">✗ ' + esc(t('chkNok')) + '</button>' +
      '<button type="button" class="na' + (v === 'na' ? ' on' : '') + '" data-v="na">' + esc(t('chkNa')) + '</button></div>';
    if (bad) {
      h += '<div class="op-note"><input type="text" maxlength="200" data-note="' + esc(it.no) + '" value="' + esc(S.notes[it.no] || '') + '" placeholder="' + esc(t('chkWhat')) + '"></div>';
      if (it.safety) h += '<div class="stop">' + esc(t('chkStop')) + '</div>';
    }
    return h + '</div>';
  }

  function progress() {
    var n = S.x.template.items.length, a = S.x.template.items.filter(function (it) { return S.ans[it.no]; }).length;
    return esc(t('chkAnswered')) + ': ' + a + ' / ' + n;
  }

  function renderForm() {
    var x = S.x, tpl = x.template, a = x.asset, sec = null, h = machineCard();
    h += '<div class="prog"><span id="progTxt">' + progress() + '</span><span>' + esc(tpl.docNo || '') + '</span></div>';
    h += '<form class="card" id="ckForm" autocomplete="off" novalidate>' +
      '<div class="who"><span>' + esc(t('chkAs')) + ': <b>' + esc(opName()) + '</b></span><button type="button" class="linkbtn" id="chgName">' + esc(t('chkNotMe')) + '</button></div>' +
      '<div class="muted small" style="margin-top:4px">' + esc(tpl.title) + '</div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-5000px;width:1px;height:1px" aria-hidden="true">';
    tpl.items.forEach(function (it) {
      if (it.section !== sec) { sec = it.section; h += '<div class="ck-sec">' + esc(secName(sec)) + '</div>'; }
      h += rowHtml(it);
    });
    if (a.meterUnit) {
      h += '<label class="f" for="meter">' + esc(t('chkMeter')) + '</label><input id="meter" type="number" inputmode="decimal" step="0.1" min="0"' +
        (a.currentMeter !== '' ? ' placeholder="' + esc(t('chkMeterLast')) + ': ' + esc(a.currentMeter) + ' ' + esc(a.meterUnit) + '"' : '') + '>';
    }
    h += '<label class="f" for="remarks">' + esc(t('chkRemarks')) + '</label><textarea id="remarks" rows="2" maxlength="1000"></textarea>' +
      '<label class="f" for="photo">' + esc(t('chkPhoto')) + '</label><input id="photo" type="file" accept="image/*" capture="environment">' +
      '<div id="ckMsg" class="msg hidden"></div>' +
      '<button class="btn green" type="submit" id="saveBtn" style="margin-top:8px">' + esc(t('chkSave')) + '</button></form>';
    out.innerHTML = h;

    var form = document.getElementById('ckForm');
    document.getElementById('chgName').addEventListener('click', function () { S.askName = true; renderName(); window.scrollTo(0, 0); });
    form.addEventListener('click', function (e) {
      var b = e.target.closest('.op-btns button');
      if (!b) return;
      var row = b.closest('.op-row'), no = row.getAttribute('data-no');
      S.ans[no] = b.getAttribute('data-v');
      var it = tpl.items.filter(function (i) { return String(i.no) === no; })[0];
      var tmp = document.createElement('div');
      tmp.innerHTML = rowHtml(it);
      row.parentNode.replaceChild(tmp.firstChild, row);
      document.getElementById('progTxt').innerHTML = progress();
      if (S.ans[no] === 'nok') { var ni = form.querySelector('[data-note="' + no + '"]'); if (ni) ni.focus(); }
    });
    form.addEventListener('input', function (e) {
      var no = e.target.getAttribute && e.target.getAttribute('data-note');
      if (no) S.notes[no] = e.target.value;
    });
    document.getElementById('photo').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      S.photo = null;
      if (f) C.shrinkPhoto(f, 1280).then(function (d) { S.photo = d; }).catch(function () { S.photo = null; });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); save(form); });
  }

  function save(form) {
    var tpl = S.x.template, msg = document.getElementById('ckMsg');
    var left = tpl.items.filter(function (it) { return !S.ans[it.no]; });
    form.querySelectorAll('.op-row').forEach(function (r) { r.classList.toggle('miss', !S.ans[r.getAttribute('data-no')]); });
    if (left.length) {
      C.showMsg(msg, 'err', fill(t('chkMissing'), { n: left.length }));
      var first = form.querySelector('.op-row.miss');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var noNote = tpl.items.filter(function (it) { return S.ans[it.no] === 'nok' && !String(S.notes[it.no] || '').trim(); });
    if (noNote.length) {
      C.showMsg(msg, 'err', t('chkNoteMissing'));
      var ni = form.querySelector('[data-note="' + noNote[0].no + '"]');
      if (ni) { ni.focus(); if (ni.scrollIntoView) ni.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    var btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = t('chkSaving');
    var meterEl = document.getElementById('meter');
    var data = { assetId: S.x.asset.id, name: opName(), results: S.ans, notes: S.notes,
      remarks: document.getElementById('remarks').value, meter: meterEl ? meterEl.value : '', photo: S.photo || '' };
    C.api('opCheckSave', { data: data, website: form.querySelector('[name=website]').value }).then(done).catch(function (e) {
      btn.disabled = false; btn.textContent = t('chkSave');
      C.showMsg(msg, 'err', e.message);
    });
  }

  function done(r) {
    var h = '<div class="card donebox"><div class="big">' + (r.unsafe && r.unsafe.length ? '⛔' : r.notOk ? '⚠️' : '✅') + '</div>' +
      '<h2>' + esc(fill(t('chkThanks'), { n: opName() })) + '</h2>' +
      '<div class="muted">' + esc(S.x.asset.id + ' · ' + S.x.asset.name) + ' · ' + esc(C.fmtDate(new Date().toISOString())) + '</div>';
    if (r.meterNote) h += '<div class="msg info">' + esc(t('chkMeterNote')) + '</div>';
    if (!r.notOk) h += '<div class="msg ok">' + esc(t('chkAllOk')) + '</div>';
    else {
      h += '<div class="msg err">' + esc(fill(t('chkProblems'), { n: r.notOk })) +
        (r.woId ? '<br>' + esc(t('chkJob')) + ': <b>' + esc(r.woId) + '</b>' : '') + '</div>';
      if (r.unsafe && r.unsafe.length) h += '<div class="stop">' + esc(t('chkStop')) + '</div>';
    }
    h += '<button class="btn ghost" type="button" id="again" style="margin-top:14px">' + esc(t('chkCheckAgain')) + '</button></div>';
    out.innerHTML = h;
    window.scrollTo(0, 0);
    document.getElementById('again').addEventListener('click', load);
  }

  load();
})();
