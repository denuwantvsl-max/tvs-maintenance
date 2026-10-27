/* TVS Horana CMMS – shared helpers: language, API calls, formatting, photos. */
(function () {
  'use strict';

  var LANG_KEY = 'cmms_lang';
  var TOKEN_KEY = 'cmms_token';
  var USER_KEY = 'cmms_user';

  /* ---------- storage that never throws ---------- */
  var store = {
    get: function (k, area) { try { return (area || localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, area) { try { (area || localStorage).setItem(k, v); } catch (e) { /* private mode */ } },
    del: function (k, area) { try { (area || localStorage).removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- language ---------- */
  var DICT = {
    plant: ['TVS Lanka · Horana Assembly Plant', 'TVS ලංකා · හොරණ එකලස් කිරීමේ කම්හල'],
    appName: ['Maintenance', 'නඩත්තු'],
    home: ['Home', 'මුල් පිටුව'],
    homeTitle: ['How can we help?', 'අපට ඔබට උදව් කළ හැක්කේ කෙසේද?'],
    homeLead: ['Report a breakdown, follow a job, or manage maintenance work.', 'බිඳවැටීමක් වාර්තා කරන්න, රැකියාවක් පසුවිපරම් කරන්න, හෝ නඩත්තු වැඩ කළමනාකරණය කරන්න.'],
    reportTitle: ['Report a problem', 'ගැටලුවක් වාර්තා කරන්න'],
    reportSub: ['Machine breakdown, electrical, plumbing, building…', 'යන්ත්‍ර බිඳවැටීම්, විදුලි, ජල නල, ගොඩනැගිලි…'],
    trackTitle: ['Check my request', 'මගේ ඉල්ලීම පරීක්ෂා කරන්න'],
    trackSub: ['See the status with your Job ID', 'රැකියා අංකයෙන් තත්ත්වය බලන්න'],
    teamTitle: ['Maintenance team', 'නඩත්තු කණ්ඩායම'],
    teamSub: ['Jobs, machines, dashboard (PIN)', 'රැකියා, යන්ත්‍ර, සාරාංශය (PIN)'],
    scanHint: ['Tip: scan the QR label on a machine to report a problem with that machine directly.',
      'ඉඟිය: යන්ත්‍රයේ ඇති QR ලේබලය ස්කෑන් කර එම යන්ත්‍රයේ ගැටලුව කෙලින්ම වාර්තා කරන්න.'],
    yourName: ['Your name', 'ඔබේ නම'],
    email: ['Email', 'ඊමේල්'],
    emailHint: ['We email you when the job is approved and finished.', 'රැකියාව අනුමත වූ විට සහ අවසන් වූ විට අපි ඔබට ඊමේල් කරමු.'],
    phone: ['Phone', 'දුරකථන අංකය'],
    department: ['Department', 'අංශය'],
    select: ['— Select —', '— තෝරන්න —'],
    machine: ['Machine / equipment', 'යන්ත්‍රය / උපකරණය'],
    machineHint: ['Type the ID or name. Leave empty for building / facility jobs.', 'අංකය හෝ නම ටයිප් කරන්න. ගොඩනැගිලි / පහසුකම් සඳහා හිස්ව තබන්න.'],
    location: ['Location', 'ස්ථානය'],
    category: ['Type of problem', 'ගැටලුවේ වර්ගය'],
    priority: ['How urgent?', 'කෙතරම් හදිසිද?'],
    'Very Urgent': ['Very Urgent', 'ඉතා හදිසි'],
    Urgent: ['Urgent', 'හදිසි'],
    General: ['General', 'සාමාන්‍ය'],
    pVeryUrgentHint: ['Safety risk or production stopped', 'ආරක්ෂක අවදානමක් හෝ නිෂ්පාදනය නැවතී ඇත'],
    pUrgentHint: ['Affects work, fix soon', 'වැඩට බලපායි, ඉක්මනින් සකස් කළ යුතුය'],
    pGeneralHint: ['Can be planned', 'සැලසුම් කළ හැක'],
    target: ['target', 'ඉලක්කය'],
    hours: ['h', 'පැ'],
    days: ['days', 'දින'],
    stopped: ['Is production stopped?', 'නිෂ්පාදනය නැවතී තිබේද?'],
    yes: ['Yes', 'ඔව්'],
    no: ['No', 'නැත'],
    description: ['What is the problem?', 'ගැටලුව කුමක්ද?'],
    descPh: ['Describe what happened, what you see or hear…', 'සිදු වූ දේ, ඔබ දකින හෝ ඇසෙන දේ විස්තර කරන්න…'],
    photo: ['Photo', 'ඡායාරූපය'],
    optional: ['(optional)', '(අත්‍යවශ්‍ය නැත)'],
    addPhoto: ['📷 Add photo', '📷 ඡායාරූපයක් එක් කරන්න'],
    removePhoto: ['Remove', 'ඉවත් කරන්න'],
    submit: ['Send request', 'ඉල්ලීම යවන්න'],
    sending: ['Sending…', 'යවමින්…'],
    loading: ['Loading…', 'පූරණය වෙමින්…'],
    sentTitle: ['Request sent', 'ඉල්ලීම යවන ලදී'],
    sentText: ['Keep this Job ID. The maintenance team has been notified.', 'මෙම රැකියා අංකය තබා ගන්න. නඩත්තු කණ්ඩායමට දැනුම් දී ඇත.'],
    trackIt: ['Track this request', 'මෙම ඉල්ලීම බලන්න'],
    reportAnother: ['Report another problem', 'තවත් ගැටලුවක් වාර්තා කරන්න'],
    jobId: ['Job ID', 'රැකියා අංකය'],
    check: ['Check', 'පරීක්ෂා කරන්න'],
    status: ['Status', 'තත්ත්වය'],
    st_NEW: ['New – waiting for approval', 'නව – අනුමැතිය බලාපොරොත්තුවෙන්'],
    st_ASSIGNED: ['Assigned', 'පවරා ඇත'],
    st_IN_PROGRESS: ['Work in progress', 'වැඩ කරමින් පවතී'],
    st_ON_HOLD: ['On hold', 'තාවකාලිකව නවතා ඇත'],
    st_DONE: ['Done – please confirm', 'අවසන් – කරුණාකර තහවුරු කරන්න'],
    st_CLOSED: ['Closed', 'වසා ඇත'],
    st_REJECTED: ['Not accepted', 'පිළිගත්තේ නැත'],
    stepRequested: ['Requested', 'ඉල්ලුම් කළා'],
    stepAssigned: ['Approved & assigned', 'අනුමත කර පවරා ඇත'],
    stepWorking: ['Work started', 'වැඩ ආරම්භ විය'],
    stepDone: ['Work done', 'වැඩ අවසන්'],
    stepClosed: ['Closed', 'වසා ඇත'],
    assignedTo: ['Assigned to', 'පවරා ඇත්තේ'],
    workDone: ['Work done', 'කළ වැඩ'],
    dueBy: ['Target', 'ඉලක්ක කාලය'],
    confirmQ: ['Is the problem fixed?', 'ගැටලුව විසඳී තිබේද?'],
    fixedYes: ['Yes, fixed', 'ඔව්, විසඳුණා'],
    fixedNo: ['No, still a problem', 'නැත, තවමත් ගැටලුවක්'],
    feedback: ['Comment', 'අදහස'],
    feedbackPh: ['What is still wrong? (required if not fixed)', 'තවමත් වැරදි කුමක්ද? (විසඳී නැත්නම් අවශ්‍යයි)'],
    thanksClosed: ['Thank you! The job is closed.', 'ස්තුතියි! රැකියාව වසා ඇත.'],
    thanksReopened: ['Thank you. The job was sent back to the maintenance team.', 'ස්තුතියි. රැකියාව නැවත නඩත්තු කණ්ඩායමට යවන ලදී.'],
    reportThis: ['Report a problem with this machine', 'මෙම යන්ත්‍රයේ ගැටලුවක් වාර්තා කරන්න'],
    certificate: ['Inspection certificate', 'පරීක්ෂණ සහතිකය'],
    cert_valid: ['Valid', 'වලංගුයි'],
    cert_expiring: ['Expiring soon', 'ඉක්මනින් කල් ඉකුත් වේ'],
    cert_expired: ['EXPIRED', 'කල් ඉකුත් වී ඇත'],
    cert_missing: ['Missing', 'නැත'],
    cert_none: ['Not required', 'අවශ්‍ය නැත'],
    validUntil: ['valid until', 'දක්වා වලංගුයි'],
    make: ['Make', 'නිෂ්පාදකයා'],
    model: ['Model', 'මාදිලිය'],
    serial: ['Serial no.', 'අනුක්‍රමික අංකය'],
    year: ['Year', 'වර්ෂය'],
    area: ['Area', 'කලාපය'],
    specs: ['Specifications', 'පිරිවිතර'],
    partOf: ['Part of', 'අයත් වන්නේ'],
    components: ['Components / tools', 'කොටස් / මෙවලම්'],
    staffOnly: ['Staff information', 'කාර්ය මණ්ඩල තොරතුරු'],
    loginForMore: ['Maintenance team: log in to see certificates and history.', 'නඩත්තු කණ්ඩායම: සහතික සහ ඉතිහාසය බැලීමට ඇතුළු වන්න.'],
    notConfigured: ['The system is not connected yet (API URL missing in config.js).', 'පද්ධතිය තවම සම්බන්ධ කර නැත (config.js හි API URL නැත).'],
    netError: ['Could not reach the server. Check your internet and try again.', 'සේවාදායකයට සම්බන්ධ විය නොහැක. අන්තර්ජාලය පරීක්ෂා කර නැවත උත්සාහ කරන්න.'],
    back: ['Back', 'ආපසු'],
    required: ['Please fill all required fields.', 'කරුණාකර අවශ්‍ය සියලු තොරතුරු පුරවන්න.']
  };
  var lang = store.get(LANG_KEY) === 'si' ? 'si' : 'en';
  var extra = {};

  function t(key) {
    var e = extra[key] || DICT[key];
    if (!e) return key;
    return (lang === 'si' ? e[1] : e[0]) || e[0];
  }
  function addDict(d) { Object.keys(d).forEach(function (k) { extra[k] = d[k]; }); }
  function applyI18n(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    document.documentElement.lang = lang === 'si' ? 'si' : 'en';
    document.querySelectorAll('.lang-btn').forEach(function (b) { b.textContent = lang === 'si' ? 'English' : 'සිංහල'; });
  }
  function setLang(l) {
    lang = l === 'si' ? 'si' : 'en';
    store.set(LANG_KEY, lang);
    applyI18n();
    document.dispatchEvent(new CustomEvent('langchange'));
  }
  function initLangButton() {
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { setLang(lang === 'si' ? 'en' : 'si'); });
    });
    applyI18n();
  }

  /* ---------- API ---------- */
  var MOCK = /[?&]mock=1\b/.test(location.search) || store.get('cmms_mock', sessionStorage) === '1';
  if (MOCK) store.set('cmms_mock', '1', sessionStorage);

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  var mockReady = null;
  function ensureMock() {
    if (!mockReady) {
      mockReady = loadScript('dev/fake-gas.js').then(function () { return loadScript('dev/demo-data.js'); })
        .then(function () { return loadScript('dev/mock-boot.js'); })
        .then(function () { return window.CMMS_MOCK_BOOT(); });
    }
    return mockReady;
  }

  function api(action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    var tok = store.get(TOKEN_KEY);
    if (tok && !body.token) body.token = tok;
    var p;
    if (MOCK) {
      p = ensureMock().then(function () { return window.CMMS_MOCK_POST(body); });
    } else {
      var url = (window.CMMS_CONFIG || {}).API_URL;
      if (!url) return Promise.reject(new Error(t('notConfigured')));
      p = fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); }, function () { throw new Error(t('netError')); });
    }
    return p.then(function (res) {
      if (!res || !res.ok) {
        var err = new Error((res && res.error) || 'Error');
        if (/log in again/i.test(err.message)) { err.auth = true; clearSession(); }
        throw err;
      }
      return res.data;
    });
  }

  function session() {
    var tok = store.get(TOKEN_KEY);
    var u = null;
    try { u = JSON.parse(store.get(USER_KEY) || 'null'); } catch (e) { u = null; }
    return tok && u ? { token: tok, user: u } : null;
  }
  function saveSession(tok, user) { store.set(TOKEN_KEY, tok); store.set(USER_KEY, JSON.stringify(user)); }
  function clearSession() { store.del(TOKEN_KEY); store.del(USER_KEY); }

  /* ---------- formatting ---------- */
  function esc(v) {
    return String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    var s = d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
    if (withTime !== false) s += ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    return s;
  }
  function fmtAgo(iso) {
    if (!iso) return '';
    var mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return Math.max(mins, 0) + ' min';
    var h = Math.round(mins / 60);
    if (h < 48) return h + ' ' + t('hours');
    return Math.round(h / 24) + ' ' + t('days');
  }
  function toLocalInput(iso, dateOnly) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var p = function (n) { return ('0' + n).slice(-2); };
    var s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    return dateOnly ? s : s + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function statusPill(st) { return '<span class="pill st-' + esc(st) + '">' + esc(t('st_' + st)) + '</span>'; }
  function prioPill(pr) { return pr ? '<span class="pill pr-' + esc(String(pr).replace(/\s/g, '')) + '">' + esc(t(pr)) + '</span>' : ''; }
  function prioClass(pr) { return { 'Very Urgent': 'p0', 'Urgent': 'p1', 'General': 'p2' }[pr] || 'p2'; }
  function certPill(status, expiry) {
    var txt = t('cert_' + status) + (expiry && status !== 'none' ? ' · ' + fmtDate(expiry, false) : '');
    return '<span class="pill cert-' + esc(status) + '">' + esc(txt) + '</span>';
  }
  function param(name) { return new URLSearchParams(location.search).get(name) || ''; }
  function showMsg(el, kind, text) {
    if (!el) return;
    el.className = 'msg ' + kind;
    el.textContent = text;
    el.classList.remove('hidden');
    if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function loadingHtml() { return '<div class="loading"><div class="spinner"></div>' + esc(t('loading')) + '</div>'; }

  /* ---------- photos: shrink before upload ---------- */
  function shrinkPhoto(file, maxSide) {
    maxSide = maxSide || 1280;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read photo')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Could not read photo')); };
        img.onload = function () {
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.CMMS = {
    t: t, addDict: addDict, applyI18n: applyI18n, setLang: setLang, initLangButton: initLangButton,
    lang: function () { return lang; }, api: api, session: session, saveSession: saveSession, clearSession: clearSession,
    esc: esc, fmtDate: fmtDate, fmtAgo: fmtAgo, toLocalInput: toLocalInput, statusPill: statusPill, prioPill: prioPill,
    prioClass: prioClass, certPill: certPill, param: param, showMsg: showMsg, loadingHtml: loadingHtml,
    shrinkPhoto: shrinkPhoto, store: store, isMock: function () { return MOCK; }
  };
})();
