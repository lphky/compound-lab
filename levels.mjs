import { Chart, COLORS } from './chart.mjs';
import { compoundAmount, simpleAmount, curve, money, num, parseAnswer, near } from './math.mjs';
import { LEVELS, PERIODS, CLINIC, FACTOR_OPTIONS, MATCH_ROWS, PERIOD_TASKS, periodLabel } from './content.mjs';
import { $, $$, talk, slider, bindSlider, seg, bindSeg, feedback, stat, revealButton } from './ui.mjs';
import { mountLab, stackRows, STACK_PARTS } from './lab.mjs';
import { markDone, state } from './store.mjs';

const head = (n, goal) => `
  <section class="level-head"><p class="eyebrow">第 ${n} 關</p><h1>${LEVELS[n - 1].title}</h1><p>${goal}</p></section>`;

function foot(n) {
  const next = n < 6 ? `#level-${n + 1}` : '#lab';
  const label = n < 6 ? `下一關：${LEVELS[n].title}` : '到自由實驗';
  return `<div class="level-foot"><p id="status" role="status">${state.done[n] ? '本關已完成。' : '完成本頁任務後，這一關會標記為完成。'}</p><a class="button primary" href="${next}">${label} →</a></div>`;
}

function finish(main, n) {
  markDone(n);
  const status = $('#status', main);
  if (status) status.textContent = '本關已完成。';
}

export function level1(main) {
  const P = 10000;
  const r = 5;
  const years = 30;
  let guess = 25000;
  main.innerHTML = `${head(1, '先用直覺預測，再用圖表驗證。')}
    <div class="duo">${talk('dan', '我用單利息，每年利息都係 $500，好易計。')}${talk('fuk', '我用複利息，利息留喺戶口，下年一齊計息。')}</div>
    <div class="card">
      <h2>任務：預測複仔 30 年後有多少錢</h2>
      <p>兩人各存 <b>$10,000</b>，年利率 <b>5%</b>，存 <b>30 年</b>。上下拖動右邊的圓點，放在你預測的金額。</p>
      <div id="stage"></div>
      <div class="answer-row" id="guess-row">
        <label for="guess-input">我的預測 $</label>
        <input id="guess-input" inputmode="numeric" value="${guess}">
        <button type="button" class="primary" id="compare">比較結果</button>
      </div>
      <div class="stats" id="result" hidden></div>
      <div class="feedback" id="fb" hidden></div>
    </div>
    ${foot(1)}`;
  const stage = $('#stage', main);
  const input = $('#guess-input', main);
  const chart = new Chart(stage, {
    xMax: years,
    yMax: 60000,
    noCursor: true,
    series: [],
    aria: '預測圖表。用上下方向鍵改變預測金額。',
  });
  const setGuess = (value, typed = false) => {
    guess = value;
    if (!typed) input.value = value;
    chart.set({ handle: { x: years, y: Math.min(60000, Math.max(10000, value)), min: 10000, max: 60000, step: 500, label: `預測 ${money(value)}`, onChange: (v) => setGuess(v) } });
  };
  setGuess(guess);
  input.addEventListener('input', () => {
    const v = parseAnswer(input.value);
    if (v !== null) setGuess(v, true);
  });
  let lab = null;
  $('#compare', main).addEventListener('click', () => {
    if (parseAnswer(input.value) === null) {
      feedback($('#fb', main), 'retry', '請先輸入一個金額。');
      return;
    }
    const actual = compoundAmount(P, r, years);
    const simple = simpleAmount(P, r, years);
    chart.destroy();
    stage.className = '';
    stage.innerHTML = '';
    $('#guess-row', main).hidden = true;
    lab = mountLab(stage, { P, r, years, marks: [{ x: years, y: guess, label: `你的預測 ${money(guess)}`, color: '#17324a' }], controls: ['sliders', 'period', 'view', 'play', 'stats'] });
    lab.play();
    const diff = guess - actual;
    const closeEnough = Math.abs(diff) <= actual * 0.1;
    const linear = Math.abs(guess - simple) <= 1500;
    const text = closeEnough ? `你的預測與實際只差 ${money(Math.abs(diff))}，很接近。`
      : `你的預測比實際${diff < 0 ? '低' : '高'} ${money(Math.abs(diff))}。`;
    const why = linear ? '你的預測接近單利息的 $25,000，這是很常見的直線思維：以為每年增加的錢都一樣。'
      : '留意複利息曲線：開始時和直線很接近，後來愈走愈陡。';
    feedback($('#fb', main), 'correct', `<b>${text}</b> ${why}<br>30 年後，單利息是 ${money(simple)}，複利息約 ${money(actual)}，相差 ${money(actual - simple)}。試改動上面的條件，再按「播放」。`);
    finish(main, 1);
  });
  return () => { lab ? lab.destroy() : chart.destroy(); };
}

export function level2(main) {
  const P = 10000;
  const maxYear = 10;
  const check = 3;
  let r = 10;
  let year = 0;
  let solved = false;
  main.innerHTML = `${head(2, '複利息的關鍵：上一期的利息，會成為下一期計息的金額。')}
    <div class="duo">${talk('fuk', '撳「過一年」，睇吓我啲利息點樣再生利息。')}</div>
    <div class="card">
      <div class="toolbar"><div class="tool"><span>年利率</span>${seg('rate', '年利率', [5, 10, 15].map((v) => ({ value: v, label: `${v}%` })), r)}</div><div class="tool"><span>本金</span><b>$10,000</b></div></div>
      <div class="chart-host"></div>
      <div class="player">
        <button type="button" class="primary" id="next-year">過一年 ▶</button>
        <button type="button" id="prev-year">◀ 退一年</button>
        <button type="button" id="reset-year">重新開始</button>
      </div>
      <div class="ledger" id="ledger" aria-live="polite"></div>
      <form class="checkpoint" id="checkpoint" hidden>
        <h3>先想一想：第 ${check + 1} 年的利息是多少？</h3>
        <div class="answer-row"><label for="cp">$</label><input id="cp" inputmode="decimal" autocomplete="off"><button class="primary">檢查</button>${revealButton('cp-reveal')}</div>
        <div class="feedback" id="cp-fb" hidden></div>
      </form>
      <div class="feedback" id="cp-done" hidden></div>
    </div>
    ${foot(2)}`;
  const chart = new Chart($('.chart-host', main), {
    xMax: maxYear,
    series: [],
    cursor: 0,
    aria: '本利和組成圖。每條柱代表一年。',
    onCursor: (x) => { year = x; ledger(); },
  });
  const amount = (t) => compoundAmount(P, r, t);
  const answer = () => amount(check) * (r / 100);
  function ledger() {
    const open = year > 0 ? amount(year - 1) : P;
    const interest = open * (r / 100);
    const fromP = P * (r / 100);
    $('#ledger', main).innerHTML = year === 0
      ? '<p>第 0 年：戶口只有本金 $10,000。</p>'
      : `<p><b>第 ${year} 年：</b>年初 ${money(open)} × ${r}% = 本年利息 <b>${money(interest)}</b></p>
         <p class="split"><span><i class="swatch" style="background:${COLORS.simple}"></i>本金產生 ${money(fromP)}</span><span><i class="swatch" style="background:${COLORS.compound}"></i>舊利息產生 ${money(interest - fromP)}</span></p>
         <p>年底本利和：<b>${money(amount(year))}</b></p>`;
  }
  function draw() {
    const gated = year === check && !solved;
    $('#checkpoint', main).hidden = !gated;
    $('#next-year', main).disabled = gated || year >= maxYear;
    $('#prev-year', main).disabled = year === 0;
    chart.set({
      yMax: amount(maxYear),
      cursor: year,
      reveal: year,
      stack: { parts: STACK_PARTS, rows: stackRows(P, r, maxYear, 1, year) },
      readout: (x) => ({ title: `第 ${x ?? year} 年`, rows: [{ label: '本利和', value: money(amount(x ?? year)) }] }),
    });
    ledger();
    if (year >= maxYear && solved) {
      finish(main, 2);
      $('#status', main).textContent = `本關已完成。第 1 年利息 ${money(P * r / 100)}，第 10 年利息 ${money(amount(9) * r / 100)}，因為計息的金額愈來愈大。`;
    }
  }
  const pass = () => { solved = true; draw(); };
  $('#next-year', main).addEventListener('click', () => { year = Math.min(maxYear, year + 1); draw(); });
  $('#prev-year', main).addEventListener('click', () => { year = Math.max(0, year - 1); draw(); });
  $('#reset-year', main).addEventListener('click', () => { year = 0; draw(); });
  bindSeg(main, 'rate', (v) => { r = Number(v); $('#cp-fb', main).hidden = true; draw(); });
  $('#checkpoint', main).addEventListener('submit', (e) => {
    e.preventDefault();
    const fb = $('#cp-fb', main);
    const value = parseAnswer($('#cp', main).value);
    if (value === null) { feedback(fb, 'retry', '請輸入金額。'); return; }
    if (near(value, answer(), 1)) {
      feedback($('#cp-done', main), 'correct', `<b>正確！</b>第 ${check + 1} 年是用 ${money(amount(check))} 計息，所以利息比第 1 年多。`);
      pass();
    } else if (near(value, P * r / 100, 1)) {
      feedback(fb, 'retry', '這是只用本金計算的利息，即單利息。下一步：用第 4 年<b>年初</b>的本利和乘年利率。');
    } else if (near(value, amount(check + 1), 1)) {
      feedback(fb, 'retry', '這是第 4 年年底的本利和，不是利息。下一步：只計算當年新增的部分。');
    } else {
      feedback(fb, 'retry', '未正確。下一步：看看圖上第 3 年的本利和，再乘年利率。');
    }
  });
  $('#cp-reveal', main).addEventListener('click', () => {
    feedback($('#cp-done', main), 'correct', `答案：${money(amount(check))} × ${r}% = ${money(answer())}`);
    pass();
  });
  draw();
  return () => chart.destroy();
}

export function level3(main) {
  const P = 10000;
  let count = 0;
  const flags = { build: false, factor: false, match: false };
  main.innerHTML = `${head(3, '由重複相乘推導 A = P(1 + r%)ⁿ，再看算式每個部分在圖上代表甚麼。')}
    <div class="card" id="factory">
      <h2>步驟一：砌出算式</h2>
      <p>本金 $10,000，年利率 5%。每過一年，本利和都變成原來的 105%，即 ×1.05。至少按 3 次。</p>
      <div class="player"><button type="button" class="primary" id="times">× 1.05（過一年）</button><button type="button" id="undo">退回</button></div>
      <p class="chain" id="chain" aria-live="polite"></p>
      <div class="chart-host"></div>
    </div>
    <div class="card">
      <h2>步驟二：年利率 8% 時，每年要乘多少？</h2>
      <div class="choices" id="factor">${FACTOR_OPTIONS.map((o, i) => `<button type="button" data-i="${i}">× ${o.label}</button>`).join('')}${revealButton('factor-reveal')}</div>
      <div class="feedback" id="factor-fb" hidden></div>
    </div>
    <form class="card" id="match">
      <h2>步驟三：配對符號</h2>
      <p class="formula">A = P(1 + r%)<sup>n</sup></p>
      <div class="match-grid">${MATCH_ROWS.map((row) => `<label><b>${row.symbol}</b><select data-symbol="${row.symbol}"><option value="">請選擇</option>${[...MATCH_ROWS].sort((a, b) => a.answer.localeCompare(b.answer, 'zh-Hant')).map((o) => `<option>${o.answer}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="player"><button class="primary">檢查配對</button>${revealButton('match-reveal')}</div>
      <div class="feedback" id="match-fb" hidden></div>
    </form>
    <div class="card">
      <h2>步驟四：改動 P、r、n</h2>
      <p>按算式中的 A、P、r 或 n，圖上會標示它的位置。拖動圖表或時間軸可以改變 n。</p>
      <div id="live-lab"></div>
    </div>
    ${foot(3)}`;
  const chart = new Chart($('#factory .chart-host', main), {
    xMax: 10,
    yMax: compoundAmount(P, 5, 10),
    noCursor: true,
    series: [],
    height: 240,
    aria: '每乘一次 1.05 後的本利和。',
  });
  const lab = mountLab($('#live-lab', main), { P, r: 5, years: 20, cursor: 10, controls: ['sliders', 'play', 'formula'] });
  const check = () => { if (Object.values(flags).every(Boolean)) finish(main, 3); };
  function drawChain() {
    const long = `10,000 ${Array(count).fill('× <mark>1.05</mark>').join(' ')}`;
    const short = count === 0 ? '開始時只有本金' : count === 1 ? '過了 1 年' : `= 10,000 × 1.05<sup>${count}</sup>`;
    $('#chain', main).innerHTML = `${long}<br><span>${short} = <b>${money(compoundAmount(P, 5, count))}</b></span>${count >= 3 ? '<br><em>同一個數字重複相乘，可以寫成指數。乘了多少次，指數就是多少。</em>' : ''}`;
    chart.set({
      series: [{ id: 'chain', endLabel: false, label: '本利和', color: COLORS.compound, points: curve((t) => compoundAmount(P, 5, t), 0, count) }],
      marks: [{ x: count, y: compoundAmount(P, 5, count), label: `n = ${count}`, color: COLORS.compound }],
    });
    $('#times', main).disabled = count >= 10;
    $('#undo', main).disabled = count === 0;
    if (count >= 3) { flags.build = true; check(); }
  }
  $('#times', main).addEventListener('click', () => { count += 1; drawChain(); });
  $('#undo', main).addEventListener('click', () => { count -= 1; drawChain(); });
  const solveFactor = () => {
    flags.factor = true;
    feedback($('#factor-fb', main), 'correct', '對：1 代表保留本金，0.08 代表新增的 8%。所以每年乘 (1 + 8%) = 1.08。');
    check();
  };
  $('#factor', main).addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const option = FACTOR_OPTIONS[b.dataset.i];
    if (option.correct) solveFactor();
    else feedback($('#factor-fb', main), 'retry', option.tip);
  });
  $('#factor-reveal', main).addEventListener('click', solveFactor);
  const solveMatch = () => {
    $$('#match select', main).forEach((el) => { el.value = MATCH_ROWS.find((row) => row.symbol === el.dataset.symbol).answer; });
    flags.match = true;
    feedback($('#match-fb', main), 'correct', '全部正確。留意 r% 是<b>每期</b>利率，n 是<b>期數</b>。每年複利時，一期就是一年。');
    check();
  };
  $('#match', main).addEventListener('submit', (e) => {
    e.preventDefault();
    const wrong = $$('#match select', main).filter((el) => el.value !== MATCH_ROWS.find((row) => row.symbol === el.dataset.symbol).answer);
    if (wrong.length) feedback($('#match-fb', main), 'retry', `還有 ${wrong.length} 項未配對正確：${wrong.map((el) => el.dataset.symbol).join('、')}。`);
    else solveMatch();
  });
  $('#match-reveal', main).addEventListener('click', solveMatch);
  drawChain();
  return () => { chart.destroy(); lab.destroy(); };
}

export function level4(main) {
  const s = { P: 10000, r: 8, years: 10, m: 4, cursor: 10 };
  const flags = { predict: false, tasks: 0 };
  main.innerHTML = `${head(4, '複利次數改變時，每期利率和期數要一起調整。')}
    <div class="card">
      <h2>先預測</h2>
      <p>本金、年利率和年期都不變。把「每年複利」改為「每月複利」，本利和會怎樣？</p>
      <div class="choices" id="predict"><button type="button" data-v="up">變大</button><button type="button" data-v="same">不變</button><button type="button" data-v="down">變小</button>${revealButton('predict-reveal')}</div>
      <div class="feedback" id="predict-fb" hidden></div>
    </div>
    <div class="card">
      <h2>切換週期</h2>
      <div class="sliders">
        ${slider({ id: 'f-p', label: '本金 P', min: 1000, max: 100000, step: 1000, value: s.P, text: money })}
        ${slider({ id: 'f-r', label: '年利率', min: 1, max: 15, step: 0.5, value: s.r, text: (v) => `${v}%` })}
        ${slider({ id: 'f-y', label: '年期', min: 1, max: 30, step: 1, value: s.years, text: (v) => `${v} 年` })}
      </div>
      <div class="toolbar"><div class="tool"><span>複利週期</span>${seg('period', '複利週期', PERIODS.map((p) => ({ value: p.m, label: p.label })), s.m)}</div></div>
      <p class="formula" id="period-formula"></p>
      <div class="period-steps" id="period-steps"></div>
      <div class="chart-host"></div>
      <h3>各週期所得利息</h3>
      <div class="hbars" id="hbars"></div>
      <p class="note" id="hbar-note"></p>
    </div>
    <div class="card">
      <h2>練習：調整 r 和 n</h2>
      <div id="tasks">${PERIOD_TASKS.map((t, i) => `<form class="task" data-i="${i}">
        <p>年利率 ${t.r}%，存 ${t.t} 年，${periodLabel(t.m)}複利一次</p>
        <div class="answer-row"><label>每期利率 <input name="rate" inputmode="decimal" autocomplete="off"> %</label><label>期數 <input name="n" inputmode="numeric" autocomplete="off"></label><button class="primary">檢查</button>${revealButton(`task-reveal-${i}`)}</div>
        <div class="feedback" hidden></div></form>`).join('')}</div>
    </div>
    ${foot(4)}`;
  const chart = new Chart($('.chart-host', main), { cursor: s.years, onCursor: (x) => { s.cursor = x; draw(); }, aria: '所選複利週期與每年複利的比較圖。' });
  const check = () => { if (flags.predict && flags.tasks === PERIOD_TASKS.length) finish(main, 4); };
  function draw() {
    const { P, r, years, m } = s;
    s.cursor = Math.min(s.cursor, years);
    const n = m * years;
    const rate = num(r / m, 4);
    $('#period-formula', main).innerHTML = `A = ${P.toLocaleString('en-US')}(1 + ${rate}%)<sup>${n}</sup> = <b>${money(compoundAmount(P, r, years, m))}</b>`;
    $('#period-steps', main).innerHTML = `<span>每期利率 <b>${r}% ÷ ${m} = ${rate}%</b></span><span>期數 <b>${m} × ${years} = ${n}</b></span>`;
    const annual = (t) => compoundAmount(P, r, t);
    const chosen = (t) => compoundAmount(P, r, t, m);
    chart.set({
      xMax: years,
      cursor: s.cursor,
      yMax: chosen(years),
      series: [
        { id: 'annual', label: '每年複利', color: COLORS.simple, dash: '7 5', points: curve(annual, 0, years) },
        ...(m === 1 ? [] : [{ id: 'chosen', label: `${periodLabel(m)}複利`, color: COLORS.compound, points: curve(chosen, 0, years, m) }]),
      ],
      readout: (x) => ({ title: `第 ${x ?? years} 年`, rows: [{ label: '每年複利', value: money(annual(x ?? years)), color: COLORS.simple }, ...(m === 1 ? [] : [{ label: `${periodLabel(m)}複利`, value: money(chosen(x ?? years)), color: COLORS.compound }, { label: '多了', value: money(chosen(x ?? years) - annual(x ?? years)) }])] }),
    });
    const top = compoundAmount(P, r, years, 12) - P;
    $('#hbars', main).innerHTML = PERIODS.map((p) => {
      const interest = compoundAmount(P, r, years, p.m) - P;
      return `<div class="hbar${p.m === m ? ' on' : ''}"><span>${p.label}</span><div><i style="width:${(interest / top) * 100}%"></i></div><b>${money(interest)}</b></div>`;
    }).join('');
    $('#hbar-note', main).textContent = `每月複利比每年複利多得 ${money(top + P - annual(years))}。結算次數增加 12 倍，利息只多了 ${num(((top + P - annual(years)) / (annual(years) - P)) * 100, 1)}%。`;
  }
  bindSeg(main, 'period', (v) => { s.m = Number(v); draw(); });
  [['f-p', 'P', money], ['f-r', 'r', (v) => `${v}%`], ['f-y', 'years', (v) => `${v} 年`]].forEach(([id, key, text]) => bindSlider(main, { id, text }, (v) => {
    s[key] = v;
    if (key === 'years') s.cursor = v;
    draw();
  }));
  const solvePredict = () => {
    flags.predict = true;
    feedback($('#predict-fb', main), 'correct', '<b>會變大。</b>結算愈密，利息愈早加入本金，生息的時間就愈長。但增幅有限，切換週期看看。');
    check();
  };
  $('#predict', main).addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    if (b.dataset.v === 'up') solvePredict();
    else feedback($('#predict-fb', main), 'retry', '先看下面的圖：切換「每年」和「每月」，比較本利和，再作答。');
  });
  $('#predict-reveal', main).addEventListener('click', solvePredict);
  const solved = new Set();
  const solveTask = (i, form) => {
    if (!solved.has(i)) { solved.add(i); flags.tasks = solved.size; }
    const t = PERIOD_TASKS[i];
    feedback($('.feedback', form), 'correct', `正確：每期利率 ${t.r}% ÷ ${t.m} = ${num(t.r / t.m, 2)}%，期數 ${t.m} × ${t.t} = ${t.m * t.t}。`);
    check();
  };
  $$('.task', main).forEach((form) => {
    const i = Number(form.dataset.i);
    const t = PERIOD_TASKS[i];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rate = parseAnswer(form.elements.rate.value);
      const n = parseAnswer(form.elements.n.value);
      const fb = $('.feedback', form);
      if (rate === null || n === null) { feedback(fb, 'retry', '兩格都要填寫。'); return; }
      const rateOk = near(rate, t.r / t.m, 0.001);
      const nOk = n === t.m * t.t;
      if (rateOk && nOk) solveTask(i, form);
      else if (rateOk) feedback(fb, 'retry', `每期利率正確，但期數未改好。下一步：${t.t} 年內共有多少個「${PERIODS.find((p) => p.m === t.m).unit}」？`);
      else if (nOk) feedback(fb, 'retry', `期數正確，但利率仍未調整。下一步：把年利率平均分到一年的 ${t.m} 期。`);
      else feedback(fb, 'retry', '兩格都要調整。下一步：利率要除以每年的複利次數，期數要乘以它。');
    });
    $(`#task-reveal-${i}`, form).addEventListener('click', () => solveTask(i, form));
  });
  draw();
  return () => chart.destroy();
}

export function level5(main) {
  let index = 0;
  let chart = null;
  const fixed = new Set();
  main.innerHTML = `${head(5, '每份功課都有一步出錯。先找出錯處，再改正，然後用圖表比較。')}
    <div class="case-tabs" id="case-tabs"></div>
    <div class="card" id="case"></div>
    ${foot(5)}`;
  function tabs() {
    $('#case-tabs', main).innerHTML = CLINIC.map((c, i) => `<button type="button" data-i="${i}" aria-current="${i === index}">${fixed.has(i) ? '✓ ' : ''}${c.tag}</button>`).join('');
  }
  function comparison(c, withRight) {
    const steps = c.perYear ?? 1;
    const horizon = c.horizon;
    const wrong = curve(c.wrongCurve, 0, horizon, steps);
    const right = curve(c.rightCurve, 0, horizon, steps);
    chart.set({
      xMax: horizon,
      series: [
        { id: 'wrong', label: c.wrongLabel, color: COLORS.simple, dash: '7 5', points: wrong },
        ...(withRight ? [{ id: 'right', label: c.rightLabel ?? '正確算法', color: COLORS.compound, points: right }] : []),
      ],
      marks: c.target ? [{ x: c.target[0], y: c.target[1], label: '目標 $13,310', color: '#17324a' }] : [],
      cursor: horizon,
      readout: (x) => ({ title: `第 ${x ?? horizon} 年`, rows: [{ label: c.wrongLabel, value: money(c.wrongCurve(x ?? horizon)), color: COLORS.simple }, ...(withRight ? [{ label: c.rightLabel ?? '正確算法', value: money(c.rightCurve(x ?? horizon)), color: COLORS.compound }] : [])] }),
    });
  }
  function open(i) {
    index = i;
    chart?.destroy();
    tabs();
    const c = CLINIC[i];
    const host = $('#case', main);
    host.innerHTML = `
      <p class="eyebrow">病歷 ${i + 1} / ${CLINIC.length} · 虛構學生：${c.student}</p>
      <h2>${c.problem}</h2>
      <p>${c.student}的做法：按一下你認為出錯的一行。</p>
      <div class="work" id="work">${c.steps.map((line, k) => `<button type="button" data-k="${k}"><span>${k + 1}</span>${line}</button>`).join('')}</div>
      ${revealButton('case-reveal')}
      <div class="feedback" id="step-fb" hidden></div>
      <div id="fix" hidden><h3>應該改成哪一條？</h3><div class="choices column" id="fix-options">${c.options.map((o, k) => `<button type="button" data-k="${k}">${o}</button>`).join('')}</div><div class="feedback" id="fix-fb" hidden></div></div>
      <div class="chart-host"></div>
      <div class="player" id="case-next" hidden><button type="button" class="primary">${i < CLINIC.length - 1 ? '下一位病人 →' : '查看全部病歷'}</button></div>`;
    chart = new Chart($('.chart-host', host), { cursor: c.horizon, snap: 1 / (c.perYear ?? 1), aria: `${c.student}的算法與正確算法比較圖。` });
    comparison(c, fixed.has(i));
    const locate = () => {
      $$('#work button', host).forEach((b) => b.classList.toggle('picked', Number(b.dataset.k) === c.wrong));
      feedback($('#step-fb', host), 'correct', `找到了：第 ${c.wrong + 1} 行出錯。`);
      $('#fix', host).hidden = false;
    };
    const cure = () => {
      fixed.add(i);
      tabs();
      feedback($('#fix-fb', host), 'correct', `<b>正確答案：${c.answer}。</b>${c.lesson}`);
      comparison(c, true);
      $('#case-next', host).hidden = false;
      if (fixed.size === CLINIC.length) finish(main, 5);
    };
    $('#work', host).addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      if (Number(b.dataset.k) === c.wrong) locate();
      else feedback($('#step-fb', host), 'retry', c.stepTip);
    });
    $('#fix-options', host).addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      if (Number(b.dataset.k) === c.right) cure();
      else feedback($('#fix-fb', host), 'retry', '這一條仍有問題。下一步：把題目的 P、每期利率和期數逐一對照。');
    });
    $('#case-reveal', host).addEventListener('click', () => { locate(); cure(); });
    $('#case-next button', host).addEventListener('click', () => {
      const next = CLINIC.findIndex((_, k) => !fixed.has(k));
      open(next === -1 ? 0 : next);
    });
  }
  $('#case-tabs', main).addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) open(Number(b.dataset.i)); });
  open(0);
  return () => chart?.destroy();
}

