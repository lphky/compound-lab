import { Chart, COLORS } from './chart.mjs';
import { compoundAmount, simpleAmount, curve, money } from './math.mjs';
import { LEVELS, QUESTIONS, WORKSHEET_IDS, answerText, work } from './content.mjs';
import { $, $$, slider, bindSlider, talk } from './ui.mjs';
import { state, save, clearProgress, doneCount, hasBadge } from './store.mjs';
import { level1, level2, level3, level4, level5 } from './levels.mjs';
import { level6 } from './quiz.mjs';
import { renderLab } from './lab.mjs';
import { renderDebt } from './debt.mjs';

const main = $('#main');
let cleanup = null;

const BADGE = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#17324a"/><circle cx="60" cy="60" r="44" fill="none" stroke="#ffcfb8" stroke-width="2" stroke-dasharray="3 6"/><path d="M32 82 L88 66" stroke="#8fc0f5" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/><path d="M32 82 C56 80 76 62 88 34" fill="none" stroke="#ff9a6b" stroke-width="6" stroke-linecap="round"/></svg>';

function home() {
  const done = doneCount();
  main.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">中三數學 · 百分法的應用</p>
        <h1>利息也會<br>生利息</h1>
        <p class="lead">用預測、實驗和驗證，看懂單利息與複利息為何愈差愈遠，並親手推導 A = P(1 + r%)ⁿ。</p>
        <div class="player"><a class="button primary" href="#level-${Math.min(6, LEVELS.findIndex((l) => !state.done[l.n]) + 1 || 1)}">${done ? '繼續學習' : '開始第 1 關'} →</a><a class="button" href="#lab">直接做實驗</a></div>
      </div>
      <div class="card hero-lab">
        <div class="sliders two">
          ${slider({ id: 'h-r', label: '年利率', min: 1, max: 15, step: 0.5, value: 5, text: (v) => `${v}%` })}
          ${slider({ id: 'h-y', label: '年期', min: 5, max: 40, step: 1, value: 30, text: (v) => `${v} 年` })}
        </div>
        <div class="chart-host"></div>
      </div>
    </section>
    <div class="duo">${talk('dan', '每年利息都一樣，我一條直線行到尾。')}${talk('fuk', '利息留低再生息，我會愈行愈快！')}</div>
    <section class="section-head"><h2>六個關卡</h2><span>已完成 ${done} / 6</span></section>
    <div class="level-grid">${LEVELS.map((l) => `<a class="level-card${state.done[l.n] ? ' done' : ''}" href="#level-${l.n}"><span class="no">${state.done[l.n] ? '✓' : l.n}</span><h3>${l.title}</h3><p>${l.blurb}</p></a>`).join('')}
      <a class="level-card" href="#debt"><span class="no">＋</span><h3>卡數怪獸</h3><p>算出兩年後的欠款，用逐月互動圖表觀察複利的另一面。</p></a>
      <a class="level-card lab-card" href="#lab"><span class="no">∞</span><h3>自由實驗</h3><p>早開始與遲開始、欠款增長、增長與折舊。</p></a></div>
    ${hasBadge() ? `<section class="badge card"><span>${BADGE}</span><div><h2>複利實驗員</h2><p>你已完成全部六關${state.best !== null ? `，最佳成績 ${state.best} / 10` : ''}。</p></div></section>` : ''}
    <section class="card progress-row"><div><h2>給老師</h2><p>頁首「老師工具」有大字投影、教師揭曉及減少動畫。工作紙可列印，附獨立答案頁。</p></div><div class="player"><a class="button" href="#worksheet">工作紙</a>${done ? '<button type="button" id="clear">清除進度</button>' : ''}</div></section>`;
  let r = 5;
  let years = 30;
  const chart = new Chart($('.hero-lab .chart-host', main), { cursor: years, height: 280, aria: '單利息與複利息比較圖。', onCursor: () => {} });
  const draw = () => {
    chart.set({
      xMax: years,
      cursor: Math.min(chart.spec.cursor ?? years, years),
      yMax: compoundAmount(10000, r, years),
      series: [
        { id: 'simple', label: '單利息', color: COLORS.simple, dash: '7 5', points: curve((t) => simpleAmount(10000, r, t), 0, years) },
        { id: 'compound', label: '複利息', color: COLORS.compound, points: curve((t) => compoundAmount(10000, r, t), 0, years) },
      ],
      readout: (x) => ({ title: `$10,000 存 ${x ?? years} 年`, rows: [{ label: '單利息', value: money(simpleAmount(10000, r, x ?? years)), color: COLORS.simple }, { label: '複利息', value: money(compoundAmount(10000, r, x ?? years)), color: COLORS.compound }] }),
    });
  };
  bindSlider(main, { id: 'h-r', text: (v) => `${v}%` }, (v) => { r = v; draw(); });
  bindSlider(main, { id: 'h-y', text: (v) => `${v} 年` }, (v) => { years = v; chart.spec.cursor = v; draw(); });
  draw();
  $('#clear', main)?.addEventListener('click', () => $('#clear-dialog').showModal());
  return () => chart.destroy();
}

function worksheet() {
  const list = WORKSHEET_IDS.map((id) => QUESTIONS.find((q) => q.id === id));
  main.innerHTML = `
    <div class="sheet-tools"><button type="button" class="primary" id="print">列印工作紙</button><label><input type="checkbox" id="sheet-answers">加入答案頁</label><a class="button" href="#home">回首頁</a></div>
    <article class="sheet">
      <header><h1>複利息工作紙</h1><p>姓名：＿＿＿＿＿＿＿＿　班別：＿＿＿＿　學號：＿＿＿＿　日期：＿＿＿＿＿＿</p></header>
      <section><h2>一、重點</h2>
        <p class="formula">A = P(1 + r%)<sup>n</sup>　　利息 = A − P</p>
        <p>A：本利和　P：本金　r%：每期利率　n：期數。每半年複利：利率 ÷ 2，期數 × 2；每季：÷ 4，× 4；每月：÷ 12，× 12。</p></section>
      <section><h2>二、填表（$10,000，年利率 10%）</h2>
        <table><thead><tr><th>年</th><th>年初金額</th><th>單利息：本年利息</th><th>複利息：本年利息</th><th>複利息：年底本利和</th></tr></thead>
        <tbody><tr><th>1</th><td>$10,000</td><td>$1,000</td><td>$1,000</td><td>$11,000</td></tr><tr><th>2</th><td>$11,000</td><td></td><td></td><td></td></tr><tr><th>3</th><td></td><td></td><td></td><td></td></tr><tr><th>4</th><td></td><td></td><td></td><td></td></tr></tbody></table></section>
      <section><h2>三、練習（答案進位至整數元；年利率題以 % 表示）</h2>
        <ol class="sheet-q">${list.map((q) => `<li>${q.text}<div class="blank"></div></li>`).join('')}</ol></section>
      <section><h2>四、反思</h2><p>為甚麼年期愈長，單利息和複利息的差距愈大？用「利息」和「本金」兩個詞解釋。</p><div class="blank short"></div></section>
    </article>
    <article class="sheet answers" id="sheet-key" hidden>
      <header><h1>工作紙答案</h1></header>
      <h2>二、填表</h2>
      <p>單利息每年利息都是 $1,000。複利息：第 2 年 $1,100，年底 $12,100；第 3 年年初 $12,100，利息 $1,210，年底 $13,310；第 4 年年初 $13,310，利息 $1,331，年底 $14,641。</p>
      <h2>三、練習</h2>
      <ol>${list.map((q) => `<li><b>${answerText(q)}</b>　${work(q).slice(0, -1).join('；') || work(q)[0]}</li>`).join('')}</ol>
      <h2>四、反思（參考）</h2><p>複利息把已得的利息加入本金一同計息，計息金額逐年增大；單利息只按原來本金計息，所以差距愈來愈大。</p>
    </article>`;
  $('#print', main).addEventListener('click', () => window.print());
  $('#sheet-answers', main).addEventListener('change', (e) => { $('#sheet-key', main).hidden = !e.target.checked; });
  return null;
}

const ROUTES = { home, worksheet, debt: () => renderDebt(main), lab: () => renderLab(main), 'level-1': () => level1(main), 'level-2': () => level2(main), 'level-3': () => level3(main), 'level-4': () => level4(main), 'level-5': () => level5(main), 'level-6': () => level6(main) };

function nav(route) {
  $('#level-nav').innerHTML = `${LEVELS.map((l) => `<a href="#level-${l.n}"${route === `level-${l.n}` ? ' aria-current="page"' : ''}><span>${state.done[l.n] ? '✓' : l.n}</span>${l.short}</a>`).join('')}<a href="#debt"${route === 'debt' ? ' aria-current="page"' : ''}><span>＋</span>卡數怪獸</a><a href="#lab"${route === 'lab' ? ' aria-current="page"' : ''}><span>∞</span>自由實驗</a>`;
  $('#level-nav').hidden = route === 'home' || route === 'worksheet';
  const current = $('#level-nav [aria-current]');
  if (current) $('#level-nav').scrollLeft = current.offsetLeft - $('#level-nav').offsetLeft - 20;
}

function route() {
  const name = location.hash.slice(1) || 'home';
  const key = ROUTES[name] ? name : 'home';
  cleanup?.();
  cleanup = null;
  main.className = key === 'worksheet' ? 'wide' : '';
  nav(key);
  cleanup = ROUTES[key]() ?? null;
  document.title = `${key === 'home' ? '' : `${key === 'debt' ? '卡數怪獸' : key === 'lab' ? '自由實驗' : key === 'worksheet' ? '工作紙' : LEVELS[Number(key.slice(-1)) - 1].title} · `}複利實驗室`;
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function applyPrefs() {
  const { large, reveal, calm } = state.prefs;
  document.documentElement.classList.toggle('large', large);
  document.documentElement.classList.toggle('reveal', reveal);
  document.documentElement.classList.toggle('calm', calm);
  $$('[data-pref]').forEach((el) => { el.checked = state.prefs[el.dataset.pref]; });
  document.dispatchEvent(new Event('chart-refresh'));
}

$$('[data-pref]').forEach((el) => el.addEventListener('change', () => {
  state.prefs[el.dataset.pref] = el.checked;
  if (!save()) $('#storage-note').textContent = '此瀏覽器未能儲存進度，關閉頁面後設定及進度會消失。';
  applyPrefs();
}));
document.addEventListener('progress-change', () => nav(location.hash.slice(1) || 'home'));
$('#clear-dialog').addEventListener('close', () => {
  if ($('#clear-dialog').returnValue === 'clear') {
    clearProgress();
    route();
  }
});
addEventListener('hashchange', route);
applyPrefs();
route();
