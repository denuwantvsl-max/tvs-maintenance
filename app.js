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
    tabPm: ['PM', 'නඩත්තු සැලසුම'],
    qrShort: ['QR labels', 'QR ලේබල'],
    searchPm: ['Search PM tasks / machine ID…', 'නඩත්තු කාර්ය / යන්ත්‍ර අංකය සොයන්න…'],
    pv_due: ['Due now', 'දැන් කළ යුතු'],
    pv_week: ['This week', 'මෙම සතිය'],
    pv_mine: ['Mine', 'මගේ'],
    pv_unscheduled: ['No date', 'දිනයක් නැත'],
    pv_all: ['All tasks', 'සියලු කාර්ය'],
    pv_history: ['History', 'ඉතිහාසය'],
    pmLate: ['{n} d late', 'දින {n} ප්‍රමාදයි'],
    pmToday: ['Due today', 'අද කළ යුතුයි'],
    pmHours: ['Hours reached', 'පැය සම්පූර්ණයි'],
    pmNoDate: ['No date set', 'දිනයක් නැත'],
    pmNothingDue: ['Nothing due right now 👍', 'දැනට කළ යුතු දෙයක් නැත 👍'],
    pmFreq: ['Frequency', 'වාර ගණන'],
    pmNext: ['Next due', 'ඊළඟ දිනය'],
    pmLast: ['Last done', 'අවසන් වරට කළේ'],
    pmMeter: ['Hour meter', 'පැය මීටරය'],
    pmMeterIn: ['Hour meter reading', 'පැය මීටර කියවීම'],
    pmMeterInt: ['Also due every … hours (optional)', 'තවද පැය … කට වරක් (අත්‍යවශ්‍ය නැත)'],
    pmAnyone: ['Anyone in the team', 'කණ්ඩායමේ ඕනෑම අයෙක්'],
    pmChecklist: ['Checklist', 'පරීක්ෂණ ලැයිස්තුව'],
    pmNoChecklist: ['— No checklist (service record only) —', '— ලැයිස්තුවක් නැත (සේවා වාර්තාව පමණි) —'],
    pmDoCheck: ['Fill the checklist', 'පරීක්ෂණ ලැයිස්තුව පුරවන්න'],
    pmDoService: ['Record the service', 'සේවාව සටහන් කරන්න'],
    pmAllOk: ['Mark all OK', 'සියල්ල හරි ලෙස ලකුණු කරන්න'],
    pmPerChild: ['Check every tool. Tap "Mark all OK", then change only the faulty ones.', 'සෑම මෙවලමක්ම පරීක්ෂා කරන්න. "සියල්ල හරි" ඔබා දෝෂ ඇති ඒවා පමණක් වෙනස් කරන්න.'],
    pmRemarks: ['Remarks / work done', 'සටහන් / කළ වැඩ'],
    pmSubmit: ['Save record', 'වාර්තාව සුරකින්න'],
    pmSaved: ['Record saved', 'වාර්තාව සුරකින ලදී'],
    pmJobOpened: ['Not OK items found – repair job {id} opened and the team alerted.', 'දෝෂ හමු විය – අලුත්වැඩියා රැකියාව {id} විවෘත කර කණ්ඩායමට දැනුම් දෙන ලදී.'],
    pmViewRecord: ['View / print record', 'වාර්තාව බලන්න / මුද්‍රණය'],
    pmRecordNo: ['Record no.', 'වාර්තා අංකය'],
    pmTask: ['PM task', 'නඩත්තු කාර්යය'],
    pmDoneAt: ['Date', 'දිනය'],
    pmJob: ['Repair job', 'අලුත්වැඩියා රැකියාව'],
    pmCheckItem: ['Check', 'පරීක්ෂාව'],
    pmResult: ['Result', 'ප්‍රතිඵලය'],
    pmCheckedBy: ['Checked by', 'පරීක්ෂා කළේ'],
    pmReviewedBy: ['Reviewed by', 'සමාලෝචනය කළේ'],
    pmNewTask: ['New PM task', 'නව නඩත්තු කාර්යය'],
    pmTitle: ['Task title', 'කාර්යයේ නම'],
    pmScope: ['Which checklist items', 'කුමන අයිතම'],
    pmEvery: ['Repeat every', 'නැවත කරන්නේ'],
    pmActive: ['Active', 'සක්‍රීයයි'],
    u_day: ['day(s)', 'දින'],
    u_week: ['week(s)', 'සති'],
    u_month: ['month(s)', 'මාස'],
    u_none: ['One-off / no repeat', 'එක් වරක් පමණි'],
    ok: ['OK', 'හරි'],
    nok: ['Not OK', 'දෝෂයි'],
    na: ['N/A', 'අදාළ නැත'],
    print: ['Print', 'මුද්‍රණය'],
    d_pm: ['Preventive maintenance', 'වැළැක්වීමේ නඩත්තුව'],
    k_pmToday: ['PM due today', 'අද කළ යුතු නඩත්තු'],
    k_pmOverdue: ['PM overdue', 'ප්‍රමාද නඩත්තු'],
    k_pmDone: ['PM done this month', 'මෙම මාසයේ කළ නඩත්තු'],
    k_pmComp: ['PM compliance', 'නඩත්තු අනුකූලතාව'],
    pmForMachine: ['PM tasks', 'නඩත්තු කාර්ය'],
    addPmTask: ['+ PM task', '+ නඩත්තු කාර්යය'],
    machinePhoto: ['Machine photo', 'යන්ත්‍රයේ ඡායාරූපය'],
    removeMachine: ['Remove machine', 'යන්ත්‍රය ඉවත් කරන්න'],
    removeHint: ['Machines with job or PM history are kept as "Disposed" (history stays). Others are deleted.',
      'රැකියා හෝ නඩත්තු ඉතිහාසයක් ඇති යන්ත්‍ර "ඉවත් කළ" ලෙස තබා ගනී. අනෙක් ඒවා මකා දමයි.'],
    removeConfirm: ['Remove {id}?', '{id} ඉවත් කරන්නද?'],
    removeReason: ['Reason (optional), e.g. scrapped, replaced, duplicate', 'හේතුව (අත්‍යවශ්‍ය නැත)'],
    removedDeleted: ['Machine deleted.', 'යන්ත්‍රය මකා දමන ලදී.'],
    removedDisposed: ['Machine marked as Disposed. Its history is kept.', 'යන්ත්‍රය ඉවත් කළ ලෙස සලකුණු කළා. ඉතිහාසය තබා ඇත.'],
    showDisposed: ['Show removed machines', 'ඉවත් කළ යන්ත්‍ර පෙන්වන්න'],
    showActive: ['Show active machines', 'සක්‍රීය යන්ත්‍ර පෙන්වන්න'],
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
    if (name === 'labels') document.querySelector('#tabs [data-tab="assets"]').classList.add('on');
    ['jobs', 'pm', 'assets', 'dash', 'labels', 'me'].forEach(function (n) { $('tab-' + n).classList.toggle('hidden', n !== name); });
    if (name === 'pm') { renderPmViews(); loadPm(); }
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
    if (!$('tab-pm').classList.contains('hidden')) loadPm();
  });
  function route() {
    var h = location.hash.replace(/^#/, '');
    var m = /^wo=(.+)$/.exec(h), a = /^asset=(.*)$/.exec(h), pm = /^pm=(.*)$/.exec(h), rec = /^rec=(.+)$/.exec(h), pe = /^pmedit=(.*)$/.exec(h);
    if (m) openJob(decodeURIComponent(m[1]));
    else if (a) openAsset(decodeURIComponent(a[1]));
    else if (pm) openPm(decodeURIComponent(pm[1]));
    else if (rec) openRecord(decodeURIComponent(rec[1]));
    else if (pe) openPmEditor(decodeURIComponent(pe[1]));
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
    var disposed = S.assets.filter(function (a) { return a.Status === 'Disposed'; }).length;
    var list = S.assets.filter(function (a) {
      return (!S.area || a.Area === S.area) && assetMatches(a, q) && (S.showDisposed ? a.Status === 'Disposed' : a.Status !== 'Disposed');
    });
    $('assetList').innerHTML = list.map(function (a) {
      return '<button type="button" class="item has-thumb" data-asset="' + esc(a.AssetID) + '">' +
        (a.photoUrl ? '<img class="thumb" src="' + esc(a.photoUrl) + '" alt="" loading="lazy">' : '') +
        '<div class="top"><span class="id">' + esc(a.AssetID) + '</span>' +
        (a.Status && a.Status !== 'Active' ? '<span class="pill st-REJECTED">' + esc(a.Status) + '</span>' : '') +
        (a.openJobs ? '<span class="pill st-IN_PROGRESS">' + a.openJobs + ' open</span>' : '') +
        (a.certStatus !== 'none' ? C.certPill(a.certStatus, a.CertExpiry) : '') + '</div><div class="ttl">' + esc(a.Name) + '</div><div class="meta">📍 ' +
        esc(a.Location || '') + (a.Make ? ' · ' + esc(a.Make) : '') + (a.ParentID ? ' · ⤴ ' + esc(a.ParentID) : '') + '</div></button>';
    }).join('') || '<div class="muted center" style="padding:24px">—</div>';
    $('assetList').insertAdjacentHTML('beforeend', disposed ? '<button type="button" class="btn ghost sm" id="toggleDisposed" style="margin:8px auto 0">' +
      esc(S.showDisposed ? t('showActive') : t('showDisposed') + ' (' + disposed + ')') + '</button>' : '');
    if ($('toggleDisposed')) $('toggleDisposed').addEventListener('click', function (e) { e.stopPropagation(); S.showDisposed = !S.showDisposed; renderAssets(); });
  }
  $('areaChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-area]'); if (!b) return; S.area = b.getAttribute('data-area'); renderAssets();
  });
  $('assetQ').addEventListener('input', function () { if (S.assets) renderAssets(); });
  $('assetList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-asset]'); if (b) location.hash = 'asset=' + encodeURIComponent(b.getAttribute('data-asset'));
  });
  $('assetAdd').addEventListener('click', function () { location.hash = 'asset='; });
  $('assetQr').addEventListener('click', function () { showTab('labels'); });

  var ASSET_FIELDS = [
    ['AssetID', 'Asset ID *'], ['Name', 'Name *'], ['Area', 'Area'], ['Location', 'Location'], ['Category', 'Category'],
    ['ParentID', 'Part of (parent asset ID)'], ['Make', 'Make'], ['Model', 'Model'], ['SerialNo', 'Serial no.'], ['Year', 'Year'],
    ['Specs', 'Specifications (one per line, e.g. "Power: 30 kW")', 'area'], ['Criticality', 'Criticality', ['', 'A', 'B', 'C']],
    ['Status', 'Status', ['Active', 'Out of service', 'Disposed']], ['MaintainedBy', 'Maintained by'], ['PMFrequency', 'PM frequency'],
    ['ChecklistRef', 'Checklist ref. (e.g. TVS/QMS/CL/29)'], ['CertRequired', 'Statutory certificate required?', ['', 'Yes', 'No']],
    ['CertExpiry', 'Certificate valid until', 'date'], ['CertFileId', 'Certificate PDF (Google Drive link)'],
    ['MeterUnit', 'Hour meter? (h = hours)', ['', 'h', 'km']], ['CurrentMeter', 'Current meter reading'], ['Notes', 'Notes', 'area']
  ];

  function openAsset(id) {
    var go = function () {
      var a = id ? S.assets.filter(function (x) { return x.AssetID === id; })[0] : {};
      if (id && !a) { openSheet(id, '<div class="msg err">Not found</div>'); return; }
      var editable = isMgr(), h = '', photo = '', removePhoto = false;
      if (id) {
        h += '<div class="btn-row"><a class="btn ghost sm" href="asset.html?id=' + encodeURIComponent(id) + '" target="_blank" rel="noopener">' + esc(t('publicPage')) + ' ↗</a>' +
          '<a class="btn ghost sm" href="request.html?asset=' + encodeURIComponent(id) + '">' + esc(t('reportThis')) + '</a>' +
          '<button class="btn ghost sm" type="button" id="asPm">' + esc(t('pmForMachine')) + '</button>' +
          (editable ? '<a class="btn ghost sm" href="#pmedit=?asset=' + encodeURIComponent(id) + '">' + esc(t('addPmTask')) + '</a>' : '') + '</div>';
      }
      h += '<div class="card"><label class="f">' + esc(t('machinePhoto')) + '</label><div class="photo-pick asset-photo">' +
        '<img id="asPhotoPrev" class="' + (a.photoUrl ? '' : 'hidden') + '" src="' + esc(a.photoUrl || '') + '" alt="">' +
        (editable ? '<label class="btn ghost sm" for="asPhoto">' + esc(t('addPhoto')) + '</label><input type="file" id="asPhoto" accept="image/*" capture="environment" class="hidden">' +
          '<button type="button" class="btn ghost sm' + (a.photoUrl ? '' : ' hidden') + '" id="asPhotoDel">' + esc(t('removePhoto')) + '</button>' : (a.photoUrl ? '' : '<span class="muted">—</span>')) +
        '</div></div>';
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
      if (id && editable && a.Status !== 'Disposed') {
        h += '<div class="card danger-zone"><h3 style="margin-top:0">' + esc(t('removeMachine')) + '</h3><p class="muted small">' + esc(t('removeHint')) + '</p>' +
          '<div id="rmErr" class="hidden"></div><button class="btn ghost sm danger" id="asRemove" type="button">' + esc(t('removeMachine')) + '</button></div>';
      }
      openSheet(id || t('newAsset'), h);
      if (S.flash) { $('sheetBody').insertAdjacentHTML('afterbegin', '<div class="msg ok">' + esc(S.flash) + '</div>'); S.flash = ''; }
      if ($('asPm')) $('asPm').addEventListener('click', function () {
        history.pushState(null, '', location.pathname + location.search); closeSheet();
        $('pmQ').value = id; S.pmView = 'all'; showTab('pm');
      });
      if ($('asPhoto')) $('asPhoto').addEventListener('change', function () {
        var f = $('asPhoto').files[0]; if (!f) return;
        C.shrinkPhoto(f, 1280).then(function (d) {
          photo = d; removePhoto = false; $('asPhotoPrev').src = d; $('asPhotoPrev').classList.remove('hidden'); $('asPhotoDel').classList.remove('hidden');
        });
      });
      if ($('asPhotoDel')) $('asPhotoDel').addEventListener('click', function () {
        photo = ''; removePhoto = true; $('asPhotoPrev').classList.add('hidden'); $('asPhotoDel').classList.add('hidden');
      });
      if ($('asRemove')) $('asRemove').addEventListener('click', function () {
        if (!confirm(t('removeConfirm').replace('{id}', id))) return;
        var reason = prompt(t('removeReason')) || '';
        $('asRemove').disabled = true;
        C.api('assetRemove', { id: id, reason: reason }).then(function (r) {
          return loadAssets(true).then(function () {
            history.pushState(null, '', location.pathname + location.search); closeSheet(); renderAssets();
            alert(r.mode === 'deleted' ? t('removedDeleted') : t('removedDisposed'));
          });
        }).catch(function (e) { handleErr(e, $('rmErr')); $('asRemove').disabled = false; });
      });
      if (editable) $('asSave').addEventListener('click', function () {
        var data = {};
        ASSET_FIELDS.forEach(function (f) { data[f[0]] = $('as_' + f[0]).value.trim(); });
        if (id) data.AssetID = id;
        $('asSave').disabled = true;
        C.api('assetSave', { asset: data, isNew: !id, photo: photo, removePhoto: removePhoto }).then(function (r) {
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
      h += '<h2>' + esc(t('d_pm')) + '</h2><div class="kpis">' + tile(k.pmToday, 'k_pmToday') + tile(k.pmOverdue, 'k_pmOverdue', true) +
        tile(k.pmDoneMonth, 'k_pmDone') + tile(k.pmCompliance === null ? null : k.pmCompliance + '%', 'k_pmComp') + '</div>';
      if (d.pmDue && d.pmDue.length) h += '<div class="list" style="margin-top:10px">' + d.pmDue.map(pmCard).join('') + '</div>';
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

  /* ---------------- preventive maintenance ---------------- */
  var PM_VIEWS = ['due', 'week', 'mine', 'unscheduled', 'all', 'history'];
  function renderPmViews() {
    S.pmView = S.pmView || 'due';
    $('pmViews').innerHTML = PM_VIEWS.map(function (v) {
      return '<button type="button" class="chip' + (S.pmView === v ? ' on' : '') + '" data-pv="' + v + '">' + esc(t('pv_' + v)) + '</button>';
    }).join('');
  }
  $('pmViews').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pv]'); if (!b) return;
    S.pmView = b.getAttribute('data-pv'); renderPmViews(); loadPm();
  });
  var pmTimer;
  $('pmQ').addEventListener('input', function () { clearTimeout(pmTimer); pmTimer = setTimeout(loadPm, 350); });
  $('pmAdd').addEventListener('click', function () { location.hash = 'pmedit='; });

  function dueLabel(x) {
    if (x.state === 'overdue') return '<span class="pill badge-late">' + esc(t('pmLate').replace('{n}', x.daysLate)) + '</span>';
    if (x.state === 'today') return '<span class="pill st-IN_PROGRESS">' + esc(x.meterLeft !== null && x.meterLeft <= 0 ? t('pmHours') : t('pmToday')) + '</span>';
    if (x.state === 'soon') return '<span class="pill st-NEW">' + esc(C.fmtDate(x.nextDue, false)) + '</span>';
    if (x.state === 'unscheduled') return '<span class="pill st-REJECTED">' + esc(t('pmNoDate')) + '</span>';
    return '<span class="pill st-CLOSED">' + esc(C.fmtDate(x.nextDue, false)) + '</span>';
  }
  function pmCard(x) {
    var cls = { overdue: 'p0', today: 'p1' }[x.state] || 'p2';
    return '<button type="button" class="item ' + cls + '" data-pm="' + esc(x.id) + '"><div class="top"><span class="id">' + esc(x.assetId) + '</span>' + dueLabel(x) + '</div>' +
      '<div class="ttl">' + esc(x.title) + '</div><div class="meta">' + esc(x.assetName || '') + ' · 🔁 ' + esc(x.freq) +
      (x.meterLeft !== null ? ' · ⏱ ' + esc(x.meterLeft) + ' h left' : '') + (x.assignedName ? ' · 👷 ' + esc(x.assignedName) : '') +
      (x.doneBy && x.doneBy !== 'Internal' ? ' · 🏢 ' + esc(x.doneBy) : '') + '</div></button>';
  }
  function recCard(r) {
    return '<button type="button" class="item ' + (r.notOkCount > 0 ? 'p1' : 'p2') + '" data-rec="' + esc(r.id) + '"><div class="top"><span class="id">' + esc(r.id) + '</span>' +
      (r.notOkCount > 0 ? '<span class="pill badge-late">' + r.notOkCount + ' ✗</span>' : '<span class="pill st-CLOSED">✓ ' + (r.okCount || 0) + '</span>') + '</div>' +
      '<div class="ttl">' + esc(r.assetId + ' · ' + r.title) + '</div><div class="meta">' + esc(C.fmtDate(r.doneAt)) + ' · 👷 ' + esc(r.doneBy) +
      (r.woId ? ' · ' + esc(r.woId) : '') + '</div></button>';
  }
  function loadPm() {
    var box = $('pmList');
    box.innerHTML = C.loadingHtml();
    var q = $('pmQ').value.trim();
    var p = S.pmView === 'history' ? C.api('pmRecords', { assetId: /^[A-Z0-9][A-Z0-9-]+$/i.test(q) ? q : '' })
      : C.api('pmList', { view: S.pmView, q: q });
    return p.then(function (r) {
      if (S.pmView === 'history') { box.innerHTML = r.length ? r.map(recCard).join('') : '<div class="muted center" style="padding:24px">—</div>'; return; }
      box.innerHTML = r.tasks.length ? r.tasks.map(pmCard).join('') : '<div class="muted center" style="padding:24px">' + esc(t(S.pmView === 'due' ? 'pmNothingDue' : 'noJobs')) + '</div>';
    }).catch(function (e) { handleErr(e); box.innerHTML = ''; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pm]');
    if (b) { e.preventDefault(); location.hash = 'pm=' + b.getAttribute('data-pm'); return; }
    var r = e.target.closest('[data-rec]');
    if (r) { e.preventDefault(); location.hash = 'rec=' + r.getAttribute('data-rec'); }
  });

  /* task detail + checklist form */
  function openPm(id) {
    openSheet(id, C.loadingHtml());
    C.api('pmTask', { id: id }).then(function (x) { S.pm = x; renderPmTask(); })
      .catch(function (e) { if (e.auth) return handleErr(e); $('sheetBody').innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
  }
  function itemText(it) { return C.lang() === 'si' && it.textSi ? it.textSi : it.text; }
  function seg(key) {
    return '<div class="seg" data-key="' + esc(key) + '"><button type="button" data-v="ok">✓ ' + esc(t('ok')) + '</button>' +
      '<button type="button" data-v="nok">✗ ' + esc(t('nok')) + '</button><button type="button" data-v="na">' + esc(t('na')) + '</button></div>';
  }
  function renderPmTask() {
    var x = S.pm, tpl = x.template, h = '';
    $('sheetTitle').textContent = x.assetId + ' · ' + x.title;
    h += '<div class="card"><div class="top" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + dueLabel(x) + '</div>' +
      '<h2 style="margin:8px 0 4px">' + esc(x.title) + '</h2><dl class="kv">' +
      kv(t('machine'), x.assetId + ' — ' + (x.asset ? x.asset.name : '')) + kv(t('location'), x.asset && x.asset.location) +
      kv(t('pmFreq'), x.freq) + kv(t('pmNext'), x.nextDue ? C.fmtDate(x.nextDue, false) : t('pmNoDate')) +
      kv(t('pmLast'), x.lastDone ? C.fmtDate(x.lastDone) : '—') +
      (x.meterInterval ? kv(t('pmMeter'), (x.asset && x.asset.currentMeter !== '' ? x.asset.currentMeter + ' h' : '—') + (x.meterLeft !== null ? ' · ' + x.meterLeft + ' h left' : '')) : '') +
      kv(t('assignedTo'), x.assignedName || t('pmAnyone')) + kv(t('doneBy'), x.doneBy) +
      (tpl ? kv(t('pmChecklist'), (tpl.docNo || tpl.id) + ' · ' + tpl.title) : '') + kv(t('note'), x.notes) + '</dl>' +
      (isMgr() ? '<div class="btn-row"><a class="btn ghost sm" href="#pmedit=' + encodeURIComponent(x.id) + '">' + esc(t('a_edit')) + '</a></div>' : '') + '</div>';

    h += '<form id="pmForm" class="card" autocomplete="off" novalidate><h3 style="margin-top:0">' + esc(t(tpl ? 'pmDoCheck' : 'pmDoService')) + '</h3>';
    if (x.asset && x.asset.meterUnit) {
      h += field('pmMeterIn', t('pmMeterIn') + ' (' + x.asset.meterUnit + ')' + (x.meterInterval ? ' *' : ''),
        '<input type="number" id="pmMeterIn" inputmode="decimal" step="0.1" placeholder="' + esc(x.asset.currentMeter !== '' ? '≥ ' + x.asset.currentMeter : '') + '">');
    }
    if (tpl) {
      h += '<div class="btn-row" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="pmAllOk">✓ ' + esc(t('pmAllOk')) + '</button></div>';
      if (x.children && x.children.length) {
        var checks = tpl.items.filter(function (it) { return it.type === 'check'; });
        h += '<p class="hint">' + esc(t('pmPerChild')) + '</p>';
        h += x.children.map(function (c) {
          return '<div class="child-row"><div class="child-id"><b>' + esc(c.id) + '</b><span class="muted small">' + esc(c.location || '') + '</span></div>' +
            checks.map(function (it) { return '<div class="ck-row"><span>' + esc(itemText(it)) + '</span>' + seg(c.id + '|' + it.no) + '</div>'; }).join('') + '</div>';
        }).join('');
      } else {
        var lastSec = null;
        tpl.items.forEach(function (it) {
          if (it.section && it.section !== lastSec) { h += '<div class="ck-sec">' + esc(it.section) + '</div>'; lastSec = it.section; }
          var label = '<span>' + esc(itemText(it)) + (it.freq && it.freq !== x.scope ? ' <em class="freq">' + esc(it.freq) + '</em>' : '') + '</span>';
          if (it.type === 'number') {
            h += '<div class="ck-row">' + label + '<div class="num-in"><input type="number" step="any" inputmode="decimal" data-num="' + esc(it.no) + '"><span>' + esc(it.unit || '') +
              (it.min !== null || it.max !== null ? ' <small class="muted">(' + (it.min !== null ? it.min : '') + '–' + (it.max !== null ? it.max : '') + ')</small>' : '') + '</span></div></div>';
          } else if (it.type === 'text') {
            h += '<div class="ck-row col">' + label + '<input type="text" data-txt="' + esc(it.no) + '" maxlength="300"></div>';
          } else {
            h += '<div class="ck-row">' + label + seg(it.no) + '</div>';
          }
        });
      }
    }
    if (!tpl || (x.doneBy && x.doneBy !== 'Internal')) {
      h += '<div class="grid2"><div>' + field('pmContr', t('contractor'), '<input type="text" id="pmContr" maxlength="100" value="' + esc(x.doneBy !== 'Internal' ? x.doneBy : '') + '">') +
        '</div><div>' + field('pmCost', t('cost'), '<input type="number" id="pmCost" min="0" inputmode="numeric">') + '</div></div>';
    }
    h += field('pmRemarks', t('pmRemarks') + (tpl ? '' : ' *'), '<textarea id="pmRemarks" maxlength="1000" style="min-height:70px"></textarea>') +
      '<label class="f">' + esc(t('photo')) + ' <span class="opt">' + esc(t('optional')) + '</span></label><div class="photo-pick">' +
      '<label class="btn ghost sm" for="pmPhoto">' + esc(t('addPhoto')) + '</label><input type="file" id="pmPhoto" accept="image/*" capture="environment" class="hidden">' +
      '<img id="pmPhotoPrev" class="hidden" alt=""></div><div id="pmErr" class="hidden"></div>' +
      '<div style="margin-top:16px"><button class="btn" id="pmSubmit" type="submit">' + esc(t('pmSubmit')) + '</button></div></form>';

    if (x.records && x.records.length) h += '<h3>' + esc(t('history')) + '</h3><div class="list">' + x.records.map(recCard).join('') + '</div>';
    $('sheetBody').innerHTML = h;

    var answers = {}, photo = '';
    $('sheetBody').querySelectorAll('.seg').forEach(function (sg) {
      sg.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-v]'); if (!b) return;
        answers[sg.getAttribute('data-key')] = b.getAttribute('data-v');
        sg.querySelectorAll('button').forEach(function (o) { o.className = o === b ? 'on ' + b.getAttribute('data-v') : ''; });
      });
    });
    if ($('pmAllOk')) $('pmAllOk').addEventListener('click', function () {
      $('sheetBody').querySelectorAll('.seg').forEach(function (sg) {
        var k = sg.getAttribute('data-key');
        if (answers[k]) return;
        answers[k] = 'ok';
        sg.querySelectorAll('button').forEach(function (o) { o.className = o.getAttribute('data-v') === 'ok' ? 'on ok' : ''; });
      });
    });
    $('pmPhoto').addEventListener('change', function () {
      var f = $('pmPhoto').files[0]; if (!f) return;
      C.shrinkPhoto(f).then(function (d) { photo = d; $('pmPhotoPrev').src = d; $('pmPhotoPrev').classList.remove('hidden'); });
    });
    $('pmForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var results = Object.assign({}, answers);
      $('sheetBody').querySelectorAll('[data-num]').forEach(function (i) { if (i.value.trim() !== '') results[i.getAttribute('data-num')] = i.value.trim(); });
      $('sheetBody').querySelectorAll('[data-txt]').forEach(function (i) { if (i.value.trim() !== '') results[i.getAttribute('data-txt')] = i.value.trim(); });
      var v = function (id) { return $(id) ? $(id).value.trim() : ''; };
      $('pmSubmit').disabled = true; $('pmSubmit').textContent = t('sending');
      C.api('pmComplete', { data: { taskId: x.id, results: results, meter: v('pmMeterIn'), remarks: v('pmRemarks'), contractor: v('pmContr'), cost: v('pmCost'), photo: photo } })
        .then(function (r) {
          var msg = '<div class="card center"><div style="font-size:40px">' + (r.notOk ? '⚠️' : '✅') + '</div><h2>' + esc(t('pmSaved')) + '</h2>' +
            '<p class="muted">' + esc(r.recordId) + ' · ✓ ' + r.ok + (r.notOk ? ' · ✗ ' + r.notOk : '') + '</p>' +
            (r.woId ? '<div class="msg err">' + esc(t('pmJobOpened').replace('{id}', r.woId)) + '</div><a class="btn dark" href="#wo=' + esc(r.woId) + '">' + esc(r.woId) + '</a>' : '') +
            '<div class="btn-row"><a class="btn ghost" href="#rec=' + esc(r.recordId) + '">' + esc(t('pmViewRecord')) + '</a></div></div>';
          $('sheetBody').innerHTML = msg; $('sheet').scrollTop = 0;
        }).catch(function (err) {
          handleErr(err, $('pmErr')); if ($('pmSubmit')) { $('pmSubmit').disabled = false; $('pmSubmit').textContent = t('pmSubmit'); }
        });
    });
  }

  /* printable ISO record */
  function openRecord(id) {
    openSheet(id, C.loadingHtml());
    C.api('pmRecord', { id: id }).then(function (r) {
      var sh = r.sheet, h = '<div class="iso-rec card">';
      h += '<div class="iso-head"><div><b>TVS Lanka (Pvt.) Ltd</b><br><span class="muted small">QUALITY MANAGEMENT SYSTEM · Vehicle Assembly Complex – Horana</span></div>' +
        '<div class="iso-doc">' + esc(sh ? sh.doc || '' : 'PM service record') + '</div></div>';
      h += '<h2 style="margin:10px 0">' + esc(sh ? sh.title : r.title) + '</h2><dl class="kv">' + kv(t('pmRecordNo'), r.id) +
        kv(t('machine'), r.assetId + ' — ' + r.assetName) + kv(t('location'), r.location) + kv(t('pmTask'), r.title) +
        kv(t('pmDoneAt'), C.fmtDate(r.doneAt)) + kv(t('doneBy'), r.doneBy) + kv(t('pmMeterIn'), r.meter) +
        kv(t('contractor'), r.contractor) + kv(t('cost'), r.cost === '' ? '' : Number(r.cost).toLocaleString()) + kv(t('pmRemarks'), r.remarks) +
        (r.woId ? '<dt>' + esc(t('pmJob')) + '</dt><dd><a href="#wo=' + esc(r.woId) + '">' + esc(r.woId) + '</a></dd>' : '') + '</dl>';
      var mark = function (v) { return v === 'ok' ? '<span class="res ok">✓</span>' : v === 'nok' ? '<span class="res nok">✗</span>' : v === 'na' ? '<span class="res na">N/A</span>' : esc(v === undefined ? '' : v); };
      if (sh && sh.children && sh.children.length) {
        var cols = sh.items.filter(function (i) { return i[3] === 'check'; });
        h += '<div class="tbl-wrap"><table class="simple iso"><tr><th>Tool</th>' + cols.map(function (i) { return '<th>' + esc(i[2]) + '</th>'; }).join('') + '</tr>' +
          sh.children.map(function (c) { return '<tr><td><b>' + esc(c) + '</b></td>' + cols.map(function (i) { return '<td>' + mark(sh.values[c + '|' + i[0]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
      } else if (sh) {
        h += '<div class="tbl-wrap"><table class="simple iso"><tr><th>#</th><th>' + esc(t('pmCheckItem')) + '</th><th>' + esc(t('pmResult')) + '</th></tr>' +
          sh.items.map(function (i) { return '<tr><td>' + esc(i[0]) + '</td><td>' + esc(i[2]) + '</td><td>' + mark(sh.values[i[0]]) + (i[4] && sh.values[i[0]] !== undefined ? ' ' + esc(i[4]) : '') + '</td></tr>'; }).join('') + '</table></div>';
      }
      if (r.photoUrl) h += '<div class="photos" style="margin-top:12px"><a href="' + esc(r.photoUrl) + '" target="_blank" rel="noopener"><img src="' + esc(r.photoUrl) + '" alt=""></a></div>';
      h += '<div class="iso-sign"><div>' + esc(t('pmCheckedBy')) + ': ' + esc(r.doneBy) + '</div><div>' + esc(t('pmReviewedBy')) + ': ______________</div></div></div>';
      h += '<button class="btn dark no-print" type="button" id="recPrint">🖨 ' + esc(t('print')) + '</button>';
      $('sheetBody').innerHTML = h;
      $('recPrint').addEventListener('click', function () {
        document.body.classList.add('printing-sheet');
        window.print();
        setTimeout(function () { document.body.classList.remove('printing-sheet'); }, 500);
      });
    }).catch(function (e) { if (e.auth) return handleErr(e); $('sheetBody').innerHTML = '<div class="msg err">' + esc(e.message) + '</div>'; });
  }

  /* task editor (admin / supervisor) */
  function openPmEditor(arg) {
    var m = /^\?asset=(.*)$/.exec(arg || '');
    var id = m ? '' : arg, presetAsset = m ? decodeURIComponent(m[1]) : '';
    openSheet(id ? t('a_edit') + ' ' + id : t('pmNewTask'), C.loadingHtml());
    Promise.all([id ? C.api('pmTask', { id: id }) : Promise.resolve(null), S.templates ? Promise.resolve(S.templates) : C.api('templates')]).then(function (r) {
      var x = r[0] || {}, tpls = S.templates = r[1];
      var val = function (k, d) { return x[k] === undefined || x[k] === null ? (d || '') : x[k]; };
      var users = [{ v: '', l: t('pmAnyone') }].concat(S.users.filter(function (u) { return u.role !== 'viewer'; }).map(function (u) { return { v: u.id, l: u.name }; }));
      var h = '<div class="card">' +
        field('pe_asset', t('machine') + ' *', '<input type="text" id="pe_asset" list="peAssets" autocomplete="off" value="' + esc(val('assetId', presetAsset)) + '"><datalist id="peAssets">' +
          S.meta.assets.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join('') + '</datalist>') +
        field('pe_title', t('pmTitle') + ' *', '<input type="text" id="pe_title" maxlength="120" value="' + esc(val('title')) + '">') +
        field('pe_tpl', t('pmChecklist'), '<select id="pe_tpl">' + opts([{ v: '', l: t('pmNoChecklist') }].concat(tpls.map(function (tp) {
          return { v: tp.id, l: (tp.docNo || tp.id) + ' · ' + tp.title + ' (' + tp.count + ')' }; })), val('templateId')) + '</select>') +
        field('pe_scope', t('pmScope'), '<select id="pe_scope">' + opts(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'All'], val('scope', 'All')) + '</select>') +
        '<div class="grid2"><div>' + field('pe_fv', t('pmEvery'), '<input type="number" id="pe_fv" min="1" value="' + esc(val('freqValue', 1)) + '">') + '</div><div>' +
        field('pe_fu', ' ','<select id="pe_fu">' + opts([{ v: 'Day', l: t('u_day') }, { v: 'Week', l: t('u_week') }, { v: 'Month', l: t('u_month') }, { v: '', l: t('u_none') }], val('freqUnit', 'Month')) + '</select>') + '</div></div>' +
        field('pe_mi', t('pmMeterInt'), '<input type="number" id="pe_mi" min="0" inputmode="numeric" value="' + esc(val('meterInterval')) + '">') +
        field('pe_next', t('pmNext'), '<input type="date" id="pe_next" value="' + esc(C.toLocalInput(val('nextDue'), true)) + '">') +
        field('pe_user', t('assignTo'), '<select id="pe_user">' + opts(users, val('assignedTo')) + '</select>') +
        field('pe_by', t('doneBy'), '<input type="text" id="pe_by" list="peBy" value="' + esc(val('doneBy', 'Internal')) + '"><datalist id="peBy"><option value="Internal">' +
          '<option value="Swedish Trading Co. (Pvt) Ltd"><option value="Singer"><option value="UTE"><option value="G.max Fire Service"></datalist>') +
        field('pe_active', t('pmActive'), '<select id="pe_active">' + opts([{ v: 'Yes', l: t('yes') }, { v: 'No', l: t('no') }], x.id ? (x.active ? 'Yes' : 'No') : 'Yes') + '</select>') +
        field('pe_notes', t('note'), '<textarea id="pe_notes" maxlength="1000" style="min-height:70px">' + esc(val('notes')) + '</textarea>') +
        '<div id="peErr" class="hidden"></div><div style="margin-top:16px"><button class="btn dark" id="peSave" type="button">' + esc(t('save')) + '</button></div></div>';
      $('sheetBody').innerHTML = h;
      $('peSave').addEventListener('click', function () {
        var v = function (k) { return $(k).value.trim(); };
        var task = { TaskID: id || '', AssetID: v('pe_asset').split(' ')[0], Title: v('pe_title'), TemplateID: v('pe_tpl'), Scope: v('pe_scope'),
          FreqValue: v('pe_fv'), FreqUnit: v('pe_fu'), MeterInterval: v('pe_mi'), NextDue: v('pe_next'), AssignedTo: v('pe_user'),
          DoneBy: v('pe_by'), Active: v('pe_active'), Notes: v('pe_notes') };
        $('peSave').disabled = true;
        C.api('pmSave', { task: task }).then(function (r) { location.hash = 'pm=' + encodeURIComponent(r.id); })
          .catch(function (e) { handleErr(e, $('peErr')); $('peSave').disabled = false; });
      });
    }).catch(function (e) { handleErr(e); });
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
        '<div class="msg info">' + esc(t('tgManual')) + '<br><b>@' + esc(r.bot) + '</b> → START → <b style="font-size:20px;letter-spacing:2px">' + esc(r.code) + '</b></div>' +
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
