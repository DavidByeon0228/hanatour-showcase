'use strict';
/* HTML 레이아웃 · 공통 컴포넌트 */

const store = require('./store');
const EV = store.event;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const won = n => Number(n || 0).toLocaleString('ko-KR') + '원';
const num = n => Number(n || 0).toLocaleString('ko-KR');

function fmtDate(iso, withTime) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = n => String(n).padStart(2, '0');
  const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const base = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} (${day})`;
  return withTime ? `${base} ${p(d.getHours())}:${p(d.getMinutes())}` : base;
}

/* 브랜드 마크 — currentColor 기반이라 테마를 그대로 따라갑니다 */
const MARK = `<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
  <defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="var(--brand)"/><stop offset="1" stop-color="var(--brand-2)"/>
  </linearGradient></defs>
  <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#bm)"/>
  <path d="M9 26.5c4.6-2 8.2-5.6 10.4-10.6C21.6 20.9 25.2 24.5 31 26.5" fill="none"
        stroke="var(--brand-fg)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>
  <circle cx="28.5" cy="12" r="3.4" fill="var(--brand-fg)" opacity=".95"/>
</svg>`;

const NAV_MEMBER = [
  ['/achievement', '나의 업적 현황'],
  ['/booking', '여행신청'],
  ['/destinations', '여행지 정보'],
  ['/bookings', '예약조회'],
  ['/faq', '자주 묻는 질문'],
  ['/support', '전담고객센터']
];
const NAV_GUEST = [
  ['/#about', '프로모션 안내'],
  ['/destinations', '여행지 정보'],
  ['/faq', '자주 묻는 질문'],
  ['/support', '전담고객센터']
];

function header(ctx) {
  const items = ctx.user ? NAV_MEMBER : NAV_GUEST;
  const links = items.map(([href, label]) =>
    `<a href="${href}"${ctx.path === href ? ' class="on"' : ''}>${esc(label)}</a>`).join('');
  const tail = ctx.user
    ? `<a href="/logout">로그아웃</a>
       <span class="user-chip"><span class="avatar">${esc(ctx.user.name.slice(0, 1))}</span>
       <b>${esc(ctx.user.name)}</b> 님</span>`
    : `<a href="/login" class="btn btn-sm" style="margin-left:8px">로그인</a>`;

  return `<header class="hdr"><div class="wrap hdr-in">
    <a class="brand" href="/">${MARK}
      <span class="brand-txt"><b>${esc(EV.client)}</b><small>${esc(EV.season)} Promotion</small></span>
    </a>
    <button class="burger" type="button" aria-expanded="false" aria-label="메뉴 열기">
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M1 1h18M1 7h18M1 13h18"/></svg>
    </button>
    <nav class="nav">${links}${tail}</nav>
  </div></header>`;
}

function footer() {
  return `<footer class="ftr"><div class="wrap">
    <div class="ftr-grid">
      <div>
        <div class="brand" style="margin-bottom:14px">${MARK}
          <span class="brand-txt"><b>${esc(EV.client)}</b><small>${esc(EV.clientEn)}</small></span></div>
        <p class="muted" style="font-size:var(--fs-14);max-width:38ch">
          ${esc(EV.title)}<br>주관 · 운영 ${esc(EV.agency)} (${esc(EV.agencyEn)})</p>
        <p class="dim mt-2" style="font-size:var(--fs-12)">
          ※ 본 사이트는 데모/테스트 목적으로 제작된 가상의 행사 페이지이며,<br>
          등장하는 회사명 · 회원 정보 · 예약 내역은 모두 가상의 데이터입니다.</p>
      </div>
      <div>
        <h5>바로가기</h5>
        <ul>
          <li><a href="/achievement">나의 업적 현황</a></li>
          <li><a href="/booking">여행신청</a></li>
          <li><a href="/destinations">여행지 주요정보</a></li>
          <li><a href="/bookings">예약조회</a></li>
          <li><a href="/faq">자주 묻는 질문</a></li>
        </ul>
      </div>
      <div>
        <h5>전담고객센터</h5>
        <ul>
          ${EV.tel.map(t => `<li><a href="tel:${esc(t.replace(/-/g, ''))}"><b style="font-size:var(--fs-16);color:var(--fg)">${esc(t)}</b></a></li>`).join('')}
          <li><a href="mailto:${esc(EV.email)}">${esc(EV.email)}</a></li>
          <li class="dim" style="font-size:var(--fs-13);line-height:1.7">${esc(EV.hours)}</li>
        </ul>
      </div>
    </div>
    <div class="ftr-btm row-between">
      <span>© 2026 ${esc(EV.agencyEn)} INC. · Demo build for local testing</span>
      <span>여행지 사진 출처: Wikimedia Commons (CC0 / CC BY / CC BY-SA) — <a href="/credits">이미지 출처</a></span>
    </div>
  </div></footer>`;
}

/* 페이지 셸 */
function page(ctx, opts) {
  const title = opts.title ? `${opts.title} | ${EV.titleShort}` : EV.title;
  const flash = ctx.flash
    ? `<div id="flash" data-msg="${esc(ctx.flash.msg)}" data-kind="${esc(ctx.flash.kind || 'ok')}" hidden></div>` : '';

  return `<!doctype html>
<html lang="ko" data-theme="aurora" data-mode="dark" data-density="cozy" data-motion="on">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(EV.title)} — ${esc(EV.client)} 임직원 대상 해외여행 프로모션 신청 사이트">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='11' fill='%236d8bff'/%3E%3Cpath d='M9 26.5c4.6-2 8.2-5.6 10.4-10.6C21.6 20.9 25.2 24.5 31 26.5' fill='none' stroke='%23fff' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='28.5' cy='12' r='3.4' fill='%23fff'/%3E%3C/svg%3E">
<script>
/* FOUC 방지: CSS 로드 전에 저장된 디자인 설정을 먼저 적용합니다.
   ?theme=swiss&mode=light&density=compact 처럼 URL 로도 강제할 수 있습니다. */
(function(){try{
  var d=JSON.parse(localStorage.getItem('hb-promo-design')||'{}');
  var defs={aurora:'dark',editorial:'light',sunset:'light',swiss:'light',midnight:'dark'};
  var q=new URLSearchParams(location.search);
  ['theme','mode','density','motion'].forEach(function(k){ if(q.get(k)) d[k]=q.get(k); });
  if(q.get('theme')&&!q.get('mode')) d.mode=null;
  if([...q.keys()].some(function(k){return ['theme','mode','density','motion'].indexOf(k)>-1})){
    try{ localStorage.setItem('hb-promo-design',JSON.stringify(d)); }catch(e){}
  }
  var t=defs[d.theme]?d.theme:'aurora';
  var r=document.documentElement;
  r.setAttribute('data-theme',t);
  r.setAttribute('data-mode',(d.mode==='dark'||d.mode==='light')?d.mode:defs[t]);
  r.setAttribute('data-density',d.density==='compact'?'compact':'cozy');
  r.setAttribute('data-motion',d.motion==='off'?'off':'on');
}catch(e){}})();
</script>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Cormorant+Garamond:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Nanum+Myeongjo:wght@400;700;800&display=swap">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/themes.css">
<link rel="stylesheet" href="/css/mobile.css">
<noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
</head>
<body>
${header(ctx)}
<main>${opts.body}</main>
${footer()}
${flash}
<div class="toast-host"></div>
<script src="/js/theme.js"></script>
<script src="/js/app.js"></script>
</body></html>`;
}

/* 내부 페이지 상단 히어로 */
function pageHero(eyebrow, title, sub, extra) {
  return `<section class="page-hero"><div class="wrap">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1 class="h-lg mt-2">${title}</h1>
    ${sub ? `<p class="muted mt-2" style="max-width:62ch">${sub}</p>` : ''}
    ${extra || ''}
  </div></section>`;
}

/* 상품 카드 */
function productCard(p, opts) {
  opts = opts || {};
  const locked = !!opts.locked;
  const href = opts.href || `/booking/${p.code}`;
  return `<a class="card pcard card-link${locked ? ' is-locked' : ''}" href="${href}">
    <div class="pcard-media">
      <img src="/img/${p.slug}.jpg" alt="${esc(p.name)}" loading="lazy">
      <div class="pcard-tags">
        ${p.depart ? `<span class="badge">${esc(p.depart)}</span>` : ''}
        ${p.region ? `<span class="badge">${esc(p.region)}</span>` : ''}
        ${locked ? '<span class="badge">업적 부족</span>' : ''}
      </div>
      <div class="pcard-name"><b>${esc(p.name)}</b><span>${esc(p.nights || '')} · ${esc(p.airline || '')}</span></div>
    </div>
    <div class="pcard-body">
      <p>${esc(p.summary)}</p>
      <div class="pcard-foot">
        <span class="price"><small>인당 사용 업적</small><b>${num(p.price)}</b><span style="font-size:var(--fs-14)">원</span></span>
        <span class="arrow">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </div>
  </a>`;
}

module.exports = { esc, won, num, fmtDate, page, header, footer, pageHero, productCard, MARK, EV };
