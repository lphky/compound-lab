import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as M from '../math.mjs';
import * as C from '../content.mjs';

const EXPECTED = {"a1": 8487.2, "a2": 22497.28, "a3": 5519.0645, "a4": 16058.7069, "p1": 11255.0881, "p3": 8659.4573, "p5": 12740.1337, "i1": 1537.5, "i2": 2781.81, "i3": 2162.9338, "i4": 828.225, "p2": 2555.0947, "p4": 1988.5609, "p6": 1618.4079, "b1": 10000.0, "b2": 10000.0, "b3": 20000.0, "b4": 23035.6693, "c1": 10.0, "c2": 8.0, "c3": 1288.9463, "c4": 416.3226, "c5": 11464.96, "c6": 95.4405};

test('題庫共 24 題，id 不重複，五類配額合共 10 題', () => {
  assert.equal(C.QUESTIONS.length, 24);
  assert.equal(new Set(C.QUESTIONS.map((q) => q.id)).size, 24);
  assert.equal(Object.values(C.ROUND_QUOTA).reduce((a, b) => a + b), 10);
});

test('全部答案與 Python 高精度獨立計算一致', () => {
  for (const q of C.QUESTIONS) {
    assert.ok(Math.abs(C.exactAnswer(q) - EXPECTED[q.id]) < 0.001, q.id);
    assert.ok(C.isCorrect(q, C.roundedAnswer(q)), q.id + ' 四捨五入答案應接受');
  }
});

test('教案例子：$10,000、5%、30 年', () => {
  assert.equal(M.simpleAmount(10000, 5, 30), 25000);
  assert.equal(Math.round(M.compoundAmount(10000, 5, 30)), 43219);
});

test('本金＋本金利息＋利息的利息 = 本利和；差距等於利息的利息', () => {
  for (const [P, r, y, m] of [[10000, 5, 30, 1], [8000, 8, 10, 4], [1000, 15, 40, 12], [50000, 0.5, 3, 2]]) {
    for (const row of M.schedule(P, r, y, m)) {
      assert.ok(Math.abs(row.principal + row.interestOnPrincipal + row.interestOnInterest - row.compound) < 1e-6);
      assert.ok(Math.abs(row.gap - row.interestOnInterest) < 1e-6);
      assert.ok(row.gap >= -1e-9);
    }
  }
});

test('週期愈密，本利和愈大；反求函數互逆', () => {
  const values = [1, 2, 4, 12].map((m) => M.compoundAmount(10000, 8, 10, m));
  values.slice(1).forEach((v, i) => assert.ok(v > values[i]));
  assert.ok(Math.abs(M.principalFrom(M.compoundAmount(7000, 6, 5, 4), 6, 5, 4) - 7000) < 1e-6);
  assert.ok(Math.abs(M.rateFrom(5000, M.compoundAmount(5000, 7, 3), 3) - 7) < 1e-9);
});

test('常見錯誤被正確辨認', () => {
  const q = (id) => C.QUESTIONS.find((x) => x.id === id);
  assert.equal(C.diagnose(q('a1'), 8480), 'simple');
  assert.equal(C.diagnose(q('a1'), 8000 * 4 ** 2), 'percentWhole');
  assert.equal(C.diagnose(q('a1'), 487), 'interestForAmount');
  assert.equal(C.diagnose(q('i1'), 16538), 'amountForInterest');
  assert.equal(C.diagnose(q('p1'), 10000 * 1.03 ** 2), 'rateOnly');
  assert.equal(C.diagnose(q('p1'), 10000 * 1.06 ** 4), 'periodsOnly');
  assert.equal(C.diagnose(q('b1'), 13310 * 1.1 ** 3), 'wrongDirection');
  assert.equal(C.diagnose(q('c1'), 1.1), 'rateIsFactor');
  assert.equal(C.diagnose(q('c1'), 10.5), 'rateNoRoot');
  assert.equal(C.diagnose(q('c5'), 11249), 'stageOnly');
  assert.equal(C.diagnose(q('c6'), 56275), 'bothNeeded');
  assert.equal(C.diagnose(q('a2'), 22600), 'close');
  assert.equal(C.diagnose(q('a2'), 99999), 'generic');
  for (const item of C.QUESTIONS) for (const v of [1, 1000, 123456]) assert.ok(C.DIAGNOSES[C.diagnose(item, v)]);
});

test('診斷訊息不洩露該題答案', () => {
  for (const text of Object.values(C.DIAGNOSES)) assert.doesNotMatch(text, /\$\d/);
  for (const q of C.QUESTIONS) for (const hint of C.hints(q)) assert.ok(!hint.includes(C.answerText(q)), q.id);
});

test('每輪抽 10 題、不重複、每類配額正確', () => {
  for (let i = 0; i < 300; i++) {
    const round = C.pickRound();
    assert.equal(new Set(round.map((q) => q.id)).size, 10);
    for (const [topic, n] of Object.entries(C.ROUND_QUOTA)) assert.equal(round.filter((q) => q.topic === topic).length, n);
  }
});

test('錯題診所：錯誤答案、正確答案及曲線一致', () => {
  const nums = (s) => Number(s.replace(/[^\d.]/g, ''));
  assert.equal(C.CLINIC.length, 6);
  for (const c of C.CLINIC) {
    assert.ok(c.steps[c.wrong] && c.options[c.right], c.id);
    const shown = c.id === 'reverse' ? c.rightCurve(0) : c.rightCurve(c.horizon === 12 ? 3 : c.horizon);
    assert.equal(Math.round(shown), nums(c.answer), c.id);
  }
  const check = (id, t) => Math.round(C.CLINIC.find((c) => c.id === id).wrongCurve(t));
  assert.equal(check('percent', 3), 1728000);
  assert.equal(check('simple', 3), 11800);
  assert.equal(check('asked', 2), 21632);
  assert.equal(check('periodsOnly', 2), 8163);
  assert.equal(check('rateOnly', 2), 9272);
  assert.equal(check('reverse', 0), 17716);
});

test('工具函數：金額解析與座標刻度', () => {
  assert.equal(M.parseAnswer('$12,345'), 12345);
  assert.equal(M.parseAnswer('8%'), 8);
  assert.equal(M.parseAnswer(''), null);
  assert.equal(M.parseAnswer('abc'), null);
  assert.equal(M.money(43219.42), '$43,219');
  for (const v of [1, 37, 999, 43219, 1728000]) {
    const { max, step } = M.niceScale(v);
    assert.ok(max >= v && max / step <= 6);
  }
});

test('教材文字不含僥倖框架用語', () => {
  const root = new URL('../', import.meta.url);
  for (const file of readdirSync(root).filter((f) => /\.(mjs|html)$/.test(f))) {
    assert.doesNotMatch(readFileSync(new URL(file, root), 'utf8'), /賭|博彩|碰運氣|試手氣|搏一搏/, file);
  }
});

test('卡數怪獸：Python Decimal 獨立驗算兩年每月複利', () => {
  assert.ok(Math.abs(M.compoundAmount(5000, 36, 2, 12) - 10163.970532302013) < 1e-8);
});
