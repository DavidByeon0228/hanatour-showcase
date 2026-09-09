/* ============================================================
   디자인 전환 시스템
   - 5개 테마 × 라이트/다크 × 밀도(기본/컴팩트) × 모션 on/off
   - 마우스: 우하단 팔레트 버튼 클릭, 버튼 위에서 휠 스크롤로 테마 순환
   - 키보드: 1~5 테마 / [ ] 이전·다음 / D 명암 / C 밀도 / M 모션 / P 패널 / ? 도움말
   설정은 localStorage 에 저장되어 페이지를 이동해도 유지됩니다.
   ============================================================ */
(function () {
  'use strict';

  var THEMES = [
    { id: 'aurora',    name: '오로라',     en: 'Aurora',    desc: '딥 인디고 글래스 · 기본',   mode: 'dark',  sw: ['#0a0f26', '#6d8bff', '#3ee0d8', '#171e42'] },
    { id: 'editorial', name: '에디토리얼', en: 'Editorial', desc: '종이 질감 · 명조 제목',     mode: 'light', sw: ['#faf7f0', '#8c2f24', '#2f5d50', '#e8e0d0'] },
    { id: 'sunset',    name: '선셋',       en: 'Sunset',    desc: '따뜻한 코랄 · 라운드',      mode: 'light', sw: ['#fff8f3', '#f2603c', '#ff9f1c', '#ffd9c4'] },
    { id: 'swiss',     name: '스위스',     en: 'Swiss',     desc: '흑백 그리드 · 각진 보더',   mode: 'light', sw: ['#ffffff', '#000000', '#e5232b', '#f2f2f2'] },
    { id: 'midnight',  name: '미드나잇',   en: 'Midnight',  desc: '에메랄드 · 골드 라인',      mode: 'dark',  sw: ['#07100d', '#cba14e', '#4fbf94', '#13241d'] }
  ];

  var KEY = 'hb-promo-design';
  var root = document.documentElement;
  var state = readState();

  function readState() {
    var s = { theme: 'aurora', mode: null, density: 'cozy', motion: 'on' };
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          if (findTheme(p.theme)) s.theme = p.theme;
          if (p.mode === 'dark' || p.mode === 'light') s.mode = p.mode;
          if (p.density === 'compact' || p.density === 'cozy') s.density = p.density;
          if (p.motion === 'off' || p.motion === 'on') s.motion = p.motion;
        }
      }
    } catch (e) { /* 시크릿 모드 등 저장소 접근 불가 — 기본값 사용 */ }
    return s;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function findTheme(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }

  function apply(flash) {
    var t = findTheme(state.theme) || THEMES[0];
    var mode = state.mode || t.mode;
    if (flash) {
      var f = document.createElement('div');
      f.className = 'tsw-flash';
      document.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 480);
    }
    root.setAttribute('data-theme', t.id);
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-density', state.density);
    root.setAttribute('data-motion', state.motion);
    root.style.colorScheme = mode;
    save();
    syncUI();
  }

  /* ---------- 공개 API ---------- */
  var API = {
    themes: THEMES,
    setTheme: function (id, silent) {
      var t = findTheme(id); if (!t) return;
      var changed = state.theme !== id;
      state.theme = id;
      state.mode = null;               /* 테마 고유 기본 명암으로 복귀 */
      apply(changed);
      if (!silent && changed) toast(t.name + ' 테마 · ' + (t.mode === 'dark' ? '다크' : '라이트'));
    },
    step: function (dir) {
      var i = 0;
      for (var k = 0; k < THEMES.length; k++) if (THEMES[k].id === state.theme) i = k;
      API.setTheme(THEMES[(i + dir + THEMES.length) % THEMES.length].id);
    },
    toggleMode: function () {
      var t = findTheme(state.theme);
      var cur = state.mode || t.mode;
      state.mode = cur === 'dark' ? 'light' : 'dark';
      apply(true);
      toast(state.mode === 'dark' ? '다크 모드' : '라이트 모드');
    },
    toggleDensity: function () {
      state.density = state.density === 'compact' ? 'cozy' : 'compact';
      apply(false);
      toast(state.density === 'compact' ? '컴팩트 레이아웃' : '기본 레이아웃');
    },
    toggleMotion: function () {
      state.motion = state.motion === 'off' ? 'on' : 'off';
      apply(false);
      toast(state.motion === 'off' ? '모션 끔' : '모션 켬');
    },
    get: function () { return { theme: state.theme, mode: state.mode || findTheme(state.theme).mode, density: state.density, motion: state.motion }; }
  };
  window.Design = API;

  /* ---------- 토스트 ---------- */
  function toast(msg, kind) {
    var host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 1900);
  }
  window.toast = toast;

  /* ---------- UI 조립 ---------- */
  var fab, panel, help;

  function buildUI() {
    fab = document.createElement('button');
    fab.className = 'tsw-fab';
    fab.type = 'button';
    fab.title = '디자인 변경 (P) · 휠로 테마 순환';
    fab.setAttribute('aria-label', '디자인 변경 패널 열기');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>' +
      '<circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>' +
      '<circle cx="8.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>' +
      '<circle cx="6.5" cy="12.5" r="1.2" fill="currentColor" stroke="none"/>' +
      '<path d="M12 2a10 10 0 1 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.6-.4-1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-5-4.5-8.7-10-8.7Z"/></svg>';

    panel = document.createElement('div');
    panel.className = 'tsw-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '디자인 설정');

    var swatches = THEMES.map(function (t, i) {
      return '<button class="tsw-theme" type="button" role="radio" data-theme-id="' + t.id + '" aria-checked="false">' +
        '<span class="tsw-swatch" aria-hidden="true">' +
        t.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') +
        '</span>' +
        '<span class="tsw-theme-txt"><b>' + t.name + ' <span style="opacity:.5;font-weight:500">' + t.en + '</span></b><small>' + t.desc + '</small></span>' +
        '<kbd>' + (i + 1) + '</kbd></button>';
    }).join('');

    panel.innerHTML =
      '<button class="tsw-close" type="button" aria-label="닫기">&times;</button>' +
      '<h4>테마</h4><div class="tsw-themes" role="radiogroup" aria-label="테마 선택">' + swatches + '</div>' +
      '<h4>명암</h4><div class="tsw-seg" data-seg="mode">' +
        '<button type="button" data-val="light" aria-pressed="false">라이트</button>' +
        '<button type="button" data-val="dark" aria-pressed="false">다크</button></div>' +
      '<h4>레이아웃 밀도</h4><div class="tsw-seg" data-seg="density">' +
        '<button type="button" data-val="cozy" aria-pressed="false">기본</button>' +
        '<button type="button" data-val="compact" aria-pressed="false">컴팩트</button></div>' +
      '<h4>모션</h4><div class="tsw-seg" data-seg="motion">' +
        '<button type="button" data-val="on" aria-pressed="false">켬</button>' +
        '<button type="button" data-val="off" aria-pressed="false">끔</button></div>' +
      '<div class="tsw-foot"><kbd>1</kbd>~<kbd>5</kbd> 테마 · <kbd>[</kbd><kbd>]</kbd> 이전/다음 · <kbd>D</kbd> 명암 · <kbd>C</kbd> 밀도 · <kbd>M</kbd> 모션 · <kbd>?</kbd> 전체 단축키</div>';

    help = document.createElement('div');
    help.className = 'tsw-help';
    help.innerHTML =
      '<div class="tsw-help-box"><h3>키보드 · 마우스 단축키</h3><dl>' +
      '<dt><kbd class="kbd">1</kbd>~<kbd class="kbd">5</kbd></dt><dd>테마 직접 선택 (오로라 / 에디토리얼 / 선셋 / 스위스 / 미드나잇)</dd>' +
      '<dt><kbd class="kbd">[</kbd> <kbd class="kbd">]</kbd></dt><dd>이전 · 다음 테마로 순환</dd>' +
      '<dt><kbd class="kbd">T</kbd></dt><dd>다음 테마로 순환</dd>' +
      '<dt><kbd class="kbd">D</kbd></dt><dd>라이트 / 다크 전환</dd>' +
      '<dt><kbd class="kbd">C</kbd></dt><dd>기본 / 컴팩트 레이아웃 밀도</dd>' +
      '<dt><kbd class="kbd">M</kbd></dt><dd>애니메이션 켬 / 끔</dd>' +
      '<dt><kbd class="kbd">P</kbd></dt><dd>디자인 패널 열기 / 닫기</dd>' +
      '<dt><kbd class="kbd">?</kbd></dt><dd>이 도움말 열기</dd>' +
      '<dt><kbd class="kbd">Esc</kbd></dt><dd>패널 · 도움말 닫기</dd>' +
      '<dt>🖱 휠</dt><dd>우하단 팔레트 버튼 위에서 스크롤하면 테마가 순환합니다</dd>' +
      '</dl><div style="margin-top:22px;text-align:right"><button class="btn btn-sm" type="button" data-close>닫기</button></div></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    document.body.appendChild(help);

    /* --- 이벤트 --- */
    fab.addEventListener('click', function () { togglePanel(); });
    fab.addEventListener('wheel', function (e) { e.preventDefault(); API.step(e.deltaY > 0 ? 1 : -1); }, { passive: false });

    panel.querySelector('.tsw-close').addEventListener('click', function () { togglePanel(false); });
    panel.addEventListener('click', function (e) {
      var t = e.target.closest('[data-theme-id]');
      if (t) { API.setTheme(t.getAttribute('data-theme-id')); return; }
      var seg = e.target.closest('.tsw-seg button');
      if (!seg) return;
      var kind = seg.parentNode.getAttribute('data-seg');
      var val = seg.getAttribute('data-val');
      if (kind === 'mode') { state.mode = val; apply(true); }
      else if (kind === 'density') { state.density = val; apply(false); }
      else if (kind === 'motion') { state.motion = val; apply(false); }
    });

    help.addEventListener('click', function (e) {
      if (e.target === help || e.target.hasAttribute('data-close')) toggleHelp(false);
    });

    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('open')) return;
      if (panel.contains(e.target) || fab.contains(e.target)) return;
      togglePanel(false);
    });
  }

  function togglePanel(force) {
    var open = force === undefined ? !panel.classList.contains('open') : force;
    panel.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function toggleHelp(force) {
    var open = force === undefined ? !help.classList.contains('open') : force;
    help.classList.toggle('open', open);
  }

  function syncUI() {
    if (!panel) return;
    var cur = API.get();
    panel.querySelectorAll('[data-theme-id]').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-theme-id') === cur.theme ? 'true' : 'false');
    });
    panel.querySelectorAll('.tsw-seg').forEach(function (seg) {
      var kind = seg.getAttribute('data-seg');
      seg.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-val') === cur[kind] ? 'true' : 'false');
      });
    });
  }

  /* ---------- 키보드 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;

    var k = e.key;
    if (k === 'Escape') { togglePanel(false); toggleHelp(false); return; }
    if (k >= '1' && k <= String(THEMES.length)) { e.preventDefault(); API.setTheme(THEMES[+k - 1].id); return; }
    switch (k.toLowerCase()) {
      case ']': case 't': e.preventDefault(); API.step(1); break;
      case '[':           e.preventDefault(); API.step(-1); break;
      case 'd':           e.preventDefault(); API.toggleMode(); break;
      case 'c':           e.preventDefault(); API.toggleDensity(); break;
      case 'm':           e.preventDefault(); API.toggleMotion(); break;
      case 'p':           e.preventDefault(); togglePanel(); break;
      case '?': case '/': e.preventDefault(); toggleHelp(); break;
    }
  });

  /* ---------- 시작 ---------- */
  function boot() { buildUI(); apply(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
