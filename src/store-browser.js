'use strict';
/* ============================================================
   브라우저용 데이터 계층 — src/store.js 와 동일한 API
   - 회원 · 상품 · FAQ 는 빌드 시점에 window.__PROMO_DATA 로 주입
   - 예약 내역은 서버 파일 대신 localStorage 에 저장
   정적(GitHub Pages) 빌드에서만 사용되며, src/pages.js 와
   src/html.js 는 수정 없이 그대로 재사용됩니다.
   ============================================================ */

var DATA = (typeof window !== 'undefined' && window.__PROMO_DATA) || {};
var catalog = DATA.catalog;
var faq = DATA.faq;
var members = DATA.members;

var BOOK_KEY = 'hb-promo-bookings';

function readBookings() {
  try { return JSON.parse(localStorage.getItem(BOOK_KEY) || '[]'); }
  catch (e) { return []; }
}
function writeBookings(list) {
  try { localStorage.setItem(BOOK_KEY, JSON.stringify(list)); } catch (e) {}
}

function bookingNo() {
  var d = new Date();
  var p = function (n) { return String(n).padStart(2, '0'); };
  var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'VT' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + rnd;
}

var api = {
  event: catalog.event,
  products: catalog.products,
  cancelProduct: catalog.cancelProduct,
  faq: faq,

  members: function () { return members; },
  reloadMembers: function () { return members; },

  findMember: function (code) {
    var c = String(code).trim();
    for (var i = 0; i < members.length; i++) if (members[i].code === c) return members[i];
    return null;
  },

  authenticate: function (username, password) {
    var u = String(username || '').trim();
    var p = String(password || '').trim();
    if (u.toLowerCase() === 'guest' && p.toLowerCase() === 'guest') return members[0];
    var m = api.findMember(u);
    if (m && m.birth === p) return m;
    return null;
  },

  product: function (code) {
    for (var i = 0; i < catalog.products.length; i++) {
      if (catalog.products[i].code === code) return catalog.products[i];
    }
    return catalog.cancelProduct.code === code ? catalog.cancelProduct : null;
  },

  budgetOf: function (memberCode) {
    var m = api.findMember(memberCode);
    if (!m) return 0;
    var spent = api.bookingsOf(memberCode)
      .filter(function (b) { return b.status === 'CONFIRMED'; })
      .reduce(function (s, b) { return s + b.usedPoint; }, 0);
    return m.remain - spent;
  },

  bookingsOf: function (memberCode) {
    return readBookings()
      .filter(function (b) { return b.memberCode === memberCode; })
      .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  },

  booking: function (no) {
    var list = readBookings();
    for (var i = 0; i < list.length; i++) if (list[i].no === no) return list[i];
    return null;
  },

  createBooking: function (data) {
    var list = readBookings();
    var rec = Object.assign({
      no: bookingNo(),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      cancelledAt: null
    }, data);
    list.push(rec);
    writeBookings(list);
    return rec;
  },

  cancelBooking: function (no, memberCode) {
    var list = readBookings();
    var b = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].no === no && list[i].memberCode === memberCode) { b = list[i]; break; }
    }
    if (!b || b.status === 'CANCELLED') return null;
    b.status = 'CANCELLED';
    b.cancelledAt = new Date().toISOString();
    writeBookings(list);
    return b;
  },

  applyWindow: function (now) {
    var t = (now || new Date()).getTime();
    var o = new Date(catalog.event.applyOpen).getTime();
    var c = new Date(catalog.event.applyClose).getTime();
    if (t < o) return 'before';
    if (t > c) return 'closed';
    return 'open';
  },

  stats: function () {
    var total = members.reduce(function (s, m) { return s + m.achieved; }, 0);
    return {
      memberCount: members.length,
      destinationCount: catalog.products.length,
      totalAchieved: total,
      avgAchieved: Math.round(total / members.length),
      seats: catalog.products.reduce(function (s, p) {
        return s + p.rounds.reduce(function (x, r) { return x + r.seats; }, 0);
      }, 0)
    };
  },

  /* 정적 빌드 전용 — 데모 데이터 초기화 */
  resetDemo: function () { writeBookings([]); }
};

module.exports = api;
