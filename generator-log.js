/* TVS Horana CMMS – public Generator log (view only, anyone with the link). For HR / audit: is the diesel given to the
   generator used in line with its running hours, which days did it run, and the full log. Data: API action genLog.
   English / Sinhala: the header button (common.js) switches the language; the choice is remembered. */
(function () {
  'use strict';
  var C = CMMS, esc = C.esc, $ = function (id) { return document.getElementById(id); };
  var V = window.Viz, num = V.num, stat = V.stat, line = V.line, tankSvg = V.tankSvg;
  var S = { data: null, period: C.store.get('cmms_genlog_period') || 'last30' };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseAt = function (s) { return new Date(String(s).replace(' ', 'T') + ':00'); };

  /* ---------------- English / Sinhala ---------------- */
  var TXT = {
    pageTitle: ['Generator log – TVS Horana', 'ජනක යන්ත්‍ර ලොගය – TVS හොරණ'],
    brandSub: ['TVS Lanka · Horana Assembly Plant', 'TVS ලංකා · හොරණ එකලස් කිරීමේ කම්හල'],
    viewOnly: ['VIEW ONLY', 'බැලීමට පමණි'],
    title: ['Generator log', 'ජනක යන්ත්‍ර ලොගය'],
    tank: ['{n} L tank', 'ලීටර් {n} ටැංකිය'],
    intro: ['Readings are taken daily by the maintenance team, and each run (power cut, test, service) is recorded with its start and stop time.',
      'නඩත්තු කණ්ඩායම දිනපතා කියවීම් ගන්නා අතර, සෑම ධාවනයක්ම (විදුලිය නැතිවීම, පරීක්ෂණ, සේවාව) ආරම්භ හා නැවතුම් වේලාව සමඟ සටහන් කරයි.'],
    last30: ['Last 30 days', 'පසුගිය දින 30'],
    last90: ['Last 90 days', 'පසුගිය දින 90'],
    print: ['🖨 Print / PDF', '🖨 මුද්‍රණය / PDF'],
    csv: ['⬇ Excel (CSV)', '⬇ Excel (CSV)'],
    fromTo: ['{a} to {b}', '{a} සිට {b} දක්වා'],
    hoursRun: ['Hours run', 'ධාවන පැය'],
    daysRan: ['Days it ran', 'ධාවනය වූ දින'],
    runsTimed: ['{n} runs recorded with times', 'වේලාව සහිතව සටහන් කළ ධාවන {n}'],
    runTimed: ['1 run recorded with times', 'වේලාව සහිතව සටහන් කළ ධාවන 1'],
    filled: ['Diesel filled', 'පිරවූ ඩීසල්'],
    refills: ['{n} refills', 'පිරවීම් {n}'],
    refill1: ['1 refill', 'පිරවීම් 1'],
    perHour: ['Diesel per running hour', 'ධාවන පැයකට ඩීසල්'],
    normal: ['normal {a}–{b} L/h', 'සාමාන්‍ය {a}–{b} L/h'],
    qTitle: ['Is the diesel used in line with the running hours?', 'භාවිත කළ ඩීසල් ධාවන පැයවලට ගැළපේද?'],
    qSub: ['Diesel used is worked out from the tank level ({t} L tank) and the refills between readings. Expected = hours run × {e} L/h.',
      'භාවිත කළ ඩීසල් ගණනය කරන්නේ ටැංකියේ මට්ටම (ලීටර් {t} ටැංකිය) සහ කියවීම් අතර පිරවීම් අනුවයි. අපේක්ෂිත = ධාවන පැය × {e} L/h.'],
    notEnough: ['Not enough fuel-level readings in this period yet. The check starts once the tank level is read on two different days.',
      'මෙම කාලය සඳහා ප්‍රමාණවත් ඉන්ධන මට්ටම් කියවීම් තවම නැත. ටැංකි මට්ටම වෙනස් දින දෙකකදී කියවූ පසු පරීක්ෂාව ආරම්භ වේ.'],
    used: ['Diesel used (tank level)', 'භාවිත කළ ඩීසල් (ටැංකි මට්ටම)'],
    expectedFor: ['Expected for {h} h run', 'පැය {h} ධාවනයට අපේක්ෂිත'],
    kMatch: ['Used, matches running hours', 'භාවිතය – ධාවන පැයවලට ගැළපේ'],
    kNot: ['Used, not explained by running hours', 'භාවිතය – ධාවන පැයවලින් පැහැදිලි නොවේ'],
    kExp: ['Expected', 'අපේක්ෂිත'],
    kFill: ['Filled', 'පිරවූ'],
    vBad: ['About {n} L of diesel is not explained by the running hours.', 'ඩීසල් ලීටර් {n} ක් පමණ ධාවන පැයවලින් පැහැදිලි නොවේ.'],
    vBad2: ['See the flagged rows in the log below. Possible reasons: a run not recorded (power cut at night), a leak, diesel taken, or a wrong reading.',
      'පහත ලොගයේ ⚠ සලකුණු කළ පේළි බලන්න. විය හැකි හේතු: සටහන් නොකළ ධාවනයක් (රාත්‍රී විදුලිය නැතිවීම), කාන්දුවක්, ඩීසල් ඉවත් කිරීමක්, හෝ වැරදි කියවීමක්.'],
    vGood: ['Diesel use matches the running hours', 'ඩීසල් භාවිතය ධාවන පැයවලට ගැළපේ'],
    vGood2: ['for this period (within the normal {a}–{b} L/h and a 5% gauge allowance).', 'මෙම කාලය සඳහා (සාමාන්‍ය {a}–{b} L/h සහ 5% මිනුම් ඉඩ තුළ).'],
    vRefill: ['The tank level went up at least once without a refill entry. Ask maintenance to record every refill.',
      'පිරවීමක් සටහන් නොකර ටැංකි මට්ටම අවම වශයෙන් එක් වරක් ඉහළ ගොස් ඇත. සෑම පිරවීමක්ම සටහන් කරන ලෙස නඩත්තු අංශයට දන්වන්න.'],
    calTitle: ['Days the generator ran', 'ජනකය ධාවනය වූ දින'],
    calCap: ['Hover or tap a day for the times.', 'වේලාවන් බැලීමට දිනයක් මත ඔබන්න.'],
    days: [['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ['සඳු', 'අඟ', 'බදා', 'බ්‍රහ', 'සිකු', 'සෙන', 'ඉරි']],
    cRan: ['{t} run', '{t} ධාවනය'],
    cMeter: ['(from the hour meter)', '(පැය මීටරය අනුව)'],
    cNoRun: ['did not run', 'ධාවනය නොවීය'],
    cNoRead: ['no reading', 'කියවීමක් නැත'],
    keyNoRun: ['Did not run', 'ධාවනය නොවීය'],
    keyU1: ['Under 1 h', 'පැය 1 ට අඩු'],
    key13: ['1–3 h', 'පැය 1–3'],
    keyO3: ['Over 3 h', 'පැය 3 ට වැඩි'],
    keyPower: ['⚡ Power cut', '⚡ විදුලිය නැතිවීම'],
    keyNoRead: ['No reading', 'කියවීමක් නැත'],
    tankNow: ['Tank now', 'දැන් ටැංකිය'],
    readOn: ['Read {d}', '{d} කියවූ'],
    noFuel: ['No fuel reading yet', 'තවම ඉන්ධන කියවීමක් නැත'],
    litresOf: ['{l} L of {t} L', 'ලීටර් {t} න් ලීටර් {l}'],
    redLine: ['Red line = low-fuel level ({p}%)', 'රතු රේඛාව = අඩු ඉන්ධන මට්ටම ({p}%)'],
    lowLbl: ['low {p}%', 'අඩු {p}%'],
    overTime: ['Tank level over time', 'කාලයත් සමඟ ටැංකි මට්ටම'],
    greyLines: ['Grey lines = refills.', 'අළු රේඛා = ඩීසල් පිරවීම්.'],
    runsTitle: ['Runs with times', 'වේලාවන් සහිත ධාවන'],
    runsSub: ['Each time the generator ran, as recorded by the maintenance team.', 'නඩත්තු කණ්ඩායම සටහන් කළ පරිදි ජනකය ධාවනය වූ සෑම අවස්ථාවක්ම.'],
    onMeter: ['{t} on the meter', 'මීටරයේ {t}'],
    fuel: ['fuel', 'ඉන්ධන'],
    noRuns: ['No runs recorded with times in this period. Daily readings still show the hours on the calendar.',
      'මෙම කාලය තුළ වේලාවන් සහිත ධාවන සටහන් කර නැත. දිනපතා කියවීම් අනුව පැය දින දර්ශනයේ පෙන්වයි.'],
    checks: ['Checks', 'පරීක්ෂා'],
    checksNote: ['(as recorded in the maintenance system)', '(නඩත්තු පද්ධතියේ සටහන් කළ පරිදි)'],
    logTitle: ['Full log', 'සම්පූර්ණ ලොගය'],
    logSub: ['Newest first. ⚠ = fuel went down more than the running hours explain.', 'අලුත්ම ඒවා මුලින්. ⚠ = ධාවන පැයවලින් පැහැදිලි වන ප්‍රමාණයට වඩා ඉන්ධන අඩු විය.'],
    cols: [['Date & time', 'Entry', 'Hour meter', 'Fuel', 'Litres', 'By', 'Note'], ['දිනය සහ වේලාව', 'ඇතුළත් කිරීම', 'පැය මීටරය', 'ඉන්ධන', 'ලීටර්', 'කළේ', 'සටහන']],
    flagCol: ['Flag', 'සලකුණ'],
    noEntries: ['No entries in this period.', 'මෙම කාලය තුළ ඇතුළත් කිරීම් නැත.'],
    footer: ['View-only page. Figures come from the maintenance system (CMMS) and update when the team records readings. Updated {t}.',
      'බැලීමට පමණි. සංඛ්‍යා නඩත්තු පද්ධතියෙන් (CMMS) ලැබෙන අතර කණ්ඩායම කියවීම් සටහන් කරන විට යාවත්කාලීන වේ. යාවත්කාලීන කළේ {t}.'],
    kRead: ['Daily reading', 'දෛනික කියවීම'],
    kRun: ['Run', 'ධාවනය'],
    kRefill: ['Diesel refill', 'ඩීසල් පිරවීම'],
    litresUsed: ['{n} L used', 'ලීටර් {n} භාවිතා විය'],
    flagTxt: ['About {n} L used since {a} with {h} h run', '{a} සිට පැය {h} ධාවනයට ලීටර් {n} ක් පමණ භාවිතා විය'],
    tryAgain: ['Try again', 'නැවත උත්සාහ කරන්න'],
    hm: ['{h} h {m} m', 'පැය {h} මිනි. {m}'],
    'Power cut': ['Power cut', 'විදුලිය නැතිවීම'],
    'Test run': ['Test run', 'පරීක්ෂණ ධාවනය'],
    'Service': ['Service', 'සේවාව'],
    'Other': ['Other', 'වෙනත්']
  };
  var si = function () { return C.lang() === 'si'; };
  function L(key, vars) {
    var e = TXT[key], s = e ? e[si() ? 1 : 0] : key;
    if (vars && typeof s === 'string') Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  // Sinhala names written out (not every browser has a Sinhala date format)
  var SI_MONTHS = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
  var SI_DAYS = ['ඉරි', 'සඳු', 'අඟ', 'බදා', 'බ්‍රහ', 'සිකු', 'සෙන'];
  var dayMon = function (d) { return si() ? SI_MONTHS[d.getMonth()] + ' ' + d.getDate() : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  var dayL = function (k) { var d = new Date(k + 'T00:00:00'); return si() ? SI_DAYS[d.getDay()] + ', ' + dayMon(d) : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  var monthL = function (d) { return si() ? d.getFullYear() + ' ' + SI_MONTHS[d.getMonth()] : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };
  var hm = function (h) { var m = Math.round(h * 60); return L('hm', { h: Math.floor(m / 60), m: pad(m % 60) }); };
  var reason = function (r) { return TXT[r] ? L(r) : r; };

  /** [from, to] (yyyy-MM-dd, inclusive) and a label for the chosen period. */
  function range() {
    var now = new Date(), p = S.period;
    if (p === 'last30' || p === 'last90') {
      var n = p === 'last30' ? 30 : 90, f = new Date(now.getTime() - (n - 1) * 86400000);
      return { from: ymd(f), to: ymd(now), label: L(p) };
    }
    var y = Number(p.slice(0, 4)), m = Number(p.slice(5, 7)), last = new Date(y, m, 0);
    return { from: p + '-01', to: ymd(last) > ymd(now) ? ymd(now) : ymd(last), label: monthL(last, true) };
  }

  /** Fuel and hours accounting for the period, pair by pair between fuel readings. */
  function account(d, r) {
    var lim = d.limits, tank = lim.tankLitres;
    var rd = d.readings.map(function (x) { return Object.assign({ t: Date.parse(x.at) }, x); }).sort(function (a, b) { return a.t - b.t; });
    var hoursAt = function (x) {
      if (x.hours !== undefined && x.hours !== null) return x.hours;
      var h = null, next = null;
      rd.forEach(function (y) { if (y.hours === undefined || y.hours === null) return; if (y.t <= x.t) h = y.hours; else if (next === null) next = y.hours; });
      return h !== null && next !== null && next > h + 0.05 ? null : h;   // ran in between: unknown
    };
    var refills = d.refills.filter(function (f) { return !f.exclude && f.litres > 0 && (!tank || f.litres <= tank); });
    var refAt = function (f) { return f.at ? Date.parse(f.at) : Date.parse(f.date + 'T12:00:00'); };
    var fedBetween = function (a, b) { return refills.filter(function (f) { var t = refAt(f); return t > a.t && t <= b.t; }).reduce(function (s, f) { return s + f.litres; }, 0); };
    var inP = function (x) { return x.date >= r.from && x.date <= r.to; };
    // hours run: meter at the last reading of the period minus the last reading before it (or the first in it)
    var withH = rd.filter(function (x) { return x.hours !== undefined && x.hours !== null; });
    var base = null, endR = null;
    withH.forEach(function (x) { if (x.date < r.from) base = x; else if (x.date <= r.to) { endR = x; if (!base) base = x; } });
    var hoursRun = base && endR ? Math.max(0, endR.hours - base.hours) : 0;
    // fuel pairs
    var fuel = rd.filter(function (x) { return x.fuelPct !== undefined && x.fuelPct !== null && hoursAt(x) !== null; });
    var pairs = [];
    for (var i = 1; i < fuel.length; i++) {
      var a = fuel[i - 1], b = fuel[i];
      if (!inP(b)) continue;
      var ha = hoursAt(a), hb = hoursAt(b), ran = ha !== null && hb !== null ? Math.max(0, hb - ha) : 0;
      var fed = fedBetween(a, b), drop = (a.fuelPct - b.fuelPct) / 100 * tank + fed;
      var allowed = ran * lim.lphMax + 0.05 * tank;
      pairs.push({ a: a, b: b, ran: ran, fed: fed, used: drop, expected: ran * lim.lphExpected, unexplained: Math.max(0, drop - allowed), missingRefill: drop < -0.05 * tank });
    }
    var sum = function (k) { return pairs.reduce(function (s, p) { return s + Math.max(0, p[k]); }, 0); };
    return { hoursRun: hoursRun, pairs: pairs, used: sum('used'), expected: sum('expected'), unexplained: sum('unexplained'),
      fuelHours: pairs.reduce(function (s, p) { return s + p.ran; }, 0),
      filled: refills.filter(inP).reduce(function (s, f) { return s + f.litres; }, 0), refills: refills.filter(inP), rd: rd, hoursAt: hoursAt };
  }

  /** Run hours per day: recorded runs first (exact), otherwise hour-meter change between readings (on the later reading's day). */
  function perDay(d, acc) {
    var days = {};
    d.runs.forEach(function (x) {
      var k = x.start.slice(0, 10), o = days[k] = days[k] || { h: 0, runs: [], approx: 0 };
      o.h += Math.max(0, x.hoursStop - x.hoursStart); o.runs.push(x);
    });
    var withH = acc.rd.filter(function (x) { return x.hours !== undefined && x.hours !== null; });
    for (var i = 1; i < withH.length; i++) {
      var a = withH[i - 1], b = withH[i], dh = b.hours - a.hours;
      if (dh <= 0.01 || /^Run GR-/.test(b.note || '')) continue;
      var covered = d.runs.some(function (x) { var s = parseAt(x.start).getTime(), e = parseAt(x.stop).getTime(); return s >= a.t - 60000 && e <= b.t + 60000; });
      if (covered) continue;
      var o = days[b.date] = days[b.date] || { h: 0, runs: [], approx: 0 };
      o.h += dh; o.approx += dh; o.from = a;
    }
    return days;
  }

  function calendar(r, days, readDays) {
    var out = '', start = new Date(r.from + 'T00:00:00'), end = new Date(r.to + 'T00:00:00');
    var cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      var y = cur.getFullYear(), m = cur.getMonth(), first = new Date(y, m, 1), nDays = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
      out += '<div class="cal-month">' + esc(monthL(first, true)) + '</div><div class="cal">' +
        L('days').map(function (x) { return '<div class="dh">' + esc(x) + '</div>'; }).join('');
      for (var b = 0; b < lead; b++) out += '<div class="d out"></div>';
      for (var dd = 1; dd <= nDays; dd++) {
        var k = y + '-' + pad(m + 1) + '-' + pad(dd), o = days[k], inside = k >= r.from && k <= r.to;
        if (!inside) { out += '<div class="d out"></div>'; continue; }
        var h = o ? o.h : 0, cls = h > 3 ? 'l3' : h >= 1 ? 'l2' : h > 0.01 ? 'l1' : (readDays[k] ? '' : 'nodata');
        var power = o && o.runs.some(function (x) { return x.reason === 'Power cut'; });
        var tip = dayL(k) + ': ' + (h > 0.01 ? L('cRan', { t: hm(h) }) + ' ' + (o.runs.length ? '(' + o.runs.map(function (x) { return reason(x.reason) + ' ' + x.start.slice(11) + '–' + x.stop.slice(11); }).join(', ') + ')' : L('cMeter'))
          : (readDays[k] ? L('cNoRun') : L('cNoRead')));
        out += '<div class="d ' + cls + '" title="' + esc(tip) + '" aria-label="' + esc(tip) + '">' + (power ? '<span class="pc" aria-hidden="true">⚡</span>' : '') +
          '<b>' + dd + '</b><small>' + (h > 0.01 ? num(h, 1) + 'h' : '') + '</small></div>';
      }
      out += '</div>';
      cur = new Date(y, m + 1, 1);
    }
    return out + '<div class="keyrow"><span><i style="background:#eef0f3"></i>' + esc(L('keyNoRun')) + '</span><span><i style="background:#9ec5f4"></i>' + esc(L('keyU1')) + '</span>' +
      '<span><i style="background:#3987e5"></i>' + esc(L('key13')) + '</span><span><i style="background:#184f95"></i>' + esc(L('keyO3')) + '</span><span>' + esc(L('keyPower')) + '</span>' +
      '<span><i style="background:repeating-linear-gradient(135deg,#f8fafc 0 3px,#d5d8de 3px 5px)"></i>' + esc(L('keyNoRead')) + '</span></div>';
  }

  function hbar(label, value, max, color, parts) {
    var w = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
    var inner = parts ? parts.filter(function (p) { return p[0] > 0; }).map(function (p, i, arr) {
      return '<i class="' + (i < arr.length - 1 ? 'part' : '') + '" style="width:' + (p[0] / (max || 1) * 100) + '%;background:' + p[1] + '"></i>';
    }).join('') : '<i style="width:' + w + '%;background:' + color + '"></i>';
    return '<div class="hbar"><span class="lab">' + esc(label) + '</span><span class="track">' + inner + '</span><span class="val">' + num(value, 0) + ' L</span></div>';
  }

  function chrome() {
    document.title = L('pageTitle');
    $('brandSub').textContent = L('brandSub');
    $('viewOnly').textContent = L('viewOnly');
  }

  function render() {
    chrome();
    var d = S.data, r = range(), lim = d.limits, acc = account(d, r), days = perDay(d, acc);
    var readDays = {}; acc.rd.forEach(function (x) { readDays[x.date] = 1; }); d.runs.forEach(function (x) { readDays[x.start.slice(0, 10)] = 1; });
    var ranDays = Object.keys(days).filter(function (k) { return k >= r.from && k <= r.to && days[k].h > 0.01; });
    var runsIn = d.runs.filter(function (x) { return x.start.slice(0, 10) >= r.from && x.start.slice(0, 10) <= r.to; }).sort(function (a, b) { return b.start.localeCompare(a.start); });
    var lphAvg = acc.fuelHours >= 2 ? acc.used / acc.fuelHours : null;

    // period picker: last 30 / 90 days and the months that have data
    var months = {}, m0 = ymd(new Date(Date.now() - 365 * 86400000)).slice(0, 7);
    acc.rd.forEach(function (x) { if (x.date.slice(0, 7) >= m0) months[x.date.slice(0, 7)] = 1; });
    d.runs.forEach(function (x) { if (x.start.slice(0, 7) >= m0) months[x.start.slice(0, 7)] = 1; });
    var h = '<h1 style="margin:4px 0 2px">' + esc(L('title')) + '</h1><p class="sub">' + esc(d.name) + ' · ' + esc(d.asset) + ' · ' + esc(L('tank', { n: lim.tankLitres })) + '. ' + esc(L('intro')) + '</p>';
    h += '<div class="period" id="period">' + ['last30', 'last90'].map(function (x) { return '<button type="button" class="chip' + (S.period === x ? ' on' : '') + '" data-p="' + x + '">' + esc(L(x)) + '</button>'; }).join('') +
      Object.keys(months).sort().reverse().map(function (k) { return '<button type="button" class="chip' + (S.period === k ? ' on' : '') + '" data-p="' + k + '">' + esc(monthL(new Date(k + '-01T00:00:00'))) + '</button>'; }).join('') +
      '<span class="actions"><button type="button" class="btn sm ghost" id="pdf">' + esc(L('print')) + '</button><button type="button" class="btn sm ghost" id="csv">' + esc(L('csv')) + '</button></span></div>';
    h += '<p class="sub" style="margin-top:6px"><b>' + esc(r.label) + '</b> · ' + esc(L('fromTo', { a: dayL(r.from), b: dayL(r.to) })) + '</p>';

    h += '<div class="tiles4">' +
      stat(L('hoursRun'), num(acc.hoursRun, 1), 'h', esc(hm(acc.hoursRun))) +
      stat(L('daysRan'), ranDays.length, '', esc(runsIn.length === 1 ? L('runTimed') : L('runsTimed', { n: runsIn.length }))) +
      stat(L('filled'), num(acc.filled, 0), 'L', esc(acc.refills.length === 1 ? L('refill1') : L('refills', { n: acc.refills.length }))) +
      stat(L('perHour'), lphAvg === null ? '—' : num(lphAvg, 1), lphAvg === null ? '' : 'L/h', esc(L('normal', { a: lim.lphMin, b: lim.lphMax }))) + '</div>';

    // fuel accounting
    var max = Math.max(acc.filled, acc.used, acc.expected, 1);
    var explainedUsed = Math.max(0, acc.used - acc.unexplained);
    h += '<h2>' + esc(L('qTitle')) + '</h2><p class="sub">' + esc(L('qSub', { t: lim.tankLitres, e: lim.lphExpected })) + '</p><div class="panel">';
    if (!acc.pairs.length) h += '<div class="verdict info"><span class="ic">ℹ️</span><span>' + esc(L('notEnough')) + '</span></div>';
    else {
      h += hbar(L('filled'), acc.filled, max, 'var(--neutral)') +
        hbar(L('used'), acc.used, max, null, [[explainedUsed, 'var(--series-1)'], [acc.unexplained, 'var(--bad)']]) +
        hbar(L('expectedFor', { h: num(acc.fuelHours, 1) }), acc.expected, max, '#86b6ef');
      h += '<div class="keyrow"><span><i style="background:var(--series-1)"></i>' + esc(L('kMatch')) + '</span><span><i style="background:var(--bad)"></i>' + esc(L('kNot')) + '</span>' +
        '<span><i style="background:#86b6ef"></i>' + esc(L('kExp')) + '</span><span><i style="background:var(--neutral)"></i>' + esc(L('kFill')) + '</span></div>';
      h += acc.unexplained >= 20
        ? '<div class="verdict bad"><span class="ic">⚠️</span><span><b>' + esc(L('vBad', { n: num(acc.unexplained, 0) })) + '</b> ' + esc(L('vBad2')) + '</span></div>'
        : '<div class="verdict good"><span class="ic">✓</span><span><b>' + esc(L('vGood')) + '</b> ' + esc(L('vGood2', { a: lim.lphMin, b: lim.lphMax })) + '</span></div>';
      if (acc.pairs.some(function (p) { return p.missingRefill; })) h += '<div class="verdict info"><span class="ic">ℹ️</span><span>' + esc(L('vRefill')) + '</span></div>';
    }
    h += '</div>';

    // calendar + tank
    h += '<div class="grid2c wide-left" style="margin-top:12px"><div class="panel"><h3>' + esc(L('calTitle')) + '</h3><div class="cap">' + esc(L('calCap')) + '</div>' + calendar(r, days, readDays) + '</div>' +
      '<div class="panel"><h3>' + esc(L('tankNow')) + '</h3><div class="cap">' + esc(d.stats.fuelDate ? L('readOn', { d: dayL(d.stats.fuelDate) }) : L('noFuel')) + '</div>' +
      (d.stats.fuelPct !== undefined && d.stats.fuelPct !== null ? '<div class="tank">' + tankSvg(d.stats.fuelPct, lim.fuelLowPct) + '<div class="facts"><div><b>' +
        esc(L('litresOf', { l: num(d.stats.fuelLitres, 0), t: lim.tankLitres })) + '</b></div><div>' + esc(L('redLine', { p: lim.fuelLowPct })) + '</div></div></div>' : '<div class="empty-note">—</div>') + '</div></div>';
    h += '<div class="panel" style="margin-top:12px"><h3>' + esc(L('overTime')) + '</h3><div class="cap">' + esc(L('greyLines')) + '</div><div class="chart" id="cFuel"></div></div>';

    // runs
    h += '<h2>' + esc(L('runsTitle')) + '</h2><p class="sub">' + esc(L('runsSub')) + '</p><div class="panel"><div class="runs">' +
      (runsIn.length ? runsIn.map(function (x) {
        var s = parseAt(x.start), e = parseAt(x.stop), hrs = Math.max(0, x.hoursStop - x.hoursStart);
        var used = x.fuelStart !== null && x.fuelStop !== null ? (x.fuelStart - x.fuelStop) / 100 * lim.tankLitres : null, lph = used !== null && hrs >= 0.5 ? used / hrs : null;
        var bad = lph !== null && (lph < lim.lphMin || lph > lim.lphMax);
        var dayStart = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime(), left = (s.getTime() - dayStart) / 864e5 * 100, width = Math.min(100 - left, (e - s) / 864e5 * 100);
        return '<div class="run"><div class="when"><b>' + esc(dayMon(s)) + '</b><span>' + esc(x.start.slice(11) + ' – ' + x.stop.slice(11)) + '</span></div>' +
          '<div><div class="tl" title="00:00 – 24:00"><i style="left:' + left + '%;width:' + width + '%"></i></div><div class="meta"><span class="tag' + (x.reason === 'Power cut' ? '' : ' svc') + '">' + esc(reason(x.reason)) + '</span>' +
          esc(L('onMeter', { t: hm(hrs) })) + ' (' + num(x.hoursStart, 2) + ' → ' + num(x.hoursStop, 2) + ' h)' + (x.fuelStart !== null && x.fuelStop !== null ? ' · ' + esc(L('fuel')) + ' ' + x.fuelStart + '% → ' + x.fuelStop + '%' : '') +
          (x.by ? ' · ' + esc(x.by) : '') + (x.note ? ' · ' + esc(x.note) : '') + '</div></div>' +
          '<div class="lph' + (bad ? ' flagtxt' : '') + '">' + (used !== null ? num(used, 0) + ' L' : '—') + '<small>' + (lph !== null ? num(lph, 1) + ' L/h' : '') + '</small></div></div>';
      }).join('') : '<div class="empty-note">' + esc(L('noRuns')) + '</div>') + '</div></div>';

    // alerts (worded by the maintenance system, in English)
    if (d.alerts.length) h += '<h2>' + esc(L('checks')) + '</h2>' + (si() ? '<p class="sub">' + esc(L('checksNote')) + '</p>' : '') +
      d.alerts.map(function (a) { return '<div class="flag ' + a.tone + '"><span>' + (a.tone === 'bad' ? '⛔' : '⚠️') + '</span><span><b>' + esc(a.title) + '</b>' + (a.detail ? ' – ' + esc(a.detail) : '') + '</span></div>'; }).join('');

    // log table
    var rows = logRows(d, r, acc), cols = L('cols');
    h += '<h2>' + esc(L('logTitle')) + '</h2><p class="sub">' + esc(L('logSub')) + '</p><div class="panel scroll-x"><table class="var log"><thead><tr>' +
      cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (x) {
        return '<tr><td>' + esc(x.when) + '</td><td class="ev">' + esc(x.kind) + '</td><td>' + esc(x.meter) + '</td><td>' + esc(x.fuel) + '</td><td>' + esc(x.litres) + '</td><td class="ev">' + esc(x.by) + '</td><td class="note">' +
          (x.flag ? '<span class="flagtxt">⚠ ' + esc(x.flag) + '</span> ' : '') + esc(x.note) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="ev">' + esc(L('noEntries')) + '</td></tr>') + '</tbody></table></div>';
    h += '<p class="sub" style="margin-top:16px">' + esc(L('footer', { t: (si() ? dayL(ymd(new Date(d.now))) + ' ' + new Date(d.now).toTimeString().slice(0, 5) : new Date(d.now).toLocaleString('en-GB')) })) + '</p>';
    $('main').innerHTML = h;
    S.rows = rows;

    var fuelPts = acc.rd.filter(function (x) { return x.fuelPct !== undefined && x.fuelPct !== null && x.date <= r.to; }).map(function (x) {
      return { t: x.t, value: x.fuelPct, tip: '<b>' + esc(dayL(x.date)) + ' ' + esc(x.time || '') + '</b><br>' + x.fuelPct + '% ≈ ' + Math.round(x.fuelPct / 100 * lim.tankLitres) + ' L' };
    }).filter(function (p, i, arr) { return new Date(p.t) >= new Date(r.from + 'T00:00:00') || (arr[i + 1] && new Date(arr[i + 1].t) >= new Date(r.from + 'T00:00:00')); });
    line($('cFuel'), fuelPts, { min: 0, max: 100, unit: '%', color: 'var(--series-1)', threshold: lim.fuelLowPct, thresholdLabel: L('lowLbl', { p: lim.fuelLowPct }), title: L('overTime'),
      events: acc.refills.map(function (f) { return { t: f.at ? Date.parse(f.at) : Date.parse(f.date + 'T12:00:00'), label: '+' + num(f.litres, 0) + ' L' }; }) });

    $('period').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b) return;
      S.period = b.getAttribute('data-p'); C.store.set('cmms_genlog_period', S.period); render();
    });
    $('pdf').addEventListener('click', function () { window.print(); });
    $('csv').addEventListener('click', function () {
      var head = cols.slice(0, 6).concat([L('flagCol'), cols[6]]);
      var lines = [head].concat(S.rows.map(function (x) { return [x.when, x.kind, x.meter, x.fuel, x.litres, x.by, x.flag, x.note]; }));
      var csv = lines.map(function (l) { return l.map(function (v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      a.download = 'Generator log ' + r.from + ' to ' + r.to + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    });
  }

  function logRows(d, r, acc) {
    var lim = d.limits, out = [], flagAt = {};
    acc.pairs.forEach(function (p) { if (p.unexplained >= 20) flagAt[p.b.at] = L('flagTxt', { n: num(p.used, 0), a: p.a.date + ' ' + p.a.time, h: num(p.ran, 1) }); });
    acc.rd.forEach(function (x) {
      if (x.date < r.from || x.date > r.to || /^Run GR-/.test(x.note || '')) return;
      out.push({ t: x.t, when: x.date + ' ' + (x.time || ''), kind: L('kRead'), meter: x.hours !== undefined && x.hours !== null ? num(x.hours, 2) + ' h' : '',
        fuel: x.fuelPct !== undefined && x.fuelPct !== null ? x.fuelPct + '% ≈ ' + Math.round(x.fuelPct / 100 * lim.tankLitres) + ' L' : '', litres: '', by: x.by,
        note: (x.note || '').replace(/^From WhatsApp photos? /, 'Photo ').slice(0, 140), flag: flagAt[x.at] || '' });
    });
    d.runs.forEach(function (x) {
      if (x.start.slice(0, 10) < r.from || x.start.slice(0, 10) > r.to) return;
      var hrs = Math.max(0, x.hoursStop - x.hoursStart), used = x.fuelStart !== null && x.fuelStop !== null ? (x.fuelStart - x.fuelStop) / 100 * lim.tankLitres : null;
      out.push({ t: parseAt(x.start).getTime(), when: x.start + ' → ' + x.stop.slice(11), kind: L('kRun') + ' · ' + reason(x.reason), meter: num(x.hoursStart, 2) + ' → ' + num(x.hoursStop, 2) + ' h (' + hm(hrs) + ')',
        fuel: x.fuelStart !== null && x.fuelStop !== null ? x.fuelStart + '% → ' + x.fuelStop + '%' : '', litres: used !== null ? L('litresUsed', { n: num(used, 0) }) : '', by: x.by, note: x.note, flag: '' });
    });
    acc.refills.forEach(function (f) {
      out.push({ t: f.at ? Date.parse(f.at) : Date.parse(f.date + 'T12:00:00'), when: f.date + (f.time ? ' ' + f.time : ''), kind: L('kRefill'), meter: f.hours !== null && f.hours !== undefined ? num(f.hours, 2) + ' h' : '',
        fuel: f.before !== null && f.after !== null ? f.before + '% → ' + f.after + '%' : '', litres: '+' + num(f.litres, 0) + ' L', by: f.by, note: f.note, flag: '' });
    });
    return out.sort(function (a, b) { return b.t - a.t; });
  }

  function load() {
    C.api('genLog', { days: 400 }).then(function (d) { S.data = d; render(); })
      .catch(function (e) { $('main').innerHTML = '<div class="card"><p>' + esc(e.message) + '</p><button class="btn" onclick="location.reload()">' + esc(L('tryAgain')) + '</button></div>'; });
  }

  C.initLangButton();
  document.addEventListener('langchange', function () { chrome(); if (S.data) render(); });
  chrome();
  load();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (S.data) render(); }, 200); });
})();
