# 複利實驗室

- 先讀 README.md、docs/TEST-RESULTS.md。GitHub owner 為 lphky，repo compound-lab，保留 main 根目錄 Pages。
- 純前端、無 CDN、無登入，只用本機進度；保留觸控、鍵盤、減少動畫、大字投影、教師揭曉及列印工作紙。
- 互動圖表是教材核心，每關都要動手。不可用「賭」等僥倖框架，開場用預測、實驗、驗證。
- 講解用書面語，只有單仔、複仔對白用少量粵語。折舊與增長只放自由實驗；反求利率只放挑戰題。
- 答錯時指出錯誤類型和下一步，不直接給答案。
- 顏色：單利息藍虛線、複利息橙實線、本金綠。差距一定等於「利息的利息」。
- 改邏輯或題庫後執行 node --test tests/*.test.mjs 及 tests/browser-check.mjs。新題答案要獨立驗算，並加入 tests/logic.test.mjs 的預期值。
