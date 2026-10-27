/**
 * TVS Horana CMMS – API
 * Google Apps Script web app (standalone project) that stores its data in the Google Sheet "TVS Horana CMMS DB".
 * Phase 1: asset register, public QR asset pages, work orders, Telegram + email alerts.
 *
 * Secrets live ONLY in Script Properties (Project Settings > Script Properties):
 *   TELEGRAM_BOT_TOKEN  – from @BotFather (set by Denuwan)
 *   TOKEN_SECRET        – created automatically by setup()
 *   PHOTO_FOLDER_ID     – created automatically by setup()
 * Staff PINs: type a PIN into the Users tab "NewPIN" column; it is hashed and cleared on first use.
 */

var TZ = 'Asia/Colombo';
var DB_SHEET_ID = '1vkmq3CH5tjTfxaaxLaTCXkLpg4taqWUClQHaWTFrJ-A'; // "TVS Horana CMMS DB"
var OLD_REQUESTS_SHEET_ID = '1RurjIrWvBDDJYh613ZRUf1kouJISIiU8t7kBObyNL_U'; // old Google Form responses (import only)

var TABLES = {
  Assets: ['AssetID', 'Name', 'Area', 'Location', 'Category', 'ParentID', 'Make', 'Model', 'SerialNo', 'Year',
    'Specs', 'Criticality', 'Status', 'MaintainedBy', 'PMFrequency', 'ChecklistRef', 'CertRequired', 'CertExpiry',
    'CertFileId', 'Notes', 'Created', 'Updated', 'Photo', 'MeterUnit', 'CurrentMeter', 'MeterUpdated'],
  WorkOrders: ['WO_ID', 'Created', 'RequesterName', 'RequesterEmail', 'RequesterPhone', 'Department', 'Location',
    'AssetID', 'AssetName', 'Category', 'Priority', 'Description', 'ProductionStopped', 'RequestPhoto', 'Status',
    'DueAt', 'ApprovedBy', 'ApprovedAt', 'AssignedTo', 'AssignedAt', 'StartedAt', 'CompletedAt', 'ClosedAt',
    'ClosedBy', 'WorkType', 'FailureCause', 'RootCause', 'ActionTaken', 'PartsUsed', 'LabourHours', 'Cost', 'DoneBy',
    'Contractor', 'DowntimeStart', 'DowntimeEnd', 'DowntimeMin', 'AfterPhoto', 'RequesterFeedback', 'ConfirmKey',
    'LastOverdueAlert', 'Updated', 'Source', 'OldJobID'],
  WorkOrderLog: ['Timestamp', 'WO_ID', 'User', 'Action', 'FromStatus', 'ToStatus', 'Note'],
  Users: ['UserID', 'Name', 'Role', 'Email', 'Phone', 'Active', 'NewPIN', 'PinHash', 'TelegramChatID',
    'TelegramLinkCode', 'LastLogin'],
  ChecklistItems: ['TemplateID', 'TemplateTitle', 'DocNo', 'ItemNo', 'Section', 'Text', 'TextSi', 'Type', 'Unit', 'Min',
    'Max', 'Frequency', 'PerChild', 'Active'],
  PMTasks: ['TaskID', 'AssetID', 'Title', 'TemplateID', 'Scope', 'FreqUnit', 'FreqValue', 'MeterInterval', 'NextDue',
    'LastDone', 'LastMeter', 'AssignedTo', 'DoneBy', 'Active', 'Notes', 'Created', 'Updated'],
  PMRecords: ['RecordID', 'TaskID', 'AssetID', 'TemplateID', 'Title', 'DoneAt', 'DoneBy', 'Meter', 'Results', 'OkCount',
    'NotOkCount', 'Remarks', 'Contractor', 'Cost', 'Photo', 'WO_ID'],
  Settings: ['Key', 'Value', 'Description'],
  Errors: ['Timestamp', 'Action', 'Message', 'Stack']
};

// Columns kept as plain text (leading zeros, IDs, phone numbers, PINs)
var TEXT_COLUMNS = {
  Assets: ['AssetID', 'ParentID', 'SerialNo', 'Year', 'CertFileId'],
  WorkOrders: ['WO_ID', 'RequesterPhone', 'AssetID', 'ConfirmKey', 'OldJobID'],
  Users: ['UserID', 'Phone', 'NewPIN', 'PinHash', 'TelegramChatID', 'TelegramLinkCode'],
  ChecklistItems: ['TemplateID', 'ItemNo'],
  PMTasks: ['TaskID', 'AssetID', 'TemplateID', 'AssignedTo'],
  PMRecords: ['RecordID', 'TaskID', 'AssetID', 'TemplateID', 'WO_ID']
};

var DEFAULT_SETTINGS = [
  ['APP_URL', 'https://denuwantvsl-max.github.io/tvs-maintenance/', 'Web address of the GitHub Pages site (ends with /)'],
  ['PLANT_NAME', 'TVS Lanka (Pvt.) Ltd – Vehicle Assembly Complex, Horana', 'Shown in emails'],
  ['TARGET_HOURS_VERY_URGENT', '4', 'Target hours to finish a Very Urgent job'],
  ['TARGET_HOURS_URGENT', '24', 'Target hours to finish an Urgent job'],
  ['TARGET_HOURS_GENERAL', '168', 'Target hours to finish a General job (168 = 7 days)'],
  ['AUTO_CLOSE_DAYS', '3', 'Done jobs close automatically if the requester does not reply within this many days'],
  ['CATEGORIES', 'Mechanical,Electrical,Pneumatic,Hydraulic,Plumbing,Civil / Building,General Maintenance,Other', 'Request categories (comma separated)'],
  ['DEPARTMENTS', 'SKD Assembly,CKD,3W,Stores,Quality,Testing,Rectification,IT,Security,Admin / HR,Work Study,Maintenance,Other', 'Departments (comma separated)'],
  ['WORK_TYPES', 'Breakdown,Corrective,Facility,Improvement,Safety,Other', 'Work types (comma separated)'],
  ['FAILURE_CAUSES', 'Wear and tear,Lack of lubrication,Electrical fault,Pneumatic leak,Hydraulic fault,Operator error,Damage / accident,Design / installation,Unknown,Not a failure', 'Failure causes (comma separated)'],
  ['NOTIFY_EMAILS', '', 'Extra emails copied on new requests (comma separated, optional)'],
  ['CERT_ALERT_DAYS', '60,30,7,1', 'Telegram alert this many days before an inspection certificate expires'],
  ['PM_SOON_DAYS', '7', 'PM tasks due within this many days show as "coming up"']
];

var PRIORITIES = ['Very Urgent', 'Urgent', 'General'];
var OPEN_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'DONE'];
var MANAGER_ROLES = ['admin', 'supervisor'];
var TEAM_ROLES = ['admin', 'supervisor', 'technician'];
var SCOPE_RANK = { Daily: 1, Weekly: 2, Monthly: 3, Quarterly: 4, 'Half-yearly': 5, Yearly: 6, All: 9 };
var TOKEN_DAYS = 30;

/* =========================================================================
 * Web entry points
 * ========================================================================= */

function doGet(e) {
  return json_({ ok: true, app: 'TVS Horana CMMS API', time: new Date().toISOString() });
}

function doPost(e) {
  var action = '';
  TABLE_CACHE_ = {};
  try {
    var p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    action = String(p.action || '');
    var fn = ROUTES[action];
    if (!fn) throw new Error('Unknown action: ' + action);
    var data = fn(p);
    return json_({ ok: true, data: data });
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    if (!(err && err.userError)) logError_(action, err);
    return json_({ ok: false, error: msg });
  }
}

var ROUTES = {
  ping: function () { return { time: new Date().toISOString() }; },
  meta: apiMeta_,
  assetPublic: apiAssetPublic_,
  createRequest: apiCreateRequest_,
  track: apiTrack_,
  confirm: apiConfirm_,
  login: apiLogin_,
  me: function (p) { return publicUser_(auth_(p)); },
  jobs: apiJobs_,
  job: apiJob_,
  jobAction: apiJobAction_,
  assetsList: apiAssetsList_,
  assetSave: apiAssetSave_,
  dashboard: apiDashboard_,
  users: apiUsers_,
  telegramLinkStart: apiTelegramLinkStart_,
  telegramLinkCheck: apiTelegramLinkCheck_,
  assetRemove: apiAssetRemove_,
  pmList: apiPmList_,
  pmTask: apiPmTask_,
  pmComplete: apiPmComplete_,
  pmSave: apiPmSave_,
  pmRecords: apiPmRecords_,
  pmRecord: apiPmRecord_,
  templates: apiTemplates_
};

/* =========================================================================
 * Public API
 * ========================================================================= */

function apiMeta_(p) {
  var s = settings_();
  var assets = readTable_('Assets').rows
    .filter(function (a) { return a.AssetID && String(a.Status || 'Active') !== 'Disposed'; })
    .map(function (a) { return { id: a.AssetID, name: a.Name, area: a.Area, location: a.Location, parent: a.ParentID }; });
  var locs = {};
  assets.forEach(function (a) { if (a.location) locs[String(a.location).trim()] = 1; });
  var wos = readTable_('WorkOrders').rows;
  wos.slice(-300).forEach(function (w) { if (w.Location) locs[String(w.Location).trim()] = 1; });
  var staff = readTable_('Users').rows
    .filter(function (u) { return isActive_(u) && u.UserID; })
    .map(function (u) { return { id: String(u.UserID), name: u.Name }; });
  return {
    categories: list_(s.CATEGORIES),
    departments: list_(s.DEPARTMENTS),
    workTypes: list_(s.WORK_TYPES),
    failureCauses: list_(s.FAILURE_CAUSES),
    priorities: PRIORITIES.map(function (pr) { return { name: pr, hours: targetHours_(pr, s) }; }),
    assets: assets,
    locations: Object.keys(locs).sort(),
    staff: staff
  };
}

function apiAssetPublic_(p) {
  var id = cleanId_(p.id);
  var t = readTable_('Assets');
  var a = find_(t.rows, 'AssetID', id);
  if (!a) throw userError_('Asset not found: ' + id);
  var out = {
    id: a.AssetID, name: a.Name, area: a.Area, location: a.Location, category: a.Category, parent: a.ParentID,
    make: a.Make, model: a.Model, serial: a.SerialNo, year: a.Year, specs: a.Specs, status: a.Status || 'Active',
    certRequired: yes_(a.CertRequired), certExpiry: iso_(a.CertExpiry), certStatus: certStatus_(a),
    photoUrl: photoUrl_(a.Photo)
  };
  if (a.ParentID) {
    var par = find_(t.rows, 'AssetID', String(a.ParentID));
    if (par) out.parentName = par.Name;
  }
  out.children = t.rows.filter(function (c) { return String(c.ParentID) === String(a.AssetID); })
    .map(function (c) { return { id: c.AssetID, name: c.Name, location: c.Location }; });

  var user = optionalAuth_(p);
  if (user) {
    out.staff = {
      maintainedBy: a.MaintainedBy, pmFrequency: a.PMFrequency, checklistRef: a.ChecklistRef,
      criticality: a.Criticality, notes: a.Notes,
      certUrl: a.CertFileId ? 'https://drive.google.com/file/d/' + a.CertFileId + '/view' : '',
      jobs: readTable_('WorkOrders').rows
        .filter(function (w) { return String(w.AssetID) === String(a.AssetID); })
        .sort(function (x, y) { return dateNum_(y.Created) - dateNum_(x.Created); })
        .slice(0, 30).map(jobSummary_),
      meter: a.MeterUnit ? { unit: a.MeterUnit, value: a.CurrentMeter, updated: iso_(a.MeterUpdated) } : null,
      pm: readTable_('PMTasks').rows.filter(function (t) { return String(t.AssetID) === String(a.AssetID) && yes_(t.Active); })
        .map(function (t) { return pmSummary_(t, a); })
    };
  }
  return out;
}

function apiCreateRequest_(p) {
  if (p.website) throw userError_('Rejected.'); // honeypot field, humans never fill it
  var r = p.request || {};
  var name = clean_(r.name, 80), email = clean_(r.email, 120).toLowerCase(), phone = clean_(r.phone, 30);
  var dept = clean_(r.department, 60), loc = clean_(r.location, 120), cat = clean_(r.category, 60);
  var pr = clean_(r.priority, 20), desc = clean_(r.description, 2000);
  if (!name) throw userError_('Please enter your name.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw userError_('Email address looks wrong.');
  if (!dept) throw userError_('Please select your department.');
  if (PRIORITIES.indexOf(pr) < 0) throw userError_('Please select the priority.');
  if (!cat) throw userError_('Please select a category.');
  if (desc.length < 5) throw userError_('Please describe the problem.');

  var cache = CacheService.getScriptCache();
  var rateKey = 'rq_' + (email || name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
  var count = Number(cache.get(rateKey) || 0);
  if (count >= 15) throw userError_('Too many requests from you in the last hour. Please call the maintenance team.');
  cache.put(rateKey, String(count + 1), 3600);

  var asset = null;
  if (r.assetId) {
    asset = find_(readTable_('Assets').rows, 'AssetID', cleanId_(r.assetId));
    if (!asset) throw userError_('Asset not found: ' + r.assetId);
    if (!loc) loc = String(asset.Location || '');
  }
  if (!loc) throw userError_('Please enter the location.');

  var s = settings_();
  var now = new Date();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var wo;
  try {
    var t = readTable_('WorkOrders', true);
    wo = {
      WO_ID: nextWoId_(t.rows, now), Created: now, RequesterName: name, RequesterEmail: email,
      RequesterPhone: phone, Department: dept, Location: loc,
      AssetID: asset ? asset.AssetID : '', AssetName: asset ? asset.Name : '',
      Category: cat, Priority: pr, Description: desc, ProductionStopped: r.productionStopped ? 'Yes' : 'No',
      Status: 'NEW', DueAt: new Date(now.getTime() + targetHours_(pr, s) * 3600000),
      ConfirmKey: Utilities.getUuid().replace(/-/g, '').slice(0, 16), Updated: now, Source: 'Web'
    };
    if (wo.ProductionStopped === 'Yes') wo.DowntimeStart = now;
    appendObj_('WorkOrders', wo);
    addLog_(wo.WO_ID, name + ' (requester)', 'Created', '', 'NEW', '');
  } finally {
    lock.releaseLock();
  }

  if (r.photo) {
    try {
      var fid = savePhoto_(r.photo, wo.WO_ID + '_request');
      updateWo_(wo.WO_ID, { RequestPhoto: fid });
    } catch (err) { logError_('createRequest.photo', err); }
  }

  var appUrl = s.APP_URL;
  notifyRoles_(TEAM_ROLES,
    '🆕 <b>New request ' + wo.WO_ID + '</b> [' + esc_(pr) + ']\n' +
    (wo.AssetID ? '🔧 ' + esc_(wo.AssetID + ' – ' + wo.AssetName) + '\n' : '') +
    '📍 ' + esc_(loc) + '\n' + '👤 ' + esc_(name) + ' (' + esc_(dept) + ')\n' +
    (wo.ProductionStopped === 'Yes' ? '⛔ <b>Production stopped</b>\n' : '') +
    '📝 ' + esc_(short_(desc, 300)) + '\n\n' + appUrl + 'app.html#wo=' + wo.WO_ID);

  var trackUrl = appUrl + 'track.html?id=' + wo.WO_ID;
  if (email) {
    sendMail_(email, 'Maintenance request ' + wo.WO_ID + ' received',
      'Dear ' + name + ',\n\nYour maintenance request has been received.\n\n' +
      'Job ID: ' + wo.WO_ID + '\nLocation: ' + loc + '\nPriority: ' + pr + '\nDescription: ' + desc + '\n\n' +
      'Track the status here: ' + trackUrl + '\n\n' + s.PLANT_NAME + '\nMaintenance Team');
  }
  var extra = list_(s.NOTIFY_EMAILS);
  if (extra.length) {
    sendMail_(extra.join(','), 'New maintenance request ' + wo.WO_ID + ' [' + pr + ']',
      wo.WO_ID + '\nRequested by: ' + name + ' (' + dept + ')\nLocation: ' + loc + '\nDescription: ' + desc +
      '\n\nOpen: ' + appUrl + 'app.html#wo=' + wo.WO_ID);
  }
  return { id: wo.WO_ID, trackUrl: trackUrl };
}

function apiTrack_(p) {
  var id = cleanId_(p.id);
  var w = find_(readTable_('WorkOrders').rows, 'WO_ID', id);
  if (!w) throw userError_('Job not found: ' + id);
  var keyOk = p.key && String(p.key) === String(w.ConfirmKey);
  return {
    id: w.WO_ID, created: iso_(w.Created), status: w.Status, priority: w.Priority, location: w.Location,
    assetId: w.AssetID, assetName: w.AssetName, category: w.Category, description: short_(w.Description, 400),
    assignedTo: userName_(w.AssignedTo), approvedAt: iso_(w.ApprovedAt), startedAt: iso_(w.StartedAt),
    completedAt: iso_(w.CompletedAt), closedAt: iso_(w.ClosedAt), dueAt: iso_(w.DueAt),
    actionTaken: (w.Status === 'DONE' || w.Status === 'CLOSED') ? short_(w.ActionTaken, 400) : '',
    canConfirm: !!keyOk && w.Status === 'DONE'
  };
}

function apiConfirm_(p) {
  var id = cleanId_(p.id);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var w;
  try {
    w = find_(readTable_('WorkOrders', true).rows, 'WO_ID', id);
    if (!w) throw userError_('Job not found.');
    if (!p.key || String(p.key) !== String(w.ConfirmKey)) throw userError_('This confirmation link is not valid.');
    if (w.Status !== 'DONE') throw userError_('This job is not waiting for confirmation.');
    var fb = clean_(p.feedback, 500);
    var now = new Date();
    if (p.fixed) {
      updateWo_(id, { Status: 'CLOSED', ClosedAt: now, ClosedBy: 'Requester', RequesterFeedback: fb });
      addLog_(id, w.RequesterName + ' (requester)', 'Confirmed fixed', 'DONE', 'CLOSED', fb);
    } else {
      if (!fb) throw userError_('Please tell us what is still wrong.');
      updateWo_(id, { Status: 'ASSIGNED', CompletedAt: '', RequesterFeedback: fb });
      addLog_(id, w.RequesterName + ' (requester)', 'Not fixed – reopened', 'DONE', 'ASSIGNED', fb);
    }
  } finally {
    lock.releaseLock();
  }
  if (!p.fixed) {
    var msg = '🔁 <b>' + id + ' reopened by requester</b>\n📍 ' + esc_(w.Location) + '\n💬 ' + esc_(clean_(p.feedback, 500)) +
      '\n\n' + settings_().APP_URL + 'app.html#wo=' + id;
    notifyUser_(w.AssignedTo, msg);
    notifyRoles_(MANAGER_ROLES, msg, w.AssignedTo);
  }
  return { status: p.fixed ? 'CLOSED' : 'ASSIGNED' };
}

/* =========================================================================
 * Staff login (name + PIN) and signed tokens
 * ========================================================================= */

function apiLogin_(p) {
  applyNewPins_();
  var uid = String(p.userId || '').trim();
  var pin = String(p.pin || '').trim();
  var cache = CacheService.getScriptCache();
  var failKey = 'pinfail_' + uid;
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= 5) throw userError_('Too many wrong PINs. Wait 15 minutes and try again.');
  var t = readTable_('Users');
  var u = find_(t.rows, 'UserID', uid);
  if (!u || !isActive_(u)) throw userError_('User not found.');
  if (!u.PinHash) throw userError_('No PIN set for this user yet. Ask the admin to set one.');
  if (hashPin_(String(u.UserID), pin) !== String(u.PinHash)) {
    cache.put(failKey, String(fails + 1), 900);
    throw userError_('Wrong PIN.');
  }
  cache.remove(failKey);
  setCells_(t, u, { LastLogin: new Date() });
  return { token: makeToken_(uid), user: publicUser_(u) };
}

function publicUser_(u) {
  return { id: String(u.UserID), name: u.Name, role: String(u.Role || '').toLowerCase(), telegram: !!u.TelegramChatID };
}

function hashPin_(uid, pin) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secret_() + '|' + uid + '|' + pin,
    Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(raw);
}

/** Hash any PIN typed into the Users "NewPIN" column, then clear it. */
function applyNewPins_() {
  var t = readTable_('Users');
  t.rows.forEach(function (u) {
    var np = String(u.NewPIN || '').trim();
    if (!np || !u.UserID) return;
    if (!/^\d{4,8}$/.test(np)) return; // ignore anything that is not 4–8 digits
    setCells_(t, u, { PinHash: hashPin_(String(u.UserID), np), NewPIN: '' });
  });
}

function makeToken_(uid) {
  var exp = Date.now() + TOKEN_DAYS * 86400000;
  var body = Utilities.base64EncodeWebSafe(uid + '|' + exp);
  return body + '.' + sign_(body);
}

function sign_(body) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret_()));
}

function verifyToken_(token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) return null;
  var raw = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  var bits = raw.split('|');
  if (bits.length !== 2 || Number(bits[1]) < Date.now()) return null;
  var u = find_(readTable_('Users').rows, 'UserID', bits[0]);
  return (u && isActive_(u)) ? u : null;
}

function auth_(p, roles) {
  var u = verifyToken_(p.token);
  if (!u) { var e = userError_('Please log in again.'); e.authError = true; throw e; }
  if (roles && roles.indexOf(String(u.Role || '').toLowerCase()) < 0) throw userError_('You do not have permission for this.');
  return u;
}

function optionalAuth_(p) {
  try { return p.token ? verifyToken_(p.token) : null; } catch (e) { return null; }
}

function isManager_(u) { return MANAGER_ROLES.indexOf(String(u.Role || '').toLowerCase()) >= 0; }

/* =========================================================================
 * Work orders (staff)
 * ========================================================================= */

function apiJobs_(p) {
  var u = auth_(p);
  var view = String(p.view || 'open');
  var q = String(p.q || '').toLowerCase().trim();
  var now = Date.now();
  var rows = readTable_('WorkOrders').rows.filter(function (w) { return w.WO_ID; });
  rows = rows.filter(function (w) {
    var open = OPEN_STATUSES.indexOf(w.Status) >= 0;
    if (view === 'open' && !open) return false;
    if (view === 'mine' && !(open && String(w.AssignedTo) === String(u.UserID))) return false;
    if (view === 'new' && w.Status !== 'NEW') return false;
    if (view === 'overdue' && !(open && w.Status !== 'DONE' && w.DueAt && dateNum_(w.DueAt) < now)) return false;
    if (view === 'done' && w.Status !== 'DONE') return false;
    if (view === 'closed' && ['CLOSED', 'REJECTED'].indexOf(w.Status) < 0) return false;
    if (q) {
      var hay = [w.WO_ID, w.Location, w.AssetID, w.AssetName, w.Description, w.RequesterName, w.Category]
        .join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
  var prRank = { 'Very Urgent': 0, 'Urgent': 1, 'General': 2 };
  rows.sort(function (a, b) {
    if (view === 'closed' || view === 'all') return dateNum_(b.Created) - dateNum_(a.Created);
    return (prRank[a.Priority] - prRank[b.Priority]) || (dateNum_(a.Created) - dateNum_(b.Created));
  });
  return { jobs: rows.slice(0, 300).map(jobSummary_), total: rows.length };
}

function jobSummary_(w) {
  var open = OPEN_STATUSES.indexOf(w.Status) >= 0 && w.Status !== 'DONE';
  return {
    id: w.WO_ID, created: iso_(w.Created), status: w.Status, priority: w.Priority, location: w.Location,
    assetId: w.AssetID, assetName: w.AssetName, category: w.Category, description: short_(w.Description, 160),
    requester: w.RequesterName, assignedTo: String(w.AssignedTo || ''), assignedName: userName_(w.AssignedTo),
    dueAt: iso_(w.DueAt), overdue: open && !!w.DueAt && dateNum_(w.DueAt) < Date.now(),
    productionStopped: w.ProductionStopped === 'Yes', closedAt: iso_(w.ClosedAt)
  };
}

function apiJob_(p) {
  auth_(p);
  var id = cleanId_(p.id);
  var w = find_(readTable_('WorkOrders').rows, 'WO_ID', id);
  if (!w) throw userError_('Job not found: ' + id);
  var out = {};
  TABLES.WorkOrders.forEach(function (k) { if (k !== 'ConfirmKey') out[k] = iso_(w[k]); });
  out.assignedName = userName_(w.AssignedTo);
  out.requestPhotoUrl = photoUrl_(w.RequestPhoto);
  out.afterPhotoUrl = photoUrl_(w.AfterPhoto);
  out.overdue = OPEN_STATUSES.indexOf(w.Status) >= 0 && w.Status !== 'DONE' && !!w.DueAt && dateNum_(w.DueAt) < Date.now();
  out.log = readTable_('WorkOrderLog').rows
    .filter(function (l) { return String(l.WO_ID) === id; })
    .map(function (l) { return { time: iso_(l.Timestamp), user: l.User, action: l.Action, from: l.FromStatus, to: l.ToStatus, note: l.Note }; });
  return out;
}

function apiJobAction_(p) {
  var u = auth_(p);
  var id = cleanId_(p.id);
  var op = String(p.op || '');
  var d = p.data || {};
  var mgr = isManager_(u);
  var s = settings_();
  var now = new Date();
  var note = clean_(d.note, 1000);
  var notices = [];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var w, from, ch = {};
  try {
    w = find_(readTable_('WorkOrders', true).rows, 'WO_ID', id);
    if (!w) throw userError_('Job not found: ' + id);
    from = w.Status;
    var mine = String(w.AssignedTo) === String(u.UserID);
    var need = function (cond, msg) { if (!cond) throw userError_(msg || 'This action is not allowed now.'); };
    var to = from;

    switch (op) {
      case 'assign':
        need(mgr, 'Only the admin or supervisor can assign jobs.');
        need(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(from) >= 0);
        var assignee = find_(readTable_('Users').rows, 'UserID', String(d.assignee || ''));
        need(assignee && isActive_(assignee), 'Select who will do the job.');
        if (from === 'NEW') { ch.ApprovedBy = u.Name; ch.ApprovedAt = now; to = 'ASSIGNED'; }
        if (d.priority && PRIORITIES.indexOf(d.priority) >= 0 && d.priority !== w.Priority) {
          ch.Priority = d.priority;
          ch.DueAt = new Date(dateNum_(w.Created) + targetHours_(d.priority, s) * 3600000);
        }
        if (d.workType) ch.WorkType = clean_(d.workType, 40);
        ch.AssignedTo = String(assignee.UserID);
        ch.AssignedAt = now;
        notices.push(function () {
          notifyUser_(assignee.UserID, '🛠 <b>Job ' + id + ' assigned to you</b> [' + esc_(ch.Priority || w.Priority) + ']\n' +
            (w.AssetID ? '🔧 ' + esc_(w.AssetID + ' – ' + w.AssetName) + '\n' : '') + '📍 ' + esc_(w.Location) + '\n📝 ' +
            esc_(short_(w.Description, 300)) + (note ? '\n💬 ' + esc_(note) : '') + '\n\n' + s.APP_URL + 'app.html#wo=' + id);
          if (from === 'NEW' && w.RequesterEmail) {
            sendMail_(w.RequesterEmail, 'Maintenance request ' + id + ' approved',
              'Dear ' + w.RequesterName + ',\n\nYour request ' + id + ' has been approved and assigned to ' + assignee.Name +
              '.\n\nTrack it here: ' + s.APP_URL + 'track.html?id=' + id + '\n\n' + s.PLANT_NAME + '\nMaintenance Team');
          }
        });
        break;

      case 'reject':
        need(mgr, 'Only the admin or supervisor can reject jobs.');
        need(['NEW', 'ASSIGNED'].indexOf(from) >= 0);
        need(note, 'Please give the reason.');
        to = 'REJECTED'; ch.ClosedAt = now; ch.ClosedBy = u.Name;
        notices.push(function () {
          if (w.RequesterEmail) sendMail_(w.RequesterEmail, 'Maintenance request ' + id + ' not accepted',
            'Dear ' + w.RequesterName + ',\n\nYour request ' + id + ' (' + w.Location + ') was not accepted.\nReason: ' + note +
            '\n\n' + s.PLANT_NAME + '\nMaintenance Team');
        });
        break;

      case 'start':
        need(mine || mgr, 'Only the assigned person can start this job.');
        need(['ASSIGNED', 'ON_HOLD'].indexOf(from) >= 0);
        to = 'IN_PROGRESS';
        if (!w.StartedAt) ch.StartedAt = now;
        break;

      case 'hold':
        need(mine || mgr);
        need(['ASSIGNED', 'IN_PROGRESS'].indexOf(from) >= 0);
        need(note, 'Please give the reason (e.g. waiting for spare parts).');
        to = 'ON_HOLD';
        break;

      case 'complete':
        need(mine || mgr, 'Only the assigned person can complete this job.');
        need(['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(from) >= 0);
        var action = clean_(d.actionTaken, 2000);
        need(action.length >= 3, 'Please describe the work done.');
        ch.ActionTaken = action;
        ch.WorkType = clean_(d.workType, 40) || w.WorkType;
        ch.FailureCause = clean_(d.failureCause, 60);
        ch.RootCause = clean_(d.rootCause, 1000);
        ch.PartsUsed = clean_(d.partsUsed, 1000);
        ch.LabourHours = num_(d.labourHours);
        ch.Cost = num_(d.cost);
        ch.DoneBy = d.doneBy === 'Contractor' ? 'Contractor' : 'Internal';
        ch.Contractor = ch.DoneBy === 'Contractor' ? clean_(d.contractor, 100) : '';
        need(ch.DoneBy === 'Internal' || ch.Contractor, 'Please enter the contractor name.');
        if (w.ProductionStopped === 'Yes' || d.downtimeStart) {
          var ds = parseLocal_(d.downtimeStart) || (w.DowntimeStart ? new Date(dateNum_(w.DowntimeStart)) : new Date(dateNum_(w.Created)));
          var de = parseLocal_(d.downtimeEnd) || now;
          need(de.getTime() >= ds.getTime(), 'Downtime end must be after the start.');
          ch.DowntimeStart = ds; ch.DowntimeEnd = de;
          ch.DowntimeMin = Math.round((de.getTime() - ds.getTime()) / 60000);
        }
        if (!w.StartedAt) ch.StartedAt = now;
        ch.CompletedAt = now;
        to = 'DONE';
        notices.push(function () {
          notifyRoles_(MANAGER_ROLES, '✅ <b>' + id + ' completed</b> by ' + esc_(u.Name) + '\n📍 ' + esc_(w.Location) +
            '\n🔧 ' + esc_(short_(action, 300)) + '\n\n' + s.APP_URL + 'app.html#wo=' + id, u.UserID);
          if (w.RequesterEmail) {
            var link = s.APP_URL + 'track.html?id=' + id + '&k=' + w.ConfirmKey;
            sendMail_(w.RequesterEmail, 'Maintenance job ' + id + ' completed – please confirm',
              'Dear ' + w.RequesterName + ',\n\nThe maintenance team has completed your request ' + id + ' (' + w.Location + ').\n\n' +
              'Work done: ' + action + '\n\nPlease confirm whether the problem is fixed:\n' + link + '\n\n' +
              'If we do not hear from you within ' + s.AUTO_CLOSE_DAYS + ' days, the job will be closed automatically.\n\n' +
              s.PLANT_NAME + '\nMaintenance Team');
          }
        });
        break;

      case 'close':
        need(mgr, 'Only the admin or supervisor can close jobs.');
        need(from === 'DONE', 'Only completed jobs can be closed.');
        to = 'CLOSED'; ch.ClosedAt = now; ch.ClosedBy = u.Name;
        break;

      case 'reopen':
        need(mgr, 'Only the admin or supervisor can reopen jobs.');
        need(['DONE', 'CLOSED', 'REJECTED'].indexOf(from) >= 0);
        need(note, 'Please give the reason.');
        to = w.AssignedTo ? 'ASSIGNED' : 'NEW';
        ch.CompletedAt = ''; ch.ClosedAt = ''; ch.ClosedBy = '';
        break;

      case 'edit':
        need(mgr, 'Only the admin or supervisor can edit jobs.');
        if (d.category) ch.Category = clean_(d.category, 60);
        if (d.location) ch.Location = clean_(d.location, 120);
        if (d.workType !== undefined) ch.WorkType = clean_(d.workType, 40);
        if (d.assetId !== undefined) {
          var aid = cleanId_(d.assetId);
          if (aid) {
            var a = find_(readTable_('Assets').rows, 'AssetID', aid);
            need(a, 'Asset not found: ' + aid);
            ch.AssetID = a.AssetID; ch.AssetName = a.Name;
          } else { ch.AssetID = ''; ch.AssetName = ''; }
        }
        if (d.priority && PRIORITIES.indexOf(d.priority) >= 0 && d.priority !== w.Priority) {
          ch.Priority = d.priority;
          ch.DueAt = new Date(dateNum_(w.Created) + targetHours_(d.priority, s) * 3600000);
        }
        break;

      case 'note':
        need(note, 'Please type a note.');
        break;

      default:
        throw userError_('Unknown action.');
    }

    if (op === 'complete' && d.afterPhoto) {
      try { ch.AfterPhoto = savePhoto_(d.afterPhoto, id + '_after'); } catch (err) { logError_('jobAction.photo', err); }
    }
    ch.Status = to;
    ch.Updated = now;
    updateWo_(id, ch);
    addLog_(id, u.Name, opLabel_(op), from, to, note || (op === 'complete' ? short_(ch.ActionTaken, 300) : ''));
  } finally {
    lock.releaseLock();
  }
  notices.forEach(function (f) { try { f(); } catch (err) { logError_('notice.' + op, err); } });
  return apiJob_({ token: p.token, id: id });
}

function opLabel_(op) {
  return { assign: 'Approved / assigned', reject: 'Rejected', start: 'Started work', hold: 'On hold', complete: 'Completed',
    close: 'Closed', reopen: 'Reopened', edit: 'Edited', note: 'Note' }[op] || op;
}

/* =========================================================================
 * Assets (staff)
 * ========================================================================= */

function apiAssetsList_(p) {
  auth_(p);
  var wos = readTable_('WorkOrders').rows;
  var openCount = {};
  wos.forEach(function (w) {
    if (w.AssetID && OPEN_STATUSES.indexOf(w.Status) >= 0) openCount[w.AssetID] = (openCount[w.AssetID] || 0) + 1;
  });
  return readTable_('Assets').rows.filter(function (a) { return a.AssetID; }).map(function (a) {
    var o = {};
    TABLES.Assets.forEach(function (k) { o[k] = iso_(a[k]); });
    o.certStatus = certStatus_(a);
    o.openJobs = openCount[a.AssetID] || 0;
    o.photoUrl = a.Photo ? 'https://drive.google.com/thumbnail?id=' + a.Photo + '&sz=w300' : '';
    return o;
  });
}

function apiAssetSave_(p) {
  var u = auth_(p, MANAGER_ROLES);
  var d = p.asset || {};
  var id = cleanId_(d.AssetID);
  if (!/^[A-Z0-9][A-Z0-9\-_.]{1,29}$/.test(id)) throw userError_('Asset ID must be 2–30 letters, numbers or dashes.');
  if (!clean_(d.Name, 120)) throw userError_('Please enter the asset name.');
  var editable = ['Name', 'Area', 'Location', 'Category', 'ParentID', 'Make', 'Model', 'SerialNo', 'Year', 'Specs',
    'Criticality', 'Status', 'MaintainedBy', 'PMFrequency', 'ChecklistRef', 'CertRequired', 'CertExpiry', 'CertFileId', 'Notes',
    'MeterUnit', 'CurrentMeter'];
  var ch = {};
  editable.forEach(function (k) {
    if (d[k] === undefined) return;
    if (k === 'CertExpiry') { ch[k] = d[k] ? parseLocal_(d[k]) || '' : ''; return; }
    if (k === 'CurrentMeter') { ch[k] = num_(d[k]); if (ch[k] !== '') ch.MeterUpdated = new Date(); return; }
    if (k === 'ParentID') { ch[k] = cleanId_(d[k]); return; }
    if (k === 'CertFileId') { ch[k] = driveId_(d[k]); return; }
    ch[k] = clean_(d[k], k === 'Specs' || k === 'Notes' ? 3000 : 200);
  });
  if (ch.ParentID && ch.ParentID === id) throw userError_('An asset cannot be its own parent.');
  if (p.photo) ch.Photo = savePhoto_(p.photo, 'ASSET_' + id);
  if (p.removePhoto) ch.Photo = '';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var t = readTable_('Assets', true);
    var a = find_(t.rows, 'AssetID', id);
    if (ch.ParentID && !find_(t.rows, 'AssetID', ch.ParentID)) throw userError_('Parent asset not found: ' + ch.ParentID);
    ch.Updated = new Date();
    if (a) {
      if (p.isNew) throw userError_('Asset ID ' + id + ' already exists.');
      setCells_(t, a, ch);
    } else {
      ch.AssetID = id; ch.Created = ch.Updated;
      if (!ch.Status) ch.Status = 'Active';
      appendObj_('Assets', ch);
    }
  } finally {
    lock.releaseLock();
  }
  return { id: id, savedBy: u.Name };
}

/** Removes a machine. Machines with history (jobs / PM records) are marked "Disposed" so the history stays. */
function apiAssetRemove_(p) {
  var u = auth_(p, MANAGER_ROLES);
  var id = cleanId_(p.id);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var t = readTable_('Assets', true);
    var a = find_(t.rows, 'AssetID', id);
    if (!a) throw userError_('Asset not found: ' + id);
    var kids = t.rows.filter(function (c) { return String(c.ParentID).toUpperCase() === id && String(c.Status) !== 'Disposed'; });
    if (kids.length) throw userError_('Remove or move its ' + kids.length + ' parts first (e.g. ' + kids[0].AssetID + ').');
    var used = readTable_('WorkOrders').rows.some(function (w) { return String(w.AssetID).toUpperCase() === id; }) ||
      readTable_('PMRecords').rows.some(function (r) { return String(r.AssetID).toUpperCase() === id; });
    var tt = readTable_('PMTasks', true);
    tt.rows.forEach(function (k) { if (String(k.AssetID).toUpperCase() === id && yes_(k.Active)) setCells_(tt, k, { Active: 'No', Updated: new Date() }); });
    if (used) {
      setCells_(t, a, { Status: 'Disposed', Updated: new Date(), Notes: clean_((a.Notes ? a.Notes + '\n' : '') + 'Removed by ' + u.Name + ' ' +
        Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy') + (p.reason ? ': ' + clean_(p.reason, 200) : ''), 3000) });
      return { mode: 'disposed', id: id };
    }
    t.sheet.deleteRow(a._row);
    delete TABLE_CACHE_.Assets;
    return { mode: 'deleted', id: id };
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================================
 * Preventive maintenance (Phase 2)
 * ========================================================================= */

function startOfDay_(d) {
  return new Date(Utilities.formatDate(d || new Date(), TZ, "yyyy-MM-dd'T'00:00:00") + '+05:30');
}

/** Next due date: from + n days / weeks / months (Colombo calendar, start of day). */
function addPeriod_(from, unit, value) {
  var n = Number(value) || 1;
  if (unit === 'Day') return startOfDay_(new Date(from.getTime() + n * 86400000));
  if (unit === 'Week') return startOfDay_(new Date(from.getTime() + n * 7 * 86400000));
  var p = Utilities.formatDate(from, TZ, 'yyyy-MM-dd').split('-').map(Number);
  var m = p[1] - 1 + n, y = p[0] + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  var pad = function (x) { return ('0' + x).slice(-2); };
  return new Date(y + '-' + pad(m + 1) + '-' + pad(Math.min(p[2], last)) + 'T00:00:00+05:30');
}

function freqText_(t) {
  var n = Number(t.FreqValue) || 1, u = String(t.FreqUnit || '');
  var txt = u ? (n === 1 ? { Day: 'Daily', Week: 'Weekly', Month: 'Monthly' }[u] : 'Every ' + n + ' ' + u.toLowerCase() + 's') : '';
  if (u === 'Month' && n === 3) txt = 'Every 3 months';
  if (t.MeterInterval) txt = (txt ? txt + ' or ' : 'Every ') + t.MeterInterval + ' h';
  return txt || 'One-off';
}

function pmSummary_(t, a, soonDays) {
  var today = startOfDay_().getTime(), tomorrow = today + 86400000;
  var due = dateNum_(t.NextDue);
  var state = !due ? 'unscheduled' : due < today ? 'overdue' : due < tomorrow ? 'today' : due < today + (soonDays || 7) * 86400000 ? 'soon' : 'ok';
  var meterLeft = null;
  if (t.MeterInterval && a && String(a.CurrentMeter) !== '' && String(t.LastMeter) !== '') {
    meterLeft = Math.round((Number(t.LastMeter) + Number(t.MeterInterval) - Number(a.CurrentMeter)) * 10) / 10;
    if (meterLeft <= 0 && state !== 'overdue') state = 'today';
  }
  return {
    id: String(t.TaskID), assetId: t.AssetID, assetName: a ? a.Name : '', title: t.Title, templateId: t.TemplateID,
    scope: t.Scope, freq: freqText_(t), nextDue: iso_(t.NextDue), lastDone: iso_(t.LastDone), state: state,
    daysLate: due && due < today ? Math.round((today - due) / 86400000) : 0, meterLeft: meterLeft,
    meterUnit: a ? a.MeterUnit : '', assignedTo: String(t.AssignedTo || ''), assignedName: userName_(t.AssignedTo),
    doneBy: t.DoneBy || 'Internal', active: yes_(t.Active)
  };
}

function assetMap_() {
  var m = {};
  readTable_('Assets').rows.forEach(function (a) { if (a.AssetID) m[String(a.AssetID).toUpperCase()] = a; });
  return m;
}

function apiPmList_(p) {
  var u = auth_(p);
  var view = String(p.view || 'due');
  var q = String(p.q || '').toLowerCase().trim();
  var s = settings_(), amap = assetMap_();
  var rank = { overdue: 0, today: 1, soon: 2, unscheduled: 3, ok: 4 };
  var list = readTable_('PMTasks').rows.filter(function (t) { return t.TaskID && (view === 'inactive' ? !yes_(t.Active) : yes_(t.Active)); })
    .map(function (t) { return pmSummary_(t, amap[String(t.AssetID).toUpperCase()], Number(s.PM_SOON_DAYS) || 7); })
    .filter(function (x) {
      if (view === 'due' && ['overdue', 'today'].indexOf(x.state) < 0) return false;
      if (view === 'week' && ['overdue', 'today', 'soon'].indexOf(x.state) < 0) return false;
      if (view === 'unscheduled' && x.state !== 'unscheduled') return false;
      if (view === 'mine' && !(x.assignedTo === String(u.UserID) && ['overdue', 'today', 'soon'].indexOf(x.state) >= 0)) return false;
      if (q && [x.id, x.assetId, x.assetName, x.title].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  list.sort(function (a, b) { return (rank[a.state] - rank[b.state]) || (dateNum_(a.nextDue) - dateNum_(b.nextDue)) || String(a.assetId).localeCompare(String(b.assetId)); });
  return { tasks: list.slice(0, 400), total: list.length };
}

/** Items of one checklist template, filtered by scope (Daily < Weekly < Monthly < Quarterly < Half-yearly < Yearly < All). */
function templateInfo_(templateId, scope) {
  if (!templateId) return null;
  var rows = readTable_('ChecklistItems').rows.filter(function (r) {
    return String(r.TemplateID).toUpperCase() === String(templateId).toUpperCase() && !/^(no|false|0)$/i.test(String(r.Active || 'Yes'));
  });
  if (!rows.length) return null;
  var lim = SCOPE_RANK[scope] || SCOPE_RANK.All;
  var items = rows.filter(function (r) { return !r.Frequency || (SCOPE_RANK[r.Frequency] || 1) <= lim; })
    .sort(function (a, b) { return (parseFloat(a.ItemNo) || 0) - (parseFloat(b.ItemNo) || 0); })
    .map(function (r) {
      return { no: String(r.ItemNo), section: r.Section, text: r.Text, textSi: r.TextSi, type: String(r.Type || 'check').toLowerCase(),
        unit: r.Unit, min: r.Min === '' ? null : Number(r.Min), max: r.Max === '' ? null : Number(r.Max), freq: r.Frequency };
    });
  return { id: rows[0].TemplateID, title: rows[0].TemplateTitle, docNo: rows[0].DocNo, perChild: rows.some(function (r) { return yes_(r.PerChild); }), items: items };
}

function apiPmTask_(p) {
  auth_(p);
  var t = find_(readTable_('PMTasks').rows, 'TaskID', String(p.id || ''));
  if (!t) throw userError_('PM task not found.');
  var amap = assetMap_(), a = amap[String(t.AssetID).toUpperCase()];
  var out = pmSummary_(t, a);
  out.notes = t.Notes; out.freqUnit = t.FreqUnit; out.freqValue = t.FreqValue; out.meterInterval = t.MeterInterval; out.lastMeter = t.LastMeter;
  out.asset = a ? { id: a.AssetID, name: a.Name, location: a.Location, meterUnit: a.MeterUnit, currentMeter: a.CurrentMeter, photoUrl: photoUrl_(a.Photo) } : null;
  out.template = templateInfo_(t.TemplateID, t.Scope);
  if (out.template && out.template.perChild) {
    out.children = readTable_('Assets').rows.filter(function (c) { return String(c.ParentID).toUpperCase() === String(t.AssetID).toUpperCase() && String(c.Status) !== 'Disposed'; })
      .map(function (c) { return { id: c.AssetID, name: c.Name, location: c.Location }; });
  }
  out.records = readTable_('PMRecords').rows.filter(function (r) { return String(r.TaskID) === String(t.TaskID); })
    .sort(function (x, y) { return dateNum_(y.DoneAt) - dateNum_(x.DoneAt); }).slice(0, 10).map(recordSummary_);
  return out;
}

function recordSummary_(r) {
  return { id: r.RecordID, taskId: r.TaskID, assetId: r.AssetID, title: r.Title, doneAt: iso_(r.DoneAt), doneBy: r.DoneBy,
    meter: r.Meter, okCount: r.OkCount, notOkCount: r.NotOkCount, woId: r.WO_ID, contractor: r.Contractor };
}

/** Saves a filled checklist (or a contractor service record), moves the task to its next due date, and opens a job for Not OK items. */
function apiPmComplete_(p) {
  var u = auth_(p);
  var d = p.data || {};
  var now = new Date();
  var s = settings_();
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  var rec, wo = null, taskTitle, asset;
  try {
    var tt = readTable_('PMTasks', true);
    var t = find_(tt.rows, 'TaskID', String(d.taskId || ''));
    if (!t || !yes_(t.Active)) throw userError_('PM task not found or not active.');
    var at = readTable_('Assets', true);
    asset = find_(at.rows, 'AssetID', String(t.AssetID));
    taskTitle = t.Title;
    var tpl = templateInfo_(t.TemplateID, t.Scope);
    var children = [];
    if (tpl && tpl.perChild) {
      children = at.rows.filter(function (c) { return String(c.ParentID).toUpperCase() === String(t.AssetID).toUpperCase() && String(c.Status) !== 'Disposed'; })
        .map(function (c) { return c.AssetID; });
    }
    var results = d.results || {};
    var values = {}, notOk = [], ok = 0, missing = 0;
    var check = function (it, child) {
      var key = (child ? child + '|' : '') + it.no;
      var v = results[key];
      var label = (child ? child + ': ' : '') + it.text;
      if (it.type === 'number') {
        if (v === undefined || v === null || String(v).trim() === '') { missing++; return; }
        var n = Number(String(v).replace(/,/g, ''));
        if (!isFinite(n)) throw userError_('Not a number: ' + it.text);
        values[key] = n;
        if ((it.min !== null && n < it.min) || (it.max !== null && n > it.max)) notOk.push(label + ' = ' + n + (it.unit ? ' ' + it.unit : '') + ' (out of range)');
        else ok++;
      } else if (it.type === 'text') {
        if (v) values[key] = clean_(v, 300);
      } else {
        if (['ok', 'nok', 'na'].indexOf(v) < 0) { missing++; return; }
        values[key] = v;
        if (v === 'nok') notOk.push(label); else if (v === 'ok') ok++;
      }
    };
    if (tpl) {
      tpl.items.forEach(function (it) {
        if (children.length) children.forEach(function (c) { check(it, c); }); else check(it, null);
      });
      if (missing) throw userError_('Please answer all items (' + missing + ' not answered).');
    }
    var remarks = clean_(d.remarks, 1000);
    var contractor = clean_(d.contractor, 100);
    if (!tpl && !remarks && !contractor) throw userError_('Please write what was done (or the contractor name).');
    var meter = num_(d.meter);
    if (meter !== '' && asset && String(asset.CurrentMeter) !== '' && meter < Number(asset.CurrentMeter)) {
      throw userError_('Meter reading is lower than the last reading (' + asset.CurrentMeter + ').');
    }
    if (asset && asset.MeterUnit && t.MeterInterval && meter === '') throw userError_('Please enter the hour meter reading.');

    var rt = readTable_('PMRecords', true);
    var prefix = 'PM-' + Utilities.formatDate(now, TZ, 'yyMMdd') + '-';
    var seq = rt.rows.filter(function (r) { return String(r.RecordID).indexOf(prefix) === 0; }).length + 1;
    rec = {
      RecordID: prefix + ('00' + seq).slice(-3), TaskID: t.TaskID, AssetID: t.AssetID, TemplateID: t.TemplateID || '', Title: t.Title,
      DoneAt: now, DoneBy: u.Name, Meter: meter, OkCount: ok, NotOkCount: notOk.length, Remarks: remarks, Contractor: contractor,
      Cost: num_(d.cost),
      Results: tpl ? JSON.stringify({ doc: tpl.docNo, title: tpl.title, items: tpl.items.map(function (i) { return [i.no, i.section || '', i.text, i.type, i.unit || '']; }),
        children: children, values: values }) : ''
    };

    if (notOk.length) {
      var wt = readTable_('WorkOrders', true);
      var crit = asset && /^A$/i.test(String(asset.Criticality));
      var pr = crit ? 'Urgent' : 'General';
      wo = {
        WO_ID: nextWoId_(wt.rows, now), Created: now, RequesterName: u.Name, RequesterEmail: '', Department: 'Maintenance',
        Location: asset ? asset.Location : '', AssetID: t.AssetID, AssetName: asset ? asset.Name : '', Category: 'General Maintenance',
        Priority: pr, Description: 'Not OK in PM check ' + rec.RecordID + ' (' + t.Title + '):\n• ' + notOk.slice(0, 40).join('\n• ') +
          (remarks ? '\nRemarks: ' + remarks : ''), ProductionStopped: 'No', Status: 'NEW', WorkType: 'Corrective',
        DueAt: new Date(now.getTime() + targetHours_(pr, s) * 3600000), ConfirmKey: Utilities.getUuid().replace(/-/g, '').slice(0, 16),
        Updated: now, Source: 'PM'
      };
      appendObj_('WorkOrders', wo);
      addLog_(wo.WO_ID, u.Name, 'Created from PM check', '', 'NEW', rec.RecordID);
      rec.WO_ID = wo.WO_ID;
    }
    appendObj_('PMRecords', rec);

    var ch = { LastDone: now, Updated: now };
    if (t.FreqUnit) ch.NextDue = addPeriod_(now, t.FreqUnit, t.FreqValue);
    if (meter !== '' && t.MeterInterval) ch.LastMeter = meter;
    setCells_(tt, t, ch);
    if (meter !== '' && asset) setCells_(at, asset, { CurrentMeter: meter, MeterUpdated: now });
  } finally {
    lock.releaseLock();
  }
  if (d.photo) {
    try {
      var fid = savePhoto_(d.photo, rec.RecordID);
      var rt2 = readTable_('PMRecords', true);
      setCells_(rt2, find_(rt2.rows, 'RecordID', rec.RecordID), { Photo: fid });
    } catch (err) { logError_('pmComplete.photo', err); }
  }
  if (wo) {
    notifyRoles_(TEAM_ROLES, '⚠️ <b>' + wo.WO_ID + ' – Not OK in PM check</b> [' + esc_(wo.Priority) + ']\n🔧 ' + esc_(wo.AssetID + ' – ' + wo.AssetName) +
      '\n👷 ' + esc_(u.Name) + '\n📝 ' + esc_(short_(wo.Description, 500)) + '\n\n' + s.APP_URL + 'app.html#wo=' + wo.WO_ID);
  }
  return { recordId: rec.RecordID, woId: wo ? wo.WO_ID : '', notOk: rec.NotOkCount, ok: rec.OkCount };
}

function apiPmSave_(p) {
  var u = auth_(p, MANAGER_ROLES);
  var d = p.task || {};
  var aid = cleanId_(d.AssetID);
  if (!find_(readTable_('Assets').rows, 'AssetID', aid)) throw userError_('Machine not found: ' + aid);
  var title = clean_(d.Title, 120);
  if (!title) throw userError_('Please enter the task title.');
  var tplId = clean_(d.TemplateID, 40);
  if (tplId && !templateInfo_(tplId, 'All')) throw userError_('Checklist not found: ' + tplId);
  var scope = SCOPE_RANK[d.Scope] ? d.Scope : 'All';
  var unit = ['Day', 'Week', 'Month'].indexOf(d.FreqUnit) >= 0 ? d.FreqUnit : '';
  var ch = {
    AssetID: aid, Title: title, TemplateID: tplId, Scope: scope, FreqUnit: unit, FreqValue: unit ? (num_(d.FreqValue) || 1) : '',
    MeterInterval: num_(d.MeterInterval), NextDue: d.NextDue ? (parseLocal_(d.NextDue) || '') : '',
    AssignedTo: clean_(d.AssignedTo, 20), DoneBy: clean_(d.DoneBy, 100) || 'Internal',
    Active: /^(no|false|0)$/i.test(String(d.Active || 'Yes')) ? 'No' : 'Yes', Notes: clean_(d.Notes, 1000), Updated: new Date()
  };
  if (ch.AssignedTo && !find_(readTable_('Users').rows, 'UserID', ch.AssignedTo)) throw userError_('User not found.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var t = readTable_('PMTasks', true);
    var row = d.TaskID ? find_(t.rows, 'TaskID', String(d.TaskID)) : null;
    if (d.TaskID && !row) throw userError_('PM task not found.');
    if (row) { setCells_(t, row, ch); return { id: String(row.TaskID), savedBy: u.Name }; }
    var max = 0;
    t.rows.forEach(function (r) { var m = /^T(\d+)$/.exec(String(r.TaskID)); if (m) max = Math.max(max, Number(m[1])); });
    ch.TaskID = 'T' + ('000' + (max + 1)).slice(-4);
    ch.Created = ch.Updated;
    appendObj_('PMTasks', ch);
    return { id: ch.TaskID, savedBy: u.Name };
  } finally {
    lock.releaseLock();
  }
}

function apiPmRecords_(p) {
  auth_(p);
  var aid = cleanId_(p.assetId), tid = String(p.taskId || '');
  return readTable_('PMRecords').rows.filter(function (r) {
    return r.RecordID && (!aid || String(r.AssetID).toUpperCase() === aid) && (!tid || String(r.TaskID) === tid);
  }).sort(function (x, y) { return dateNum_(y.DoneAt) - dateNum_(x.DoneAt); }).slice(0, 200).map(recordSummary_);
}

function apiPmRecord_(p) {
  auth_(p);
  var r = find_(readTable_('PMRecords').rows, 'RecordID', String(p.id || ''));
  if (!r) throw userError_('Record not found.');
  var out = recordSummary_(r);
  out.remarks = r.Remarks; out.cost = r.Cost; out.templateId = r.TemplateID;
  out.photoUrl = photoUrl_(r.Photo);
  var a = find_(readTable_('Assets').rows, 'AssetID', String(r.AssetID));
  out.assetName = a ? a.Name : '';
  out.location = a ? a.Location : '';
  try { out.sheet = r.Results ? JSON.parse(r.Results) : null; } catch (e) { out.sheet = null; }
  return out;
}

function apiTemplates_(p) {
  auth_(p);
  var m = {};
  readTable_('ChecklistItems').rows.forEach(function (r) {
    if (!r.TemplateID) return;
    var k = String(r.TemplateID);
    if (!m[k]) m[k] = { id: k, title: r.TemplateTitle, docNo: r.DocNo, perChild: false, count: 0 };
    m[k].count++;
    if (yes_(r.PerChild)) m[k].perChild = true;
  });
  return Object.keys(m).sort().map(function (k) { return m[k]; });
}

/** Certificates that crossed an alert threshold (60/30/7/1 days, then expired) since the last alert. */
function certAlerts_(assets, s) {
  var props = PropertiesService.getScriptProperties();
  var th = list_(s.CERT_ALERT_DAYS).map(Number).filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
  var today = startOfDay_().getTime();
  var lines = [];
  assets.forEach(function (a) {
    if (!a.AssetID || !a.CertExpiry || String(a.Status) === 'Disposed') return;
    var exp = dateNum_(a.CertExpiry);
    var days = Math.round((exp - today) / 86400000);
    var level = days <= 0 ? 0 : th.filter(function (x) { return days <= x; })[0];
    if (level === undefined) return;
    var key = 'certalert_' + a.AssetID + '_' + level;
    var stamp = String(exp);
    if (props.getProperty(key) === stamp) return;
    props.setProperty(key, stamp);
    lines.push((days <= 0 ? '🔴 EXPIRED ' : '🟠 ' + days + ' days – ') + esc_(a.AssetID + ' ' + a.Name) + ' (' +
      Utilities.formatDate(new Date(exp), TZ, 'dd MMM yyyy') + ')');
  });
  return lines;
}

/* =========================================================================
 * Dashboard
 * ========================================================================= */

function apiDashboard_(p) {
  auth_(p);
  var now = new Date();
  var wos = readTable_('WorkOrders').rows.filter(function (w) { return w.WO_ID; });
  var users = readTable_('Users').rows;
  var monthStart = new Date(Utilities.formatDate(now, TZ, "yyyy-MM-01'T'00:00:00") + '+05:30');
  var d90 = now.getTime() - 90 * 86400000;
  var k = { open: 0, newCount: 0, overdue: 0, waitingConfirm: 0, onHold: 0, createdMonth: 0, closedMonth: 0,
    downtimeMonthMin: 0, costMonth: 0, avgCloseHours: null, stoppedNow: 0 };
  var closeHours = [], perPerson = {}, perAsset = {}, overdueList = [];
  wos.forEach(function (w) {
    var open = OPEN_STATUSES.indexOf(w.Status) >= 0;
    if (open && w.Status !== 'DONE') {
      k.open++;
      if (w.Status === 'NEW') k.newCount++;
      if (w.Status === 'ON_HOLD') k.onHold++;
      if (w.ProductionStopped === 'Yes') k.stoppedNow++;
      if (w.DueAt && dateNum_(w.DueAt) < now.getTime()) { k.overdue++; overdueList.push(jobSummary_(w)); }
      var who = w.AssignedTo ? userName_(w.AssignedTo, users) : '(not assigned)';
      perPerson[who] = (perPerson[who] || 0) + 1;
    }
    if (w.Status === 'DONE') k.waitingConfirm++;
    if (dateNum_(w.Created) >= monthStart.getTime()) k.createdMonth++;
    var doneAt = dateNum_(w.CompletedAt) || dateNum_(w.ClosedAt);
    if (w.Status === 'CLOSED' && dateNum_(w.ClosedAt) >= monthStart.getTime()) {
      k.closedMonth++;
      if (doneAt && w.Source !== 'Google Form import') closeHours.push((doneAt - dateNum_(w.Created)) / 3600000);
    }
    if (dateNum_(w.CompletedAt) >= monthStart.getTime()) {
      k.downtimeMonthMin += Number(w.DowntimeMin) || 0;
      k.costMonth += Number(w.Cost) || 0;
    }
    if (w.AssetID && dateNum_(w.Created) >= d90 && w.Status !== 'REJECTED') {
      var key = w.AssetID + '|' + (w.AssetName || '');
      perAsset[key] = (perAsset[key] || 0) + 1;
    }
  });
  if (closeHours.length) k.avgCloseHours = Math.round(closeHours.reduce(function (a, b) { return a + b; }, 0) / closeHours.length * 10) / 10;
  var topAssets = Object.keys(perAsset).map(function (key) {
    var b = key.split('|'); return { id: b[0], name: b[1], count: perAsset[key] };
  }).sort(function (a, b) { return b.count - a.count; }).slice(0, 8);
  var certs = readTable_('Assets').rows.filter(function (a) { return a.AssetID && a.CertExpiry; })
    .map(function (a) { return { id: a.AssetID, name: a.Name, expiry: iso_(a.CertExpiry), status: certStatus_(a) }; })
    .filter(function (c) { return c.status !== 'valid'; })
    .sort(function (a, b) { return dateNum_(a.expiry) - dateNum_(b.expiry); });
  var amap = assetMap_();
  var pmTasks = readTable_('PMTasks').rows.filter(function (t) { return t.TaskID && yes_(t.Active); })
    .map(function (t) { return pmSummary_(t, amap[String(t.AssetID).toUpperCase()]); });
  k.pmOverdue = pmTasks.filter(function (x) { return x.state === 'overdue'; }).length;
  k.pmToday = pmTasks.filter(function (x) { return x.state === 'today'; }).length;
  k.pmDoneMonth = readTable_('PMRecords').rows.filter(function (r) { return dateNum_(r.DoneAt) >= monthStart.getTime(); }).length;
  k.pmCompliance = (k.pmDoneMonth + k.pmOverdue) ? Math.round(k.pmDoneMonth / (k.pmDoneMonth + k.pmOverdue) * 100) : null;
  return {
    kpi: k,
    pmDue: pmTasks.filter(function (x) { return x.state === 'overdue' || x.state === 'today'; })
      .sort(function (a, b) { return b.daysLate - a.daysLate; }).slice(0, 20),
    overdue: overdueList.sort(function (a, b) { return dateNum_(a.dueAt) - dateNum_(b.dueAt); }).slice(0, 20),
    perPerson: Object.keys(perPerson).map(function (n) { return { name: n, count: perPerson[n] }; })
      .sort(function (a, b) { return b.count - a.count; }),
    topAssets: topAssets,
    certs: certs
  };
}

function apiUsers_(p) {
  auth_(p);
  return readTable_('Users').rows.filter(function (u) { return u.UserID && isActive_(u); })
    .map(function (u) { return { id: String(u.UserID), name: u.Name, role: String(u.Role || '').toLowerCase() }; });
}

/* =========================================================================
 * Telegram
 * ========================================================================= */

function tgToken_() { return PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || ''; }

function tgCall_(method, payload) {
  var token = tgToken_();
  if (!token) return null;
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true
  });
  var body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) { body = { ok: false, description: res.getContentText() }; }
  if (!body.ok) Logger.log('Telegram ' + method + ' failed: ' + body.description);
  return body;
}

function tgSend_(chatId, html) {
  if (!chatId) return;
  try {
    tgCall_('sendMessage', { chat_id: String(chatId), text: html, parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (err) { logError_('telegram.send', err); }
}

function notifyUser_(userId, html) {
  if (!userId) return;
  var u = find_(readTable_('Users').rows, 'UserID', String(userId));
  if (u && isActive_(u)) tgSend_(u.TelegramChatID, html);
}

function notifyRoles_(roles, html, exceptUserId) {
  readTable_('Users').rows.forEach(function (u) {
    if (!isActive_(u) || !u.TelegramChatID) return;
    if (roles.indexOf(String(u.Role || '').toLowerCase()) < 0) return;
    if (exceptUserId && String(u.UserID) === String(exceptUserId)) return;
    tgSend_(u.TelegramChatID, html);
  });
}

function apiTelegramLinkStart_(p) {
  var u = auth_(p);
  if (!tgToken_()) throw userError_('The Telegram bot is not set up yet (TELEGRAM_BOT_TOKEN missing).');
  var me = tgCall_('getMe', {});
  if (!me || !me.ok) throw userError_('Telegram bot token is not working. Check TELEGRAM_BOT_TOKEN.');
  var code = String(Math.floor(100000 + Math.random() * 900000));
  var t = readTable_('Users', true);
  setCells_(t, find_(t.rows, 'UserID', String(u.UserID)), { TelegramLinkCode: code });
  return { bot: me.result.username, code: code, url: 'https://t.me/' + me.result.username + '?start=' + code };
}

function apiTelegramLinkCheck_(p) {
  var u = auth_(p);
  var t = readTable_('Users', true);
  var row = find_(t.rows, 'UserID', String(u.UserID));
  if (!row.TelegramLinkCode && row.TelegramChatID) return { linked: true };
  if (!row.TelegramLinkCode) throw userError_('Press "Connect Telegram" first.');
  var upd = tgCall_('getUpdates', { timeout: 0, allowed_updates: ['message'] });
  if (!upd || !upd.ok) throw userError_('Could not read messages from Telegram. Try again.');
  var lastId = 0;
  (upd.result || []).forEach(function (x) {
    lastId = Math.max(lastId, x.update_id);
    var m = x.message;
    var mt = m && m.text && /^(?:\/start\s+)?(\d{6})$/.exec(m.text.trim());
    if (!mt || !m.chat) return;
    // link whoever is waiting with this code (two people may link at the same time)
    var who = find_(t.rows, 'TelegramLinkCode', mt[1]);
    if (!who) return;
    setCells_(t, who, { TelegramChatID: String(m.chat.id), TelegramLinkCode: '' });
    tgSend_(m.chat.id, '✅ Hello ' + esc_(who.Name) + '! You will now receive TVS Horana maintenance alerts here.');
  });
  if (lastId) tgCall_('getUpdates', { offset: lastId + 1, timeout: 0 }); // mark messages as read
  return { linked: !!row.TelegramChatID && !row.TelegramLinkCode };
}

/* =========================================================================
 * Time-based jobs (installed by setup)
 * ========================================================================= */

/** Every hour: overdue alerts (07:00–19:59 only) and auto-close of confirmed-by-silence jobs. */
function hourlyTick() {
  TABLE_CACHE_ = {};
  var s = settings_();
  var now = new Date();
  var hour = Number(Utilities.formatDate(now, TZ, 'H'));
  var t = readTable_('WorkOrders');
  var autoDays = Number(s.AUTO_CLOSE_DAYS) || 3;
  t.rows.forEach(function (w) {
    if (!w.WO_ID) return;
    if (w.Status === 'DONE' && w.CompletedAt && now.getTime() - dateNum_(w.CompletedAt) > autoDays * 86400000) {
      setCells_(t, w, { Status: 'CLOSED', ClosedAt: now, ClosedBy: 'Auto (no reply from requester)', Updated: now });
      addLog_(w.WO_ID, 'System', 'Closed automatically', 'DONE', 'CLOSED', 'No reply from requester in ' + autoDays + ' days');
      return;
    }
    if (hour < 7 || hour >= 20) return;
    if (['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(w.Status) < 0 || !w.DueAt) return;
    if (dateNum_(w.DueAt) >= now.getTime()) return;
    if (w.LastOverdueAlert && now.getTime() - dateNum_(w.LastOverdueAlert) < 20 * 3600000) return;
    var late = Math.round((now.getTime() - dateNum_(w.DueAt)) / 3600000);
    var msg = '⏰ <b>OVERDUE ' + w.WO_ID + '</b> [' + esc_(w.Priority) + '] – ' + late + ' h late\n' +
      '📍 ' + esc_(w.Location) + '\n📝 ' + esc_(short_(w.Description, 200)) + '\n👷 ' +
      esc_(userName_(w.AssignedTo) || 'not assigned') + ' · ' + esc_(w.Status) + '\n\n' + s.APP_URL + 'app.html#wo=' + w.WO_ID;
    if (w.AssignedTo) notifyUser_(w.AssignedTo, msg);
    notifyRoles_(MANAGER_ROLES, msg, w.AssignedTo);
    setCells_(t, w, { LastOverdueAlert: now });
  });
}

/**
 * Every morning ~07:30 (not Sunday): a personal Telegram summary for each team member –
 * their jobs, PM checks due / overdue, and (for admin + supervisor) totals and certificate alerts.
 */
function dailyDigest() {
  TABLE_CACHE_ = {};
  var now = new Date();
  if (Utilities.formatDate(now, TZ, 'u') === '7') return; // no digest on Sunday
  var s = settings_();
  var wos = readTable_('WorkOrders').rows.filter(function (w) { return w.WO_ID; });
  var open = wos.filter(function (w) { return ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].indexOf(w.Status) >= 0; });
  var overdue = open.filter(function (w) { return w.DueAt && dateNum_(w.DueAt) < now.getTime(); });
  var y = now.getTime() - 86400000;
  var newY = wos.filter(function (w) { return dateNum_(w.Created) >= y; }).length;
  var doneY = wos.filter(function (w) { return dateNum_(w.CompletedAt) >= y; }).length;
  var assets = readTable_('Assets').rows;
  var amap = assetMap_();
  var pm = readTable_('PMTasks').rows.filter(function (t) { return t.TaskID && yes_(t.Active); })
    .map(function (t) { return pmSummary_(t, amap[String(t.AssetID).toUpperCase()]); })
    .filter(function (x) { return x.state === 'overdue' || x.state === 'today'; })
    .sort(function (a, b) { return b.daysLate - a.daysLate; });
  var certLines = certAlerts_(assets, s);
  var pmLine = function (x) {
    return '• ' + esc_(x.assetId + ' ' + short_(x.title, 40)) + (x.state === 'overdue' ? ' – <b>' + x.daysLate + ' d late</b>' : ' – today') +
      (x.meterLeft !== null && x.meterLeft <= 0 ? ' (hours reached)' : '');
  };
  var head = '☀️ <b>Maintenance – ' + Utilities.formatDate(now, TZ, 'EEE dd MMM yyyy') + '</b>';

  readTable_('Users').rows.forEach(function (u) {
    if (!isActive_(u) || !u.TelegramChatID) return;
    var role = String(u.Role || '').toLowerCase();
    if (TEAM_ROLES.indexOf(role) < 0) return;
    var mgr = MANAGER_ROLES.indexOf(role) >= 0;
    var mine = open.filter(function (w) { return String(w.AssignedTo) === String(u.UserID); });
    var lines = [head, ''];
    if (mgr) {
      lines.push('Open jobs: <b>' + open.length + '</b> (new ' + open.filter(function (w) { return w.Status === 'NEW'; }).length +
        ', on hold ' + open.filter(function (w) { return w.Status === 'ON_HOLD'; }).length + ') · overdue <b>' + overdue.length + '</b>',
        'Last 24 h: ' + newY + ' new, ' + doneY + ' completed');
      overdue.slice(0, 8).forEach(function (w) {
        lines.push('• ' + w.WO_ID + ' ' + esc_(short_(w.Location, 35)) + ' – ' + esc_(userName_(w.AssignedTo) || 'not assigned'));
      });
    }
    if (mine.length) {
      lines.push('', '👷 <b>Your jobs (' + mine.length + ')</b>');
      mine.slice(0, 10).forEach(function (w) {
        var late = w.DueAt && dateNum_(w.DueAt) < now.getTime();
        lines.push('• ' + w.WO_ID + ' ' + esc_(short_(w.AssetName || w.Location, 35)) + (late ? ' – <b>overdue</b>' : ''));
      });
    }
    var myPm = mgr ? pm : pm.filter(function (x) { return !x.assignedTo || x.assignedTo === String(u.UserID); });
    if (myPm.length) {
      lines.push('', '🗓 <b>PM checks due (' + myPm.length + ')</b>');
      myPm.slice(0, 15).forEach(function (x) { lines.push(pmLine(x)); });
      if (myPm.length > 15) lines.push('… and ' + (myPm.length - 15) + ' more');
    } else {
      lines.push('', '🗓 No PM checks due today.');
    }
    if (mgr && certLines.length) {
      lines.push('', '📄 <b>Inspection certificates</b>');
      certLines.forEach(function (l) { lines.push(l); });
    }
    lines.push('', s.APP_URL + 'app.html');
    tgSend_(u.TelegramChatID, short_(lines.join('\n'), 4000));
  });
}

/* =========================================================================
 * One-time setup and import (run from the editor)
 * ========================================================================= */

/** Run once (and again any time – it is safe). Creates tabs, headers, settings, photo folder, secret and triggers. */
function setup() {
  var ss = db_();
  ss.setSpreadsheetTimeZone(TZ);
  Object.keys(TABLES).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var want = TABLES[name];
    var lastCol = sh.getLastColumn();
    var have = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    want.forEach(function (h) {
      if (have.indexOf(h) < 0) { have.push(h); sh.getRange(1, have.length).setValue(h); }
    });
    sh.getRange(1, 1, 1, have.length).setFontWeight('bold').setBackground('#1c2126').setFontColor('#f2b705');
    sh.setFrozenRows(1);
    (TEXT_COLUMNS[name] || []).forEach(function (h) {
      sh.getRange(2, have.indexOf(h) + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    });
  });
  var st = readTable_('Settings');
  DEFAULT_SETTINGS.forEach(function (row) {
    if (!find_(st.rows, 'Key', row[0])) appendObj_('Settings', { Key: row[0], Value: row[1], Description: row[2] });
  });
  var users = readTable_('Users');
  if (!users.rows.some(function (u) { return u.UserID; })) {
    appendObj_('Users', { UserID: 'U01', Name: 'Denuwan Chamara', Role: 'admin', Email: Session.getEffectiveUser().getEmail(), Active: 'Yes' });
    appendObj_('Users', { UserID: 'U02', Name: 'Hirushan', Role: 'supervisor', Active: 'Yes' });
    appendObj_('Users', { UserID: 'U03', Name: 'Gayan', Role: 'technician', Active: 'Yes' });
  }
  var blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  secret_();
  photoFolder_();
  setupTriggers();
  Logger.log('Setup finished. Next: type a PIN for each user in the Users tab, column NewPIN.');
}

function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (['hourlyTick', 'dailyDigest'].indexOf(tr.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('hourlyTick').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(7).nearMinute(30).inTimezone(TZ).create();
}

/** Copies the old Google Form requests (MWRF001…) into WorkOrders. Safe to run again: skips IDs already imported. */
function importOldRequests() {
  var src = SpreadsheetApp.openById(OLD_REQUESTS_SHEET_ID).getSheetByName('Form Responses 1');
  var v = src.getDataRange().getValues();
  var h = v.shift().map(function (x) { return String(x).trim(); });
  var col = function (name) { return h.indexOf(name); };
  var t = readTable_('WorkOrders');
  var have = {};
  t.rows.forEach(function (w) { have[String(w.WO_ID)] = 1; });
  var maxN = 0;
  v.forEach(function (r) { var m = /^MWRF(\d+)$/.exec(String(r[col('Job ID')] || '').trim()); if (m) maxN = Math.max(maxN, Number(m[1])); });
  var s = settings_();
  var added = 0, skipped = 0;
  var catMap = { 'General Maintenace': 'General Maintenance' };
  v.forEach(function (r) {
    var name = String(r[col('Requested by (Name)')] || '').trim();
    var desc = String(r[col('Request Description / Drawings')] || '').trim();
    var loc = String(r[col('Location of mainteance work')] || '').trim();
    if (!name || !desc) return;
    if (desc.toLowerCase() === 'test' && loc.toLowerCase() === 'test') { skipped++; return; }
    var id = String(r[col('Job ID')] || '').trim();
    if (!id) { maxN++; id = 'MWRF' + ('000' + maxN).slice(-3); }
    if (have[id]) { skipped++; return; }
    var created = toDate_(r[col('Timestamp')], 'MDY') || new Date();
    var done = completedDate_(r[col('Job completed Timestamp')], created);
    var completed = /complete/i.test(String(r[col('Job Status')] || '')) || !!done;
    var pr = String(r[col('Requirement')] || '').trim();
    if (PRIORITIES.indexOf(pr) < 0) pr = 'General';
    var cat = String(r[col('Category of Request')] || '').trim();
    var wo = {
      WO_ID: id, Created: created, RequesterName: name, RequesterEmail: String(r[col('Email Address')] || '').trim(),
      Location: loc, Category: catMap[cat] || cat, Priority: pr, Description: desc, ProductionStopped: 'No',
      Status: completed ? 'CLOSED' : 'NEW', DueAt: new Date(created.getTime() + targetHours_(pr, s) * 3600000),
      ConfirmKey: Utilities.getUuid().replace(/-/g, '').slice(0, 16), Updated: new Date(),
      Source: 'Google Form import', OldJobID: id
    };
    if (completed) {
      wo.CompletedAt = done || created; wo.ClosedAt = done || created;
      wo.ClosedBy = String(r[col('Job Approved by')] || '').trim() || 'Imported';
      wo.ApprovedBy = wo.ClosedBy;
    }
    appendObj_('WorkOrders', wo);
    addLog_(id, 'System', 'Imported from Google Form', '', wo.Status, '');
    have[id] = 1;
    added++;
  });
  Logger.log('Imported ' + added + ' requests, skipped ' + skipped + '.');
}

/**
 * Old "Job completed" dates were typed day/month; Sheets turned the ones with day <= 12 into wrong month/day dates.
 * Try both readings and keep the one closest after the request date.
 */
function completedDate_(v, created) {
  var c = [];
  if (v instanceof Date && !isNaN(v.getTime())) {
    c.push(v);
    var p = Utilities.formatDate(v, TZ, 'yyyy-MM-dd-HH-mm-ss').split('-');
    if (Number(p[2]) <= 12) c.push(new Date(p[0] + '-' + p[2] + '-' + p[1] + 'T' + p[3] + ':' + p[4] + ':' + p[5] + '+05:30'));
  } else {
    c.push(toDate_(v, 'DMY'), toDate_(v, 'MDY'));
  }
  var best = null;
  c.forEach(function (d) {
    if (!d || isNaN(d.getTime()) || d.getTime() < created.getTime() - 86400000) return;
    if (!best || d.getTime() < best.getTime()) best = d;
  });
  return best || c.filter(function (d) { return d && !isNaN(d.getTime()); })[0] || null;
}

/** Sends a Telegram test message to every linked admin/supervisor. */
function sendTelegramTest() {
  notifyRoles_(MANAGER_ROLES, '🔔 Test message from TVS Horana CMMS – ' + Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy HH:mm'));
}

/** Checks the bot token (logs only the bot name, never the token) and lists who has connected Telegram. */
function checkTelegram() {
  var me = tgCall_('getMe', {});
  if (!me) { Logger.log('TELEGRAM_BOT_TOKEN is not set in Script Properties.'); return; }
  Logger.log(me.ok ? 'Bot OK: @' + me.result.username + ' (' + me.result.first_name + ')' : 'Bot token NOT working: ' + me.description);
  var linked = readTable_('Users').rows.filter(function (u) { return u.TelegramChatID; }).map(function (u) { return u.Name; });
  Logger.log('Telegram connected: ' + (linked.join(', ') || 'nobody yet'));
}

/* =========================================================================
 * Sheet helpers
 * ========================================================================= */

/** The database spreadsheet (works whether or not the script is bound to it). */
function db_() {
  return SpreadsheetApp.getActive() || SpreadsheetApp.openById(DB_SHEET_ID);
}

function sheet_(name) {
  var sh = db_().getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" is missing. Run setup() first.');
  return sh;
}

var TABLE_CACHE_ = {};

/** Reads a whole tab once per execution (cached). Use fresh=true inside a lock. */
function readTable_(name, fresh) {
  if (!fresh && TABLE_CACHE_[name]) return TABLE_CACHE_[name];
  var sh = sheet_(name);
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  var values = (lastRow && lastCol) ? sh.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  var headers = values.shift().map(function (x) { return String(x).trim(); });
  var rows = values.map(function (r, i) {
    var o = { _row: i + 2 };
    headers.forEach(function (k, j) { if (k) o[k] = r[j]; });
    return o;
  });
  TABLE_CACHE_[name] = { name: name, sheet: sh, headers: headers, rows: rows };
  return TABLE_CACHE_[name];
}

function appendObj_(name, obj) {
  var sh = sheet_(name);
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (x) { return String(x).trim(); });
  var row = headers.map(function (k) { return (obj[k] === undefined || obj[k] === null) ? '' : obj[k]; });
  var r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, headers.length).setValues([row]);
  delete TABLE_CACHE_[name];
}

/** Writes only the changed cells of one row (keeps other columns untouched). */
function setCells_(t, rowObj, changes) {
  if (!rowObj) throw new Error('Row not found');
  Object.keys(changes).forEach(function (k) {
    var c = t.headers.indexOf(k);
    if (c < 0) return;
    var v = changes[k] === undefined || changes[k] === null ? '' : changes[k];
    t.sheet.getRange(rowObj._row, c + 1).setValue(v);
    rowObj[k] = v;
  });
}

function updateWo_(id, changes) {
  var t = readTable_('WorkOrders');
  setCells_(t, find_(t.rows, 'WO_ID', id), changes);
}

function addLog_(woId, user, action, from, to, note) {
  appendObj_('WorkOrderLog', { Timestamp: new Date(), WO_ID: woId, User: user, Action: action, FromStatus: from || '',
    ToStatus: to || '', Note: note || '' });
}

function find_(rows, key, value) {
  var v = String(value === undefined || value === null ? '' : value).trim().toUpperCase();
  if (!v) return null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][key] === undefined ? '' : rows[i][key]).trim().toUpperCase() === v) return rows[i];
  }
  return null;
}

function nextWoId_(rows, now) {
  var prefix = 'WO-' + Utilities.formatDate(now, TZ, 'yyyy') + '-';
  var max = 0;
  rows.forEach(function (w) {
    var id = String(w.WO_ID || '');
    if (id.indexOf(prefix) === 0) max = Math.max(max, Number(id.slice(prefix.length)) || 0);
  });
  return prefix + ('0000' + (max + 1)).slice(-4);
}

function settings_() {
  var out = {};
  DEFAULT_SETTINGS.forEach(function (r) { out[r[0]] = r[1]; });
  readTable_('Settings').rows.forEach(function (r) { if (r.Key) out[String(r.Key).trim()] = String(r.Value === undefined ? '' : r.Value).trim(); });
  if (out.APP_URL && !/\/$/.test(out.APP_URL)) out.APP_URL += '/';
  return out;
}

function targetHours_(priority, s) {
  s = s || settings_();
  var key = { 'Very Urgent': 'TARGET_HOURS_VERY_URGENT', 'Urgent': 'TARGET_HOURS_URGENT', 'General': 'TARGET_HOURS_GENERAL' }[priority];
  return Number(s[key]) || 168;
}

function secret_() {
  var props = PropertiesService.getScriptProperties();
  var sec = props.getProperty('TOKEN_SECRET');
  if (!sec) {
    sec = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('TOKEN_SECRET', sec);
  }
  return sec;
}

function photoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* folder deleted – create a new one */ }
  }
  var parent = null;
  try { parent = DriveApp.getFileById(db_().getId()).getParents().next(); } catch (e) { /* use My Drive */ }
  var f = parent ? parent.createFolder('TVS CMMS Photos') : DriveApp.createFolder('TVS CMMS Photos');
  props.setProperty('PHOTO_FOLDER_ID', f.getId());
  return f;
}

/** Saves a data-URL image to Drive (anyone with the link can view) and returns the file ID. */
function savePhoto_(dataUrl, baseName) {
  var m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) throw new Error('Photo format not supported');
  var bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > 6 * 1024 * 1024) throw new Error('Photo too large');
  var ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  var file = photoFolder_().createFile(Utilities.newBlob(bytes, m[1], baseName + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

function photoUrl_(id) { return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000' : ''; }

function sendMail_(to, subject, body) {
  try {
    MailApp.sendEmail({ to: to, subject: '[TVS Maintenance] ' + subject, body: body, name: 'TVS Horana Maintenance' });
  } catch (err) { logError_('mail', err); }
}

function logError_(action, err) {
  try {
    appendObj_('Errors', { Timestamp: new Date(), Action: action, Message: (err && err.message) || String(err),
      Stack: String((err && err.stack) || '').slice(0, 2000) });
  } catch (e) { Logger.log(e); }
}

/* =========================================================================
 * Small utilities
 * ========================================================================= */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function userError_(msg) { var e = new Error(msg); e.userError = true; return e; }

function clean_(v, max) { return String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 500); }

function cleanId_(v) { return clean_(v, 40).toUpperCase().replace(/\s+/g, ''); }

function driveId_(v) {
  var s = clean_(v, 300);
  var m = /\/d\/([A-Za-z0-9_-]{20,})/.exec(s) || /[?&]id=([A-Za-z0-9_-]{20,})/.exec(s);
  return m ? m[1] : s;
}

function num_(v) {
  var s = String(v === undefined || v === null ? '' : v).replace(/,/g, '').trim();
  if (s === '') return '';
  var n = Number(s);
  return isFinite(n) ? n : '';
}

function list_(v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(String); }

function yes_(v) { return /^(y|yes|true|1)$/i.test(String(v || '').trim()); }

function isActive_(u) { return !/^(n|no|false|0)$/i.test(String(u.Active === undefined ? 'Yes' : u.Active).trim()); }

function short_(v, n) { var s = String(v || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function esc_(v) { return String(v === undefined || v === null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function iso_(v) { return (v instanceof Date) ? (isNaN(v.getTime()) ? '' : v.toISOString()) : (v === undefined || v === null ? '' : v); }

function dateNum_(v) {
  if (!v) return 0;
  if (v instanceof Date) return v.getTime();
  var t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

/** "2026-10-26T14:30" or "2026-10-26" typed in Sri Lanka → Date. */
function parseLocal_(v) {
  var s = String(v || '').trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(s);
  if (!m) return null;
  var d = new Date(m[1] + '-' + m[2] + '-' + m[3] + 'T' + (m[4] || '00') + ':' + (m[5] || '00') + ':00+05:30');
  return isNaN(d.getTime()) ? null : d;
}

/** Old sheet dates: real Date, or text like 3/1/2024 or 6/15/2024 20:01 in the given day/month order. */
function toDate_(v, order) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(String(v || '').trim());
  if (!m) return null;
  var a = Number(m[1]), b = Number(m[2]);
  var mon = order === 'DMY' ? b : a, day = order === 'DMY' ? a : b;
  if (mon > 12) { var x = mon; mon = day; day = x; }
  var pad = function (n) { return ('0' + n).slice(-2); };
  var d = new Date(m[3] + '-' + pad(mon) + '-' + pad(day) + 'T' + pad(m[4] || 0) + ':' + (m[5] || '00') + ':' + (m[6] || '00') + '+05:30');
  return isNaN(d.getTime()) ? null : d;
}

function certStatus_(a) {
  if (!a.CertExpiry) return yes_(a.CertRequired) ? 'missing' : 'none';
  var days = (dateNum_(a.CertExpiry) - Date.now()) / 86400000;
  if (days < 0) return 'expired';
  if (days <= 60) return 'expiring';
  return 'valid';
}

function userName_(id, users) {
  if (!id) return '';
  var u = find_(users || readTable_('Users').rows, 'UserID', String(id));
  return u ? u.Name : String(id);
}
