/* 사이트 공통 인터랙션
   정적(SPA) 빌드에서는 화면을 다시 그릴 때마다 window.initApp() 을 호출합니다. */
(function () {
  'use strict';
  function initApp() {

  /* ---------- 모바일 네비게이션 ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav && !burger.hasAttribute('data-bound')) {
    burger.setAttribute('data-bound', 'true');
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', '메뉴 열기');
      }
    });
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var d = +(el.getAttribute('data-delay') || 0);
          setTimeout(function () { el.classList.add('in'); }, d);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- 숫자 카운트업 ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-count');
    if (!isFinite(target)) return;
    var motionOff = document.documentElement.getAttribute('data-motion') === 'off';
    if (motionOff) { el.textContent = target.toLocaleString('ko-KR'); return; }
    var dur = 1100, t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------- 게이지 채우기 ---------- */
  document.querySelectorAll('.gauge > i').forEach(function (bar) {
    var w = bar.getAttribute('data-w') || '0';
    bar.style.width = '0%';
    setTimeout(function () { bar.style.width = w + '%'; }, 220);
  });

  /* ---------- FAQ 검색 ---------- */
  var faqSearch = document.getElementById('faqSearch');
  if (faqSearch) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-faq]'));
    var empty = document.getElementById('faqEmpty');
    faqSearch.addEventListener('input', function () {
      var q = faqSearch.value.trim().toLowerCase();
      var hit = 0;
      items.forEach(function (el) {
        var match = !q || el.getAttribute('data-faq').toLowerCase().indexOf(q) > -1;
        el.hidden = !match;
        if (match) hit++;
      });
      document.querySelectorAll('[data-faq-group]').forEach(function (g) {
        g.hidden = !g.querySelector('[data-faq]:not([hidden])');
      });
      if (empty) empty.hidden = hit > 0;
    });
  }

  /* ---------- 예약 폼: 인원수에 따라 여행자 카드 표시 ---------- */
  var paxSelect = document.getElementById('paxCount');
  if (paxSelect) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-pax-index]'));
    var unit = +(document.getElementById('bookForm').getAttribute('data-unit-price') || 0);
    var budget = +(document.getElementById('bookForm').getAttribute('data-budget') || 0);
    var totalEl = document.getElementById('sumTotal');
    var restEl = document.getElementById('sumRest');
    var cashEl = document.getElementById('sumCash');
    var cashRow = document.getElementById('sumCashRow');
    var submitBtn = document.getElementById('bookSubmit');

    function syncPax() {
      var n = +paxSelect.value;
      cards.forEach(function (c) {
        var idx = +c.getAttribute('data-pax-index');
        var on = idx < n;
        c.hidden = !on;
        c.querySelectorAll('[data-required]').forEach(function (inp) { inp.required = on; });
      });
      var total = unit * n;
      var cash = Math.max(0, total - budget);
      if (totalEl) totalEl.textContent = total.toLocaleString('ko-KR') + '원';
      if (restEl) restEl.textContent = Math.max(0, budget - total).toLocaleString('ko-KR') + '원';
      if (cashEl) cashEl.textContent = cash.toLocaleString('ko-KR') + '원';
      if (cashRow) cashRow.hidden = cash === 0;
      if (submitBtn) {
        var blocked = unit > budget;   /* 본인 1인분도 안 되면 신청 불가 */
        submitBtn.classList.toggle('is-disabled', blocked);
      }
    }
    paxSelect.addEventListener('change', syncPax);
    syncPax();
  }

  /* ---------- 예약 폼 제출 전 확인 ---------- */
  var bookForm = document.getElementById('bookForm');
  if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
      var agree = bookForm.querySelector('[name="agree"]');
      if (agree && !agree.checked) {
        e.preventDefault();
        if (window.toast) window.toast('개인정보 수집·이용에 동의해 주세요.', 'err');
        agree.focus();
        return;
      }
      if (!bookForm.querySelector('[name="round"]:checked')) {
        e.preventDefault();
        if (window.toast) window.toast('출발 차수를 선택해 주세요.', 'err');
      }
    });
  }

  /* ---------- 취소 확인 ---------- */
  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!window.confirm(el.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  /* ---------- 서버 플래시 메시지를 토스트로 ---------- */
  var flash = document.getElementById('flash');
  if (flash && window.toast) {
    setTimeout(function () {
      window.toast(flash.getAttribute('data-msg'), flash.getAttribute('data-kind') || 'ok');
    }, 260);
  }

  /* ---------- 데모 계정 원클릭 채우기 ---------- */
  document.querySelectorAll('[data-fill]').forEach(function (el) {
    el.addEventListener('click', function () {
      var v = el.getAttribute('data-fill').split('/');
      var u = document.querySelector('[name="username"]');
      var p = document.querySelector('[name="password"]');
      if (u) u.value = v[0];
      if (p) p.value = v[1];
      if (p) p.focus();
    });
  });
  }
  window.initApp = initApp;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp);
  else initApp();
})();
