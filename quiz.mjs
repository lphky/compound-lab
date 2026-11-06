import { Chart, COLORS } from './chart.mjs';
import { compoundAmount, curve, money, parseAnswer, principalFrom, rateFrom } from './math.mjs';
import { TOPICS, pickRound, isCorrect, diagnose, DIAGNOSES, hints, work, answerText } from './content.mjs';
import { $, feedback, revealButton } from './ui.mjs';
import { state, save, markDone, hasBadge } from './store.mjs';

function chartFor(q) {
  const m = q.m ?? 1;
  let fn;
  if (q.kind === 'custom') fn = q.points;
  else if (q.kind === 'principal') fn = (t) => compoundAmount(principalFrom(q.A, q.r, q.t, m), q.r, t, m);
  else if (q.kind === 'rate') fn = (t) => compoundAmount(q.P, rateFrom(q.P, q.A, q.t), t, 1);
  else fn = (t) => compoundAmount(q.P, q.r, t, m);
  const steps = m;
  const end = fn(q.t);
  const start = fn(0);
  return {
    xMax: q.t,
    snap: 1 / steps,
    noCursor: false,
    cursor: q.t,
    series: [
      { id: 'start', label: '本金', color: COLORS.principal, dash: '7 5', points: [[0, start], [q.t, start]] },
      { id: 'grow', label: '本利和', color: COLORS.compound, points: curve(fn, 0, q.t, steps) },
    ],
    marks: [{ x: q.t, y: end, label: money(end), color: COLORS.compound }],
    readout: (x) => ({ title: `第 ${Number((x ?? q.t).toFixed(2))} 年`, rows: [{ label: '本利和', value: money(fn(x ?? q.t)), color: COLORS.compound }, { label: '利息', value: money(fn(x ?? q.t) - start) }] }),
    aria: '本題本利和增長圖。',
  };
}

export function level6(main) {
  let round = [];
  let index = 0;
  let results = [];
  let chart = null;
  const clean = () => { chart?.destroy(); chart = null; };

  function start() {
    round = pickRound();
    index = 0;
    results = [];
    show();
  }

  function show() {
    clean();
    const q = round[index];
    const tries = { wrong: 0, hint: 0, settled: false };
    const hintList = hints(q);
    main.innerHTML = `
      <section class="level-head"><p class="eyebrow">第 6 關 · ${TOPICS[q.topic]}</p><h1>綜合挑戰</h1></section>
      <progress max="${round.length}" value="${index}" aria-label="已完成 ${index} 題，共 ${round.length} 題"></progress>
      <form class="card" id="q-form">
        <p class="eyebrow">第 ${index + 1} / ${round.length} 題</p>
        <h2 id="q-text">${q.text}</h2>
        <p class="note">${q.kind === 'rate' ? '答案以百分率表示，可答至小數點後兩位。' : '答案進位至最接近的整數元，容許相差 $1。'}</p>
        <div class="answer-row">
          <label for="q-input">${q.kind === 'rate' ? '年利率' : '答案 $'}</label>
          <input id="q-input" inputmode="decimal" autocomplete="off">${q.kind === 'rate' ? '<span>%</span>' : ''}
          <button class="primary" id="q-check">檢查</button>
          <button type="button" id="q-hint">提示（0/${hintList.length}）</button>
          ${revealButton('q-reveal')}
        </div>
        <ol class="hints" id="q-hints"></ol>
        <div class="feedback" id="q-fb" hidden></div>
        <div id="q-after" hidden>
          <div class="solution" id="q-solution"></div>
          <div class="chart-host"></div>
          <div class="player"><button type="button" class="primary" id="q-next">${index + 1 === round.length ? '查看結果' : '下一題 →'}</button></div>
        </div>
        <button type="button" class="text-button" id="q-giveup" hidden>查看完整解法</button>
      </form>`;
    const fb = $('#q-fb', main);
    const settle = (firstTry, label) => {
      if (tries.settled) return;
      tries.settled = true;
      results.push({ topic: q.topic, ok: firstTry, solved: label !== 'shown' });
      $('#q-input', main).disabled = true;
      $('#q-check', main).disabled = true;
      $('#q-hint', main).disabled = true;
      $('#q-giveup', main).hidden = true;
      $('#q-solution', main).innerHTML = `<h3>完整解法</h3>${work(q).map((line) => `<p>${line}</p>`).join('')}<p class="final">答案：${answerText(q)}</p>`;
      $('#q-after', main).hidden = false;
      chart = new Chart($('#q-after .chart-host', main), chartFor(q));
      $('#q-next', main).focus({ preventScroll: true });
    };
    $('#q-form', main).addEventListener('submit', (e) => {
      e.preventDefault();
      if (tries.settled) return;
      const value = parseAnswer($('#q-input', main).value);
      if (value === null) { feedback(fb, 'retry', '請先輸入數字。'); return; }
      if (isCorrect(q, value)) {
        feedback(fb, 'correct', tries.wrong ? '<b>正確！</b>改正得好。' : '<b>正確！</b>');
        settle(tries.wrong === 0 && tries.hint === 0, 'solved');
        return;
      }
      tries.wrong += 1;
      feedback(fb, 'retry', DIAGNOSES[diagnose(q, value)]);
      if (tries.wrong >= 2) $('#q-giveup', main).hidden = false;
    });
    $('#q-hint', main).addEventListener('click', () => {
      if (tries.hint >= hintList.length) return;
      $('#q-hints', main).insertAdjacentHTML('beforeend', `<li>${hintList[tries.hint]}</li>`);
      tries.hint += 1;
      $('#q-hint', main).textContent = `提示（${tries.hint}/${hintList.length}）`;
      if (tries.hint === hintList.length) $('#q-hint', main).disabled = true;
    });
    const showAnswer = () => { feedback(fb, 'info', '先看完整解法，再用圖表對照。'); settle(false, 'shown'); };
    $('#q-giveup', main).addEventListener('click', showAnswer);
    $('#q-reveal', main).addEventListener('click', showAnswer);
    $('#q-next', main).addEventListener('click', () => {
      index += 1;
      if (index < round.length) show();
      else summary();
    });
  }

  function summary() {
    clean();
    const score = results.filter((r) => r.ok).length;
    state.best = Math.max(state.best ?? 0, score);
    save();
    markDone(6);
    const rows = Object.entries(TOPICS).map(([key, label]) => {
      const list = results.filter((r) => r.topic === key);
      return `<tr><th scope="row">${label}</th><td>${list.filter((r) => r.ok).length} / ${list.length}</td></tr>`;
    }).join('');
    main.innerHTML = `
      <section class="level-head"><p class="eyebrow">第 6 關</p><h1>完成一輪挑戰</h1></section>
      <div class="card center">
        <p class="big-score">${score} / ${results.length}</p>
        <p>首次作答、沒有用提示而答對的題數</p>
        <div class="table-wrap short"><table><caption>各類題目結果</caption><tbody>${rows}</tbody></table></div>
        ${hasBadge() ? '<p class="note">你已完成全部六關，首頁已顯示「複利實驗員」徽章。</p>' : '<p class="note">完成全部六關後，首頁會顯示徽章。</p>'}
        <div class="player centered"><button type="button" class="primary" id="again">再抽 10 題</button><a class="button" href="#debt">挑戰卡數怪獸</a><a class="button" href="#lab">到自由實驗</a><a class="button" href="#home">回首頁</a></div>
      </div>`;
    $('#again', main).addEventListener('click', start);
  }

  start();
  return clean;
}

