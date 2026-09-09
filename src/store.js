'use strict';
/* 데이터 계층 — 회원(CSV) · 상품/행사(JSON) · FAQ(JSON) · 예약(JSON 파일) */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const BOOKINGS_FILE = path.join(DATA, 'bookings.json');

/* ---------- CSV 파서 (따옴표 포함 필드 지원) ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r[0] && r[0].trim()));
}

function loadMembers() {
  const rows = parseCsv(fs.readFileSync(path.join(DATA, 'members.csv'), 'utf8'));
  const head = rows[0].map(h => h.trim());
  const idx = name => head.indexOf(name);
  return rows.slice(1).map(r => ({
    code:      r[idx('구성원코드')].trim(),
    name:      r[idx('성명')].trim(),
    nameEn:    r[idx('영문명')].trim(),
    birth:     r[idx('생년월일')].trim(),
    phone:     r[idx('연락처')].trim(),
    email:     r[idx('이메일')].trim(),
    ga:        r[idx('소속GA')].trim(),
    branch:    r[idx('지사')].trim(),
    rank:      r[idx('직급')].trim(),
    joinedAt:  r[idx('입사일')].trim(),
    achieved:  +r[idx('합산업적')],
    paid:      +r[idx('지급금액')],
    used:      +r[idx('사용금액')],
    remain:    +r[idx('잔여금액')],
    tier:      r[idx('달성등급')].trim()
  }));
}

const catalog = JSON.parse(fs.readFileSync(path.join(DATA, 'products.json'), 'utf8'));
const faq = JSON.parse(fs.readFileSync(path.join(DATA, 'faq.json'), 'utf8'));
let members = loadMembers();

/* ---------- 예약 저장소 ---------- */
function readBookings() {
  try { return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeBookings(list) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function bookingNo() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'VT' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + rnd;
}

/* ---------- 조회 헬퍼 ---------- */
const api = {
  event: catalog.event,
  products: catalog.products,
  cancelProduct: catalog.cancelProduct,
  faq,

  members: () => members,
  reloadMembers: () => { members = loadMembers(); return members; },

  findMember: code => members.find(m => m.code === String(code).trim()) || null,

  authenticate(username, password) {
    const u = String(username || '').trim();
    const p = String(password || '').trim();
    /* 데모용 게스트 계정 — 첫 번째 회원으로 로그인 */
    if (u.toLowerCase() === 'guest' && p.toLowerCase() === 'guest') return members[0];
    const m = api.findMember(u);
    if (m && m.birth === p) return m;
    return null;
  },

  product: code => catalog.products.find(p => p.code === code)
              || (catalog.cancelProduct.code === code ? catalog.cancelProduct : null),

  /* 회원이 실제로 쓸 수 있는 잔액 = 잔여금액 - 진행중 예약 사용액 */
  budgetOf(memberCode) {
    const m = api.findMember(memberCode);
    if (!m) return 0;
    const spent = api.bookingsOf(memberCode)
      .filter(b => b.status === 'CONFIRMED')
      .reduce((s, b) => s + b.usedPoint, 0);
    return m.remain - spent;
  },

  bookingsOf(memberCode) {
    return readBookings()
      .filter(b => b.memberCode === memberCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  booking(no) { return readBookings().find(b => b.no === no) || null; },

  createBooking(data) {
    const list = readBookings();
    const rec = Object.assign({
      no: bookingNo(),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      cancelledAt: null
    }, data);
    list.push(rec);
    writeBookings(list);
    return rec;
  },

  cancelBooking(no, memberCode) {
    const list = readBookings();
    const b = list.find(x => x.no === no && x.memberCode === memberCode);
    if (!b || b.status === 'CANCELLED') return null;
    b.status = 'CANCELLED';
    b.cancelledAt = new Date().toISOString();
    writeBookings(list);
    return b;
  },

  /* 신청 접수 기간 상태: 'before' | 'open' | 'closed' */
  applyWindow(now) {
    const t = (now || new Date()).getTime();
    const o = new Date(catalog.event.applyOpen).getTime();
    const c = new Date(catalog.event.applyClose).getTime();
    if (t < o) return 'before';
    if (t > c) return 'closed';
    return 'open';
  },

  stats() {
    const total = members.reduce((s, m) => s + m.achieved, 0);
    return {
      memberCount: members.length,
      destinationCount: catalog.products.length,
      totalAchieved: total,
      avgAchieved: Math.round(total / members.length),
      seats: catalog.products.reduce((s, p) => s + p.rounds.reduce((x, r) => x + r.seats, 0), 0)
    };
  }
};

module.exports = api;
