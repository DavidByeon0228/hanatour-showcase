'use strict';
/* 페이지 렌더러 */

const store = require('./store');
const H = require('./html');
const { esc, won, num, fmtDate, page, pageHero, productCard } = H;
const EV = store.event;

const WINDOW_LABEL = {
  before: ['접수 예정', 'badge-warn'],
  open:   ['접수 중', 'badge-ok'],
  closed: ['접수 마감', 'badge-muted']
};

function windowNotice() {
  const w = store.applyWindow();
  const period = `${fmtDate(EV.applyOpen, true)} ~ ${fmtDate(EV.applyClose, true)}`;
  if (w === 'open')  return `<div class="note"><i>🟢</i><div><b>여행 신청 접수 중입니다.</b><br>접수 기간 ${period}</div></div>`;
  if (w === 'before') return `<div class="note note-warn"><i>🕒</i><div><b>아직 접수 시작 전입니다.</b><br>접수 기간 ${period}</div></div>`;
  return `<div class="note note-danger"><i>🔒</i><div><b>접수가 마감되었습니다.</b><br>접수 기간이었던 ${period} 이후에는 신청 및 변경이 불가합니다.<br>
    <span class="dim">※ 데모 사이트에서는 마감 이후에도 신청 흐름을 테스트할 수 있도록 열어 두었습니다.</span></div></div>`;
}

/* ============================ 1. 랜딩 ============================ */
function home(ctx) {
  const s = store.stats();
  const [wLabel, wClass] = WINDOW_LABEL[store.applyWindow()];

  const body = `
<section class="hero">
  <div class="hero-bg"><img src="/img/hero.jpg" alt=""></div>
  <div class="wrap hero-in">
    <span class="eyebrow">${esc(EV.clientEn)} · ${esc(EV.season)}</span>
    <h1 class="hero-title mt-3">${esc(EV.season)}<br>${esc(EV.client)}<br>GA 해외여행 프로모션</h1>
    <p class="hero-sub">하반기 업적을 달성하신 ${esc(EV.client)} 파트너 여러분을 6개 여행지로 초대합니다.
      업적금액 범위 내에서 원하시는 여행지를 직접 선택하세요.</p>
    <div class="hero-meta">
      <div><small>Apply</small><b>${fmtDate(EV.applyOpen).slice(5)} ~ ${fmtDate(EV.applyClose).slice(5)}</b></div>
      <div><small>Destinations</small><b>${s.destinationCount}개 여행지</b></div>
      <div><small>Operated by</small><b>${esc(EV.agency)}</b></div>
    </div>
    <div class="hero-cta">
      <a class="btn btn-lg" href="${ctx.user ? '/achievement' : '/login'}">
        ${ctx.user ? '나의 업적 현황 보기' : '여행신청 바로가기'}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </a>
      <a class="btn btn-lg btn-on-media" href="/destinations">여행지 미리보기</a>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="wrap">
    <div class="section-head center reveal">
      <span class="eyebrow">Overview</span>
      <h2 class="h-lg mt-2">프로모션 한눈에 보기</h2>
      <p>업적 산정 기준일은 ${fmtDate(EV.baseDate)}이며, 확정된 업적금액 범위 안에서 여행지를 선택하실 수 있습니다.</p>
    </div>
    <div class="grid grid-4 reveal" data-delay="80">
      <div class="stat"><small>Members</small><b><span data-count="${s.memberCount}">0</span><span class="unit">명</span></b></div>
      <div class="stat"><small>Destinations</small><b><span data-count="${s.destinationCount}">0</span><span class="unit">개</span></b></div>
      <div class="stat"><small>Total Seats</small><b><span data-count="${s.seats}">0</span><span class="unit">석</span></b></div>
      <div class="stat"><small>Avg. Achievement</small><b><span data-count="${s.avgAchieved}">0</span><span class="unit">원</span></b></div>
    </div>
    <div class="mt-4 reveal" data-delay="140">${windowNotice()}</div>
  </div>
</section>

<section class="section-sm">
  <div class="wrap">
    <div class="section-head reveal">
      <span class="eyebrow">Destinations</span>
      <h2 class="h-lg mt-2">6개 여행지</h2>
      <p>모든 일정은 왕복 항공, 호텔, 전 일정 가이드가 포함된 패키지로 운영됩니다.</p>
    </div>
    <div class="grid grid-3">
      ${store.products.map((p, i) => `<div class="reveal" data-delay="${i * 70}">${productCard(p, { href: '/destinations#' + p.slug })}</div>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="grid grid-2" style="align-items:start">
      <div class="reveal">
        <span class="eyebrow">Process</span>
        <h2 class="h-md mt-2 mb-3">신청 절차</h2>
        <ul class="timeline">
          <li><b>STEP 01</b><span>구성원코드 8자리 + 생년월일 6자리로 로그인</span></li>
          <li><b>STEP 02</b><span>[나의 업적 현황]에서 확정 업적금액과 잔여금액 확인</span></li>
          <li><b>STEP 03</b><span>업적금액 범위 내 여행지 · 출발 차수 선택</span></li>
          <li><b>STEP 04</b><span>참가자 전원의 여권 정보 입력 후 신청 완료</span></li>
          <li><b>STEP 05</b><span>[예약조회]에서 내역 확인 · 변경 · 취소</span></li>
        </ul>
      </div>
      <div class="card reveal" data-delay="120">
        <h3 class="h-sm mb-3">꼭 확인해 주세요</h3>
        <ul class="stack" style="--u:8px">
          <li class="tick">업적금액과 현금의 혼합 결제는 허용되지 않습니다. 보유 업적금액이 여행지 기준 금액 미만이면 신청할 수 없습니다.</li>
          <li class="tick">여행 신청 후 남은 잔여 업적금액은 ${esc(EV.client)}을 통해 현금으로 지급됩니다.</li>
          <li class="tick">동반자 비용은 업적금액 사용이 가능하며, 부족분은 현금 결제로 처리됩니다.</li>
          <li class="tick no">여행 출발 시점에 해촉 · 실효 · 보험료 미입금 사유 발생 시 여행이 제한될 수 있습니다.</li>
          <li class="tick no">항공 · 호텔 좌석 상황에 따라 차수별로 조기 마감될 수 있습니다.</li>
        </ul>
        <div class="mt-4"><a class="btn btn-block" href="${ctx.user ? '/booking' : '/login'}">여행 신청하러 가기</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section-sm">
  <div class="wrap">
    <div class="card text-center" style="padding:calc(var(--u)*6)">
      <span class="eyebrow" style="justify-content:center">Design Playground</span>
      <h2 class="h-md mt-2">디자인을 바꿔가며 살펴보세요</h2>
      <p class="muted mt-2" style="max-width:60ch;margin-inline:auto">
        이 사이트는 5가지 테마 × 라이트/다크 × 레이아웃 밀도 조합으로 즉시 전환됩니다.
        우측 하단 팔레트 버튼을 클릭하거나 아래 단축키를 눌러 보세요.</p>
      <div class="row mt-4" style="justify-content:center;gap:10px">
        <span><span class="kbd">1</span>~<span class="kbd">5</span> 테마</span>
        <span><span class="kbd">[</span><span class="kbd">]</span> 순환</span>
        <span><span class="kbd">D</span> 명암</span>
        <span><span class="kbd">C</span> 밀도</span>
        <span><span class="kbd">M</span> 모션</span>
        <span><span class="kbd">?</span> 도움말</span>
      </div>
    </div>
  </div>
</section>`;
  return page(ctx, { body });
}

/* ============================ 2. 로그인 ============================ */
function login(ctx, opts) {
  opts = opts || {};
  const demo = store.members().slice(0, 4);
  const body = `
<section class="section">
  <div class="wrap" style="max-width:1020px">
    <div class="grid" style="grid-template-columns:1.05fr .95fr;gap:calc(var(--u)*4);align-items:start">
      <div class="card">
        <span class="eyebrow">Member Login</span>
        <h1 class="h-md mt-2 mb-1">로그인</h1>
        <p class="muted" style="font-size:var(--fs-14)">
          아이디는 <b>${esc(EV.client)} 구성원코드 8자리</b>, 비밀번호는 <b>본인 생년월일 6자리(YYMMDD)</b>입니다.</p>

        ${opts.error ? `<div class="note note-danger mt-3"><i>⚠️</i><div>${esc(opts.error)}</div></div>` : ''}

        <form method="post" action="/login" class="mt-4">
          <input type="hidden" name="redirect" value="${esc(opts.redirect || '/achievement')}">
          <label class="field">
            <span class="label">구성원코드 <span class="req">*</span></span>
            <input class="input" name="username" inputmode="numeric" autocomplete="username"
                   placeholder="예: 20250101" value="${esc(opts.username || '')}" required autofocus>
          </label>
          <label class="field">
            <span class="label">비밀번호 (생년월일 6자리) <span class="req">*</span></span>
            <input class="input" name="password" type="password" inputmode="numeric"
                   autocomplete="current-password" placeholder="예: 880312" required>
          </label>
          <button class="btn btn-lg btn-block mt-4" type="submit">로그인</button>
        </form>
        <p class="hint mt-3">비밀번호가 기억나지 않으시면 전담고객센터(${esc(EV.tel[0])})로 문의해 주세요.</p>
      </div>

      <div class="card">
        <span class="eyebrow">Test Accounts</span>
        <h2 class="h-sm mt-2 mb-1">데모 계정</h2>
        <p class="muted" style="font-size:var(--fs-14)">테스트용 가상 회원 ${store.members().length}명이 등록되어 있습니다. 아래를 클릭하면 자동으로 입력됩니다.</p>
        <div class="stack mt-3" style="--u:6px">
          ${demo.map(m => `
            <button type="button" class="btn btn-ghost btn-block" data-fill="${esc(m.code)}/${esc(m.birth)}"
              style="justify-content:space-between;font-weight:600">
              <span>${esc(m.name)} <span class="dim" style="font-weight:400">${esc(m.ga)} · ${esc(m.rank)}</span></span>
              <span class="mono dim">${esc(m.code)} / ${esc(m.birth)}</span>
            </button>`).join('')}
          <button type="button" class="btn btn-ghost btn-block" data-fill="guest/guest"
            style="justify-content:space-between;font-weight:600">
            <span>게스트 로그인</span><span class="mono dim">guest / guest</span>
          </button>
        </div>
        <hr class="divider">
        <p class="dim" style="font-size:var(--fs-12);line-height:1.8">
          전체 회원 명단은 구글 시트에서 관리되며, 로컬 서버는 <code class="mono">data/members.csv</code>를 읽습니다.
          시트를 CSV로 내려받아 덮어쓰면 즉시 반영됩니다.</p>
      </div>
    </div>
  </div>
</section>
<style>@media(max-width:860px){.wrap .grid[style*="1.05fr"]{grid-template-columns:1fr!important}}</style>`;
  return page(ctx, { title: '로그인', body });
}

/* ============================ 3. 나의 업적 현황 ============================ */
function achievement(ctx) {
  const m = ctx.user;
  const budget = store.budgetOf(m.code);
  const usedRate = m.paid ? Math.min(100, Math.round(((m.paid - budget) / m.paid) * 100)) : 0;
  const active = store.bookingsOf(m.code).filter(b => b.status === 'CONFIRMED');

  const cards = store.products.map((p, i) => {
    const locked = p.price > budget;
    return `<div class="reveal" data-delay="${i * 60}">${productCard(p, { locked, href: locked ? '/booking' : '/booking/' + p.code })}</div>`;
  }).join('');

  const body = `
${pageHero('My Achievement',
  `안녕하세요, <span style="color:var(--brand)">${esc(m.name)}</span> 님`,
  `${esc(EV.season)} ${esc(EV.client)} GA 해외여행 프로모션 달성을 축하드립니다. 아래에서 여행지를 선택해 주세요.`,
  `<div class="row mt-3">
     <span class="tier tier-${esc(m.tier)}">${esc(m.tier)}</span>
     <span class="badge badge-muted">${esc(m.ga)}</span>
     <span class="badge badge-muted">${esc(m.branch)}</span>
     <span class="badge badge-muted">${esc(m.rank)}</span>
   </div>`)}

<section class="section-sm"><div class="wrap">
  <div class="card">
    <div class="row-between mb-3">
      <div><span class="eyebrow">Achievement</span><h2 class="h-md mt-2">하반기 합산업적</h2></div>
      <div class="text-center">
        <div class="h-lg num" style="color:var(--brand)">${num(m.achieved)}<span style="font-size:var(--fs-20)">원</span></div>
        <small class="dim">${fmtDate(EV.baseDate)} 기준</small>
      </div>
    </div>
    <div class="gauge mb-2"><i data-w="${usedRate}"></i></div>
    <div class="row-between" style="font-size:var(--fs-13)">
      <span class="dim">사용 ${won(m.paid - budget)}</span>
      <span class="dim">${usedRate}% 사용</span>
      <span class="dim">전체 ${won(m.paid)}</span>
    </div>
    <div class="grid grid-3 mt-4">
      <div class="stat"><small>지급금액</small><b class="num">${num(m.paid)}<span class="unit">원</span></b></div>
      <div class="stat"><small>사용금액</small><b class="num" style="color:var(--warn)">${num(m.paid - budget)}<span class="unit">원</span></b></div>
      <div class="stat"><small>사용 가능 잔액</small><b class="num" style="color:var(--brand-2)">${num(budget)}<span class="unit">원</span></b></div>
    </div>
    <div class="note note-warn mt-4"><i>ℹ️</i><div>
      상기 업적은 <b>${fmtDate(EV.baseDate)}</b> 기준이며, 여행 출발 시점에 해촉 등의 사유가 발생하면 여행이 불가할 수 있습니다.
      여행 신청 후 잔여 업적금액은 ${esc(EV.client)}을 통해 현금으로 지급될 예정입니다.
    </div></div>
  </div>

  ${active.length ? `
  <div class="card mt-3">
    <div class="row-between mb-3"><h3 class="h-sm">진행 중인 신청 ${active.length}건</h3>
      <a class="btn btn-sm btn-ghost" href="/bookings">예약조회</a></div>
    ${active.map(b => `<div class="row-between" style="padding:12px 0;border-top:1px solid var(--line)">
      <div><span class="mono dim" style="font-size:var(--fs-12)">${esc(b.no)}</span>
        <div><b>${esc(b.productName)}</b> <span class="dim">· ${esc(b.roundRange)}</span></div></div>
      <div class="row"><span class="badge badge-ok">신청완료</span>
        <a class="btn btn-sm btn-ghost" href="/bookings/${esc(b.no)}">상세</a></div>
    </div>`).join('')}
  </div>` : ''}
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="section-head"><span class="eyebrow">Choose Your Trip</span>
    <h2 class="h-md mt-2">여행지 선택</h2>
    <p>사용 가능 잔액 <b style="color:var(--brand-2)">${won(budget)}</b> 기준으로 신청 가능한 여행지를 표시합니다.</p></div>
  <div class="grid grid-3">${cards}</div>

  <div class="card mt-4" style="border-style:dashed">
    <div class="row-between">
      <div>
        <h3 class="h-sm mb-1">${esc(store.cancelProduct.name)}</h3>
        <p class="muted" style="font-size:var(--fs-14)">${esc(store.cancelProduct.summary)}</p>
        <p class="dim mt-1" style="font-size:var(--fs-13)">${esc(store.cancelProduct.note)}</p>
      </div>
      <a class="btn btn-ghost" href="/booking/${esc(store.cancelProduct.code)}">현금 환급 신청</a>
    </div>
  </div>
</div></section>`;
  return page(ctx, { title: '나의 업적 현황', body });
}

/* ============================ 4. 여행신청 목록 ============================ */
function bookingList(ctx) {
  const budget = store.budgetOf(ctx.user.code);
  const [wLabel, wClass] = WINDOW_LABEL[store.applyWindow()];
  const body = `
${pageHero('Booking', '여행신청',
  `원하시는 여행지를 선택하면 출발 차수와 참가자 정보를 입력하는 화면으로 이동합니다.`,
  `<div class="row mt-3"><span class="badge ${wClass}">${wLabel}</span>
   <span class="badge badge-muted">사용 가능 잔액 ${won(budget)}</span></div>`)}
<section class="section-sm"><div class="wrap">
  ${windowNotice()}
  <div class="grid grid-3 mt-4">
    ${store.products.map((p, i) => {
      const locked = p.price > budget;
      return `<div class="reveal" data-delay="${i * 60}">${productCard(p, { locked, href: locked ? '#' : '/booking/' + p.code })}</div>`;
    }).join('')}
  </div>
  <div class="card mt-4" style="border-style:dashed">
    <div class="row-between">
      <div><h3 class="h-sm mb-1">${esc(store.cancelProduct.name)}</h3>
        <p class="muted" style="font-size:var(--fs-14)">${esc(store.cancelProduct.summary)}</p></div>
      <a class="btn btn-ghost" href="/booking/${esc(store.cancelProduct.code)}">현금 환급 신청</a>
    </div>
  </div>
</div></section>`;
  return page(ctx, { title: '여행신청', body });
}

/* ============================ 5. 상품 상세 / 신청 폼 ============================ */
function travelerCard(i, member) {
  const self = i === 0;
  const v = (k) => self && member ? esc(member[k] || '') : '';
  return `<div class="card mt-3" data-pax-index="${i}"${i === 0 ? '' : ' hidden'}>
    <div class="row-between mb-3">
      <h3 class="h-sm">여행자 ${i + 1}${self ? ' <span class="badge">본인</span>' : ' <span class="badge badge-muted">동반자</span>'}</h3>
    </div>
    <div class="field-row">
      <label class="field"><span class="label">성명 <span class="req">*</span></span>
        <input class="input" name="t${i}_name" data-required value="${v('name')}" placeholder="홍길동"></label>
      <label class="field"><span class="label">법정 생년월일 <span class="req">*</span></span>
        <input class="input" name="t${i}_birth" data-required value="${v('birth')}" inputmode="numeric" placeholder="YYMMDD (6자리)" maxlength="6"></label>
      <label class="field"><span class="label">연락처 <span class="req">*</span></span>
        <input class="input" name="t${i}_phone" data-required value="${v('phone')}" inputmode="numeric" placeholder="숫자만 입력"></label>
      <label class="field"><span class="label">성별 <span class="req">*</span></span>
        <select class="select" name="t${i}_sex" data-required>
          <option value="">선택</option><option value="M">남성</option><option value="F">여성</option></select></label>
      <label class="field"><span class="label">영문 성 (여권 기준) <span class="req">*</span></span>
        <input class="input" name="t${i}_ln" data-required value="${self && member ? esc((member.nameEn || '').split(' ')[0]) : ''}" placeholder="HONG" style="text-transform:uppercase"></label>
      <label class="field"><span class="label">영문 이름 (여권 기준) <span class="req">*</span></span>
        <input class="input" name="t${i}_fn" data-required value="${self && member ? esc((member.nameEn || '').split(' ').slice(1).join(' ')) : ''}" placeholder="GILDONG" style="text-transform:uppercase"></label>
      <label class="field"><span class="label">여권번호</span>
        <input class="input" name="t${i}_pp" placeholder="M12345678"></label>
      <label class="field"><span class="label">여권 만료일</span>
        <input class="input" name="t${i}_ppexp" type="date"></label>
      <label class="field"><span class="label">국적</span>
        <input class="input" name="t${i}_nat" value="대한민국"></label>
      <label class="field"><span class="label">희망 룸메이트 (예: 홍길동/남)</span>
        <input class="input" name="t${i}_room" placeholder="미기재 시 임의 배정"></label>
    </div>
  </div>`;
}

function bookingForm(ctx, p) {
  const budget = store.budgetOf(ctx.user.code);
  const isCancel = p.code === store.cancelProduct.code;

  if (isCancel) {
    const body = `
${pageHero('Cancel', esc(p.name), esc(p.summary))}
<section class="section-sm"><div class="wrap-narrow">
  <div class="note note-warn"><i>⚠️</i><div>
    현금 환급을 신청하시면 이번 프로모션의 <b>여행 신청 권리가 소멸</b>됩니다.
    ${esc(p.note)}</div></div>
  <form class="card mt-3" method="post" action="/booking/${esc(p.code)}" id="bookForm"
        data-unit-price="0" data-budget="${budget}">
    <h2 class="h-sm mb-3">환급 대상 금액</h2>
    <dl class="kv">
      <dt>신청자</dt><dd>${esc(ctx.user.name)} (${esc(ctx.user.code)})</dd>
      <dt>소속</dt><dd>${esc(ctx.user.ga)} · ${esc(ctx.user.branch)}</dd>
      <dt>환급 예정 금액</dt><dd><b style="color:var(--brand);font-size:var(--fs-18)">${won(budget)}</b></dd>
      <dt>지급 시기</dt><dd>2027년 8월 급여 지급일 일괄 정산</dd>
    </dl>
    <input type="hidden" name="round" value="CASH">
    <label class="check mt-4"><input type="checkbox" name="agree" required>
      <span>위 내용을 확인하였으며, 여행을 신청하지 않고 현금 환급을 받는 데 동의합니다.</span></label>
    <div class="row mt-4"><button class="btn btn-lg" type="submit" id="bookSubmit">현금 환급 신청</button>
      <a class="btn btn-lg btn-ghost" href="/achievement">돌아가기</a></div>
  </form>
</div></section>`;
    return page(ctx, { title: p.name, body });
  }

  const affordable = p.price <= budget;
  const maxPax = Math.max(1, Math.min(4, Math.floor(budget / p.price) || 1));

  const body = `
<section class="hero" style="--hero-h:52vh">
  <div class="hero-bg"><img src="/img/${p.slug}.jpg" alt="${esc(p.name)}"></div>
  <div class="wrap hero-in">
    <span class="eyebrow">${esc(p.depart)} · ${esc(p.region)}</span>
    <h1 class="h-lg mt-2">${esc(p.name)}</h1>
    <p class="hero-sub">${esc(p.summary)}</p>
    <div class="hero-meta">
      <div><small>기간</small><b>${esc(p.nights)}</b></div>
      <div><small>항공</small><b>${esc(p.airline)}</b></div>
      <div><small>숙소</small><b>${esc(p.hotel)}</b></div>
      <div><small>인당 사용 업적</small><b>${won(p.price)}</b></div>
    </div>
  </div>
</section>

<section class="section-sm"><div class="wrap">
  <div class="grid" style="grid-template-columns:1.5fr .95fr;gap:calc(var(--u)*4);align-items:start">
    <div>
      ${!affordable ? `<div class="note note-danger mb-3"><i>🚫</i><div>
        <b>보유 업적금액이 부족합니다.</b><br>이 여행지는 인당 ${won(p.price)}이 필요하지만 사용 가능 잔액은 ${won(budget)}입니다.
        업적금액과 현금의 혼합 결제는 허용되지 않습니다.</div></div>` : windowNotice()}

      <form method="post" action="/booking/${esc(p.code)}" id="bookForm"
            data-unit-price="${p.price}" data-budget="${budget}">
        <div class="card">
          <h2 class="h-sm mb-3">출발 차수 선택 <span class="req" style="color:var(--danger)">*</span></h2>
          <div class="pickers">
            ${p.rounds.map((r, i) => `<label class="picker">
              <input type="radio" name="round" value="${esc(r.code)}"${i === 0 ? ' checked' : ''}>
              <span><b>${esc(r.label)}</b><small>${esc(r.range)}</small><small>잔여 ${r.seats}석</small></span>
            </label>`).join('')}
          </div>
        </div>

        <div class="card mt-3">
          <h2 class="h-sm mb-3">참가 인원</h2>
          <label class="field" style="max-width:280px">
            <span class="label">총 참가자 수 (본인 포함)</span>
            <select class="select" name="pax" id="paxCount">
              ${Array.from({ length: maxPax }, (_, i) => `<option value="${i + 1}">${i + 1}명${i ? ` (동반자 ${i}명)` : ' (본인만)'}</option>`).join('')}
            </select>
            <span class="hint">보유 업적금액 기준 최대 ${maxPax}명까지 선택할 수 있습니다.</span>
          </label>
        </div>

        ${Array.from({ length: 4 }, (_, i) => travelerCard(i, ctx.user)).join('')}

        <div class="card mt-3">
          <h2 class="h-sm mb-3">요청사항</h2>
          <label class="field"><span class="label">전달하실 내용 (선택)</span>
            <textarea class="textarea" name="memo" placeholder="식이 제한, 좌석 요청 등 전달하실 내용을 적어주세요."></textarea></label>
          <label class="check mt-3"><input type="checkbox" name="agree" required>
            <span>여행 진행을 위한 <b>개인정보(여권정보 포함) 수집 · 이용 및 제3자(항공사 · 호텔) 제공</b>에 동의합니다. <span class="req">*</span></span></label>
        </div>

        <div class="row mt-4">
          <button class="btn btn-lg${affordable ? '' : ' is-disabled'}" type="submit" id="bookSubmit">여행 신청하기</button>
          <a class="btn btn-lg btn-ghost" href="/booking">다른 여행지 보기</a>
        </div>
      </form>
    </div>

    <aside class="stack">
      <div class="card">
        <h3 class="h-sm mb-3">결제 요약</h3>
        <dl class="kv" style="grid-template-columns:1fr auto">
          <dt>인당 사용 업적</dt><dd class="num">${won(p.price)}</dd>
          <dt>총 사용 업적</dt><dd class="num" id="sumTotal">${won(p.price)}</dd>
          <dt>신청 후 잔액</dt><dd class="num" id="sumRest">${won(Math.max(0, budget - p.price))}</dd>
        </dl>
        <div id="sumCashRow" class="note note-warn mt-3" hidden><i>💳</i>
          <div>업적금액 초과분 <b id="sumCash">0원</b>은 동반자 현금 결제로 처리됩니다.</div></div>
        <hr class="divider">
        <div class="row-between"><span class="dim">사용 가능 잔액</span>
          <b class="num" style="color:var(--brand-2)">${won(budget)}</b></div>
      </div>

      <div class="card">
        <h3 class="h-sm mb-3">여행 하이라이트</h3>
        <ul class="stack" style="--u:7px">${p.highlights.map(h => `<li class="tick">${esc(h)}</li>`).join('')}</ul>
      </div>

      <div class="card">
        <h3 class="h-sm mb-3">일정표</h3>
        <ul class="timeline">${p.itinerary.map(([d, t]) => `<li><b>${esc(d)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
      </div>

      <div class="card">
        <h3 class="h-sm mb-3">포함 / 불포함</h3>
        <ul class="stack" style="--u:7px">
          ${p.include.map(x => `<li class="tick">${esc(x)}</li>`).join('')}
          ${p.exclude.map(x => `<li class="tick no">${esc(x)}</li>`).join('')}
        </ul>
      </div>
    </aside>
  </div>
</div></section>
<style>@media(max-width:980px){.wrap .grid[style*="1.5fr"]{grid-template-columns:1fr!important}}</style>`;
  return page(ctx, { title: p.name, body });
}

/* ============================ 6. 예약조회 ============================ */
function bookings(ctx) {
  const list = store.bookingsOf(ctx.user.code);
  const body = `
${pageHero('My Bookings', '예약조회', '신청하신 내역을 확인하고 취소하실 수 있습니다.')}
<section class="section-sm"><div class="wrap">
  <div class="note note-warn mb-3"><i>⚠️</i><div>
    <b>여행지 변경을 원하시면</b> 기존 신청 내역을 취소하신 후 다시 신청해 주세요.
    취소 시점에 따라 취소 수수료가 부과될 수 있습니다.</div></div>

  ${list.length === 0 ? `
  <div class="card text-center" style="padding:calc(var(--u)*8)">
    <p class="h-sm mb-2">아직 신청 내역이 없습니다.</p>
    <p class="muted mb-4">여행지를 선택하고 첫 신청을 완료해 주세요.</p>
    <div><a class="btn" href="/booking">여행신청 바로가기</a></div>
  </div>` : `
  <div class="card card-flush">
    <table class="dtable">
      <thead><tr><th>예약번호</th><th>여행 상품</th><th>출발</th><th>인원</th><th>사용 업적</th><th>상태</th><th></th></tr></thead>
      <tbody>
      ${list.map(b => `<tr>
        <td class="mono" style="font-size:var(--fs-12)">${esc(b.no)}</td>
        <td><b>${esc(b.productName)}</b><br><span class="dim" style="font-size:var(--fs-12)">신청 ${fmtDate(b.createdAt, true)}</span></td>
        <td>${esc(b.roundRange || '-')}</td>
        <td class="num">${b.pax}명</td>
        <td class="num">${won(b.usedPoint)}</td>
        <td><span class="badge ${b.status === 'CONFIRMED' ? 'badge-ok' : 'badge-muted'}">${b.status === 'CONFIRMED' ? '신청완료' : '취소'}</span></td>
        <td class="text-center"><a class="btn btn-sm btn-ghost" href="/bookings/${esc(b.no)}">상세</a></td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`}
</div></section>`;
  return page(ctx, { title: '예약조회', body });
}

function bookingView(ctx, b) {
  const p = store.product(b.productCode);
  const body = `
${pageHero('Booking Detail', '예약 상세',
  `예약번호 <span class="mono">${esc(b.no)}</span>`,
  `<div class="row mt-3">
     <span class="badge ${b.status === 'CONFIRMED' ? 'badge-ok' : 'badge-muted'}">${b.status === 'CONFIRMED' ? '신청완료' : '취소됨'}</span>
     <a class="btn btn-sm btn-ghost" href="/bookings">목록으로</a>
   </div>`)}
<section class="section-sm"><div class="wrap-narrow">
  <div class="card">
    <h2 class="h-sm mb-3">예약 정보</h2>
    <dl class="kv">
      <dt>예약번호</dt><dd class="mono">${esc(b.no)}</dd>
      <dt>상품명</dt><dd>${esc(b.productName)}</dd>
      <dt>출발 차수</dt><dd>${esc(b.roundLabel || '-')} ${esc(b.roundRange || '')}</dd>
      <dt>참가 인원</dt><dd>${b.pax}명</dd>
      <dt>사용 업적금액</dt><dd><b>${won(b.usedPoint)}</b></dd>
      ${b.cashDue ? `<dt>현금 결제 예정</dt><dd style="color:var(--warn)"><b>${won(b.cashDue)}</b></dd>` : ''}
      <dt>신청일시</dt><dd>${fmtDate(b.createdAt, true)}</dd>
      <dt>예약상태</dt><dd>${b.status === 'CONFIRMED' ? '신청완료' : '취소 (' + fmtDate(b.cancelledAt, true) + ')'}</dd>
      <dt>요청사항</dt><dd>${b.memo ? esc(b.memo) : '<span class="dim">없음</span>'}</dd>
    </dl>
  </div>

  <div class="card mt-3">
    <h2 class="h-sm mb-3">대표 신청자</h2>
    <dl class="kv">
      <dt>성명</dt><dd>${esc(b.memberName)} (${esc(b.memberCode)})</dd>
      <dt>소속 GA</dt><dd>${esc(b.memberGa)}</dd>
      <dt>지사</dt><dd>${esc(b.memberBranch)}</dd>
    </dl>
  </div>

  ${(b.travelers || []).map((t, i) => `
  <div class="card mt-3">
    <h2 class="h-sm mb-3">[${i + 1}] 여행자 ${i === 0 ? '<span class="badge">본인</span>' : '<span class="badge badge-muted">동반자</span>'}</h2>
    <dl class="kv">
      <dt>성명</dt><dd>${esc(t.name)}</dd>
      <dt>법정 생년월일</dt><dd>${esc(t.birth)}</dd>
      <dt>연락처</dt><dd>${esc(t.phone)}</dd>
      <dt>성별</dt><dd>${t.sex === 'M' ? '남성' : t.sex === 'F' ? '여성' : '-'}</dd>
      <dt>영문 성명 (여권)</dt><dd class="mono">${esc(t.ln)} ${esc(t.fn)}</dd>
      <dt>여권번호</dt><dd class="mono">${t.pp ? esc(t.pp) : '<span class="dim">미입력 (추후 제출 가능)</span>'}</dd>
      <dt>여권 만료일</dt><dd>${t.ppexp ? esc(t.ppexp) : '<span class="dim">미입력</span>'}</dd>
      <dt>국적</dt><dd>${esc(t.nat || '대한민국')}</dd>
      <dt>희망 룸메이트</dt><dd>${t.room ? esc(t.room) : '<span class="dim">임의 배정</span>'}</dd>
    </dl>
  </div>`).join('')}

  ${p && p.itinerary ? `<div class="card mt-3"><h2 class="h-sm mb-3">일정표</h2>
    <ul class="timeline">${p.itinerary.map(([d, t]) => `<li><b>${esc(d)}</b><span>${esc(t)}</span></li>`).join('')}</ul></div>` : ''}

  ${b.status === 'CONFIRMED' ? `
  <form method="post" action="/bookings/${esc(b.no)}/cancel" class="mt-4">
    <button class="btn btn-lg btn-danger" type="submit"
      data-confirm="정말 이 예약을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.">예약 취소하기</button>
  </form>` : ''}
</div></section>`;
  return page(ctx, { title: '예약 상세', body });
}

/* ============================ 7. 여행지 주요정보 ============================ */
function destinations(ctx) {
  const body = `
${pageHero('Destinations', '여행지 주요정보',
  '6개 여행지의 일정, 항공, 숙소, 포함 내역을 확인하실 수 있습니다.')}
<section class="section-sm"><div class="wrap">
  <div class="row mb-4" style="gap:8px">
    ${store.products.map(p => `<a class="badge" href="#${p.slug}">${esc(p.name)}</a>`).join('')}
  </div>
  ${store.products.map((p, i) => `
  <article class="card card-flush mt-4 reveal" id="${p.slug}" data-delay="${i * 40}">
    <div class="grid" style="grid-template-columns:.9fr 1.1fr;gap:0">
      <div style="min-height:300px;position:relative;overflow:hidden">
        <img src="/img/${p.slug}.jpg" alt="${esc(p.name)}" loading="lazy"
             style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      </div>
      <div style="padding:calc(var(--u)*4)">
        <div class="row" style="gap:6px">
          <span class="badge">${esc(p.depart)}</span>
          <span class="badge badge-muted">${esc(p.region)}</span>
          <span class="badge badge-muted">${esc(p.nights)}</span>
        </div>
        <h2 class="h-md mt-2 mb-2">${esc(p.name)}</h2>
        <p class="muted" style="font-size:var(--fs-15)">${esc(p.summary)}</p>
        <dl class="kv mt-3">
          <dt>항공</dt><dd>${esc(p.airline)}</dd>
          <dt>숙소</dt><dd>${esc(p.hotel)}</dd>
          <dt>인당 사용 업적</dt><dd><b>${won(p.price)}</b></dd>
          <dt>출발 차수</dt><dd>${p.rounds.map(r => `${esc(r.label)} ${esc(r.range)} <span class="dim">(${r.seats}석)</span>`).join('<br>')}</dd>
        </dl>
        <details class="acc mt-3"><summary>일정표 자세히 보기</summary>
          <div class="acc-body"><ul class="timeline">${p.itinerary.map(([d, t]) => `<li><b>${esc(d)}</b><span>${esc(t)}</span></li>`).join('')}</ul></div>
        </details>
        <details class="acc"><summary>포함 / 불포함 사항</summary>
          <div class="acc-body"><ul class="stack" style="--u:7px">
            ${p.include.map(x => `<li class="tick">${esc(x)}</li>`).join('')}
            ${p.exclude.map(x => `<li class="tick no">${esc(x)}</li>`).join('')}
          </ul></div>
        </details>
        <div class="mt-3"><a class="btn" href="${ctx.user ? '/booking/' + p.code : '/login'}">이 여행지 신청하기</a></div>
      </div>
    </div>
  </article>`).join('')}
</div></section>
<style>@media(max-width:900px){#${store.products[0].slug} ~ article .grid,article .grid[style*=".9fr"]{grid-template-columns:1fr!important}}</style>`;
  return page(ctx, { title: '여행지 주요정보', body });
}

/* ============================ 8. FAQ ============================ */
function faqPage(ctx) {
  const groups = {};
  store.faq.forEach((f, i) => { (groups[f.cat] = groups[f.cat] || []).push(Object.assign({ n: i + 1 }, f)); });

  const body = `
${pageHero('FAQ', '자주 묻는 질문', '궁금하신 내용을 검색하거나 아래 목록에서 찾아보세요.',
  `<div class="mt-4" style="max-width:520px">
     <input class="input" id="faqSearch" type="search" placeholder="키워드로 검색 (예: 여권, 취소, 룸메이트)">
   </div>`)}
<section class="section-sm"><div class="wrap-narrow">
  ${Object.keys(groups).map(cat => `
  <div data-faq-group class="mb-4">
    <h2 class="h-sm mb-3" style="color:var(--brand)">${esc(cat)}</h2>
    ${groups[cat].map(f => `
    <details class="acc" data-faq="${esc(f.q + ' ' + f.a + ' ' + f.cat)}">
      <summary><span class="q-no">Q${String(f.n).padStart(2, '0')}</span> ${esc(f.q)}</summary>
      <div class="acc-body">${esc(f.a)}</div>
    </details>`).join('')}
  </div>`).join('')}
  <div id="faqEmpty" class="card text-center" hidden style="padding:calc(var(--u)*6)">
    <p class="h-sm mb-2">검색 결과가 없습니다.</p>
    <p class="muted">다른 키워드로 검색하시거나 전담고객센터로 문의해 주세요.</p>
    <div class="mt-3"><a class="btn btn-ghost" href="/support">전담고객센터</a></div>
  </div>
</div></section>`;
  return page(ctx, { title: '자주 묻는 질문', body });
}

/* ============================ 9. 전담고객센터 ============================ */
function support(ctx) {
  const body = `
${pageHero('Support', '전담고객센터', `${esc(EV.agency)}가 이번 프로모션의 예약 · 문의를 전담합니다.`)}
<section class="section-sm"><div class="wrap">
  <div class="grid grid-2" style="align-items:start">
    <div class="card">
      <h2 class="h-sm mb-3">연락처</h2>
      <dl class="kv">
        <dt>전화</dt><dd>${EV.tel.map(t => `<a href="tel:${esc(t.replace(/-/g, ''))}"><b>${esc(t)}</b></a>`).join(' · ')}</dd>
        <dt>이메일</dt><dd><a href="mailto:${esc(EV.email)}">${esc(EV.email)}</a></dd>
        <dt>상담시간</dt><dd>${esc(EV.hours)}</dd>
        <dt>주관 · 운영</dt><dd>${esc(EV.agency)} (${esc(EV.agencyEn)})</dd>
        <dt>주최</dt><dd>${esc(EV.client)} (${esc(EV.clientEn)})</dd>
      </dl>
      <div class="note mt-4"><i>💬</i><div>
        접수 기간 중에는 문의가 집중되어 연결이 지연될 수 있습니다.
        간단한 문의는 <a href="/faq" style="color:var(--brand)"><b>자주 묻는 질문</b></a>에서 먼저 확인해 주세요.</div></div>
    </div>

    <div class="card">
      <h2 class="h-sm mb-3">문의 남기기</h2>
      <form method="post" action="/support">
        <div class="field-row">
          <label class="field"><span class="label">성명 <span class="req">*</span></span>
            <input class="input" name="name" required value="${ctx.user ? esc(ctx.user.name) : ''}"></label>
          <label class="field"><span class="label">연락처 <span class="req">*</span></span>
            <input class="input" name="phone" required inputmode="numeric" value="${ctx.user ? esc(ctx.user.phone) : ''}"></label>
        </div>
        <label class="field"><span class="label">문의 유형</span>
          <select class="select" name="topic">
            <option>여행 신청 · 변경</option><option>업적금액 문의</option>
            <option>여권 · 서류</option><option>취소 · 환불</option><option>기타</option></select></label>
        <label class="field"><span class="label">문의 내용 <span class="req">*</span></span>
          <textarea class="textarea" name="message" required placeholder="문의하실 내용을 입력해 주세요."></textarea></label>
        <button class="btn btn-block mt-3" type="submit">문의 접수</button>
        <p class="hint">※ 데모 사이트이므로 실제로 발송되지 않습니다.</p>
      </form>
    </div>
  </div>
</div></section>`;
  return page(ctx, { title: '전담고객센터', body });
}

/* ============================ 10. 이미지 출처 ============================ */
function credits(ctx, list) {
  const body = `
${pageHero('Credits', '이미지 출처',
  '이 데모 사이트의 여행지 사진은 위키미디어 커먼즈의 자유 이용 라이선스 이미지를 사용했습니다.')}
<section class="section-sm"><div class="wrap-narrow">
  <div class="card card-flush">
    <table class="dtable">
      <thead><tr><th>구분</th><th>파일</th><th>저작자</th><th>라이선스</th></tr></thead>
      <tbody>${list.map(c => `<tr>
        <td class="mono">${esc(c.slug)}</td>
        <td><a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(String(c.file).replace(/^File:/, ''))}</a></td>
        <td>${esc(String(c.author || '').slice(0, 60))}</td>
        <td><span class="badge badge-muted">${esc(c.license)}</span></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>
  <p class="dim mt-3" style="font-size:var(--fs-13)">
    각 이미지의 원본 페이지에서 전체 저작자 표시 및 라이선스 조건을 확인하실 수 있습니다.</p>
</div></section>`;
  return page(ctx, { title: '이미지 출처', body });
}

/* ============================ 11. 404 ============================ */
function notFound(ctx) {
  const body = `
<section class="section" style="min-height:56vh;display:grid;place-items:center">
  <div class="wrap-narrow text-center">
    <span class="eyebrow" style="justify-content:center">404</span>
    <h1 class="h-lg mt-2 mb-2">페이지를 찾을 수 없습니다</h1>
    <p class="muted mb-4">주소가 변경되었거나 삭제된 페이지입니다.</p>
    <div class="row" style="justify-content:center">
      <a class="btn" href="/">홈으로</a>
      <a class="btn btn-ghost" href="/support">전담고객센터</a>
    </div>
  </div>
</section>`;
  return page(ctx, { title: '404', body });
}

module.exports = {
  home, login, achievement, bookingList, bookingForm,
  bookings, bookingView, destinations, faqPage, support, credits, notFound
};
