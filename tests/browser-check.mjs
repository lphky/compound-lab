import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const driver = process.env.PW_DIR;
const { chromium } = createRequire(pathToFileURL(driver + '/x.js'))('playwright-core');
const base = process.env.BASE ?? 'http://127.0.0.1:8123/';
const shots = process.env.SHOTS;
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const checks = [];
const ok = (cond, name) => { if (!cond) throw new Error('失敗：' + name); checks.push(name); };
const errors = [];

async function open(page, hash) {
  await page.goto(base + '#' + hash);
  await page.waitForTimeout(120);
}
const text = (page, s) => page.locator(s).first().innerText();
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

async function fresh(viewport = { width: 1280, height: 900 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, page };
}

{
  const { page, ctx } = await fresh();
  await open(page, 'home');
  ok(await page.locator('.hero-lab .chart-plot svg').count() === 1, '首頁互動圖表');
  const before = await text(page, '.hero-lab .chart-readout');
  await page.locator('#h-r').fill('10');
  ok(before !== await text(page, '.hero-lab .chart-readout'), '首頁滑桿更新圖表');

  await open(page, 'level-1');
  const box = await page.locator('.chart-plot').boundingBox();
  const startValue = await page.inputValue('#guess-input');
  await page.mouse.move(box.x + box.width - 30, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 30, box.y + box.height * 0.25, { steps: 5 });
  await page.mouse.up();
  const dragged = await page.inputValue('#guess-input');
  ok(Number(dragged) > Number(startValue), '第1關拖動預測點');
  await page.locator('.chart-plot').focus();
  await page.keyboard.press('ArrowUp');
  ok(Number(await page.inputValue('#guess-input')) === Number(dragged) + 500, '第1關鍵盤調整預測');
  await page.fill('#guess-input', '25000');
  await page.click('#compare');
  await page.waitForTimeout(100);
  ok((await text(page, '#fb')).includes('$43,219') && (await text(page, '#fb')).includes('$25,000'), '第1關揭曉正確數字');
  ok((await text(page, '#fb')).includes('直線思維'), '第1關辨認直線思維');
  ok((await text(page, '#status')).includes('已完成'), '第1關完成');
  await page.click('#play');
  const paused = await page.inputValue('#timeline');
  await page.waitForTimeout(450);
  ok(paused === await page.inputValue('#timeline') && Number(paused) < 30, '播放可暫停');
  await page.click('#step-next');
  ok(Number(await page.inputValue('#timeline')) === Number(paused) + 1, '逐步前進');

  await open(page, 'lab');
  const read = () => text(page, '.chart-readout');
  await page.locator('#lab-p').fill('50000');
  ok((await read()).includes('$216,097'), '自由實驗本金滑桿');
  await page.locator('#lab-r').fill('10');
  await page.locator('#lab-y').fill('20');
  ok((await read()).includes('第 20 年') && (await read()).includes('$336,375'), '利率、年期滑桿');
  await page.click('[data-seg=period] button:nth-child(4)');
  ok((await read()).includes('$366,'), '切換每月複利');
  ok((await text(page, '#formula-note')).includes('240'), '週期更新期數');
  await page.click('[data-seg=mode] button:nth-child(2)');
  ok(await page.locator('.bar').count() === 21, '組成柱形圖');
  ok((await read()).includes('利息的利息'), '組成讀數');
  await page.click('[data-seg=mode] button:nth-child(1)');
  await page.waitForTimeout(220);
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-seg=mode] [aria-pressed=true]')).backgroundColor) === 'rgb(23, 50, 74)', '已選按鈕於滑鼠停留時保持深色');
  ok(await page.locator('.band').count() === 1, '差距填色開啟');
  await page.uncheck('#gap-toggle');
  ok(await page.locator('.band').count() === 0, '差距填色關閉');
  await page.check('#table-toggle');
  ok(await page.locator('#lab-table tbody tr').count() === 21, '數據表');
  const pb = await page.locator('.chart-plot').boundingBox();
  await page.mouse.move(pb.x + pb.width * 0.4, pb.y + 100);
  await page.waitForTimeout(40);
  ok(!(await read()).includes('第 20 年'), '滑鼠移到圖表改變年份');
  const row = await page.locator('#lab-table tr.current th').innerText();
  ok((await read()).includes(`第 ${row} 年`), '圖表與數據表同步');
  await page.locator('.chart-plot').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  ok((await read()).includes('第 1 年'), '圖表鍵盤逐年移動');
  for (const id of ['early', 'debt', 'change']) {
    await page.click(`#tab-${id}`);
    ok(await page.locator('#scenario .chart-plot svg').count() >= 1, `情境 ${id}`);
  }
  await page.click('#tab-early');
  ok((await text(page, '#s-note')).includes('$16,289'), '遲開始追趕金額');
  await page.click('#tab-debt');
  ok((await text(page, '#s-stats')).includes('$32,810'), '欠款 24% 每月複利 5 年');

  await open(page, 'level-2');
  for (let i = 0; i < 3; i++) await page.click('#next-year');
  ok(await page.locator('#next-year').isDisabled(), '第3年先要回答');
  await page.fill('#cp', '1000');
  await page.click('#checkpoint button.primary');
  ok((await text(page, '#cp-fb')).includes('單利息'), '第2關辨認單利息');
  await page.fill('#cp', '1331');
  await page.click('#checkpoint button.primary');
  ok(await page.locator('#next-year').isEnabled(), '答對後可繼續');
  for (let i = 0; i < 7; i++) await page.click('#next-year');
  ok((await text(page, '#status')).includes('$2,358'), '第2關完成及第10年利息');
  ok(await page.locator('.bar').count() === 11, '第2關 11 條柱');

  await open(page, 'level-3');
  for (let i = 0; i < 3; i++) await page.click('#times');
  ok((await text(page, '#chain')).includes('$11,576'), '第3關連乘');
  await page.click('#factor [data-i="0"]');
  ok((await text(page, '#factor-fb')).includes('0.8'), '第3關百分率錯誤提示');
  await page.click('#factor [data-i="1"]');
  const selects = page.locator('#match select');
  const answers = { A: '本利和（到期總額）', P: '本金（開始的金額）', 'r%': '每期利率', n: '期數' };
  await page.click('#match button.primary');
  ok((await text(page, '#match-fb')).includes('4 項'), '配對未完成提示');
  for (let i = 0; i < 4; i++) await selects.nth(i).selectOption(answers[await selects.nth(i).getAttribute('data-symbol')]);
  await page.click('#match button.primary');
  ok((await text(page, '#status')).includes('已完成'), '第3關完成');
  await page.click('#live-formula [data-part=P]');
  ok(await page.locator('#live-lab .focus-line').count() === 1, '算式 P 高亮圖上');
  await page.click('#live-formula [data-part=n]');
  ok(await page.locator('#live-lab .focus-span').count() === 1, '算式 n 高亮圖上');
  await page.click('#live-formula [data-part=r]');
  ok(await page.locator('#live-lab .step-note').count() === 1, '算式 r 高亮圖上');
  await page.locator('#timeline').fill('15');
  ok((await text(page, '#live-formula')).includes('$20,789'), '時間軸改變 n 及 A');

  await open(page, 'level-4');
  await page.click('#predict [data-v=same]');
  ok((await text(page, '#predict-fb')).includes('切換'), '預測錯誤不直接給答案');
  await page.click('#predict [data-v=up]');
  ok((await text(page, '#period-steps')).includes('2%') && (await text(page, '#period-steps')).includes('40'), '每季調整 r 和 n');
  ok(await page.locator('.hbar').count() === 4, '四週期比較');
  const f0 = page.locator('.task').nth(0);
  await f0.locator('[name=rate]').fill('1.5');
  await f0.locator('[name=n]').fill('3');
  await f0.locator('button.primary').click();
  ok((await f0.locator('.feedback').innerText()).includes('期數未改好'), '只改利率診斷');
  await f0.locator('[name=rate]').fill('6');
  await f0.locator('[name=n]').fill('12');
  await f0.locator('button.primary').click();
  ok((await f0.locator('.feedback').innerText()).includes('利率仍未調整'), '只改期數診斷');
  const answers4 = [[1.5, 12], [4, 4], [1, 12]];
  for (let i = 0; i < 3; i++) {
    const f = page.locator('.task').nth(i);
    await f.locator('[name=rate]').fill(String(answers4[i][0]));
    await f.locator('[name=n]').fill(String(answers4[i][1]));
    await f.locator('button.primary').click();
  }
  ok((await text(page, '#status')).includes('已完成'), '第4關完成');

  await open(page, 'level-5');
  const { CLINIC } = await page.evaluate(async () => { const c = await import('./content.mjs'); return { CLINIC: c.CLINIC.map((x) => ({ wrong: x.wrong, right: x.right, answer: x.answer })) }; });
  for (let i = 0; i < 6; i++) {
    const other = (CLINIC[i].wrong + 1) % 3;
    await page.click(`#work [data-k="${other}"]`);
    ok(await page.locator('#fix').isHidden(), `病歷${i + 1}錯行不開放修正`);
    await page.click(`#work [data-k="${CLINIC[i].wrong}"]`);
    await page.click(`#fix-options [data-k="${CLINIC[i].right}"]`);
    ok((await text(page, '#fix-fb')).includes(CLINIC[i].answer), `病歷${i + 1}答案`);
    ok(await page.locator('#case .line').count() === 2, `病歷${i + 1}兩條曲線`);
    await page.click('#case-next button');
  }
  ok((await text(page, '#status')).includes('已完成'), '第5關完成');

  await open(page, 'level-6');
  await page.evaluate(async () => { window.__c = await import('./content.mjs'); });
  await page.click('#q-check');
  ok((await text(page, '#q-fb')).includes('輸入'), '空白答案提示');
  for (let i = 0; i < 10; i++) {
    const qText = await text(page, '#q-text');
    const answer = await page.evaluate((t) => { const q = window.__c.QUESTIONS.find((x) => x.text === t); return window.__c.roundedAnswer(q); }, qText);
    if (i === 0) {
      await page.fill('#q-input', '1');
      await page.click('#q-check');
      ok(!(await text(page, '#q-fb')).includes(String(answer)) || answer < 20, '錯誤回饋不含答案');
      await page.click('#q-hint');
      ok(await page.locator('#q-hints li').count() === 1, '分步提示');
      await page.fill('#q-input', '2');
      await page.click('#q-check');
      ok(await page.locator('#q-giveup').isVisible(), '兩次錯誤後可看解法');
    }
    await page.fill('#q-input', String(answer));
    await page.click('#q-check');
    ok((await text(page, '#q-fb')).includes('正確'), `第${i + 1}題答對`);
    ok(await page.locator('#q-after .chart-plot svg').count() === 1, `第${i + 1}題解釋圖`);
    await page.click('#q-next');
    await page.waitForTimeout(20);
  }
  ok((await text(page, '.big-score')).includes('9 / 10'), '成績計算（首題錯誤不計）');
  await open(page, 'home');
  ok(await page.locator('.badge').count() === 1, '六關完成後顯示徽章');
  await page.reload();
  await page.waitForTimeout(100);
  ok(await page.locator('.level-card.done').count() === 6, '進度於重新載入後保留');
  await page.click('#clear');
  await page.click('dialog [value=cancel]');
  ok(await page.locator('.level-card.done').count() === 6, '取消清除');
  await page.click('#clear');
  await page.click('dialog [value=clear]');
  await page.waitForTimeout(80);
  ok(await page.locator('.level-card.done').count() === 0, '確認清除');

  await page.click('.tools summary');
  await page.check('[data-pref=reveal]');
  await page.check('[data-pref=large]');
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize) === '20px', '大字投影');
  await page.click('.tools summary');
  await open(page, 'level-6');
  await page.click('#q-reveal');
  ok(await page.locator('#q-solution .final').isVisible(), '教師揭曉題目');
  await open(page, 'level-5');
  await page.click('#case-reveal');
  ok(await page.locator('#case-next').isVisible(), '教師揭曉錯題');
  await open(page, 'level-4');
  await page.click('#predict-reveal');
  ok((await text(page, '#predict-fb')).includes('會變大'), '教師揭曉預測');
  await open(page, 'level-3');
  await page.click('#factor-reveal');
  await page.click('#match-reveal');
  ok((await text(page, '#match-fb')).includes('全部正確'), '教師揭曉配對');
  await page.evaluate(() => localStorage.setItem('compound-lab-v1', '{bad'));
  await page.reload();
  await page.waitForTimeout(100);
  ok(await page.locator('h1').first().isVisible(), '損壞進度可恢復');
  await open(page, 'worksheet');
  await page.check('#sheet-answers');
  ok((await text(page, '#sheet-key')).includes('$8,487'), '工作紙答案頁');
  ok(await page.locator('.sheet-q li').count() === 8, '工作紙 8 題');
  await page.emulateMedia({ media: 'print' });
  ok(await page.locator('.top').isHidden(), '列印隱藏頁首');
  await ctx.close();
}

{
  const { page, ctx } = await fresh({ width: 1280, height: 900 }, { reducedMotion: 'reduce' });
  await open(page, 'lab');
  await page.click('#play');
  ok((await text(page, '#play')).includes('播放') && await page.inputValue('#timeline') === '30', '減少動畫時播放直接到結果');
  await ctx.close();
}

for (const [name, viewport, touch] of [['desktop', { width: 1440, height: 1000 }, false], ['tablet', { width: 768, height: 1024 }, true], ['mobile', { width: 390, height: 844 }, true], ['small', { width: 320, height: 640 }, true]]) {
  const { page, ctx } = await fresh(viewport, { hasTouch: touch });
  for (const route of ['home', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'lab', 'worksheet']) {
    await open(page, route);
    ok(!await overflow(page), `${name} ${route} 無橫向溢出`);
    if (shots && (name !== 'small')) await page.screenshot({ path: `${shots}/${name}-${route}.png`, fullPage: true });
  }
  await ctx.close();
}

{
  const { page, ctx } = await fresh({ width: 390, height: 844 }, { hasTouch: true });
  await open(page, 'level-1');
  const box = await page.locator('.chart-plot').boundingBox();
  const start = await page.inputValue('#guess-input');
  const cdp = await ctx.newCDPSession(page);
  const x = box.x + box.width - 20;
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', box.y + box.height * 0.6);
  for (let i = 1; i <= 5; i++) await touch('touchMove', box.y + box.height * (0.6 - i * 0.06));
  await touch('touchEnd', 0);
  ok(await page.inputValue('#guess-input') !== start, '手機觸控拖動預測點');
  await ctx.close();
}

await browser.close();
if (errors.length) throw new Error('瀏覽器錯誤：\n' + [...new Set(errors)].join('\n'));
console.log(`通過 ${checks.length} 項`);
