import { Chart, COLORS } from './chart.mjs';
import { compoundAmount, simpleAmount, curve, breakdown, schedule, money, num, perPeriod } from './math.mjs';
import { PERIODS, periodLabel } from './content.mjs';
import { $, slider, bindSlider, seg, bindSeg, stat } from './ui.mjs';
import { state as store } from './store.mjs';

const SLIDERS = {
  P: { id: 'lab-p', label: '本金 P', min: 1000, max: 100000, step: 1000, text: (v) => money(v) },
  r: { id: 'lab-r', label: '年利率', min: 0.5, max: 15, step: 0.5, text: (v) => `${v}%` },
  years: { id: 'lab-y', label: '年期', min: 1, max: 40, step: 1, text: (v) => `${v} 年` },
};

export const STACK_PARTS = [
  { id: 'principal', label: '本金', color: COLORS.principal },
  { id: 'iop', label: '本金產生的利息', color: COLORS.simple },
  { id: 'ioi', label: '利息產生的利息', color: COLORS.compound },
];

export function stackRows(P, r, years, m = 1, upTo = years) {
  return schedule(P, r, years, m).filter((row) => row.year <= upTo).map((row) => ({
    x: row.year,
    values: [row.principal, row.interestOnPrincipal, row.interestOnInterest],
  }));
}

export function formulaHtml({ P, r, m }, n) {
  const { rate, n: periods } = perPeriod(r, n, m);
  const value = compoundAmount(P, r, n, m);
  return `<span data-part="A" tabindex="0" role="button">A</span> = <span data-part="P" tabindex="0" role="button">${P.toLocaleString('en-US')}</span>(1 + <span data-part="r" tabindex="0" role="button">${num(rate, 4)}%</span>)<sup data-part="n" tabindex="0" role="button">${periods}</sup> = <b>${money(value)}</b>`;
}

export function mountLab(host, init = {}) {
  const s = { P: 10000, r: 5, years: 30, m: 1, mode: 'line', gap: true, table: false, reveal: null, marks: [], focus: null, ...init };
  s.cursor = init.cursor ?? s.years;
  const show = new Set(init.controls ?? ['sliders', 'period', 'view', 'play', 'formula', 'stats']);
  let timer = null;
  host.classList.add('lab');
  host.innerHTML = `
    ${show.has('sliders') ? `<div class="sliders">${Object.entries(SLIDERS).map(([k, d]) => slider({ ...d, value: s[k] })).join('')}</div>` : ''}
    <div class="toolbar">
      ${show.has('period') ? `<div class="tool"><span>複利週期</span>${seg('period', '複利週期', PERIODS.map((p) => ({ value: p.m, label: p.label })), s.m)}</div>` : ''}
      ${show.has('view') ? `<div class="tool"><span>圖表</span>${seg('mode', '圖表類型', [{ value: 'line', label: '曲線' }, { value: 'stack', label: '組成' }], s.mode)}</div>
      <div class="tool checks"><label><input type="checkbox" id="gap-toggle" ${s.gap ? 'checked' : ''}>顯示差距</label><label><input type="checkbox" id="table-toggle" ${s.table ? 'checked' : ''}>數據表</label></div>` : ''}
    </div>
    <div class="chart-host"></div>
    ${show.has('play') ? `<div class="player">
      <button type="button" class="primary" id="play">▶ 播放</button>
      <button type="button" id="step-back" aria-label="上一年">−1 年</button>
      <button type="button" id="step-next" aria-label="下一年">+1 年</button>
      <label class="timeline" for="timeline"><span>時間軸</span><input id="timeline" type="range" min="0" max="${s.years}" step="1" value="${s.cursor}"></label>
    </div>` : ''}
    ${show.has('formula') ? '<p class="formula live" id="live-formula"></p><p class="formula-note" id="formula-note"></p>' : ''}
    ${show.has('stats') ? '<div class="stats" id="lab-stats"></div>' : ''}
    <div class="table-wrap" id="lab-table" hidden></div>`;

  const chart = new Chart($('.chart-host', host), {
    aria: '單利息與複利息互動圖表。用左右方向鍵逐年移動。',
    onCursor: (x) => { s.cursor = x; syncText(); },
  });

  function spec() {
    const { P, r, years, m, mode, gap } = s;
    const simplePts = curve((t) => simpleAmount(P, r, t), 0, years, 1);
    const compoundPts = curve((t) => compoundAmount(P, r, t, m), 0, years, m > 4 && years > 20 ? 4 : m);
    const yearly = schedule(P, r, years, m);
    const yMax = Math.max(compoundAmount(P, r, years, m), ...s.marks.map((k) => k.y));
    const readout = (x) => {
      const year = x ?? years;
      const part = breakdown(P, r, year, m);
      return {
        title: `第 ${year} 年`,
        rows: mode === 'stack'
          ? [{ label: '本金', value: money(part.principal), color: COLORS.principal }, { label: '本金的利息', value: money(part.interestOnPrincipal), color: COLORS.simple }, { label: '利息的利息', value: money(part.interestOnInterest), color: COLORS.compound }]
          : [{ label: '單利息', value: money(simpleAmount(P, r, year)), color: COLORS.simple }, { label: '複利息', value: money(part.amount), color: COLORS.compound }, { label: '差距', value: money(part.interestOnInterest) }],
      };
    };
    const base = { xMax: years, yMax, cursor: s.cursor, reveal: s.reveal, readout, marks: mode === 'line' ? s.marks : [] };
    if (mode === 'stack') {
      return { ...base, series: [], band: null, hline: null, vspan: null, stepNote: null, stack: { parts: STACK_PARTS, rows: stackRows(P, r, years, m, s.reveal ?? years) } };
    }
    const f = s.focus;
    const n = s.cursor;
    return {
      ...base,
      stack: null,
      series: [
        { id: 'simple', label: '單利息', color: COLORS.simple, dash: '7 5', points: simplePts },
        { id: 'compound', label: '複利息', color: COLORS.compound, points: compoundPts },
      ],
      band: gap ? { color: COLORS.compound, label: '差距', rows: yearly.map((row) => [row.year, row.simple, row.compound]) } : null,
      hline: f === 'P' ? { y: P, label: `P = ${money(P)}` } : f === 'A' ? { y: compoundAmount(P, r, n, m), label: `A = ${money(compoundAmount(P, r, n, m))}` } : null,
      vspan: f === 'n' ? n : null,
      stepNote: f === 'r' && n >= 1 ? { x0: n - 1, x1: n, y0: compoundAmount(P, r, n - 1, m), y1: compoundAmount(P, r, n, m), label: `×${num((1 + r / 100 / m) ** m, 4)}` } : null,
    };
  }

  function syncText() {
    const n = s.cursor;
    const formula = $('#live-formula', host);
    if (formula) {
      formula.innerHTML = formulaHtml(s, n);
      formula.querySelectorAll('[data-part]').forEach((el) => el.classList.toggle('on', el.dataset.part === s.focus));
      const { rate, n: periods } = perPeriod(s.r, n, s.m);
      $('#formula-note', host).textContent = s.m === 1
        ? `每年一期：每期利率 ${s.r}%，共 ${periods} 期。`
        : `${periodLabel(s.m)}複利：每期利率 ${s.r}% ÷ ${s.m} = ${num(rate, 4)}%，期數 ${s.m} × ${n} = ${periods}。`;
    }
    const timeline = $('#timeline', host);
    if (timeline) { timeline.max = s.years; timeline.value = n; }
    const stats = $('#lab-stats', host);
    if (stats) {
      const a = compoundAmount(s.P, s.r, n, s.m);
      const b = simpleAmount(s.P, s.r, n);
      stats.innerHTML = stat('單利息本利和', money(b)) + stat('複利息本利和', money(a)) + stat('差距', money(a - b), '即利息產生的利息');
    }
    const table = $('#lab-table', host);
    table.hidden = !s.table;
    if (s.table) {
      table.innerHTML = `<table><caption>每年數據（${periodLabel(s.m)}複利）</caption><thead><tr><th scope="col">年</th><th scope="col">單利息本利和</th><th scope="col">複利息本利和</th><th scope="col">差距</th></tr></thead><tbody>${schedule(s.P, s.r, s.years, s.m).map((row) => `<tr${row.year === n ? ' class="current"' : ''}><th scope="row">${row.year}</th><td>${money(row.simple)}</td><td>${money(row.compound)}</td><td>${money(row.gap)}</td></tr>`).join('')}</tbody></table>`;
      const current = $('.current', table);
      if (current) table.scrollTop = Math.max(0, current.offsetTop - table.clientHeight / 2);
    }
    s.onChange?.(s);
  }

  function draw() {
    chart.set(spec());
    syncText();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    const button = $('#play', host);
    if (button) button.textContent = '▶ 播放';
  }

  function tick() {
    s.reveal += 1;
    s.cursor = s.reveal;
    if (s.reveal >= s.years) { s.reveal = null; s.cursor = s.years; stop(); }
    draw();
  }

  function play() {
    if (timer) { stop(); return; }
    if (s.reveal === null || s.reveal >= s.years) { s.reveal = 0; s.cursor = 0; }
    const button = $('#play', host);
    if (button) button.textContent = '❚❚ 暫停';
    if (store.prefs.calm || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.reveal = null;
      s.cursor = s.years;
      stop();
      draw();
      return;
    }
    draw();
    timer = setInterval(tick, Math.min(500, Math.max(90, 6000 / s.years)));
  }

  if (show.has('sliders')) {
    Object.entries(SLIDERS).forEach(([key, def]) => bindSlider(host, def, (value) => {
      stop();
      s.reveal = null;
      if (key === 'years') s.cursor = value;
      s[key] = value;
      s.cursor = Math.min(s.cursor, s.years);
      draw();
    }));
  }
  if (show.has('period')) bindSeg(host, 'period', (v) => { s.m = Number(v); draw(); });
  if (show.has('view')) {
    bindSeg(host, 'mode', (v) => { s.mode = v; draw(); });
    $('#gap-toggle', host).addEventListener('change', (e) => { s.gap = e.target.checked; draw(); });
    $('#table-toggle', host).addEventListener('change', (e) => { s.table = e.target.checked; draw(); });
  }
  if (show.has('play')) {
    $('#play', host).addEventListener('click', play);
    const step = (delta) => {
      stop();
      const next = Math.min(s.years, Math.max(0, s.cursor + delta));
      s.cursor = next;
      s.reveal = next >= s.years ? null : next;
      draw();
    };
    $('#step-back', host).addEventListener('click', () => step(-1));
    $('#step-next', host).addEventListener('click', () => step(1));
    $('#timeline', host).addEventListener('input', (e) => {
      stop();
      s.reveal = null;
      s.cursor = Number(e.target.value);
      draw();
    });
  }
  if (show.has('formula')) {
    const formula = $('#live-formula', host);
    const pick = (e) => {
      const part = e.target.closest('[data-part]');
      if (!part) return;
      s.focus = s.focus === part.dataset.part ? null : part.dataset.part;
      draw();
    };
    formula.addEventListener('click', pick);
    formula.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
  }

  draw();
  return {
    state: s,
    play,
    draw,
    set(patch) { Object.assign(s, patch); draw(); },
    destroy() { stop(); chart.destroy(); },
  };
}

const SCENARIOS = [
  { id: 'core', label: '單複比較' },
  { id: 'early', label: '早開始與遲開始' },
  { id: 'debt', label: '欠款增長' },
  { id: 'change', label: '延伸：增長與折舊' },
];

function miniScenario(host, { sliders, intro, compute }) {
  host.innerHTML = `<p class="lead">${intro}</p><div class="sliders">${sliders.map((d) => slider(d)).join('')}</div><div class="chart-host"></div><div class="stats" id="s-stats"></div><p class="note" id="s-note"></p>`;
  const v = Object.fromEntries(sliders.map((d) => [d.key, d.value]));
  const chart = new Chart($('.chart-host', host), { cursor: null, aria: '情境比較互動圖表。用左右方向鍵逐年移動。' });
  const draw = () => {
    const out = compute(v);
    chart.set({ ...out.chart, cursor: Math.min(chart.spec.cursor ?? out.chart.xMax, out.chart.xMax), onCursor: draw });
    $('#s-stats', host).innerHTML = out.stats;
    $('#s-note', host).textContent = out.note;
  };
  sliders.forEach((d) => bindSlider(host, d, (value) => { v[d.key] = value; chart.spec.cursor = null; draw(); }));
  draw();
  return { destroy: () => chart.destroy() };
}

const moneyText = (v) => money(v);
const SCENARIO_MOUNT = {
  core: (host) => mountLab(host, { years: 30 }),
  early: (host) => miniScenario(host, {
    intro: '兩人存入相同金額，年利率相同，每年複利。唯一分別是遲開始的人晚了幾年才存入。',
    sliders: [
      { key: 'P', id: 'e-p', label: '存入金額', min: 1000, max: 50000, step: 1000, value: 10000, text: moneyText },
      { key: 'r', id: 'e-r', label: '年利率', min: 1, max: 12, step: 0.5, value: 5, text: (x) => `${x}%` },
      { key: 'late', id: 'e-l', label: '遲開始', min: 1, max: 20, step: 1, value: 10, text: (x) => `${x} 年後` },
      { key: 'years', id: 'e-y', label: '觀察年期', min: 21, max: 45, step: 1, value: 40, text: (x) => `${x} 年` },
    ],
    compute: ({ P, r, late, years }) => {
      const early = (t) => compoundAmount(P, r, t);
      const lateFn = (t) => compoundAmount(P, r, t - late);
      return {
        chart: {
          xMax: years,
          yMax: early(years),
          series: [
            { id: 'early', label: '早開始', color: COLORS.compound, points: curve(early, 0, years) },
            { id: 'late', label: '遲開始', color: COLORS.simple, dash: '7 5', points: curve(lateFn, late, years) },
          ],
          readout: (x) => {
            const year = x ?? years;
            return { title: `第 ${year} 年`, rows: [{ label: '早開始', value: money(early(year)), color: COLORS.compound }, { label: '遲開始', value: year < late ? '未存入' : money(lateFn(year)), color: COLORS.simple }] };
          },
        },
        stats: stat('早開始', money(early(years))) + stat('遲開始', money(lateFn(years))) + stat('相差', money(early(years) - lateFn(years))),
        note: `遲開始的人要在第 ${late} 年存入 ${money(early(late))}，而不是 ${money(P)}，才追得上早開始的人。`,
      };
    },
  }),
  debt: (host) => miniScenario(host, {
    intro: '複利息也會令欠款增長。以下假設完全不還款，每月複利一次。數字為虛構例子，真實貸款條款各有不同。',
    sliders: [
      { key: 'P', id: 'd-p', label: '欠款', min: 1000, max: 50000, step: 1000, value: 10000, text: moneyText },
      { key: 'r', id: 'd-r', label: '年利率', min: 6, max: 36, step: 1, value: 24, text: (x) => `${x}%` },
      { key: 'years', id: 'd-y', label: '不還款年期', min: 1, max: 10, step: 1, value: 5, text: (x) => `${x} 年` },
    ],
    compute: ({ P, r, years }) => {
      const debt = (t) => compoundAmount(P, r, t, 12);
      const months = Math.ceil(Math.log(2) / Math.log(1 + r / 1200));
      return {
        chart: {
          xMax: years,
          yMax: debt(years),
          series: [
            { id: 'debt', label: '欠款', color: COLORS.compound, points: curve(debt, 0, years, 12) },
            { id: 'start', label: '原來欠款', color: COLORS.simple, dash: '7 5', points: [[0, P], [years, P]] },
          ],
          readout: (x) => {
            const year = x ?? years;
            return { title: `第 ${year} 年`, rows: [{ label: '欠款', value: money(debt(year)), color: COLORS.compound }, { label: '已增加', value: money(debt(year) - P) }] };
          },
        },
        stats: stat('原來欠款', money(P)) + stat(`${years} 年後`, money(debt(years))) + stat('倍數', `${num(debt(years) / P, 2)} 倍`),
        note: `年利率 ${r}%、每月複利下，約 ${months} 個月後欠款便會變成兩倍。及早還款，利息才不會繼續滾大。`,
      };
    },
  }),
  change: (host) => miniScenario(host, {
    intro: '同一個算式也可描述增長和折舊。增長用 (1 + r%)ⁿ，折舊用 (1 − r%)ⁿ。例子：一個社區的人口和一部手機的價值，都由 10,000 開始比較。',
    sliders: [
      { key: 'P', id: 'c-p', label: '起始數值', min: 1000, max: 50000, step: 1000, value: 10000, text: (x) => x.toLocaleString('en-US') },
      { key: 'g', id: 'c-g', label: '每年增長', min: 1, max: 20, step: 1, value: 6, text: (x) => `${x}%` },
      { key: 'd', id: 'c-d', label: '每年折舊', min: 1, max: 40, step: 1, value: 20, text: (x) => `${x}%` },
      { key: 'years', id: 'c-y', label: '年期', min: 2, max: 20, step: 1, value: 10, text: (x) => `${x} 年` },
    ],
    compute: ({ P, g, d, years }) => {
      const up = (t) => P * (1 + g / 100) ** t;
      const down = (t) => P * (1 - d / 100) ** t;
      const count = (v) => Math.round(v).toLocaleString('en-US');
      return {
        chart: {
          xMax: years,
          yMax: up(years),
          series: [
            { id: 'up', label: '增長', color: COLORS.compound, points: curve(up, 0, years) },
            { id: 'down', label: '折舊', color: COLORS.simple, dash: '7 5', points: curve(down, 0, years) },
          ],
          readout: (x) => {
            const year = x ?? years;
            return { title: `第 ${year} 年`, rows: [{ label: '增長', value: count(up(year)), color: COLORS.compound }, { label: '折舊', value: count(down(year)), color: COLORS.simple }] };
          },
        },
        stats: stat('增長後', count(up(years))) + stat('折舊後', count(down(years))),
        note: `增長每年乘 ${num(1 + g / 100, 2)}，折舊每年乘 ${num(1 - d / 100, 2)}。折舊曲線愈跌愈慢，但不會跌到 0。`,
      };
    },
  }),
};

export function renderLab(main) {
  main.innerHTML = `
    <section class="level-head"><p class="eyebrow">自由實驗</p><h1>改條件，看結果</h1><p>所有利率和情境均為虛構，只作學習用途。</p></section>
    <div class="tabs" role="tablist" aria-label="實驗情境">${SCENARIOS.map((c, i) => `<button type="button" role="tab" id="tab-${c.id}" data-id="${c.id}" aria-selected="${i === 0}">${c.label}</button>`).join('')}</div>
    <div class="card" id="scenario" role="tabpanel"></div>`;
  let current = null;
  const open = (id) => {
    current?.destroy();
    const host = $('#scenario', main);
    host.className = 'card';
    host.setAttribute('aria-labelledby', `tab-${id}`);
    current = SCENARIO_MOUNT[id](host);
    main.querySelectorAll('[role=tab]').forEach((t) => t.setAttribute('aria-selected', t.dataset.id === id));
  };
  $('.tabs', main).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) open(b.dataset.id); });
  open('core');
  return () => current?.destroy();
}
