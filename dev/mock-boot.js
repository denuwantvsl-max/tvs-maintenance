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
        seedDemoReadings();
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
  /** 30 days of made-up meter readings so the Readings tab and insights.html have something to show (mock only). */
  function seedDemoReadings() {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var day = function (n) { return Utilities.formatDate(new Date(Date.now() + n * 86400000), TZ, 'yyyy-MM-dd'); };
    var gen = { h: 1270.5, st: 790, fuel: 82 }, comp = { h: 7020, l: 1650, st: 93300 }, water = 5170, n = 1;
    var add = function (o) { appendObj_('Readings', Object.assign({ ReadingID: 'RD-' + ('0000' + (n++)).slice(-4), Time: '08:' + (30 + Math.floor(rnd() * 25)), By: rnd() < .5 ? 'Gayan' : 'Hirushan', Created: new Date() }, o)); };
    for (var d = -30; d <= -1; d++) {
      var date = day(d), sunday = new Date(Date.now() + d * 86400000).getDay() === 0;
      var run = (d % 7 === 0) ? 0.3 : (rnd() < .12 ? 1.5 + rnd() * 3 : 0);
      if (run > 1) {
        var sh = 17 + Math.floor(rnd() * 3), sm = Math.floor(rnd() * 50), mins = Math.round(run * 60), stopM = sh * 60 + sm + mins, pad = function (n) { return ('0' + n).slice(-2); };
        appendObj_('GenRuns', { RunID: 'GR-' + ('0000' + n).slice(-4), StartAt: date + ' ' + pad(sh) + ':' + pad(sm), StopAt: date + ' ' + pad(Math.floor(stopM / 60) % 24) + ':' + pad(stopM % 60),
          Reason: 'Power cut', HoursStart: Math.round(gen.h * 100) / 100, HoursStop: Math.round((gen.h + run) * 100) / 100, FuelStart: Math.round(gen.fuel),
          FuelStop: Math.round(gen.fuel - run * 16.5 / 440 * 100), By: 'Gayan', Created: new Date() });
      }
      if (run) { gen.h += run; gen.st += 1 + (run > 1 && rnd() < .3 ? 1 : 0); gen.fuel -= run * 16.5 / 440 * 100; }
      if (gen.fuel < 26) { appendObj_('FuelLog', { RefillID: 'FL-9' + n, Date: date, AssetID: 'EN-PS-06', Litres: 200, Hours: Math.round(gen.h * 100) / 100, FuelBefore: Math.round(gen.fuel), FuelAfter: Math.round(gen.fuel + 45), By: 'Gayan', Created: new Date(Date.now() + d * 86400000) }); gen.fuel += 45; }
      add({ Date: date, Point: 'GEN', AssetID: 'EN-PS-06', Hours: Math.round(gen.h * 100) / 100, Starts: gen.st, FuelPct: Math.round(gen.fuel) });
      var cr = sunday ? 0 : 6.5 + rnd() * 1.5, cl = cr * (0.11 + rnd() * 0.07);
      comp.h += cr; comp.l += cl; comp.st += sunday ? 0 : Math.round(80 + rnd() * 25);
      add({ Date: date, Point: 'COMP', AssetID: 'EN-CA-01', Hours: Math.round(comp.h), LoadedHours: Math.round(comp.l), Starts: comp.st });
      water += sunday ? 3 + rnd() : (d === -9 ? 12.4 : 6.6 + rnd() * 1.4);
      add({ Date: date, Point: 'WATER', AssetID: 'EN-FM-WM-01', WaterM3: Math.round(water * 100) / 100 });
    }
  }

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
