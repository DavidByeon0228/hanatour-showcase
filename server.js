'use strict';
/* ============================================================
   2027 한빛생명 GA 해외여행 프로모션 — 로컬 테스트 서버
   외부 의존성 없이 Node 기본 모듈만 사용합니다.
     실행:  node server.js        (기본 포트 4000)
            node server.js 5000   (포트 지정)
   ============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const store = require('./src/store');
const P = require('./src/pages');

const PORT = Number(process.argv[2] || process.env.PORT || 4000);
const PUBLIC = path.join(__dirname, 'public');

/* ---------- 세션 (메모리) ---------- */
const sessions = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 6;

function getSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let sid = cookies.sid;
  let s = sid && sessions.get(sid);
  if (!s || Date.now() - s.touched > SESSION_TTL) {
    sid = crypto.randomBytes(18).toString('hex');
    s = { id: sid, memberCode: null, flash: null, touched: Date.now() };
    sessions.set(sid, s);
    res.setHeader('Set-Cookie', `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  }
  s.touched = Date.now();
  return s;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/* ---------- 요청 본문 ---------- */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > 1e6) { req.destroy(); reject(new Error('본문이 너무 큽니다')); }
    });
    req.on('end', () => {
      const out = {};
      new URLSearchParams(raw).forEach((v, k) => { out[k] = v; });
      resolve(out);
    });
    req.on('error', reject);
  });
}

/* ---------- 응답 헬퍼 ---------- */
function html(res, body, status) {
  res.writeHead(status || 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}
function redirect(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}

/* ---------- 정적 파일 ---------- */
const MIME = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2'
};

function serveStatic(pathname, res) {
  const rel = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) { html(res, 'Forbidden', 403); return true; }
  let st;
  try { st = fs.statSync(file); } catch (e) { return false; }
  if (!st.isFile()) return false;
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': ext === '.css' || ext === '.js' ? 'no-cache' : 'public, max-age=3600'
  });
  fs.createReadStream(file).pipe(res);
  return true;
}

/* ---------- 컨텍스트 ---------- */
function makeCtx(req, res, url) {
  const s = getSession(req, res);
  const user = s.memberCode ? store.findMember(s.memberCode) : null;
  const flash = s.flash; s.flash = null;
  return { session: s, user, flash, path: url.pathname, query: url.searchParams };
}
function requireLogin(ctx, res, url) {
  if (ctx.user) return false;
  redirect(res, '/login?redirect=' + encodeURIComponent(url.pathname));
  return true;
}

/* ---------- 예약 생성 ---------- */
function buildTravelers(form, pax) {
  const out = [];
  for (let i = 0; i < pax; i++) {
    out.push({
      name:  (form['t' + i + '_name'] || '').trim(),
      birth: (form['t' + i + '_birth'] || '').trim(),
      phone: (form['t' + i + '_phone'] || '').trim(),
      sex:   (form['t' + i + '_sex'] || '').trim(),
      ln:    (form['t' + i + '_ln'] || '').trim().toUpperCase(),
      fn:    (form['t' + i + '_fn'] || '').trim().toUpperCase(),
      pp:    (form['t' + i + '_pp'] || '').trim().toUpperCase(),
      ppexp: (form['t' + i + '_ppexp'] || '').trim(),
      nat:   (form['t' + i + '_nat'] || '대한민국').trim(),
      room:  (form['t' + i + '_room'] || '').trim()
    });
  }
  return out;
}

/* ---------- 라우터 ---------- */
async function route(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  /* 정적 자산 우선 */
  if (/^\/(css|js|img)\//.test(pathname)) {
    if (serveStatic(pathname, res)) return;
  }

  const ctx = makeCtx(req, res, url);
  const method = req.method.toUpperCase();

  /* ---- 공개 페이지 ---- */
  if (pathname === '/' && method === 'GET') return html(res, P.home(ctx));

  if (pathname === '/login') {
    if (method === 'GET') {
      if (ctx.user) return redirect(res, '/achievement');
      return html(res, P.login(ctx, { redirect: url.searchParams.get('redirect') || '/achievement' }));
    }
    if (method === 'POST') {
      const form = await readBody(req);
      const m = store.authenticate(form.username, form.password);
      if (!m) {
        return html(res, P.login(ctx, {
          error: '구성원코드 또는 비밀번호가 올바르지 않습니다. 비밀번호는 생년월일 6자리(YYMMDD)입니다.',
          username: form.username,
          redirect: form.redirect
        }), 401);
      }
      ctx.session.memberCode = m.code;
      ctx.session.flash = { msg: `${m.name} 님, 환영합니다.`, kind: 'ok' };
      const to = (form.redirect || '/achievement');
      return redirect(res, to.startsWith('/') ? to : '/achievement');
    }
  }

  if (pathname === '/logout') {
    ctx.session.memberCode = null;
    ctx.session.flash = { msg: '로그아웃되었습니다.', kind: 'ok' };
    return redirect(res, '/');
  }

  if (pathname === '/destinations' && method === 'GET') return html(res, P.destinations(ctx));
  if (pathname === '/faq' && method === 'GET') return html(res, P.faqPage(ctx));

  if (pathname === '/support') {
    if (method === 'GET') return html(res, P.support(ctx));
    if (method === 'POST') {
      await readBody(req);
      ctx.session.flash = { msg: '문의가 접수되었습니다. (데모 — 실제 발송되지 않습니다)', kind: 'ok' };
      return redirect(res, '/support');
    }
  }

  if (pathname === '/credits' && method === 'GET') {
    let list = [];
    try { list = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'img', 'CREDITS.json'), 'utf8')); } catch (e) {}
    return html(res, P.credits(ctx, list));
  }

  /* ---- 회원 전용 ---- */
  if (pathname === '/achievement' && method === 'GET') {
    if (requireLogin(ctx, res, url)) return;
    return html(res, P.achievement(ctx));
  }

  if (pathname === '/booking' && method === 'GET') {
    if (requireLogin(ctx, res, url)) return;
    return html(res, P.bookingList(ctx));
  }

  const mBooking = pathname.match(/^\/booking\/([A-Z0-9]+)$/i);
  if (mBooking) {
    if (requireLogin(ctx, res, url)) return;
    const p = store.product(mBooking[1].toUpperCase());
    if (!p) return html(res, P.notFound(ctx), 404);

    if (method === 'GET') return html(res, P.bookingForm(ctx, p));

    if (method === 'POST') {
      const form = await readBody(req);
      const budget = store.budgetOf(ctx.user.code);
      const isCancel = p.code === store.cancelProduct.code;
      const pax = isCancel ? 1 : Math.max(1, Math.min(4, parseInt(form.pax, 10) || 1));

      if (!form.agree) {
        ctx.session.flash = { msg: '동의 항목을 체크해 주세요.', kind: 'err' };
        return redirect(res, '/booking/' + p.code);
      }
      if (!isCancel && p.price > budget) {
        ctx.session.flash = { msg: '보유 업적금액이 부족하여 신청할 수 없습니다.', kind: 'err' };
        return redirect(res, '/booking/' + p.code);
      }

      const total = p.price * pax;
      const usedPoint = isCancel ? 0 : Math.min(total, budget);
      const cashDue = isCancel ? 0 : Math.max(0, total - budget);
      const round = isCancel ? null : (p.rounds.find(r => r.code === form.round) || p.rounds[0]);

      const rec = store.createBooking({
        memberCode: ctx.user.code,
        memberName: ctx.user.name,
        memberGa: ctx.user.ga,
        memberBranch: ctx.user.branch,
        productCode: p.code,
        productName: p.name,
        roundLabel: round ? round.label : '현금 환급',
        roundRange: round ? round.range : '-',
        pax,
        usedPoint,
        cashDue,
        memo: (form.memo || '').trim(),
        travelers: isCancel ? [] : buildTravelers(form, pax)
      });

      ctx.session.flash = {
        msg: isCancel ? '현금 환급 신청이 접수되었습니다.' : `신청이 완료되었습니다. 예약번호 ${rec.no}`,
        kind: 'ok'
      };
      return redirect(res, '/bookings/' + rec.no);
    }
  }

  if (pathname === '/bookings' && method === 'GET') {
    if (requireLogin(ctx, res, url)) return;
    return html(res, P.bookings(ctx));
  }

  const mCancel = pathname.match(/^\/bookings\/([A-Z0-9]+)\/cancel$/i);
  if (mCancel && method === 'POST') {
    if (requireLogin(ctx, res, url)) return;
    const b = store.cancelBooking(mCancel[1].toUpperCase(), ctx.user.code);
    ctx.session.flash = b
      ? { msg: '예약이 취소되었습니다. 업적금액이 복원되었습니다.', kind: 'ok' }
      : { msg: '취소할 수 없는 예약입니다.', kind: 'err' };
    return redirect(res, b ? '/bookings/' + b.no : '/bookings');
  }

  const mView = pathname.match(/^\/bookings\/([A-Z0-9]+)$/i);
  if (mView && method === 'GET') {
    if (requireLogin(ctx, res, url)) return;
    const b = store.booking(mView[1].toUpperCase());
    if (!b || b.memberCode !== ctx.user.code) return html(res, P.notFound(ctx), 404);
    return html(res, P.bookingView(ctx, b));
  }

  return html(res, P.notFound(ctx), 404);
}

/* ---------- 시작 ---------- */
const server = http.createServer((req, res) => {
  route(req, res).catch(err => {
    console.error('[error]', req.method, req.url, err);
    if (!res.headersSent) html(res, '<h1>500 Internal Server Error</h1><pre>' + String(err && err.stack) + '</pre>', 500);
    else res.end();
  });
});

server.listen(PORT, () => {
  const ev = store.event;
  console.log('');
  console.log('  ' + ev.title);
  console.log('  ─────────────────────────────────────────────');
  console.log('  로컬 서버 실행 중 →  http://localhost:' + PORT);
  console.log('');
  console.log('  테스트 계정   guest / guest');
  console.log('               ' + store.members()[0].code + ' / ' + store.members()[0].birth + '  (' + store.members()[0].name + ')');
  console.log('  등록 회원     ' + store.members().length + '명   여행지 ' + store.products.length + '개');
  console.log('');
  console.log('  디자인 전환   1~5 테마 · [ ] 순환 · D 명암 · C 밀도 · M 모션 · ? 도움말');
  console.log('               (우측 하단 팔레트 버튼 클릭 또는 버튼 위에서 마우스 휠)');
  console.log('');
  console.log('  종료: Ctrl + C');
  console.log('');
});
