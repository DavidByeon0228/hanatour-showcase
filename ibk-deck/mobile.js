/* ============================================================
   모바일 · 터치 조작 레이어
   runtime.js 는 document 의 keydown 만 듣습니다. 따라서 버튼은
   합성 keydown 을 보내 기존 로직(이동 · 테마 · 오버뷰 · 발표자)을
   그대로 재사용합니다.
   ============================================================ */
(function () {
  'use strict';

  var deck = document.querySelector('.deck');
  if (!deck) return;
  var slides = [].slice.call(deck.querySelectorAll('.slide'));
  var total = slides.length;

  function key(k) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  }
  function idx() {
    var i = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    return i < 0 ? 0 : i;
  }

  /* ---------- 컨트롤 바 ---------- */
  var bar = document.createElement('nav');
  bar.className = 'mbar';
  bar.setAttribute('aria-label', '슬라이드 조작');
  bar.innerHTML =
    '<button type="button" data-act="prev" aria-label="이전 슬라이드">' +
      '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<button type="button" data-act="overview" aria-label="전체 목차"><svg viewBox="0 0 24 24">' +
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' +
      '<span>목차</span></button>' +
    '<button type="button" data-act="theme" aria-label="테마 변경"><svg viewBox="0 0 24 24">' +
      '<circle cx="13.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="17.5" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="8.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="6.5" cy="12.5" r="1.3" fill="currentColor" stroke="none"/>' +
      '<path d="M12 2a10 10 0 1 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.6-.4-1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-5-4.5-8.7-10-8.7Z"/></svg>' +
      '<span>테마</span></button>' +
    '<button type="button" data-act="page" class="mbar-page" aria-label="슬라이드로 이동"><b>1</b><i>/' + total + '</i></button>' +
    '<button type="button" data-act="notes" aria-label="발표 노트"><svg viewBox="0 0 24 24">' +
      '<path d="M4 5h16M4 10h16M4 15h10"/></svg><span>노트</span></button>' +
    '<button type="button" data-act="full" aria-label="전체화면"><svg viewBox="0 0 24 24">' +
      '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>전체</span></button>' +
    '<button type="button" data-act="present" aria-label="발표자 모드"><svg viewBox="0 0 24 24">' +
      '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M9 20.5h6M12 16.5v4"/></svg>' +
      '<span>발표</span></button>' +
    '<button type="button" data-act="next" aria-label="다음 슬라이드">' +
      '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
  document.body.appendChild(bar);

  /* ---------- 슬라이드 점프 시트 ---------- */
  var sheet = document.createElement('div');
  sheet.className = 'msheet';
  sheet.innerHTML = '<div class="msheet-in"><header><b>슬라이드 이동</b>' +
    '<button type="button" data-close aria-label="닫기">&times;</button></header><ol></ol></div>';
  var ol = sheet.querySelector('ol');
  slides.forEach(function (s, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" data-goto="' + i + '"><i>' + String(i + 1).padStart(2, '0') + '</i>' +
      '<span>' + (s.getAttribute('data-title') || '슬라이드 ' + (i + 1)) + '</span></button>';
    ol.appendChild(li);
  });
  document.body.appendChild(sheet);

  function openSheet(on) {
    sheet.classList.toggle('open', on);
    if (on) {
      var cur = ol.querySelector('[data-goto="' + idx() + '"]');
      if (cur) cur.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------- 액션 ---------- */
  function fullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    else (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    switch (b.getAttribute('data-act')) {
      case 'prev': key('ArrowLeft'); break;
      case 'next': key('ArrowRight'); break;
      case 'overview': key('o'); break;
      case 'theme': key('t'); flashTheme(); break;
      case 'notes': key('n'); break;
      case 'full': fullscreen(); break;
      case 'present': key('s'); break;
      case 'page': openSheet(!sheet.classList.contains('open')); break;
    }
    poke();
  });

  sheet.addEventListener('click', function (e) {
    if (e.target === sheet || e.target.hasAttribute('data-close')) { openSheet(false); return; }
    var g = e.target.closest('[data-goto]');
    if (!g) return;
    location.hash = '#/' + (parseInt(g.getAttribute('data-goto'), 10) + 1);
    openSheet(false);
  });

  /* 현재 테마 이름을 잠깐 띄웁니다 */
  var toastEl;
  function flashTheme() {
    setTimeout(function () {
      var link = document.getElementById('theme-link');
      var name = link ? link.getAttribute('href').split('/').pop().replace('.css', '') : '';
      if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'mtoast'; document.body.appendChild(toastEl); }
      toastEl.textContent = name;
      toastEl.classList.add('show');
      clearTimeout(toastEl.__t);
      toastEl.__t = setTimeout(function () { toastEl.classList.remove('show'); }, 1300);
    }, 60);
  }

  /* ---------- 스와이프 ---------- */
  var sx = 0, sy = 0, st = 0, tracking = false;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    if (e.target.closest('.mbar, .msheet, .overview, .notes-overlay')) { tracking = false; return; }
    tracking = true;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
    if (dt > 700) return;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    key(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
    poke();
  }, { passive: true });

  /* ---------- 자동 숨김 ---------- */
  var hideT;
  function poke() {
    bar.classList.remove('idle');
    clearTimeout(hideT);
    hideT = setTimeout(function () { bar.classList.add('idle'); }, 3600);
  }
  ['touchstart', 'mousemove', 'keydown'].forEach(function (t) {
    document.addEventListener(t, poke, { passive: true });
  });
  poke();

  /* ---------- 페이지 번호 동기화 ---------- */
  var pageBtn = bar.querySelector('.mbar-page b');
  function sync() {
    var i = idx();
    pageBtn.textContent = i + 1;
    bar.querySelector('[data-act="prev"]').disabled = i === 0;
    bar.querySelector('[data-act="next"]').disabled = i === total - 1;
  }
  new MutationObserver(sync).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  sync();
})();
