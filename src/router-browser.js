'use strict';
/* ============================================================
   정적 빌드용 클라이언트 라우터
   - 서버의 라우팅 · 세션 · 폼 처리를 브라우저에서 동일하게 재현
   - 화면은 src/pages.js 가 만든 HTML 을 그대로 사용 (렌더러 100% 재사용)
   - 경로는 해시 라우팅 (#/achievement) — GitHub Pages 정적 호스팅 대응
   ============================================================ */

var store = require('./store-browser');
var P = require('./pages');

var SESSION_KEY = 'hb-promo-session';
var app = document.getElementById('app');
var flash = null;

/* ---------- 세션 ---------- */
function currentUser() {
  try {
    var code = localStorage.getItem(SESSION_KEY);
    return code ? store.findMember(code) : null;
  } catch (e) { return null; }
}
function setUser(code) {
  try { code ? localStorage.setItem(SESSION_KEY, code) : localStorage.removeItem(SESSION_KEY); }
  catch (e) {}
}

/* ---------- 경로 ---------- */
function path() {
  var h = location.hash.replace(/^#/, '');
  if (!h || h === '/') return '/';
  return h.replace(/\/+$/, '') || '/';
}
function go(to, replace) {
  var target = '#' + (to.charAt(0) === '/' ? to : '/' + to);
  if (replace) location.replace(target); else location.hash = target;
  if (location.hash === target) render();   /* 동일 해시면 hashchange 미발생 */
}

/* ---------- 링크 · 이미지 경로 보정 ----------
   pages.js 는 서버 기준 절대경로(/achievement, /img/...)를 만듭니다.
   정적 배포에서는 해시 경로와 상대 이미지 경로로 바꿔 줍니다. */
function rewrite(htmlText) {
  return htmlText
    .replace(/(src|href)="\/img\//g, '$1="img/')
    .replace(/href="\/#about"/g, 'href="#/"')
    .replace(/href="\/"/g, 'href="#/"')
    .replace(/href="\/([a-zA-Z0-9][^"#]*)"/g, 'href="#/$1"')
    .replace(/action="\/([^"]*)"/g, 'data-action="/$1" action="javascript:void 0"');
}

/* ---------- 렌더 ---------- */
function ctxFor(p) {
  var user = currentUser();
  var f = flash; flash = null;
  return { user: user, flash: f, path: p, query: new URLSearchParams(''), session: {} };
}

function paint(fullDoc) {
  var doc = new DOMParser().parseFromString(rewrite(fullDoc), 'text/html');
  var parts = [];
  ['header.hdr', 'main', 'footer.ftr', '#flash'].forEach(function (sel) {
    var el = doc.querySelector(sel);
    if (el) parts.push(el.outerHTML);
  });
  app.innerHTML = parts.join('\n');
  document.title = doc.title;
  window.scrollTo(0, 0);
  if (window.initApp) window.initApp();
  bindForms();
}

function render() {
  var p = path();
  var user = currentUser();
  var ctx = ctxFor(p);

  /* 로그인 필요 페이지 */
  var guarded = /^\/(achievement|booking|bookings)/.test(p);
  if (guarded && !user) { flash = { msg: '로그인이 필요합니다.', kind: 'err' }; return go('/login', true); }

  if (p === '/') return paint(P.home(ctx));
  if (p === '/login') {
    if (user) return go('/achievement', true);
    return paint(P.login(ctx, { redirect: '/achievement' }));
  }
  if (p === '/logout') {
    setUser(null);
    flash = { msg: '로그아웃되었습니다.', kind: 'ok' };
    return go('/', true);
  }
  if (p === '/destinations') return paint(P.destinations(ctx));
  if (p === '/faq') return paint(P.faqPage(ctx));
  if (p === '/support') return paint(P.support(ctx));
  if (p === '/credits') return paint(P.credits(ctx, (window.__PROMO_DATA.credits || [])));
  if (p === '/achievement') return paint(P.achievement(ctx));
  if (p === '/booking') return paint(P.bookingList(ctx));

  var m = p.match(/^\/booking\/([A-Z0-9]+)$/i);
  if (m) {
    var prod = store.product(m[1].toUpperCase());
    if (!prod) return paint(P.notFound(ctx));
    return paint(P.bookingForm(ctx, prod));
  }

  m = p.match(/^\/bookings$/);
  if (m) return paint(P.bookings(ctx));

  m = p.match(/^\/bookings\/([A-Z0-9]+)$/i);
  if (m) {
    var b = store.booking(m[1].toUpperCase());
    if (!b || b.memberCode !== user.code) return paint(P.notFound(ctx));
    return paint(P.bookingView(ctx, b));
  }

  paint(P.notFound(ctx));
}

/* ---------- 폼 처리 (서버 POST 핸들러와 동일한 규칙) ---------- */
function formData(form) {
  var out = {};
  new FormData(form).forEach(function (v, k) { out[k] = v; });
  return out;
}

function bindForms() {
  app.querySelectorAll('form[data-action]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.defaultPrevented && form.__blocked) return;
      handleSubmit(form.getAttribute('data-action'), formData(form), form);
    });
  });
  /* 예약 취소 버튼 (form 안의 submit) */
}

function handleSubmit(action, f, form) {
  /* 로그인 */
  if (action === '/login') {
    var m = store.authenticate(f.username, f.password);
    if (!m) {
      var ctx = ctxFor('/login');
      return paint(P.login(ctx, {
        error: '구성원코드 또는 비밀번호가 올바르지 않습니다. 비밀번호는 생년월일 6자리(YYMMDD)입니다.',
        username: f.username, redirect: '/achievement'
      }));
    }
    setUser(m.code);
    flash = { msg: m.name + ' 님, 환영합니다.', kind: 'ok' };
    return go('/achievement');
  }

  /* 문의 */
  if (action === '/support') {
    flash = { msg: '문의가 접수되었습니다. (데모 — 실제 발송되지 않습니다)', kind: 'ok' };
    return go('/support');
  }

  /* 예약 취소 */
  var mc = action.match(/^\/bookings\/([A-Z0-9]+)\/cancel$/i);
  if (mc) {
    var user = currentUser();
    var b = store.cancelBooking(mc[1].toUpperCase(), user.code);
    flash = b
      ? { msg: '예약이 취소되었습니다. 업적금액이 복원되었습니다.', kind: 'ok' }
      : { msg: '취소할 수 없는 예약입니다.', kind: 'err' };
    return go(b ? '/bookings/' + b.no : '/bookings');
  }

  /* 예약 생성 */
  var mb = action.match(/^\/booking\/([A-Z0-9]+)$/i);
  if (mb) {
    var u = currentUser();
    var p = store.product(mb[1].toUpperCase());
    if (!p) return;
    var budget = store.budgetOf(u.code);
    var isCancel = p.code === store.cancelProduct.code;
    var pax = isCancel ? 1 : Math.max(1, Math.min(4, parseInt(f.pax, 10) || 1));

    if (!f.agree) { flash = { msg: '동의 항목을 체크해 주세요.', kind: 'err' }; return go('/booking/' + p.code); }
    if (!isCancel && p.price > budget) {
      flash = { msg: '보유 업적금액이 부족하여 신청할 수 없습니다.', kind: 'err' };
      return go('/booking/' + p.code);
    }

    var total = p.price * pax;
    var round = isCancel ? null : (p.rounds.filter(function (r) { return r.code === f.round; })[0] || p.rounds[0]);
    var travelers = [];
    if (!isCancel) {
      for (var i = 0; i < pax; i++) {
        travelers.push({
          name: (f['t' + i + '_name'] || '').trim(),
          birth: (f['t' + i + '_birth'] || '').trim(),
          phone: (f['t' + i + '_phone'] || '').trim(),
          sex: (f['t' + i + '_sex'] || '').trim(),
          ln: (f['t' + i + '_ln'] || '').trim().toUpperCase(),
          fn: (f['t' + i + '_fn'] || '').trim().toUpperCase(),
          pp: (f['t' + i + '_pp'] || '').trim().toUpperCase(),
          ppexp: (f['t' + i + '_ppexp'] || '').trim(),
          nat: (f['t' + i + '_nat'] || '대한민국').trim(),
          room: (f['t' + i + '_room'] || '').trim()
        });
      }
    }

    var rec = store.createBooking({
      memberCode: u.code, memberName: u.name, memberGa: u.ga, memberBranch: u.branch,
      productCode: p.code, productName: p.name,
      roundLabel: round ? round.label : '현금 환급',
      roundRange: round ? round.range : '-',
      pax: pax,
      usedPoint: isCancel ? 0 : Math.min(total, budget),
      cashDue: isCancel ? 0 : Math.max(0, total - budget),
      memo: (f.memo || '').trim(),
      travelers: travelers
    });

    flash = {
      msg: isCancel ? '현금 환급 신청이 접수되었습니다.' : '신청이 완료되었습니다. 예약번호 ' + rec.no,
      kind: 'ok'
    };
    return go('/bookings/' + rec.no);
  }
}

/* ---------- 시작 ---------- */
window.addEventListener('hashchange', render);
if (!location.hash) location.replace('#/');
render();
