import { compoundAmount, simpleAmount, principalFrom, rateFrom, money, num, near } from './math.mjs';

export const LEVELS = [
  { n: 1, title: '兩個存錢計劃', short: '預測', blurb: '在圖上放下預測點，再看 30 年後的結果。' },
  { n: 2, title: '利息生利息', short: '逐年觀察', blurb: '一年一年過，看每年新增利息為何愈來愈多。' },
  { n: 3, title: '公式工場', short: '推導公式', blurb: '把重複相乘濃縮成 A = P(1 + r%)ⁿ。' },
  { n: 4, title: '複利週期', short: '半年、每季、每月', blurb: '切換週期，看利率和期數如何一起改變。' },
  { n: 5, title: '錯題診所', short: '找出錯誤', blurb: '替虛構學生找錯處，用圖表看錯在哪裏。' },
  { n: 6, title: '綜合挑戰', short: '10 題練習', blurb: '從 24 題題庫隨機抽 10 題，附分步提示。' },
];

export const PERIODS = [
  { m: 1, label: '每年', unit: '年' },
  { m: 2, label: '每半年', unit: '半年' },
  { m: 4, label: '每季', unit: '季' },
  { m: 12, label: '每月', unit: '月' },
];
export const periodLabel = (m) => PERIODS.find((p) => p.m === m).label;

export const TOPICS = {
  amount: '求本利和',
  interest: '求利息',
  period: '複利週期',
  principal: '反求本金',
  challenge: '進階',
};
export const ROUND_QUOTA = { amount: 2, interest: 2, period: 2, principal: 2, challenge: 2 };

export const QUESTIONS = [
  { id: 'a1', topic: 'amount', kind: 'amount', P: 8000, r: 3, t: 2, m: 1, text: '小晴把 $8,000 利是錢存入戶口，年利率 3%，每年複利一次。2 年後的本利和是多少？' },
  { id: 'a2', topic: 'amount', kind: 'amount', P: 20000, r: 4, t: 3, m: 1, text: '一個學費基金有 $20,000，年利率 4%，每年複利一次。3 年後的本利和是多少？' },
  { id: 'a3', topic: 'amount', kind: 'amount', P: 5000, r: 2.5, t: 4, m: 1, text: '阿樂為買新手機存了 $5,000，年利率 2.5%，每年複利一次。4 年後的本利和是多少？' },
  { id: 'a4', topic: 'amount', kind: 'amount', P: 12000, r: 6, t: 5, m: 1, text: '畢業旅行基金有 $12,000，年利率 6%，每年複利一次。5 年後的本利和是多少？' },
  { id: 'i1', topic: 'interest', kind: 'interest', P: 15000, r: 5, t: 2, m: 1, text: '子軒存入 $15,000，年利率 5%，每年複利一次。2 年共得利息多少？' },
  { id: 'i2', topic: 'interest', kind: 'interest', P: 30000, r: 3, t: 3, m: 1, text: '一筆 $30,000 的存款，年利率 3%，每年複利一次。3 年共得利息多少？' },
  { id: 'i3', topic: 'interest', kind: 'interest', P: 6000, r: 8, t: 4, m: 1, text: '思敏借出 $6,000 給家中生意，年利率 8%，每年複利一次。4 年共收利息多少？' },
  { id: 'i4', topic: 'interest', kind: 'interest', P: 9000, r: 4.5, t: 2, m: 1, text: '家明存入 $9,000，年利率 4.5%，每年複利一次。2 年共得利息多少？' },
  { id: 'p1', topic: 'period', kind: 'amount', P: 10000, r: 6, t: 2, m: 2, text: '$10,000 存入戶口，年利率 6%，每半年複利一次。2 年後的本利和是多少？' },
  { id: 'p2', topic: 'period', kind: 'interest', P: 16000, r: 5, t: 3, m: 2, text: '$16,000 存入戶口，年利率 5%，每半年複利一次。3 年共得利息多少？' },
  { id: 'p3', topic: 'period', kind: 'amount', P: 8000, r: 8, t: 1, m: 4, text: '$8,000 存入戶口，年利率 8%，每季複利一次。1 年後的本利和是多少？' },
  { id: 'p4', topic: 'period', kind: 'interest', P: 24000, r: 4, t: 2, m: 4, text: '$24,000 存入戶口，年利率 4%，每季複利一次。2 年共得利息多少？' },
  { id: 'p5', topic: 'period', kind: 'amount', P: 12000, r: 6, t: 1, m: 12, text: '$12,000 存入戶口，年利率 6%，每月複利一次。1 年後的本利和是多少？' },
  { id: 'p6', topic: 'period', kind: 'interest', P: 6000, r: 12, t: 2, m: 12, text: '$6,000 存入戶口，年利率 12%，每月複利一次。2 年共得利息多少？' },
  { id: 'b1', topic: 'principal', kind: 'principal', A: 13310, r: 10, t: 3, m: 1, text: '一筆存款年利率 10%，每年複利一次，3 年後本利和為 $13,310。本金是多少？' },
  { id: 'b2', topic: 'principal', kind: 'principal', A: 11236, r: 6, t: 2, m: 1, text: '一筆存款年利率 6%，每年複利一次，2 年後本利和為 $11,236。本金是多少？' },
  { id: 'b3', topic: 'principal', kind: 'principal', A: 21632, r: 8, t: 1, m: 2, text: '一筆存款年利率 8%，每半年複利一次，1 年後本利和為 $21,632。本金是多少？' },
  { id: 'b4', topic: 'principal', kind: 'principal', A: 28000, r: 5, t: 4, m: 1, text: '小晴希望 4 年後有 $28,000 交學費。年利率 5%，每年複利一次，現在要存入多少？' },
  { id: 'c1', topic: 'challenge', kind: 'rate', P: 5000, A: 6050, t: 2, m: 1, text: '$5,000 每年複利一次，2 年後本利和為 $6,050。年利率是多少？（答案以 % 計）' },
  { id: 'c2', topic: 'challenge', kind: 'rate', P: 8000, A: 9331.2, t: 2, m: 1, text: '$8,000 每年複利一次，2 年後本利和為 $9,331.2。年利率是多少？（答案以 % 計）' },
  { id: 'c3', topic: 'challenge', kind: 'diff', P: 10000, r: 5, t: 10, m: 1, text: '$10,000 存 10 年，年利率 5%。每年複利的本利和，比單利息的本利和多多少？' },
  { id: 'c4', topic: 'challenge', kind: 'diff', P: 25000, r: 4, t: 5, m: 1, text: '$25,000 存 5 年，年利率 4%。每年複利的本利和，比單利息的本利和多多少？' },
  {
    id: 'c5', topic: 'challenge', kind: 'custom', P: 10000, t: 3, text: '$10,000 首 2 年的年利率是 4%，第 3 年改為 6%，都是每年複利一次。3 年後的本利和是多少？',
    compute: () => 10000 * 1.04 ** 2 * 1.06,
    points: (x) => (x <= 2 ? 10000 * 1.04 ** x : 10000 * 1.04 ** 2 * 1.06 ** (x - 2)),
    traps: [[11248.64, 'stageOnly'], [11910.16, 'stageOnly'], [11400, 'simple']],
    hints: ['利率有改變，要分兩段計算。', '首 2 年：10000(1 + 4%)²。', '把首 2 年的本利和再乘 (1 + 6%)。'],
    work: ['首 2 年：10000(1 + 4%)² = $10,816', '第 3 年：10816(1 + 6%) = $11,464.96', '本利和 ≈ $11,465'],
  },
  {
    id: 'c6', topic: 'challenge', kind: 'custom', P: 50000, t: 2, text: '$50,000 存 2 年，年利率 6%。每半年複利的本利和，比每年複利的本利和多多少？',
    compute: () => 50000 * (1.03 ** 4 - 1.06 ** 2),
    points: (x) => 50000 * 1.03 ** (2 * x),
    traps: [[56275.44, 'bothNeeded'], [56180, 'bothNeeded']],
    hints: ['要計算兩個本利和，再相減。', '每半年：每期 3%，共 4 期。每年：每期 6%，共 2 期。', '計算 50000(1 + 3%)⁴ − 50000(1 + 6%)²，最後才進位。'],
    work: ['每半年：50000(1 + 3%)⁴ = $56,275.44', '每年：50000(1 + 6%)² = $56,180', '相差 ≈ $95'],
  },
];

export function exactAnswer(q) {
  if (q.kind === 'custom') return q.compute();
  if (q.kind === 'principal') return principalFrom(q.A, q.r, q.t, q.m);
  if (q.kind === 'rate') return rateFrom(q.P, q.A, q.t);
  const A = compoundAmount(q.P, q.r, q.t, q.m);
  if (q.kind === 'amount') return A;
  if (q.kind === 'interest') return A - q.P;
  return A - simpleAmount(q.P, q.r, q.t);
}

export const roundedAnswer = (q) => (q.kind === 'rate' ? Number(exactAnswer(q).toFixed(2)) : Math.round(exactAnswer(q)));
export const tolerance = (q) => (q.kind === 'rate' ? 0.05 : 1);
export const isCorrect = (q, value) => near(value, exactAnswer(q), tolerance(q));
export const answerText = (q) => (q.kind === 'rate' ? `${num(roundedAnswer(q))}%` : money(roundedAnswer(q)));

export const DIAGNOSES = {
  percentWhole: '你把百分率當成整數代入。下一步：先把百分率化成小數，例如 5% = 0.05。',
  simple: '這個結果是用單利息算的，每期只計本金的利息。下一步：改用 A = P(1 + r%)ⁿ，讓利息也生利息。',
  amountForInterest: '你算出的是本利和，但題目問利息。下一步：想想本利和要減去甚麼。',
  interestForAmount: '你算出的是利息，但題目問本利和。下一步：把本金也計算在內。',
  rateOnly: '你已把利率分到每期，但 n 仍是年數。下一步：把期數也改為「每年期數 × 年數」。',
  periodsOnly: '你已改了期數，但利率仍是年利率。下一步：把年利率除以每年的複利次數。',
  wrongDirection: '本金應比本利和小，你的答案卻更大。下一步：P 在算式中被乘，要求 P 就要除。',
  rateNoRoot: '你只把增長的百分比平均分到每年，這是單利息的想法。下一步：先求 (1 + r%)ⁿ，再開 n 次方。',
  rateIsFactor: '你求到的是每年的增長倍數 (1 + r%)。下一步：把它減 1，再化成百分率。',
  stageOnly: '你只用了一個利率計算全部年期。下一步：分開首段和後段，用首段的本利和作後段的本金。',
  bothNeeded: '你只算了其中一個本利和。下一步：把兩個本利和都算出來，再相減。',
  amountForDiff: '你算出的是本利和，但題目問兩者的差距。下一步：還要算單利息的本利和，再相減。',
  close: '答案很接近。下一步：檢查是否在中途進位了，應把全條算式算完才進位。',
  generic: '這個答案未符合題目條件。下一步：先寫出 P、每期利率和期數，再代入算式。',
};

function trapsFor(q) {
  const { P, r, t, m, kind } = q;
  if (kind === 'custom') return q.traps;
  if (kind === 'rate') {
    const growth = (q.A / P - 1) * 100;
    const factor = (q.A / P) ** (1 / t);
    return [[growth / t, 'rateNoRoot'], [growth, 'rateNoRoot'], [factor, 'rateIsFactor']];
  }
  if (kind === 'principal') {
    const n = m * t;
    const P0 = principalFrom(q.A, r, t, m);
    return [
      [q.A * (1 + r / 100 / m) ** n, 'wrongDirection'],
      [q.A / (1 + (r / 100) * t), 'simple'],
      ...(m > 1 ? [[q.A / (1 + r / 100 / m) ** t, 'rateOnly'], [q.A / (1 + r / 100) ** n, 'periodsOnly']] : []),
      [q.A - P0, 'interestForAmount'],
    ];
  }
  const A = compoundAmount(P, r, t, m);
  const base = kind === 'interest' ? P : 0;
  const list = [];
  if (kind === 'diff') list.push([A, 'amountForDiff']);
  if (kind === 'amount') list.push([A - P, 'interestForAmount']);
  if (kind === 'interest') list.push([A, 'amountForInterest']);
  list.push([simpleAmount(P, r, t) - base, 'simple']);
  if (m > 1) {
    list.push([P * (1 + r / 100 / m) ** t - base, 'rateOnly']);
    list.push([P * (1 + r / 100) ** (m * t) - base, 'periodsOnly']);
  } else {
    list.push([P * (1 + r) ** t - base, 'percentWhole']);
  }
  return list;
}

export function diagnose(q, value) {
  const hit = trapsFor(q).find(([trap]) => near(value, trap, Math.max(tolerance(q), Math.abs(trap) * 0.0002)));
  if (hit) return hit[1];
  const answer = exactAnswer(q);
  if (Math.abs(value - answer) <= Math.abs(answer) * 0.01) return 'close';
  return 'generic';
}

const sup = (n) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const plain = (v) => String(v);

export function hints(q) {
  if (q.hints) return q.hints;
  const n = q.m * q.t;
  const rate = num(q.r / q.m, 4);
  if (q.kind === 'rate') {
    return ['先列式：A = P(1 + r%)ⁿ，已知 A、P 和 n。', `兩邊除以 ${plain(q.P)}：(1 + r%)${sup(q.t)} = ${num(q.A / q.P, 4)}。`, '兩邊開方，再減 1，最後化成百分率。'];
  }
  const period = q.m > 1 ? `每期利率 = ${q.r}% ÷ ${q.m} = ${rate}%，期數 = ${q.m} × ${q.t} = ${n}。` : `每年一期，所以利率是 ${q.r}%，期數是 ${n}。`;
  if (q.kind === 'principal') return [period, `列式：${plain(q.A)} = P(1 + ${rate}%)${sup(n)}。`, `求 P：把 ${plain(q.A)} 除以 (1 + ${rate}%)${sup(n)}。`];
  const first = `A = ${plain(q.P)}(1 + ${rate}%)${sup(n)}`;
  if (q.kind === 'interest') return [period, `先求本利和：${first}。`, '利息 = 本利和 − 本金。全條算完才進位。'];
  if (q.kind === 'diff') return ['分開計算複利息和單利息的本利和。', `複利息：${first}；單利息：${plain(q.P)}(1 + ${q.r}% × ${q.t})。`, '兩個本利和相減，最後才進位。'];
  return [period, `代入 A = P(1 + r%)ⁿ：${first}。`, '用計算機算出結果，再進位至整數。'];
}

export function work(q) {
  if (q.work) return q.work;
  const n = q.m * q.t;
  const rate = num(q.r / q.m, 4);
  if (q.kind === 'rate') {
    return [`${plain(q.P)}(1 + r%)${sup(q.t)} = ${plain(q.A)}`, `(1 + r%)${sup(q.t)} = ${num(q.A / q.P, 4)}`, `1 + r% = ${num((q.A / q.P) ** (1 / q.t), 4)}`, `r = ${answerText(q).replace('%', '')}，年利率是 ${answerText(q)}`];
  }
  if (q.kind === 'principal') return [`${plain(q.A)} = P(1 + ${rate}%)${sup(n)}`, `P = ${plain(q.A)} ÷ (1 + ${rate}%)${sup(n)}`, `P ≈ ${answerText(q)}`];
  const A = compoundAmount(q.P, q.r, q.t, q.m);
  const lines = [`A = ${plain(q.P)}(1 + ${rate}%)${sup(n)} ≈ ${num(A, 2)}`];
  if (q.kind === 'interest') lines.push(`利息 = ${num(A, 2)} − ${plain(q.P)} ≈ ${answerText(q)}`);
  if (q.kind === 'diff') lines.push(`單利息本利和 = ${plain(q.P)}(1 + ${q.r}% × ${q.t}) = ${num(simpleAmount(q.P, q.r, q.t), 2)}`, `差距 ≈ ${answerText(q)}`);
  if (q.kind === 'amount') lines.push(`本利和 ≈ ${answerText(q)}`);
  return lines;
}

export function pickRound(random = Math.random) {
  const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const chosen = Object.entries(ROUND_QUOTA).flatMap(([topic, count]) => shuffle(QUESTIONS.filter((q) => q.topic === topic)).slice(0, count));
  return shuffle(chosen);
}

export const CLINIC = [
  {
    id: 'percent', student: '小晴', tag: '百分率代入',
    problem: '$8,000 存 3 年，年利率 5%，每年複利一次。求本利和。',
    steps: ['P = 8000，n = 3', 'A = 8000(1 + 5)³', 'A = $1,728,000'], wrong: 1,
    stepTip: '第一行的資料抄對了，再看看代入的數字。',
    options: ['A = 8000(1 + 0.05)³', 'A = 8000(1 + 5) × 3', 'A = 8000 × 0.05 × 3'], right: 0,
    wrongCurve: (t) => 8000 * 6 ** t, rightCurve: (t) => 8000 * 1.05 ** t, horizon: 3, wrongLabel: '小晴的算法', answer: '$9,261',
    lesson: '3 年變成 216 倍，常識已告訴我們不合理。5% 應寫成 0.05。',
  },
  {
    id: 'simple', student: '阿樂', tag: '單複混淆',
    problem: '$10,000 存 3 年，年利率 6%，每年複利一次。求本利和。',
    steps: ['每年利息 = 10000 × 6% = $600', '3 年利息 = $600 × 3 = $1,800', 'A = 10000 + 1800 = $11,800'], wrong: 1,
    stepTip: '第一年的利息確實是 $600，問題在之後的年份。',
    options: ['A = 10000 × 6% × 3', 'A = 10000(1 + 6%)³', 'A = 10000(1 + 6%) × 3'], right: 1,
    wrongCurve: (t) => 10000 * (1 + 0.06 * t), rightCurve: (t) => 10000 * 1.06 ** t, horizon: 12, wrongLabel: '阿樂的算法', answer: '$11,910',
    lesson: '阿樂每年都只計本金的利息，這是單利息。年期愈長，兩條線分得愈開。',
  },
  {
    id: 'asked', student: '子軒', tag: '本利和與利息',
    problem: '$20,000 存 2 年，年利率 4%，每年複利一次。求利息。',
    steps: ['A = 20000(1 + 4%)²', 'A = $21,632', '所以利息是 $21,632'], wrong: 2,
    stepTip: '算式和計算都正確，再讀一次題目問甚麼。',
    options: ['利息 = 21632 × 4%', '利息 = 21632 + 20000', '利息 = 21632 − 20000'], right: 2,
    wrongCurve: (t) => 20000 * 1.04 ** t, rightCurve: (t) => 20000 * 1.04 ** t - 20000, horizon: 2, wrongLabel: '本利和', rightLabel: '利息', answer: '$1,632',
    lesson: '本利和包括本金。利息是本利和減去本金，所以由 $0 開始。',
  },
  {
    id: 'periodsOnly', student: '思敏', tag: '只改期數',
    problem: '$6,000 存 2 年，年利率 8%，每半年複利一次。求本利和。',
    steps: ['每年 2 期，共 2 × 2 = 4 期', 'A = 6000(1 + 8%)⁴', 'A ≈ $8,163'], wrong: 1,
    stepTip: '期數計算正確，再看每期的利率。',
    options: ['A = 6000(1 + 4%)⁴', 'A = 6000(1 + 4%)²', 'A = 6000(1 + 16%)⁴'], right: 0,
    wrongCurve: (t) => 6000 * 1.08 ** (2 * t), rightCurve: (t) => 6000 * 1.04 ** (2 * t), horizon: 2, perYear: 2, wrongLabel: '思敏的算法', answer: '$7,019',
    lesson: '8% 是一年的利率。每半年只計一半，即 4%。',
  },
  {
    id: 'rateOnly', student: '家明', tag: '只改利率',
    problem: '$9,000 存 2 年，年利率 6%，每季複利一次。求本利和。',
    steps: ['每期利率 = 6% ÷ 4 = 1.5%', 'A = 9000(1 + 1.5%)²', 'A ≈ $9,272'], wrong: 1,
    stepTip: '每期利率正確，再數一數 2 年有多少季。',
    options: ['A = 9000(1 + 6%)⁸', 'A = 9000(1 + 1.5%)⁸', 'A = 9000(1 + 1.5%)⁴'], right: 1,
    wrongCurve: (t) => 9000 * 1.015 ** t, rightCurve: (t) => 9000 * 1.015 ** (4 * t), horizon: 2, perYear: 4, wrongLabel: '家明的算法', answer: '$10,138',
    lesson: 'r 和 n 要一起改：每季 1.5%，2 年共 8 季。',
  },
  {
    id: 'reverse', student: '嘉欣', tag: '反求本金',
    problem: '年利率 10%，每年複利一次，3 年後本利和為 $13,310。求本金。',
    steps: ['13310 = P(1 + 10%)³', 'P = 13310 × 1.1³', 'P ≈ $17,716'], wrong: 1,
    stepTip: '第一行列式正確，再想想怎樣把 P 留在一邊。',
    options: ['P = 13310 ÷ 1.1³', 'P = 13310 − 1.1³', 'P = 13310 ÷ (1.1 × 3)'], right: 0,
    wrongCurve: (t) => 13310 * 1.1 ** 3 * 1.1 ** t, rightCurve: (t) => 10000 * 1.1 ** t, horizon: 3, wrongLabel: '由 $17,716 開始', rightLabel: '由 $10,000 開始', answer: '$10,000', target: [3, 13310],
    lesson: '只有由正確本金出發的曲線，才會在第 3 年經過 $13,310。',
  },
];

export const FACTOR_OPTIONS = [
  { label: '1.8', code: 'percentWhole', tip: '8% 不是 0.8。8% = 8 ÷ 100，再想一次。' },
  { label: '1.08', correct: true },
  { label: '0.08', code: 'interestOnly', tip: '乘 0.08 只得到利息，本金不見了。要保留本金的「1」。' },
  { label: '8', code: 'whole', tip: '乘 8 代表每年變成 8 倍，太多了。' },
];

export const MATCH_ROWS = [
  { symbol: 'A', answer: '本利和（到期總額）' },
  { symbol: 'P', answer: '本金（開始的金額）' },
  { symbol: 'r%', answer: '每期利率' },
  { symbol: 'n', answer: '期數' },
];

export const PERIOD_TASKS = [
  { r: 6, t: 3, m: 4 },
  { r: 8, t: 2, m: 2 },
  { r: 12, t: 1, m: 12 },
];

export const WORKSHEET_IDS = ['a1', 'i1', 'p1', 'p3', 'b1', 'b3', 'c1', 'c3'];
