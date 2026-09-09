'use strict';
/* ============================================================
   구글 시트 → data/members.csv 동기화
     node scripts/sync-members.js
   시트가 "링크가 있는 모든 사용자 - 뷰어"로 공유되어 있어야 합니다.
   (공유 전이라면 시트에서 파일 > 다운로드 > CSV 로 받아
    data/members.csv 를 직접 덮어써도 동일하게 동작합니다.)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SHEET_ID = process.env.SHEET_ID || '15zDDSHWjCqFvaTfn_o_PJQgWWcUKKjJJz-diXpVW7Vo';
const DEST = path.join(__dirname, '..', 'data', 'members.csv');
const REQUIRED = ['구성원코드', '성명', '생년월일', '합산업적', '지급금액', '사용금액', '잔여금액', '달성등급'];

function get(url, depth) {
  return new Promise((resolve, reject) => {
    if ((depth || 0) > 5) return reject(new Error('리다이렉트가 너무 많습니다'));
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, (depth || 0) + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' — 시트가 공개 공유되어 있는지 확인해 주세요.'));
      }
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

(async () => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  console.log('내려받는 중 →', url);
  try {
    const csv = await get(url);
    const head = csv.split('\n')[0].replace(/^﻿/, '');
    const missing = REQUIRED.filter(k => head.indexOf(k) === -1);
    if (missing.length) {
      console.error('필수 컬럼이 없습니다:', missing.join(', '));
      console.error('받은 헤더:', head);
      process.exit(1);
    }
    fs.writeFileSync(DEST, csv.replace(/\r\n/g, '\n'), 'utf8');
    const rows = csv.trim().split('\n').length - 1;
    console.log(`저장 완료 → ${DEST} (회원 ${rows}명)`);
    console.log('서버를 재시작하면 반영됩니다.');
  } catch (e) {
    console.error('실패:', e.message);
    console.error('시트를 CSV 로 내려받아 data/members.csv 를 직접 덮어써도 됩니다.');
    process.exit(1);
  }
})();
