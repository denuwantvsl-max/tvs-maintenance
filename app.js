/* TVS Horana CMMS – staff app (jobs, machines, dashboard, QR labels, Telegram). */
(function () {
  'use strict';
  var C = CMMS, $ = function (id) { return document.getElementById(id); }, esc = C.esc, t = C.t;

  C.addDict({
    whoAreYou: ['Who are you?', 'ඔබ කවුද?'],
    login: ['Log in', 'ඇතුළු වන්න'],
    logout: ['Log out', 'ඉවත් වන්න'],
    tabJobs: ['Jobs', 'රැකියා'],
    tabAssets: ['Machines', 'යන්ත්‍ර'],
    tabDash: ['Dashboard', 'සාරාංශය'],
    tabLabels: ['QR labels', 'QR ලේබල'],
    tabMe: ['Me', 'මම'],
    v_open: ['Open', 'විවෘත'],
    v_new: ['New', 'නව'],
    v_mine: ['My jobs', 'මගේ රැකියා'],
    v_overdue: ['Overdue', 'ප්‍රමාද'],
    v_done: ['To confirm', 'තහවුරු කිරීමට'],
    v_closed: ['Closed', 'වසා ඇත'],
    searchJobs: ['Search jobs…', 'රැකියා සොයන්න…'],
    searchAssets: ['Search machines…', 'යන්ත්‍ර සොයන්න…'],
    newJob: ['+ New', '+ නව'],
    add: ['+ Add', '+ එක් කරන්න'],
    all: ['All', 'සියල්ල'],
    noJobs: ['No jobs here.', 'මෙහි රැකියා නැත.'],
    late: ['LATE', 'ප්‍රමාදයි'],
    stoppedShort: ['STOPPED', 'නැවතී ඇත'],
    requestedBy: ['Requested by', 'ඉල්ලුම් කළේ'],
    created: ['Created', 'නිර්මාණය'],
    a_assign: ['Approve & assign', 'අනුමත කර පවරන්න'],
    a_reassign: ['Reassign', 'නැවත පවරන්න'],
    a_reject: ['Reject', 'ප්‍රතික්ෂේප කරන්න'],
    a_start: ['Start work', 'වැඩ අරඹන්න'],
    a_hold: ['Put on hold', 'තාවකාලිකව නවත්වන්න'],
    a_resume: ['Resume', 'නැවත අරඹන්න'],
    a_complete: ['Complete job', 'රැකියාව අවසන් කරන්න'],
    a_close: ['Close (verified)', 'වසන්න (තහවුරුයි)'],
    a_reopen: ['Reopen', 'නැවත විවෘත කරන්න'],
    a_note: ['Add note', 'සටහනක් එක් කරන්න'],
    a_edit: ['Edit', 'සංස්කරණය'],
    save: ['Save', 'සුරකින්න'],
    cancel: ['Cancel', 'අවලංගු කරන්න'],
    assignTo: ['Assign to', 'පවරන්නේ'],
    workType: ['Work type', 'වැඩ වර්ගය'],
    note: ['Note', 'සටහන'],
    reason: ['Reason', 'හේතුව'],
    actionTaken: ['Work done', 'කළ වැඩ'],
    failureCause: ['Failure cause', 'දෝෂයට හේතුව'],
    rootCause: ['Root cause', 'මූල හේතුව'],
    partsUsed: ['Spare parts used', 'භාවිත කළ අමතර කොටස්'],
    labourHours: ['Labour hours', 'ශ්‍රම පැය'],
    cost: ['Cost (LKR)', 'වියදම (රු.)'],
    doneBy: ['Done by', 'කළේ'],
    internal: ['Internal team', 'අභ්‍යන්තර කණ්ඩායම'],
    contractor: ['Contractor', 'කොන්ත්‍රාත්කරු'],
    downtimeStart: ['Downtime start', 'නැවතුම ආරම්භය'],
    downtimeEnd: ['Downtime end', 'නැවතුම අවසානය'],
    afterPhoto: ['Photo after repair', 'අලුත්වැඩියාවෙන් පසු ඡායාරූපය'],
    history: ['History', 'ඉතිහාසය'],
    details: ['Details', 'විස්තර'],
    selectAll: ['Select all', 'සියල්ල තෝරන්න'],
    printLabels: ['Print labels', 'ලේබල මුද්‍රණය කරන්න'],
    labelsLead: ['Tick the machines, then press Print. Two labels per row on A4 (cut and laminate).',
      'යන්ත්‍ර තෝරා Print ඔබන්න. A4 පේළියකට ලේබල දෙකක් (කපා ලැමිනේට් කරන්න).'],
    scanLabel: ['Scan for details · Report a problem', 'විස්තර සඳහා ස්කෑන් කරන්න · ගැටලු වාර්තා කරන්න'],
    tgTitle: ['Telegram alerts', 'Telegram දැනුම්දීම්'],
    tgOn: ['Connected. You receive alerts on Telegram.', 'සම්බන්ධයි. ඔබට Telegram හරහා දැනුම්දීම් ලැබේ.'],
    tgOff: ['Not connected yet.', 'තවම සම්බන්ධ කර නැත.'],
    tgConnect: ['Connect Telegram', 'Telegram සම්බන්ධ කරන්න'],
    tgStep1: ['1. Tap the button below. Telegram opens the TVS bot. Press START.', '1. පහත බොත්තම ඔබන්න. Telegram හි TVS bot විවෘත වේ. START ඔබන්න.'],
    tgStep2: ['2. Come back here and tap "I pressed START".', '2. මෙතැනට පැමිණ "මම START එබුවා" ඔබන්න.'],
    tgOpen: ['Open Telegram', 'Telegram විවෘත කරන්න'],
    tgManual: ['If the button does not open (e.g. office network): on your phone, search the bot in Telegram, press START, then send this code:',
      'බොත්තම විවෘත නොවේ නම් (උදා: කාර්යාල ජාලය): දුරකථනයේ Telegram හි bot සොයා START ඔබා, මෙම කේතය යවන්න:'],
    tgCheck: ['I pressed START', 'මම START එබුවා'],
    tgNotYet: ['Not received yet. Make sure you pressed START in Telegram, then try again.', 'තවම ලැබී නැත. Telegram හි START එබූ බව තහවුරු කර නැවත උත්සාහ කරන්න.'],
    role: ['Role', 'භූමිකාව'],
    k_open: ['Open jobs', 'විවෘත රැකියා'],
    k_overdue: ['Overdue', 'ප්‍රමාද'],
    k_new: ['Waiting approval', 'අනුමැතියට'],
    k_confirm: ['Waiting requester', 'ඉල්ලුම්කරු බලාපොරොත්තුවෙන්'],
    k_created: ['Raised this month', 'මෙම මාසයේ ලැබුණු'],
    k_closed: ['Closed this month', 'මෙම මාසයේ වැසූ'],
    k_avg: ['Avg hours to finish', 'අවසන් කිරීමට සාමාන්‍ය පැය'],
    k_down: ['Downtime this month (h)', 'මෙම මාසයේ නැවතුම් (පැ)'],
    k_cost: ['Cost this month (LKR)', 'මෙම මාසයේ වියදම (රු.)'],
    k_stopped: ['Production stopped now', 'දැන් නිෂ්පාදනය නැවතී'],
    d_overdue: ['Overdue jobs', 'ප්‍රමාද රැකියා'],
    d_person: ['Open jobs per person', 'පුද්ගලයා අනුව විවෘත රැකියා'],
    d_assets: ['Most jobs in 90 days', 'දින 90 තුළ වැඩිම රැකියා'],
    d_certs: ['Certificates to renew', 'අලුත් කළ යුතු සහතික'],
    publicPage: ['Public page', 'පොදු පිටුව'],
    newAsset: ['New machine', 'නව යන්ත්‍රය'],
    saved: ['Saved.', 'සුරකින ලදී.']
  });

  var S = { user: null, meta: null, users: [], view: 'open', jobs: [], assets: null, area: '', job: null, lblSel: {} };
  var VIEWS = ['open', 'new', 'mine', 'overdue', 'done', 'closed'];
  var isMgr = function () { return S.user && (S.user.role === 'admin' || S.user.role === 'supervisor'); };

  C.initLangButton();

  /* ---------------- login ---------------- */
  function showLogin() {
    $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden');
    $('whoami').textContent = t('plant');
    C.api('meta').then(function (m) {
      S.meta = m;
      $('lgUser').innerHTML = '<option value="">' + esc(t('select')) + '</option>' +
        m.staff.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.name) + '</option>'; }).join('');
      var last = C.store.get('cmms_last_user'); if (last) $('lgUser').value = last;
    }).catch(function (e) { C.showMsg($('lgErr'), 'err', e.message); });
  }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var uid = $('lgUser').value, pin = $('lgPin').value.trim();
    if (!uid || !pin) { C.showMsg($('lgErr'), 'err', t('required')); return; }
    $('lgBtn').disabled = true;
    C.api('login', { userId: uid, pin: pin }).then(function (r) {
      C.saveSession(r.token, r.user); C.store.set('cmms_last_user', uid);
      $('lgPin').value = ''; $('lgErr').classList.add('hidden');
      start();
    }).catch(function (err) { C.showMsg($('lgErr'), 'err', err.message); })
      .then(function () { $('lgBtn').disabled = false; });
  });

  function handleErr(e, box) {
    if (e.auth) { closeSheet(); showLogin(); return; }
    if (box) C.showMsg(box, 'err', e.message); else alert(e.message);
  }

  /* ---------------- start ---------------- */
  function start() {
    var s = C.session();
    if (!s) { showLogin(); return; }
    S.user = s.user;
    $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden');
    $('whoami').textContent = S.user.name + ' · ' + S.user.role;
    document.querySelectorAll('.mgr').forEach(function (el) { el.classList.toggle('hidden', !isMgr()); });
    Promise.all([C.api('meta'), C.api('users')]).then(function (r) {
      S.meta = r[0]; S.users = r[1];
      renderViews(); loadJobs(); route();
    }).catch(function (e) { handleErr(e); });
  }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === name); });
    ['jobs', 'assets', 'dash', 'labels', 'me'].forEach(function (n) { $('tab-' + n).classList.toggle('hidden', n !== name); });
    if (name === 'assets') loadAssets().then(renderAssets);
    if (name === 'dash') loadDash();
    if (name === 'labels') loadAssets().then(renderLabelPick);
    if (name === 'me') renderMe();
    if (name === 'jobs') loadJobs();
  }
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]'); if (b) showTab(b.getAttribute('data-tab'));
  });

  /* ---------------- jobs ---------------- */
  function renderViews() {
    $('jobViews').innerHTML = VIEWS.map(function (v) {
      return '<button type="button" class="chip' + (S.view === v ? ' on' : '') + '" data-v="' + v + '">' + esc(t('v_' + v)) + '</button>';
    }).join('');
  }
  $('jobViews').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]'); if (!b) return;
    S.view = b.getAttribute('data-v'); renderViews(); loadJobs();
  });
  var qTimer;
  $('jobQ').addEventListener('input', function () { clearTimeout(qTimer); qTimer = setTimeout(loadJobs, 350); });

  function loadJobs() {
    $('jobList').innerHTML = C.loadingHtml();
    return C.api('jobs', { view: S.view, q: $('jobQ').value.trim() }).then(function (r) {
      S.jobs = r.jobs; renderJobs();
    }).catch(function (e) { handleErr(e); $('jobList').innerHTML = ''; });
  }
  function jobCard(j) {
    return '<button type="button" class="item ' + C.prioClass(j.priority) + '" data-wo="' + esc(j.id) + '"><div class="top"><span class="id">' + esc(j.id) +
      '</span>' + (j.productionStopped && ['DONE', 'CLOSED', 'REJECTED'].indexOf(j.status) < 0 ? '<span class="pill badge-stop">' + esc(t('stoppedShort')) + '</span>' : '') +
      (j.overdue ? '<span class="pill badge-late">' + esc(t('late')) + '</span>' : '') + C.prioPill(j.priority) + C.statusPill(j.status) + '</div>' +
      '<div class="ttl">' + esc(j.assetId ? j.assetId + ' · ' + j.assetName : j.location) + '</div>' +
      '<div>' + esc(j.description) + '</div><div class="meta">📍 ' + esc(j.location) + ' · 👤 ' + esc(j.requester) +
      (j.assignedName ? ' · 👷 ' + esc(j.assignedName) : '') + ' · ' + esc(C.fmtAgo(j.created)) + '</div></button>';
  }
  function renderJobs() {
    $('jobList').innerHTML = S.jobs.length ? S.jobs.map(jobCard).join('') : '<div class="muted center" style="padding:24px">' + esc(t('noJobs')) + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-wo]');
    if (b) { e.preventDefault(); location.hash = 'wo=' + b.getAttribute('data-wo'); }
  });

  /* ---------------- sheet + routing ---------------- */
  function openSheet(title, html) {
    $('sheetTitle').textContent = title; $('sheetBody').innerHTML = html;
    $('sheet').classList.remove('hidden'); $('sheet').scrollTop = 0; document.body.style.overflow = 'hidden';
  }
  function closeSheet() { $('sheet').classList.add('hidden'); document.body.style.overflow = ''; S.job = null; }
  $('sheetBack').addEventListener('click', function () {
    if (location.hash) history.pushState(null, '', location.pathname + location.search);
    closeSheet();
    if (!$('tab-jobs').classList.contains('hidden')) loadJobs();
    if (!$('tab-assets').classList.contains('hidden')) { S.assets = null; loadAssets().then(renderAssets); }
  });
  function route() {
    var h = location.hash.replace(/^#/, '');
    var m = /^wo=(.+)$/.exec(h), a = /^asset=(.*)$/.exec(h);
    if (m) openJob(decodeURIComponent(m[1]));
    else if (a) openAsset(decodeURIComponent(a[1]));
    else closeSheet();
  }
  window.addEventListener('hashchange', function () { if (S.user) route(); });

  /* ---------------- job detail ---------------- */
  function openJob(id) {
    openSheet(id, C.loadingHtml());
    C.api('job', { id: id }).then(function (j) { S.job = j; renderJob(); })
      .catch(function (e) { if (e.auth) return handleErr(e); $('sheetBody').innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
  }
  function kv(label, val) { return val || val === 0 ? '<dt>' + esc(label) + '</dt><dd>' + esc(val) + '</dd>' : ''; }

  function actionsFor(j) {
    var mine = String(j.AssignedTo) === String(S.user.id), mgr = isMgr(), st = j.Status, a = [];
    if (mgr && st === 'NEW') a.push(['assign', 'a_assign', 'btn dark'], ['reject', 'a_reject', 'btn ghost']);
    if ((mine || mgr) && st === 'ASSIGNED') a.push(['start', 'a_start', 'btn']);
    if ((mine || mgr) && st === 'ON_HOLD') a.push(['start', 'a_resume', 'btn']);
    if ((mine || mgr) && ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(st) >= 0) a.push(['complete', 'a_complete', 'btn green']);
    if ((mine || mgr) && ['ASSIGNED', 'IN_PROGRESS'].indexOf(st) >= 0) a.push(['hold', 'a_hold', 'btn ghost']);
    if (mgr && ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(st) >= 0) a.push(['assign', 'a_reassign', 'btn ghost']);
    if (mgr && st === 'ASSIGNED') a.push(['reject', 'a_reject', 'btn ghost']);
    if (mgr && st === 'DONE') a.push(['close', 'a_close', 'btn dark']);
    if (mgr && ['DONE', 'CLOSED', 'REJECTED'].indexOf(st) >= 0) a.push(['reopen', 'a_reopen', 'btn ghost']);
    if (mgr && ['CLOSED', 'REJECTED'].indexOf(st) < 0) a.push(['edit', 'a_edit', 'btn ghost']);
    a.push(['note', 'a_note', 'btn ghost']);
    return a;
  }

  function renderJob() {
    var j = S.job, h = '';
    h += '<div class="card"><div class="top" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + C.prioPill(j.Priority) +
      C.statusPill(j.Status) + (j.overdue ? '<span class="pill badge-late">' + esc(t('late')) + '</span>' : '') +
      (j.ProductionStopped === 'Yes' ? '<span class="pill badge-stop">' + esc(t('stoppedShort')) + '</span>' : '') + '</div>' +
      '<p style="font-size:17px;margin:10px 0;white-space:pre-line">' + esc(j.Description) + '</p><dl class="kv">' +
      (j.AssetID ? '<dt>' + esc(t('machine')) + '</dt><dd><a href="asset.html?id=' + encodeURIComponent(j.AssetID) + '">' + esc(j.AssetID + ' — ' + j.AssetName) + '</a></dd>' : '') +
      kv(t('location'), j.Location) + kv(t('category'), j.Category) + kv(t('workType'), j.WorkType) +
      kv(t('requestedBy'), j.RequesterName + (j.Department ? ' (' + j.Department + ')' : '')) +
      (j.RequesterPhone ? '<dt>' + esc(t('phone')) + '</dt><dd><a href="tel:' + esc(j.RequesterPhone) + '">' + esc(j.RequesterPhone) + '</a></dd>' : '') +
      kv(t('email'), j.RequesterEmail) + kv(t('created'), C.fmtDate(j.Created)) + kv(t('dueBy'), C.fmtDate(j.DueAt)) +
      kv(t('assignedTo'), j.assignedName) + '</dl></div>';

    if (j.ActionTaken) {
      h += '<div class="card"><h3 style="margin-top:0">' + esc(t('actionTaken')) + '</h3><p style="white-space:pre-line;margin-top:0">' + esc(j.ActionTaken) + '</p><dl class="kv">' +
        kv(t('failureCause'), j.FailureCause) + kv(t('rootCause'), j.RootCause) + kv(t('partsUsed'), j.PartsUsed) +
        kv(t('labourHours'), j.LabourHours) + kv(t('cost'), j.Cost === '' ? '' : Number(j.Cost).toLocaleString()) +
        kv(t('doneBy'), j.DoneBy === 'Contractor' ? t('contractor') + ': ' + j.Contractor : (j.DoneBy ? t('internal') : '')) +
        (j.DowntimeMin !== '' ? kv(t('downtimeStart'), C.fmtDate(j.DowntimeStart)) + kv(t('downtimeEnd'), C.fmtDate(j.DowntimeEnd)) +
          kv('Downtime', Math.floor(j.DowntimeMin / 60) + ' h ' + (j.DowntimeMin % 60) + ' min') : '') +
        kv(t('feedback'), j.RequesterFeedback) + '</dl></div>';
    }
    if (j.requestPhotoUrl || j.afterPhotoUrl) {
      h += '<div class="card photos">' +
        (j.requestPhotoUrl ? '<a href="' + esc(j.requestPhotoUrl) + '" target="_blank" rel="noopener"><img src="' + esc(j.requestPhotoUrl) + '" alt="before"></a>' : '') +
        (j.afterPhotoUrl ? '<a href="' + esc(j.afterPhotoUrl) + '" target="_blank" rel="noopener"><img src="' + esc(j.afterPhotoUrl) + '" alt="after"></a>' : '') + '</div>';
    }
    h += '<div class="btn-row" id="acts">' + actionsFor(j).map(function (a) {
      return '<button type="button" class="' + a[2] + '" data-op="' + a[0] + '">' + esc(t(a[1])) + '</button>';
    }).join('') + '</div><div id="actForm"></div>';
    h += '<div class="card"><h3 style="margin-top:0">' + esc(t('history')) + '</h3><div class="log">' + j.log.slice().reverse().map(function (l) {
      return '<div><div class="when">' + esc(C.fmtDate(l.time)) + ' · ' + esc(l.user) + '</div><b>' + esc(l.action) + '</b>' +
        (l.to && l.to !== l.from ? ' → ' + C.statusPill(l.to) : '') + (l.note ? '<div style="white-space:pre-line">' + esc(l.note) + '</div>' : '') + '</div>';
    }).join('') + '</div></div>';
    $('sheetBody').innerHTML = h;
    $('acts').addEventListener('click', function (e) {
      var b = e.target.closest('[data-op]'); if (b) showActionForm(b.getAttribute('data-op'));
    });
  }

  function opts(list, cur, blank) {
    return (blank ? '<option value="">' + esc(t('select')) + '</option>' : '') +
      list.map(function (v) { var val = typeof v === 'string' ? v : v.v, lab = typeof v === 'string' ? v : v.l;
        return '<option value="' + esc(val) + '"' + (String(val) === String(cur) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('');
  }
  function field(id, label, input) { return '<label class="f" for="' + id + '">' + esc(label) + '</label>' + input; }

  function showActionForm(op) {
    var j = S.job, h = '', m = S.meta;
    var techs = S.users.filter(function (u) { return u.role !== 'viewer'; }).map(function (u) { return { v: u.id, l: u.name + ' (' + u.role + ')' }; });
    if (op === 'assign') {
      h += field('fAssignee', t('assignTo'), '<select id="fAssignee">' + opts(techs, j.AssignedTo, true) + '</select>') +
        field('fPriority', t('priority'), '<select id="fPriority">' + opts(m.priorities.map(function (p) { return { v: p.name, l: t(p.name) }; }), j.Priority) + '</select>') +
        field('fWorkType', t('workType'), '<select id="fWorkType">' + opts(m.workTypes, j.WorkType, true) + '</select>');
    }
    if (op === 'complete') {
      var now = C.toLocalInput(new Date().toISOString());
      h += field('fAction', t('actionTaken') + ' *', '<textarea id="fAction" maxlength="2000"></textarea>') +
        field('fWorkType', t('workType'), '<select id="fWorkType">' + opts(m.workTypes, j.WorkType || 'Breakdown', true) + '</select>') +
        field('fCause', t('failureCause'), '<select id="fCause">' + opts(m.failureCauses, '', true) + '</select>') +
        field('fRoot', t('rootCause'), '<input type="text" id="fRoot" maxlength="1000">') +
        field('fParts', t('partsUsed'), '<input type="text" id="fParts" maxlength="1000">') +
        '<div class="grid2"><div>' + field('fHours', t('labourHours'), '<input type="number" id="fHours" min="0" step="0.25" inputmode="decimal">') +
        '</div><div>' + field('fCost', t('cost'), '<input type="number" id="fCost" min="0" step="1" inputmode="numeric">') + '</div></div>' +
        field('fDoneBy', t('doneBy'), '<select id="fDoneBy">' + opts([{ v: 'Internal', l: t('internal') }, { v: 'Contractor', l: t('contractor') }], 'Internal') + '</select>') +
        '<div id="fContrWrap" class="hidden">' + field('fContr', t('contractor') + ' *', '<input type="text" id="fContr" maxlength="100" list="contrList">') +
        '<datalist id="contrList"><option value="Swedish Trading Co."><option value="Singer"><option value="UTE"><option value="G.max Fire Service"></datalist></div>' +
        (j.ProductionStopped === 'Yes' ? '<div class="grid2"><div>' + field('fDs', t('downtimeStart'), '<input type="datetime-local" id="fDs" value="' +
          esc(C.toLocalInput(j.DowntimeStart || j.Created)) + '">') + '</div><div>' + field('fDe', t('downtimeEnd'), '<input type="datetime-local" id="fDe" value="' + esc(now) + '">') + '</div></div>' : '') +
        '<label class="f">' + esc(t('afterPhoto')) + ' <span class="opt">' + esc(t('optional')) + '</span></label><div class="photo-pick">' +
        '<label class="btn ghost sm" for="fPhoto">' + esc(t('addPhoto')) + '</label><input type="file" id="fPhoto" accept="image/*" capture="environment" class="hidden">' +
        '<img id="fPhotoPrev" class="hidden" alt=""></div>';
    }
    if (op === 'edit') {
      h += field('fCat', t('category'), '<select id="fCat">' + opts(m.categories, j.Category) + '</select>') +
        field('fPriority', t('priority'), '<select id="fPriority">' + opts(m.priorities.map(function (p) { return { v: p.name, l: t(p.name) }; }), j.Priority) + '</select>') +
        field('fWorkType', t('workType'), '<select id="fWorkType">' + opts(m.workTypes, j.WorkType, true) + '</select>') +
        field('fLoc', t('location'), '<input type="text" id="fLoc" value="' + esc(j.Location) + '" maxlength="120">') +
        field('fAsset', t('machine'), '<input type="text" id="fAsset" value="' + esc(j.AssetID) + '" list="fAssetList" autocomplete="off"><datalist id="fAssetList">' +
          m.assets.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join('') + '</datalist>');
    }
    var needNote = ['reject', 'hold', 'reopen', 'note'].indexOf(op) >= 0;
    h += field('fNote', needNote && op !== 'note' ? t('reason') + ' *' : (op === 'note' ? t('note') + ' *' : t('note') + ' ' + t('optional')),
      '<textarea id="fNote" maxlength="1000" style="min-height:70px"></textarea>');
    h += '<div id="fErr" class="hidden"></div><div class="btn-row"><button class="btn dark" id="fSave" type="button">' + esc(t('save')) +
      '</button><button class="btn ghost" id="fCancel" type="button">' + esc(t('cancel')) + '</button></div>';
    var box = $('actForm');
    box.className = 'card';
    box.innerHTML = '<h3 style="margin-top:0">' + esc(t({ start: S.job.Status === 'ON_HOLD' ? 'a_resume' : 'a_start' }[op] || 'a_' + op)) + '</h3>' + h;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var photo = '';
    if ($('fDoneBy')) $('fDoneBy').addEventListener('change', function () { $('fContrWrap').classList.toggle('hidden', $('fDoneBy').value !== 'Contractor'); });
    if ($('fPhoto')) $('fPhoto').addEventListener('change', function () {
      var f = $('fPhoto').files[0]; if (!f) return;
      C.shrinkPhoto(f).then(function (d) { photo = d; $('fPhotoPrev').src = d; $('fPhotoPrev').classList.remove('hidden'); });
    });
    $('fCancel').addEventListener('click', function () { box.className = ''; box.innerHTML = ''; });
    $('fSave').addEventListener('click', function () {
      var v = function (id) { return $(id) ? $(id).value.trim() : undefined; };
      var data = { note: v('fNote') };
      if (op === 'assign') { data.assignee = v('fAssignee'); data.priority = v('fPriority'); data.workType = v('fWorkType'); }
      if (op === 'complete') {
        data.actionTaken = v('fAction'); data.workType = v('fWorkType'); data.failureCause = v('fCause'); data.rootCause = v('fRoot');
        data.partsUsed = v('fParts'); data.labourHours = v('fHours'); data.cost = v('fCost'); data.doneBy = v('fDoneBy'); data.contractor = v('fContr');
        data.downtimeStart = v('fDs'); data.downtimeEnd = v('fDe'); data.afterPhoto = photo;
      }
      if (op === 'edit') { data.category = v('fCat'); data.priority = v('fPriority'); data.workType = v('fWorkType'); data.location = v('fLoc'); data.assetId = v('fAsset'); }
      $('fSave').disabled = true;
      C.api('jobAction', { id: S.job.WO_ID, op: op, data: data }).then(function (j) {
        S.job = j; renderJob();
        $('sheetBody').insertAdjacentHTML('afterbegin', '<div class="msg ok">' + esc(t('saved')) + '</div>');
      }).catch(function (e) { handleErr(e, $('fErr')); if ($('fSave')) $('fSave').disabled = false; });
    });
  }

  /* ---------------- assets ---------------- */
  function loadAssets(force) {
    if (S.assets && !force) return Promise.resolve(S.assets);
    $('assetList').innerHTML = C.loadingHtml();
    return C.api('assetsList').then(function (list) {
      S.assets = list.sort(function (a, b) { return String(a.AssetID).localeCompare(String(b.AssetID)); });
      return S.assets;
    }).catch(function (e) { handleErr(e); return []; });
  }
  function assetMatches(a, q) {
    if (!q) return true;
    return [a.AssetID, a.Name, a.Location, a.Area, a.Make, a.Model, a.SerialNo].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function renderAssets() {
    var areas = {};
    S.assets.forEach(function (a) { if (a.Area) areas[a.Area] = (areas[a.Area] || 0) + 1; });
    $('areaChips').innerHTML = '<button type="button" class="chip' + (!S.area ? ' on' : '') + '" data-area="">' + esc(t('all')) + ' <span class="n">' + S.assets.length + '</span></button>' +
      Object.keys(areas).sort().map(function (k) {
        return '<button type="button" class="chip' + (S.area === k ? ' on' : '') + '" data-area="' + esc(k) + '">' + esc(k) + ' <span class="n">' + areas[k] + '</span></button>';
      }).join('');
    var q = $('assetQ').value.trim().toLowerCase();
    var list = S.assets.filter(function (a) { return (!S.area || a.Area === S.area) && assetMatches(a, q); });
    $('assetList').innerHTML = list.map(function (a) {
      return '<button type="button" class="item" data-asset="' + esc(a.AssetID) + '"><div class="top"><span class="id">' + esc(a.AssetID) + '</span>' +
        (a.openJobs ? '<span class="pill st-IN_PROGRESS">' + a.openJobs + ' open</span>' : '') +
        (a.certStatus !== 'none' ? C.certPill(a.certStatus, a.CertExpiry) : '') + '</div><div class="ttl">' + esc(a.Name) + '</div><div class="meta">📍 ' +
        esc(a.Location || '') + (a.Make ? ' · ' + esc(a.Make) : '') + (a.ParentID ? ' · ⤴ ' + esc(a.ParentID) : '') + '</div></button>';
    }).join('') || '<div class="muted center" style="padding:24px">—</div>';
  }
  $('areaChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-area]'); if (!b) return; S.area = b.getAttribute('data-area'); renderAssets();
  });
  $('assetQ').addEventListener('input', function () { if (S.assets) renderAssets(); });
  $('assetList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-asset]'); if (b) location.hash = 'asset=' + encodeURIComponent(b.getAttribute('data-asset'));
  });
  $('assetAdd').addEventListener('click', function () { location.hash = 'asset='; });

  var ASSET_FIELDS = [
    ['AssetID', 'Asset ID *'], ['Name', 'Name *'], ['Area', 'Area'], ['Location', 'Location'], ['Category', 'Category'],
    ['ParentID', 'Part of (parent asset ID)'], ['Make', 'Make'], ['Model', 'Model'], ['SerialNo', 'Serial no.'], ['Year', 'Year'],
    ['Specs', 'Specifications (one per line, e.g. "Power: 30 kW")', 'area'], ['Criticality', 'Criticality', ['', 'A', 'B', 'C']],
    ['Status', 'Status', ['Active', 'Out of service', 'Disposed']], ['MaintainedBy', 'Maintained by'], ['PMFrequency', 'PM frequency'],
    ['ChecklistRef', 'Checklist ref. (e.g. TVS/QMS/CL/29)'], ['CertRequired', 'Statutory certificate required?', ['', 'Yes', 'No']],
    ['CertExpiry', 'Certificate valid until', 'date'], ['CertFileId', 'Certificate PDF (Google Drive link)'], ['Notes', 'Notes', 'area']
  ];

  function openAsset(id) {
    var go = function () {
      var a = id ? S.assets.filter(function (x) { return x.AssetID === id; })[0] : {};
      if (id && !a) { openSheet(id, '<div class="msg err">Not found</div>'); return; }
      var editable = isMgr(), h = '';
      if (id) {
        h += '<div class="btn-row"><a class="btn ghost sm" href="asset.html?id=' + encodeURIComponent(id) + '" target="_blank" rel="noopener">' + esc(t('publicPage')) + ' ↗</a>' +
          '<a class="btn ghost sm" href="request.html?asset=' + encodeURIComponent(id) + '">' + esc(t('reportThis')) + '</a></div>';
      }
      h += '<div class="card">' + ASSET_FIELDS.map(function (f) {
        var key = f[0], val = a[key] === undefined ? '' : a[key], dis = (!editable || (key === 'AssetID' && id)) ? ' disabled' : '';
        if (key === 'CertExpiry') val = C.toLocalInput(val, true);
        if (key === 'CertFileId' && val) val = 'https://drive.google.com/file/d/' + val + '/view';
        var input;
        if (f[2] === 'area') input = '<textarea id="as_' + key + '"' + dis + '>' + esc(val) + '</textarea>';
        else if (f[2] === 'date') input = '<input type="date" id="as_' + key + '" value="' + esc(val) + '"' + dis + '>';
        else if (Array.isArray(f[2])) input = '<select id="as_' + key + '"' + dis + '>' + opts(f[2], val || f[2][0]) + '</select>';
        else input = '<input type="text" id="as_' + key + '" value="' + esc(val) + '"' + dis + (key === 'AssetID' ? ' autocapitalize="characters"' : '') + '>';
        return field('as_' + key, f[1], input);
      }).join('') + (editable ? '<div id="asErr" class="hidden"></div><div style="margin-top:16px"><button class="btn dark" id="asSave" type="button">' + esc(t('save')) + '</button></div>' : '') + '</div>';
      if (id && a.CertFileId) h += '<p><a href="https://drive.google.com/file/d/' + esc(a.CertFileId) + '/view" target="_blank" rel="noopener">📄 ' + esc(t('certificate')) + '</a></p>';
      openSheet(id || t('newAsset'), h);
      if (S.flash) { $('sheetBody').insertAdjacentHTML('afterbegin', '<div class="msg ok">' + esc(S.flash) + '</div>'); S.flash = ''; }
      if (editable) $('asSave').addEventListener('click', function () {
        var data = {};
        ASSET_FIELDS.forEach(function (f) { data[f[0]] = $('as_' + f[0]).value.trim(); });
        if (id) data.AssetID = id;
        $('asSave').disabled = true;
        C.api('assetSave', { asset: data, isNew: !id }).then(function (r) {
          return loadAssets(true).then(function () {
            S.flash = t('saved');
            if (id === r.id) openAsset(r.id); else location.hash = 'asset=' + encodeURIComponent(r.id);
          });
        }).catch(function (e) { handleErr(e, $('asErr')); $('asSave').disabled = false; });
      });
    };
    openSheet(id || t('newAsset'), C.loadingHtml());
    loadAssets().then(go);
  }

  /* ---------------- dashboard ---------------- */
  function loadDash() {
    var box = $('tab-dash');
    box.innerHTML = C.loadingHtml();
    C.api('dashboard').then(function (d) {
      var k = d.kpi;
      var tile = function (n, label, alert) { return '<div class="kpi' + (alert && n ? ' alert' : '') + '"><b>' + esc(n === null ? '—' : n) + '</b><span>' + esc(t(label)) + '</span></div>'; };
      var h = '<div class="kpis">' + tile(k.open, 'k_open') + tile(k.overdue, 'k_overdue', true) + tile(k.newCount, 'k_new') + tile(k.stoppedNow, 'k_stopped', true) +
        tile(k.waitingConfirm, 'k_confirm') + tile(k.createdMonth, 'k_created') + tile(k.closedMonth, 'k_closed') + tile(k.avgCloseHours, 'k_avg') +
        tile(Math.round(k.downtimeMonthMin / 6) / 10, 'k_down') + tile(Math.round(k.costMonth).toLocaleString(), 'k_cost') + '</div>';
      h += '<h2>' + esc(t('d_overdue')) + '</h2>' + (d.overdue.length ? '<div class="list">' + d.overdue.map(jobCard).join('') + '</div>' : '<div class="muted">—</div>');
      h += '<div class="card"><h3 style="margin-top:0">' + esc(t('d_person')) + '</h3><table class="simple">' +
        (d.perPerson.map(function (p) { return '<tr><td>' + esc(p.name) + '</td><td class="num">' + p.count + '</td></tr>'; }).join('') || '<tr><td>—</td></tr>') + '</table></div>';
      h += '<div class="card"><h3 style="margin-top:0">' + esc(t('d_assets')) + '</h3><table class="simple">' +
        (d.topAssets.map(function (a) {
          return '<tr><td><a href="#asset=' + encodeURIComponent(a.id) + '">' + esc(a.id) + '</a></td><td>' + esc(a.name) + '</td><td class="num">' + a.count + '</td></tr>';
        }).join('') || '<tr><td>—</td></tr>') + '</table></div>';
      h += '<div class="card"><h3 style="margin-top:0">' + esc(t('d_certs')) + '</h3><table class="simple">' +
        (d.certs.map(function (c) {
          return '<tr><td><a href="#asset=' + encodeURIComponent(c.id) + '">' + esc(c.id) + '</a></td><td>' + esc(c.name) + '</td><td>' + C.certPill(c.status, c.expiry) + '</td></tr>';
        }).join('') || '<tr><td>✓</td></tr>') + '</table></div>';
      box.innerHTML = h;
    }).catch(function (e) { handleErr(e); box.innerHTML = ''; });
  }

  /* ---------------- QR labels ---------------- */
  var qrLib = null;
  function loadQr() {
    if (!qrLib) qrLib = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      s.onload = res; s.onerror = function () { rej(new Error('Could not load the QR code library. Check the internet connection.')); };
      document.head.appendChild(s);
    });
    return qrLib;
  }
  function siteBase() { return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''); }
  function renderLabelPick() {
    var q = $('lblQ').value.trim().toLowerCase();
    var list = S.assets.filter(function (a) { return assetMatches(a, q); });
    $('lblPick').innerHTML = list.map(function (a) {
      return '<label class="pick"><input type="checkbox" data-lbl="' + esc(a.AssetID) + '"' + (S.lblSel[a.AssetID] ? ' checked' : '') + '><b>' +
        esc(a.AssetID) + '</b><span class="muted">' + esc(a.Name) + '</span></label>';
    }).join('');
    updateLblCount();
  }
  function updateLblCount() { $('lblCount').textContent = Object.keys(S.lblSel).filter(function (k) { return S.lblSel[k]; }).length + ' selected'; }
  $('lblPick').addEventListener('change', function (e) {
    var c = e.target.closest('[data-lbl]'); if (!c) return; S.lblSel[c.getAttribute('data-lbl')] = c.checked; updateLblCount();
  });
  $('lblQ').addEventListener('input', function () { if (S.assets) renderLabelPick(); });
  $('lblAll').addEventListener('click', function () {
    $('lblPick').querySelectorAll('[data-lbl]').forEach(function (c) { c.checked = true; S.lblSel[c.getAttribute('data-lbl')] = true; });
    updateLblCount();
  });
  $('lblPrint').addEventListener('click', function () {
    var ids = S.assets.filter(function (a) { return S.lblSel[a.AssetID]; });
    if (!ids.length) return;
    loadQr().then(function () {
      var out = $('lblOut');
      out.innerHTML = ids.map(function (a, i) {
        return '<div class="label"><div class="qr" id="qr' + i + '"></div><div class="tx"><div class="lid">' + esc(a.AssetID) + '</div><div class="lname">' +
          esc(a.Name) + '</div><div class="lscan">' + esc(C.t('scanLabel')) + '</div><div class="lco">TVS Lanka (Pvt.) Ltd · Horana</div></div></div>';
      }).join('');
      ids.forEach(function (a, i) {
        /* global QRCode */
        new QRCode($('qr' + i), { text: siteBase() + 'asset.html?id=' + encodeURIComponent(a.AssetID), width: 236, height: 236, correctLevel: QRCode.CorrectLevel.M });
      });
      setTimeout(function () { window.print(); }, 400);
    }).catch(function (e) { alert(e.message); });
  });

  /* ---------------- me / telegram ---------------- */
  function renderMe() {
    var box = $('tab-me');
    box.innerHTML = C.loadingHtml();
    C.api('me').then(function (u) {
      S.user = u; C.saveSession(C.session().token, u);
      box.innerHTML = '<div class="card"><div style="font-size:20px;font-weight:800">' + esc(u.name) + '</div><div class="muted">' + esc(t('role')) + ': ' + esc(u.role) + '</div></div>' +
        '<div class="card"><h3 style="margin-top:0">' + esc(t('tgTitle')) + '</h3><div id="tgBox">' +
        (u.telegram ? '<div class="msg ok">' + esc(t('tgOn')) + '</div>' : '<p class="muted">' + esc(t('tgOff')) + '</p>') +
        '<button class="btn dark" id="tgStart" type="button">' + esc(t('tgConnect')) + '</button></div></div>' +
        '<button class="btn ghost" id="logout" type="button">' + esc(t('logout')) + '</button>';
      $('logout').addEventListener('click', function () { C.clearSession(); S.user = null; showLogin(); });
      $('tgStart').addEventListener('click', tgStart);
    }).catch(function (e) { handleErr(e); });
  }
  function tgStart() {
    var box = $('tgBox');
    box.innerHTML = C.loadingHtml();
    C.api('telegramLinkStart').then(function (r) {
      box.innerHTML = '<p>' + esc(t('tgStep1')) + '</p><a class="btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(t('tgOpen')) + ' (@' + esc(r.bot) + ')</a>' +
        '<p>' + esc(t('tgStep2')) + '</p><div id="tgErr" class="hidden"></div><button class="btn dark" id="tgCheck" type="button">' + esc(t('tgCheck')) + '</button>';
      $('tgCheck').addEventListener('click', function () {
        $('tgCheck').disabled = true;
        C.api('telegramLinkCheck').then(function (res) {
          if (res.linked) renderMe(); else { C.showMsg($('tgErr'), 'err', t('tgNotYet')); $('tgCheck').disabled = false; }
        }).catch(function (e) { handleErr(e, $('tgErr')); $('tgCheck').disabled = false; });
      });
    }).catch(function (e) { box.innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
  }

  document.addEventListener('langchange', function () {
    if (!S.user) return;
    renderViews();
    if (S.jobs) renderJobs();
    if (S.job && !$('sheet').classList.contains('hidden')) renderJob();
  });

  if (C.session()) start(); else showLogin();
})();
