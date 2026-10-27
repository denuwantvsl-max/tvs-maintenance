/* DEV ONLY: runs backend/Code.gs inside the browser on fake data (open any page with ?mock=1). State lives in sessionStorage. */
(function () {
  var KEY = 'cmms_mock_state';
  function save() {
    var F = window.FAKE_GAS;
    var state = { sheets: F.active.sheets.map(function (s) { return { name: s.name, data: s.data }; }), props: F.props };
    sessionStorage.setItem(KEY, JSON.stringify(state, function (k, v) {
      return (this[k] instanceof Date) ? { __d: this[k].toISOString() } : v;
    }));
  }
  function load() {
    var raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    var st = JSON.parse(raw, function (k, v) { return v && v.__d ? new Date(v.__d) : v; });
    var F = window.FAKE_GAS;
    F.active.sheets = [];
    st.sheets.forEach(function (s) { F.active.insertSheet(s.name).data = s.data; });
    F.props = st.props;
    return true;
  }
  window.CMMS_MOCK_BOOT = function () {
    return fetch('backend/Code.gs?t=' + Date.now()).then(function (r) { return r.text(); }).then(function (code) {
      (0, eval)(code);
      if (!load()) {
        window.FAKE_GAS.active.sheets = [];
        window.FAKE_GAS.active.insertSheet('Sheet1');
        setup();
        DEMO_DATA.assets.forEach(function (a) { appendObj_('Assets', a); });
        DEMO_DATA.checklist.forEach(function (r) {
          var o = {}; TABLES.ChecklistItems.forEach(function (k, i) { o[k] = r[i] === undefined ? '' : r[i]; }); appendObj_('ChecklistItems', o);
        });
        DEMO_DATA.tasks.forEach(function (t) {
          var o = Object.assign({}, t); delete o.due;
          if (t.due !== null) o.NextDue = new Date(startOfDay_().getTime() + t.due * 86400000);
          appendObj_('PMTasks', o);
        });
        var at = readTable_('Assets', true);
        setCells_(at, find_(at.rows, 'AssetID', 'EN-CA-01'), { MeterUnit: 'h', CurrentMeter: 2985 });
        setCells_(at, find_(at.rows, 'AssetID', 'ST-MM-01'), { MeterUnit: 'h', CurrentMeter: 4410 });
        var ut = readTable_('Users', true);
        ut.rows.forEach(function (u) { setCells_(ut, u, { NewPIN: DEMO_DATA.pins[u.UserID] }); });
        window.FAKE_GAS.props.TELEGRAM_BOT_TOKEN = 'fake';
        var post = function (o) { return JSON.parse(doPost({ postData: { contents: JSON.stringify(o) } }).getContent()); };
        post({ action: 'createRequest', request: { name: 'Shantha', department: 'Stores', assetId: 'ST-MM-01', category: 'Hydraulic',
          priority: 'Urgent', description: 'Forklift mast drops slowly when loaded', productionStopped: false } });
        post({ action: 'createRequest', request: { name: 'Nelantha', email: 'demo@example.com', department: 'SKD Assembly', location: 'SKD washroom',
          category: 'Electrical', priority: 'Very Urgent', description: 'Exhaust fan not working. Please replace with a new exhaust fan.' } });
        post({ action: 'createRequest', request: { name: 'Prasad', department: 'Testing', assetId: 'PD-AL-01', category: 'Mechanical',
          priority: 'Very Urgent', description: 'Main conveyor chain jumped off sprocket at station L-4', productionStopped: true } });
        save();
      }
    });
  };
  window.CMMS_MOCK_POST = function (body) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var out = JSON.parse(doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
        save();
        resolve(out);
      }, 250);
    });
  };
})();
