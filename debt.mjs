import { Chart, COLORS } from './chart.mjs';
import { compoundAmount, curve, parseAnswer } from './math.mjs';
import { $, feedback, revealButton } from './ui.mjs';

export function renderDebt(main) {
  const amount = (month) => compoundAmount(5000, 36, month / 12, 12);
  const cash = (value) => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  main.innerHTML = `
    <section class="level-head"><p class="eyebrow">延伸挑戰 · 複利的另一面</p><h1>卡數怪獸</h1><p class="lead">利息會生利息，欠款也會逐月長大。用計算和圖表看清楚它。</p></section>
    <section class="card"><h2>你能算出兩年後的欠款嗎？</h2><p>假設欠款本金 $5,000，名義年利率 36%，每月複利結算一次。兩年完全沒有還款，沒有新消費或其他費用，最後欠款是多少？</p>
    <p class="note">這是簡化的教學模型，實際信用卡的計息及收費方式可能不同。</p>
    <form id="debt-form"><label for="debt-answer">兩年後的本利和（元，四捨五入至小數點後兩位）</label><div class="answer-row"><input id="debt-answer" type="number" min="0" step="0.01" inputmode="decimal" required><button class="primary">檢查答案</button><button type="button" id="debt-hint">提示</button>${revealButton('debt-reveal')}</div></form>
    <div id="debt-feedback" class="feedback" aria-live="polite" hidden></div><div id="debt-solution" class="solution" hidden></div></section>
    <section class="card"><h2>觀察怪獸逐月長大</h2><p>拖動時間軸，或在圖表上點選月份。綠色虛線是原來欠款，橙色曲線是累積欠款。</p>
    <label class="slider" for="debt-month"><span>經過月份<output id="debt-month-out">0 個月</output></span><input id="debt-month" type="range" min="0" max="24" step="1" value="0"></label>
    <div class="chart-host"></div><p id="debt-status" aria-live="polite"></p>
    <details><summary>查看逐月數據表</summary><div class="table-wrap"><table><caption>每月結息後欠款（計算途中不進位）</caption><thead><tr><th>月份</th><th>累積欠款</th><th>累積利息</th></tr></thead><tbody>${Array.from({ length: 25 }, (_, m) => `<tr><th scope="row">${m}</th><td>${cash(amount(m))}</td><td>${cash(amount(m) - 5000)}</td></tr>`).join('')}</tbody></table></div></details></section>
    <div class="player"><a class="button" href="#level-6">綜合挑戰</a><a class="button" href="#lab">自由實驗</a><a class="button" href="#home">回首頁</a></div>`;
  const reveal = () => {
    $('#debt-solution', main).hidden = false;
    $('#debt-solution', main).innerHTML = `<h3>解法</h3><p>每月利率 = 36% ÷ 12 = 3%；總期數 = 2 × 12 = 24。</p><p>A = 5000 × (1 + 3%)<sup>24</sup> = <b>${cash(amount(24))}</b></p><p>累積利息為 ${cash(amount(24) - 5000)}，已超過原來本金。此模型假設完全沒有還款。</p>`;
  };
  $('#debt-form', main).addEventListener('submit', (e) => {
    e.preventDefault();
    const value = parseAnswer($('#debt-answer', main).value);
    const correct = value !== null && Math.abs(value - amount(24)) <= 0.011;
    feedback($('#debt-feedback', main), correct ? 'correct' : 'retry', correct ? '<b>答對了！</b>對照下方圖表，看看欠款如何逐月累積。' : '再試一次：先把年利率換成每月利率，並把兩年換成總月數。題目問的是本利和，包含原來欠款。');
    if (correct) reveal();
  });
  $('#debt-hint', main).addEventListener('click', () => feedback($('#debt-feedback', main), 'info', '每月利率 = 36% ÷ 12 = 3%；總期數 = 2 × 12 = 24。把它們代入複利公式，計算途中不要進位。'));
  $('#debt-reveal', main).addEventListener('click', reveal);
  let chart;
  const selectMonth = (month) => {
    const m = Math.max(0, Math.min(24, Math.round(month)));
    $('#debt-month', main).value = m;
    $('#debt-month-out', main).textContent = `${m} 個月`;
    $('#debt-status', main).textContent = `第 ${m} 個月：欠款 ${cash(amount(m))}，其中累積利息 ${cash(amount(m) - 5000)}。`;
    chart.set({ cursor: m });
  };
  chart = new Chart($('.chart-host', main), {
    xMax: 24, xName: '月', cursor: 0, snap: 1, aria: '欠款逐月複利增長圖；橫軸單位為月。',
    series: [
      { id: 'principal', label: '原來欠款', color: COLORS.principal, dash: '7 5', points: [[0, 5000], [24, 5000]] },
      { id: 'debt', label: '累積欠款', color: COLORS.compound, points: curve(amount, 0, 24) },
    ],
    readout: (x) => ({ title: `第 ${Math.round(x ?? 0)} 個月`, rows: [{ label: '累積欠款', value: cash(amount(x ?? 0)) }, { label: '累積利息', value: cash(amount(x ?? 0) - 5000) }] }),
    onCursor: selectMonth,
  });
  $('#debt-month', main).addEventListener('input', (e) => selectMonth(+e.target.value));
  selectMonth(0);
  return () => chart.destroy();
}
