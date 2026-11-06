# 複利實驗室

香港中三數學複利息互動教材。六關加自由實驗，以可操作的互動圖表為核心：預測、逐年觀察、推導 A = P(1 + r%)ⁿ、複利週期、錯題診所及 24 題題庫（每輪抽 10 題）。純 HTML、CSS、JavaScript，無外部依賴、無登入、不收集資料。

網站：https://lphky.github.io/compound-lab/ 。原始碼：https://github.com/lphky/compound-lab 。

## 使用與開發

以靜態伺服器提供根目錄，例如 `python3 -m http.server 8123`。GitHub Pages 從 main 分支根目錄發布，所有資源為相對路徑。

| 檔案 | 用途 |
|---|---|
| `math.mjs` | 單利息、複利息、反求、組成及數字格式 |
| `content.mjs` | 關卡、題庫、錯誤診斷、提示、解法、錯題診所 |
| `chart.mjs` | SVG 互動圖表（曲線、差距、堆疊柱、預測點、鍵盤及觸控） |
| `lab.mjs` | 核心實驗圖表及四個自由實驗情境 |
| `levels.mjs`、`quiz.mjs` | 第 1–5 關及第 6 關 |
| `app.mjs`、`store.mjs`、`ui.mjs` | 路由、首頁、工作紙、本機進度、共用介面 |

## 測試

`node --test tests/*.test.mjs` 驗算邏輯及題庫。`tests/browser-check.mjs` 用 playwright-core 操作真瀏覽器，需先開靜態伺服器，並設定 `PW_DIR`（含 node_modules 的目錄）及 `CHROME`（瀏覽器路徑）。結果見 `docs/TEST-RESULTS.md`。

## 注意

所有利率、人物和情境均為虛構，不連結真實金融產品。答案可在前端原始碼查看，教師揭曉只是課堂輔助，並非保密機制。進度只存在目前瀏覽器。
