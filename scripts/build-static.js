'use strict';
/* ============================================================
   정적 사이트 빌드 — GitHub Pages 배포용
     node scripts/build-static.js [출력경로]
   기본 출력: ../hanatour-showcase/promo

   서버(server.js)의 라우팅 · 세션 · 폼 처리를 브라우저로 옮기고,
   화면 렌더러(src/pages.js · src/html.js)는 수정 없이 그대로 번들합니다.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, '..', 'hanatour-showcase', 'promo');

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function copyDir(from, to) {
  mkdir(to);
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

/* ---------- 1. 출력 폴더 준비 ---------- */
rmrf(OUT); mkdir(OUT);
copyDir(path.join(ROOT, 'public', 'css'), path.join(OUT, 'css'));
copyDir(path.join(ROOT, 'public', 'img'), path.join(OUT, 'img'));
mkdir(path.join(OUT, 'js'));
for (const f of ['theme.js', 'app.js']) {
  fs.copyFileSync(path.join(ROOT, 'public', 'js', f), path.join(OUT, 'js', f));
}

/* ---------- 2. 데이터 주입 ---------- */
const store = require(path.join(ROOT, 'src', 'store'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const faq = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'faq.json'), 'utf8'));
let credits = [];
try { credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'img', 'CREDITS.json'), 'utf8')); } catch (e) {}

const dataJs = 'window.__PROMO_DATA = ' + JSON.stringify({
  catalog, faq, members: store.members(), credits
}) + ';\n';
fs.writeFileSync(path.join(OUT, 'js', 'data.js'), dataJs, 'utf8');

/* ---------- 3. CommonJS 번들 ---------- */
const MODULES = [
  ['store', 'src/store-browser.js'],
  ['store-browser', null],              /* 같은 모듈을 두 이름으로 노출 */
  ['html', 'src/html.js'],
  ['pages', 'src/pages.js'],
  ['router-browser', 'src/router-browser.js']
];

let bundle = `/* 자동 생성 — scripts/build-static.js
   src/pages.js · src/html.js 는 서버와 동일한 소스를 그대로 사용합니다. */
(function () {
  'use strict';
  var __mods = {};
  function require(p) {
    var k = String(p).replace(/^\\.\\//, '').replace(/\\.js$/, '');
    var m = __mods[k];
    if (!m) throw new Error('module not found: ' + p);
    if (!m.loaded) { m.loaded = true; m.fn(m.mod, m.mod.exports, require); }
    return m.mod.exports;
  }
  function define(name, fn) { __mods[name] = { mod: { exports: {} }, fn: fn, loaded: false }; }
  function alias(from, to) { __mods[to] = __mods[from]; }
`;

for (const [name, rel] of MODULES) {
  if (!rel) continue;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  bundle += `\n  /* ===== ${rel} ===== */\n  define(${JSON.stringify(name)}, function (module, exports, require) {\n${src}\n  });\n`;
}
bundle += `\n  alias('store', 'store-browser');\n  require('router-browser');\n})();\n`;
fs.writeFileSync(path.join(OUT, 'js', 'bundle.js'), bundle, 'utf8');

/* ---------- 4. 셸 HTML ---------- */
const EV = catalog.event;
const shell = `<!doctype html>
<html lang="ko" data-theme="aurora" data-mode="dark" data-density="cozy" data-motion="on">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${EV.title}</title>
<meta name="description" content="${EV.title} — ${EV.client} 임직원 대상 해외여행 프로모션 신청 사이트 (데모)">
<meta name="color-scheme" content="dark light">
<meta property="og:title" content="${EV.title}">
<meta property="og:description" content="가상의 행사 데이터로 구성한 해외여행 프로모션 신청 사이트 데모">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='11' fill='%236d8bff'/%3E%3Cpath d='M9 26.5c4.6-2 8.2-5.6 10.4-10.6C21.6 20.9 25.2 24.5 31 26.5' fill='none' stroke='%23fff' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='28.5' cy='12' r='3.4' fill='%23fff'/%3E%3C/svg%3E">
<script>
/* FOUC 방지 + URL 로 디자인 강제 (?theme=swiss&mode=light) */
(function(){try{
  var d=JSON.parse(localStorage.getItem('hb-promo-design')||'{}');
  var defs={aurora:'dark',editorial:'light',sunset:'light',swiss:'light',midnight:'dark'};
  var q=new URLSearchParams(location.search);
  ['theme','mode','density','motion'].forEach(function(k){ if(q.get(k)) d[k]=q.get(k); });
  if(q.get('theme')&&!q.get('mode')) d.mode=null;
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
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/themes.css">
<link rel="stylesheet" href="css/mobile.css?v=mobile-2">
<noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
</head>
<body>
<div id="app"></div>
<div class="toast-host"></div>
<noscript><div class="wrap section"><h1 class="h-md">JavaScript가 필요합니다</h1>
<p class="muted mt-2">이 데모는 브라우저에서 직접 동작하는 정적 사이트입니다. JavaScript를 켜고 다시 열어 주세요.</p></div></noscript>
<script src="js/data.js"></script>
<script src="js/theme.js"></script>
<script src="js/app.js"></script>
<script src="js/bundle.js"></script>
</body></html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), shell, 'utf8');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');

/* ---------- 5. 요약 ---------- */
function size(p) {
  let t = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const s = path.join(p, e.name);
    t += e.isDirectory() ? size(s) : fs.statSync(s).size;
  }
  return t;
}
console.log('정적 빌드 완료 →', OUT);
console.log('  회원 ' + store.members().length + '명 · 상품 ' + catalog.products.length + '개 · FAQ ' + faq.length + '개');
console.log('  번들 ' + Math.round(bundle.length / 1024) + 'KB · 전체 ' + (size(OUT) / 1024 / 1024).toFixed(1) + 'MB');
